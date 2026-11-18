def _allergy_id(client, token="lin-demo"):
    return next(m["id"] for m in client.get(f"/api/training/{token}").json()["modules"] if m["slug"] == "allergy")


def test_prefs_and_formats_show_on_passport(client):
    assert client.post("/api/training/hana-demo/prefs", json={"prefs": ["captions", "visual", "bogus"]}).json()["prefs"] == ["captions", "visual"]
    mid = client.get("/api/training/hana-demo").json()["modules"][0]["id"]
    assert client.post("/api/training/hana-demo/format", json={"module_id": mid, "format": "video"}).json()["ok"]
    assert client.post("/api/training/hana-demo/format", json={"module_id": mid, "format": "nope"}).status_code == 400
    hana = next(t for t in client.get("/api/board").json()["columns"]["TRAINING"] if t["name"] == "Hana Kim")
    assert [p["id"] for p in hana["hire"]["prefs"]] == ["captions", "visual"]
    assert "Captioned video" in hana["hire"]["formats_used"]
    assert any("captioned" in n for n in hana["hire"]["setup_notes"])


def test_confidently_wrong_allergen_is_flagged(client):
    mid = _allergy_id(client)
    r = client.post("/api/training/lin-demo/answers", json={"module_id": mid, "question_id": "q1", "answer": "a", "confidence": 3}).json()
    assert not r["passed"]
    lin = next(t for t in client.get("/api/board").json()["columns"]["TRAINING"] if t["name"] == "Lin Chen")
    assert lin["hire"]["flags"][0]["kind"] == "allergen_risk"


def test_captions_vtt_per_language(client):
    mid = _allergy_id(client)
    vtt = client.get(f"/api/media/{mid}/captions.vtt?lang=es")
    per = next(m for m in client.get("/api/training/lin-demo").json()["modules"] if m["id"] == mid)["seconds_per_card"]
    assert vtt.status_code == 200 and vtt.text.startswith("WEBVTT")
    assert f"00:00:00.000 --> 00:00:{per:02d}.000" in vtt.text and "alergia" in vtt.text
    tea = next(m for m in client.get("/api/training/lin-demo").json()["modules"] if m["slug"] == "tea")
    assert tea["seconds_per_card"] == 6  # lessons without a Framia video keep the default timing


def test_seeded_daniel_has_visual_setup(client):
    daniel = next(t for t in client.get("/api/board").json()["columns"]["REVIEW"] if t["name"] == "Daniel Reyes")
    assert {"Captions", "Visual steps", "Seated station"} == {p["label"] for p in daniel["hire"]["prefs"]}
    assert "Picture steps" in daniel["hire"]["formats_used"]
