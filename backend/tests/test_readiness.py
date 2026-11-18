def _allergy(client):
    data = client.get("/api/training/lin-demo").json()
    return next(m for m in data["modules"] if m["slug"] == "allergy")


def test_lin_finishes_and_gets_stamped(client):
    m = _allergy(client)
    assert not m["passed"]
    # A kind miss first
    r = client.post("/api/training/lin-demo/answers", json={"module_id": m["id"], "question_id": "q1", "answer": "a"}).json()
    assert not r["passed"] and r["feedback"].startswith("差一点") and r["hint_text"]
    for qid, ans in [("q1", "b"), ("q2", "a"), ("q3", "我会告诉厨房，写在单上")]:
        r = client.post("/api/training/lin-demo/answers", json={"module_id": m["id"], "question_id": qid, "answer": ans}).json()
        assert r["passed"], r
    assert r["module_complete"]
    r = client.post("/api/training/lin-demo/confidence", json={"module_id": m["id"], "confidence": 3}).json()
    assert r["status"] == "REVIEW"

    board = client.get("/api/board").json()
    lin = next(t for t in board["columns"]["REVIEW"] if t["name"] == "Lin Chen")
    assert all(mm["passed"] for mm in lin["hire"]["modules"])

    assert client.post(f"/api/hires/{lin['hire']['id']}/stamp").json()["ok"]
    assert client.get("/api/training/lin-demo/status").json()["status"] == "SHIFT_READY"


def test_send_back_translates_and_reopens(client):
    board = client.get("/api/board").json()
    mei = next(t for t in board["columns"]["REVIEW"] if t["name"] == "Mei Huang")
    mod = mei["hire"]["modules"][1]
    note = "Let's go over this step once more before your first shift. You're very close!"
    r = client.post(f"/api/hires/{mei['hire']['id']}/send-back", json={"module_id": mod["id"], "note": note}).json()
    assert r["translated"] and "复习" in r["note"]
    st = client.get("/api/training/mei-demo/status").json()
    assert st["status"] == "TRAINING" and st["sent_back"]["module_id"] == mod["id"]


def test_confidence_gap_flag(client):
    board = client.get("/api/board").json()
    mei = next(t for t in board["columns"]["REVIEW"] if t["name"] == "Mei Huang")
    assert any(f["kind"] == "buddy" for f in mei["hire"]["flags"])
    jorge = next(t for t in board["columns"]["REVIEW"] if t["name"] == "Jorge Castillo")
    assert any(f["kind"] == "double_check" for f in jorge["hire"]["flags"])
