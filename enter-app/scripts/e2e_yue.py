"""End-to-end check of Cantonese (粵語) support against the FirstShift API.

Usage: python e2e_yue.py [BASE]   (default http://localhost:8787). Resets demo data at start and end.
"""
import json
import sys
import time
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787").rstrip("/")
fails = 0


def call(method, path, body=None, sid=None, timeout=120):
    req = urllib.request.Request(BASE + path, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", **({"x-fs-session": sid} if sid else {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def ok(cond, label):
    global fails
    print(("PASS " if cond else "FAIL ") + label)
    fails += 0 if cond else 1


_, m = call("POST", "/api/auth/demo", {"role": "manager"})
M = m["session"]
call("POST", "/api/demo/reset", {}, M)

_, meta = call("GET", "/api/meta", sid=M)
codes = [l["code"] for l in meta["languages"]]
ok("yue" in codes, f"meta languages {codes}")
ok(all(l["name"] != "Cantonese" for l in meta["pilot_languages"]), "Cantonese no longer a pilot language")
ok("chat_yue" in meta["channels"], "粵語 chat channel exists")

# Training in Cantonese (Lin's demo link; restored by the reset at the end)
T = "/api/training/lin-demo"
s, _ = call("POST", T + "/lang", {"lang": "yue"})
ok(s == 200, "set training language to yue")
_, tr = call("GET", T)
ok(tr["lang"] == "yue", "training reports lang yue")
allergy = next(x for x in tr["modules"] if x["slug"] == "allergy")
print("   ", allergy["title"], "|", allergy["cards"][0]["text"])
ok(allergy["title"] == "敏感問題" and "落單" in allergy["cards"][0]["text"], "lesson content is Cantonese")
q_mc = allergy["questions"][0]
print("   ", q_mc["prompt"], [o["text"] for o in q_mc["options"]])
for o in q_mc["options"]:
    _, res = call("POST", T + "/answers", {"module_id": allergy["id"], "question_id": q_mc["id"], "answer": o["id"], "confidence": 3})
    if res.get("passed"):
        print("    mc feedback:", res["feedback"])
        ok(res["feedback"].startswith("啱"), "multiple-choice feedback in Cantonese")
        break
q_free = next(q for q in allergy["questions"] if q["type"] != "mc")
t0 = time.time()
_, res = call("POST", T + "/answers", {"module_id": allergy["id"], "question_id": q_free["id"], "answer": "我會即刻話畀廚房知，仲會寫喺張單上面。", "confidence": 3})
print(f"    free text ({time.time() - t0:.0f}s, {res.get('graded_by')}):", res.get("passed"), res.get("feedback"))
ok(res.get("passed") is True, "Cantonese free-text answer passes")

# Apply in Cantonese
_, a = call("POST", "/api/auth/signup", {"name": "Ka Yan Chan", "email": f"kayan{int(time.time())}@firstshift.test", "password": "testpass123", "lang": "yue"})
A = a.get("session")
ok(bool(A), "sign up with lang yue")
_, jobs = call("GET", "/api/careers/jobs", sid=A)
j = jobs["jobs"][0]
_, ap = call("POST", f"/api/careers/jobs/{j['id']}/apply", {"lang": "yue", "prefs": ["read_aloud"]}, A)
print("    reply:", ap.get("reply"), ap.get("interview_slots"))
ok("唔使履歷" in (ap.get("reply") or ""), "apply reply in Cantonese")
ok(any("星期" in s for s in ap.get("interview_slots", [])), "interview slots in zh-HK")

# Manager: hire, then send back a step; note translated to Cantonese
_, b = call("GET", "/api/board", sid=M)
cand = next(t for t in b["columns"]["APPLIED"] if t["name"] == "Ka Yan Chan")
_, h = call("POST", f"/api/candidates/{cand['id']}/hire", {}, M)
ok(bool(h.get("token")), "hire Cantonese applicant")
_, b = call("GET", "/api/board", sid=M)
tk = next(t for col in b["columns"].values() for t in col if t["name"] == "Ka Yan Chan")
t0 = time.time()
_, sb = call("POST", f"/api/hires/{tk['hire']['id']}/send-back", {"module_id": tk["hire"]["modules"][0]["id"], "note": "Please review this step once more before your first shift. You're very close!"}, M)
print(f"    send-back ({time.time() - t0:.0f}s):", sb)
ok(sb.get("lang") == "yue" and sb.get("translated"), "send-back note translated to Cantonese")

# Job posts with Cantonese
t0 = time.time()
_, jp = call("POST", "/api/jobs", {"role": "server", "title": "Weekend server", "schedule": "Sat–Sun evenings, 4 shifts a week",
                                    "requirements": ["no_experience", "weekends", "standing"], "languages": ["en", "zh", "yue", "es"], "notes": ""}, M, timeout=150)
posts = {p["channel"]: p for p in jp.get("job", jp).get("posts", [])}
print(f"    posts ({time.time() - t0:.0f}s, {jp.get('job', jp).get('posts_by')}):", list(posts))
ok("chat_yue" in posts, "粵語 WhatsApp post generated")
if "chat_yue" in posts:
    print("   ", posts["chat_yue"]["text"][:160].replace("\n", " / "))

call("POST", "/api/demo/reset", {}, M)
print("FAILURES:", fails)
sys.exit(1 if fails else 0)
