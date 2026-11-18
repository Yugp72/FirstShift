from fastapi.testclient import TestClient


def _fresh(client) -> TestClient:
    """A second browser with its own cookie jar (signed out)."""
    return TestClient(client.app)


def test_manager_routes_require_manager(client):
    anon = _fresh(client)
    assert anon.get("/api/board").status_code == 401
    assert anon.post("/api/demo/reset").status_code == 401
    anon.post("/api/auth/demo", json={"role": "applicant"})
    assert anon.get("/api/board").status_code == 403
    assert client.get("/api/board").status_code == 200  # fixture is signed in as manager


def test_signup_apply_hire_then_training_counts(client):
    me = _fresh(client)
    r = me.post("/api/auth/signup", json={"name": "Rosa Test", "email": "rosa@example.test", "password": "longenough1", "lang": "es"})
    assert r.status_code == 200 and r.json()["account"]["role"] == "applicant"
    assert me.post("/api/auth/signup", json={"name": "x", "email": "rosa@example.test", "password": "longenough1"}).status_code == 409
    assert me.post("/api/auth/signup", json={"name": "x", "email": "bad", "password": "longenough1"}).status_code == 400

    jobs = me.get("/api/careers/jobs").json()["jobs"]
    server = next(j for j in jobs if j["role"] == "server")
    assert "listing" in server and server["listing"]
    assert me.post(f"/api/careers/jobs/{server['id']}/apply", json={}).status_code == 200
    assert me.post(f"/api/careers/jobs/{server['id']}/apply", json={}).status_code == 409
    apps = me.get("/api/me/applications").json()["applications"]
    assert apps[0]["status"] == "APPLIED" and apps[0]["training"] is None

    # practice before being hired: not on the manager's pipeline
    p = me.post("/api/learn/session", json={"role": "server"}).json()
    assert p["mode"] == "practice"
    board = client.get("/api/board").json()
    rosa = next(t for t in board["columns"]["APPLIED"] if t["name"] == "Rosa Test")
    assert all(t["name"] != "Rosa Test" for t in board["columns"]["TRAINING"])

    # manager hires -> the same learner's training session now counts
    client.post(f"/api/candidates/{rosa['id']}/hire")
    s = me.post("/api/learn/session", json={"role": "server"}).json()
    assert s["mode"] == "hired" and s["token"] != p["token"]
    assert me.get("/api/me/applications").json()["applications"][0]["training"]["token"] == s["token"]


def test_login_logout_and_bad_password(client):
    me = _fresh(client)
    me.post("/api/auth/signup", json={"name": "Sam", "email": "sam@example.test", "password": "longenough1"})
    me.post("/api/auth/logout")
    assert me.get("/api/auth/me").json()["account"] is None
    assert me.post("/api/auth/login", json={"email": "sam@example.test", "password": "wrongwrong"}).status_code == 401
    assert me.post("/api/auth/login", json={"email": "SAM@example.test", "password": "longenough1"}).status_code == 200


def test_anonymous_practice_is_reused_by_token(client):
    anon = _fresh(client)
    a = anon.post("/api/learn/session", json={"role": "kitchen"}).json()
    b = anon.post("/api/learn/session", json={"role": "kitchen", "token": a["token"]}).json()
    assert a == b and a["mode"] == "practice"
    t = anon.get(f"/api/training/{a['token']}").json()
    assert t["hire"]["mode"] == "practice" and len(t["modules"]) == 3
    courses = anon.get("/api/learn/courses").json()["courses"]
    assert {c["role"] for c in courses} == {"server", "kitchen"}
    assert next(c for c in courses if c["role"] == "server")["sections"][2]["has_video"] is True
