"""Build the SQLite DB from backend/seed/*.json. Run: python -m backend.seed"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .ai.base import ALL_CHANNELS, JobInput
from .ai.mock import MockProvider
import os

from .auth import hash_pw
from .db import get_conn, now_iso, row

SEED_DIR = Path(__file__).resolve().parent / "seed"


def _load(name: str) -> dict:
    return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))


def seed() -> None:
    conn = get_conn()
    now = datetime.now(timezone.utc)
    mock = MockProvider()
    conn.execute("BEGIN")
    try:
        for t in ["attempt", "module_result", "format_use", "hire", "candidate", "job", "module"]:
            conn.execute(f"DELETE FROM {t}")

        modules: dict[str, dict] = {}
        for fname in ["modules_server.json", "modules_kitchen.json"]:
            for m in _load(fname)["modules"]:
                cur = conn.execute("INSERT INTO module(role, ord, slug, content) VALUES (?,?,?,?)",
                                   (m["role"], m["order"], m["slug"], json.dumps(m, ensure_ascii=False)))
                modules[m["slug"]] = {**m, "id": cur.lastrowid}

        people = _load("people.json")
        # Demo accounts survive a reset (so nobody is signed out); passwords come from the seed file or env.
        pw = os.environ.get("FS_DEMO_PASSWORD") or people["demo_password"]
        acct_ids: dict[str, int] = {}
        for a in people["accounts"]:
            ex = conn.execute("SELECT id FROM account WHERE email=?", (a["email"],)).fetchone()
            if ex:
                acct_ids[a.get("candidate", a["email"])] = ex[0]
                continue
            cur = conn.execute("INSERT INTO account(email,name,role,pw_hash,lang,created_at) VALUES (?,?,?,?,?,?)",
                               (a["email"], a["name"], a["role"], hash_pw(pw), a["lang"], now_iso(now)))
            acct_ids[a.get("candidate", a["email"])] = cur.lastrowid
        job_ids: dict[str, int] = {}
        for j in people["jobs"]:
            ji = JobInput(role=j["role"], title=j["title"], location=j["location"], pay_range=j["pay_range"],
                          schedule=j["schedule"], requirements=j["requirements"], languages=j["languages"])
            posts = [p.model_dump() for p in mock.generate_job_posts(ji, ALL_CHANNELS)]
            cur = conn.execute(
                "INSERT INTO job(role,title,location,pay_range,schedule,requirements,languages,notes,posts,created_at)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (j["role"], j["title"], j["location"], j["pay_range"], j["schedule"], json.dumps(j["requirements"]),
                 json.dumps(j["languages"]), "", json.dumps(posts, ensure_ascii=False),
                 now_iso(now - timedelta(days=j["days_ago"]))))
            job_ids[j["key"]] = cur.lastrowid

        for c in people["candidates"]:
            created = now - timedelta(days=c["applied_days_ago"], hours=3)
            cur = conn.execute(
                "INSERT INTO candidate(job_id,ticket_no,name,preferred_lang,source_channel,status,created_at,updated_at,account_id)"
                " VALUES (?,?,?,?,?,?,?,?,?)",
                (job_ids[c["job"]], c["ticket"], c["name"], c["lang"], c["source"], c["status"],
                 now_iso(created), now_iso(created), acct_ids.get(c["name"])))
            cid = cur.lastrowid
            h = c.get("hire")
            if not h:
                continue
            started = now - timedelta(days=h["started_days_ago"], hours=2)
            stamped = now - timedelta(days=h["stamped_days_ago"]) if "stamped_days_ago" in h else None
            cur = conn.execute(
                "INSERT INTO hire(candidate_id,token,lang,started_at,stamped_at,stamped_by,prefs) VALUES (?,?,?,?,?,?,?)",
                (cid, h["token"], c["lang"], now_iso(started), now_iso(stamped) if stamped else None,
                 "Manager" if stamped else None, json.dumps(h.get("prefs", []))))
            hid = cur.lastrowid
            for i, mr in enumerate(h["modules"]):
                m = modules[mr["slug"]]
                at = now_iso(started + timedelta(hours=4 * (i + 1)))
                qs = m["questions"]
                for fmt in mr.get("formats", ["read"]):
                    conn.execute("INSERT OR IGNORE INTO format_use(hire_id,module_id,format,created_at) VALUES (?,?,?,?)",
                                 (hid, m["id"], fmt, at))
                for q in qs:
                    if q["id"] in mr["missed"]:
                        conf = 3 if q["id"] in mr.get("confident_wrong", []) else 2
                        conn.execute("INSERT INTO attempt(hire_id,module_id,question_id,answer,passed,feedback,confidence,created_at)"
                                     " VALUES (?,?,?,?,?,?,?,?)", (hid, m["id"], q["id"], "(seed)", 0, "", conf, at))
                    conn.execute("INSERT INTO attempt(hire_id,module_id,question_id,answer,passed,feedback,created_at)"
                                 " VALUES (?,?,?,?,?,?,?)", (hid, m["id"], q["id"], "(seed)", 1, "", at))
                score = (len(qs) - len(mr["missed"])) / len(qs)
                conn.execute("INSERT INTO module_result(hire_id,module_id,passed,score,confidence,updated_at)"
                             " VALUES (?,?,?,?,?,?)", (hid, m["id"], 1, score, mr["confidence"], at))
        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise


def ensure_accounts() -> None:
    """Create any missing demo accounts and link them to their seeded candidates (for DBs made before accounts)."""
    conn = get_conn()
    people = _load("people.json")
    pw = os.environ.get("FS_DEMO_PASSWORD") or people["demo_password"]
    for a in people["accounts"]:
        ex = row("SELECT id FROM account WHERE email=?", a["email"])
        aid = ex["id"] if ex else conn.execute(
            "INSERT INTO account(email,name,role,pw_hash,lang,created_at) VALUES (?,?,?,?,?,?)",
            (a["email"], a["name"], a["role"], hash_pw(pw), a["lang"], now_iso())).lastrowid
        if a.get("candidate"):
            conn.execute("UPDATE candidate SET account_id=? WHERE name=? AND account_id IS NULL", (aid, a["candidate"]))


def ensure_seeded() -> None:
    if not row("SELECT id FROM module LIMIT 1"):
        seed()
    ensure_accounts()


if __name__ == "__main__":
    seed()
    print("Seeded", row("SELECT COUNT(*) AS n FROM candidate")["n"], "candidates")
