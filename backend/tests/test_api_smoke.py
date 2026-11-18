def test_health(client):
    assert client.get("/api/health").json() == {"ok": True, "mode": "mock", "provider": "mock"}


def test_board_has_every_status(client):
    b = client.get("/api/board").json()
    for s in ["APPLIED", "TRAINING", "REVIEW", "SHIFT_READY"]:
        assert b["columns"][s], s
    assert len(b["jobs"]) == 2
    assert b["metrics"]["approvals_with_evidence"] == 2


def test_hire_creates_link(client):
    b = client.get("/api/board").json()
    cand = b["columns"]["APPLIED"][0]
    r = client.post(f"/api/candidates/{cand['id']}/hire").json()
    assert r["path"].startswith("/t/")
    t = client.get(f"/api/training/{r['token']}?lang=es").json()
    assert t["lang"] == "es" and len(t["modules"]) == 3


def test_job_posts_and_export(client):
    r = client.post("/api/jobs", json={"role": "server", "title": "Weekend server", "pay_range": "$20/hr",
                                       "schedule": "Sat-Sun", "requirements": ["weekends"], "languages": ["en", "zh", "es"]}).json()
    assert len(r["posts"]) >= 4
    assert all(len(p["text"]) <= p["limit"] for p in r["posts"])
    csv = client.get(f"/api/jobs/{r['id']}/export?fmt=csv")
    assert csv.status_code == 200 and "attachment" in csv.headers["content-disposition"]


def test_insights(client):
    gaps = client.get("/api/insights").json()["gaps"]
    assert gaps and gaps[0]["missed"] >= 1


def test_no_unkind_words_in_content():
    import json
    from pathlib import Path

    seed = Path(__file__).resolve().parent.parent / "seed"
    for f in ["modules_server.json", "modules_kitchen.json"]:
        text = (seed / f).read_text(encoding="utf-8").lower()
        for w in ["wrong", "fail", "quiz", "错误"]:
            assert w not in text, (f, w)
    json.loads((seed / "mock_ai.json").read_text(encoding="utf-8"))
