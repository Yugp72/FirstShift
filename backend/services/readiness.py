"""Per-hire readiness, confidence-gap flags, board assembly, metrics and team knowledge gaps."""
from __future__ import annotations

import json
import os

from ..ai import get_provider
from ..db import modules_for, now_iso, parse_iso, row, rows
from ..i18n import pick
from .events import bus

STATUSES = ["APPLIED", "TRAINING", "REVIEW", "SHIFT_READY"]
LANG_NAMES = {"en": "English", "zh": "中文", "es": "Español"}


def module_progress(hire_id: int | None, role: str) -> list[dict]:
    results = {}
    if hire_id:
        results = {r["module_id"]: r for r in rows("SELECT * FROM module_result WHERE hire_id=?", hire_id)}
    out = []
    for m in modules_for(role):
        r = results.get(m["id"])
        out.append({"id": m["id"], "slug": m["slug"], "icon": m["icon"], "title": pick(m["title"], "en"),
                    "passed": bool(r and r["passed"]), "score": r["score"] if r else None,
                    "confidence": r["confidence"] if r else None})
    return out


def flags_for(mods: list[dict]) -> list[dict]:
    done = [m for m in mods if m["passed"] and m["confidence"]]
    flags: list[dict] = []
    if not done:
        return flags
    avg = sum(m["score"] for m in done) / len(done)
    nervous = [m for m in done if m["confidence"] == 1]
    if nervous and avg >= 0.85:
        flags.append({"kind": "buddy", "label": "Needs a buddy shift",
                      "detail": f"Scored {round(avg * 100)}% but feels unsure about {nervous[0]['title']}.",
                      "module": nervous[0]["title"]})
    sure_missed = [m for m in done if m["confidence"] == 3 and m["score"] < 0.7]
    if sure_missed:
        m = sure_missed[0]
        flags.append({"kind": "double_check", "label": f"Double-check: {m['title']}",
                      "detail": f"Felt very sure, but missed {round((1 - m['score']) * 3)} of 3 on first try.",
                      "module": m["title"]})
    return flags


def ticket(c: dict) -> dict:
    job = row("SELECT role, title FROM job WHERE id=?", c["job_id"]) or {"role": "server", "title": ""}
    h = row("SELECT * FROM hire WHERE candidate_id=?", c["id"])
    mods = module_progress(h["id"] if h else None, job["role"])
    flags = flags_for(mods) if h else []
    done = [m for m in mods if m["passed"]]
    first_try_pct = round(100 * sum(m["score"] for m in done) / len(done)) if done else 0
    confs = [m["confidence"] for m in mods if m["confidence"]]
    summary_in = {"name": c["name"], "status": c["status"], "source_channel": c["source_channel"],
                  "lang_name": LANG_NAMES.get(c["preferred_lang"], "English"), "modules": mods,
                  "flags": flags, "first_try_pct": first_try_pct}
    sent_back = None
    if h and h["sent_back_module_id"]:
        sm = next((m for m in mods if m["id"] == h["sent_back_module_id"]), None)
        sent_back = {"module_id": h["sent_back_module_id"], "module": sm["title"] if sm else "",
                     "note": h["sent_back_note_original"]}
    return {
        "id": c["id"], "ticket_no": c["ticket_no"], "name": c["name"], "role": job["role"],
        "job_title": job["title"], "lang": c["preferred_lang"], "status": c["status"],
        "source_channel": c["source_channel"], "applied_at": c["created_at"], "updated_at": c["updated_at"],
        "hire": None if not h else {
            "id": h["id"], "token": h["token"], "path": f"/t/{h['token']}", "lang": h["lang"],
            "started_at": h["started_at"], "stamped_at": h["stamped_at"],
            "modules": mods, "flags": flags, "first_try_pct": first_try_pct,
            "confidence": confs[-1] if confs else None, "sent_back": sent_back,
        },
        "summary": get_provider().summarize_readiness(summary_in),
    }


def metrics(tickets: list[dict]) -> dict:
    on_rail = [t for t in tickets if t["status"] != "SHIFT_READY"]
    ready = [t for t in tickets if t["status"] == "SHIFT_READY" and t["hire"]]
    days = []
    for t in ready:
        s, e = parse_iso(t["hire"]["started_at"]), parse_iso(t["hire"]["stamped_at"])
        if s and e:
            days.append((e - s).total_seconds() / 86400)
    hired = [t for t in tickets if t["hire"]]
    total_mods = sum(len(t["hire"]["modules"]) for t in hired)
    passed_mods = sum(1 for t in hired for m in t["hire"]["modules"] if m["passed"])
    flagged = sum(1 for t in hired if t["hire"]["flags"])
    return {
        "on_rail": len(on_rail),
        "avg_days_to_ready": round(sum(days) / len(days), 1) if days else None,
        "completion_rate": round(100 * passed_mods / total_mods) if total_mods else 0,
        "approvals_with_evidence": len(ready),
        "flags": flagged,
    }


def board() -> dict:
    cands = rows("SELECT * FROM candidate ORDER BY updated_at DESC, id DESC")
    tickets = [ticket(c) for c in cands]
    columns = {s: [t for t in tickets if t["status"] == s] for s in STATUSES}
    jobs = []
    for j in rows("SELECT * FROM job WHERE closed=0 ORDER BY created_at DESC"):
        jobs.append({"id": j["id"], "role": j["role"], "title": j["title"], "pay_range": j["pay_range"],
                     "schedule": j["schedule"], "languages": json.loads(j["languages"]),
                     "channels": len(json.loads(j["posts"] or "[]")), "created_at": j["created_at"],
                     "applicants": sum(1 for c in cands if c["job_id"] == j["id"])})
    return {"jobs": jobs, "columns": columns, "metrics": metrics(tickets),
            "public_base": os.environ.get("FS_PUBLIC_URL") or None}


def recompute(candidate_id: int) -> str:
    """TRAINING -> REVIEW once every module is passed and has a confidence; back to TRAINING if not."""
    c = row("SELECT c.*, j.role FROM candidate c JOIN job j ON j.id=c.job_id WHERE c.id=?", candidate_id)
    if not c or c["status"] not in ("TRAINING", "REVIEW"):
        return c["status"] if c else ""
    h = row("SELECT id FROM hire WHERE candidate_id=?", candidate_id)
    mods = module_progress(h["id"], c["role"])
    new = "REVIEW" if all(m["passed"] and m["confidence"] for m in mods) else "TRAINING"
    if new != c["status"]:
        move(candidate_id, c["status"], new)
    return new


def move(candidate_id: int, frm: str, to: str, **extra) -> None:
    from ..db import execute

    execute("UPDATE candidate SET status=?, updated_at=? WHERE id=?", to, now_iso(), candidate_id)
    bus.publish({"type": "ticket.moved", "candidate_id": candidate_id, "from": frm, "to": to, **extra})


def insights(limit: int = 3) -> list[dict]:
    """Most-missed questions on first try, across every hire who attempted them."""
    first = rows(
        "SELECT a.hire_id, a.module_id, a.question_id, a.passed FROM attempt a "
        "JOIN (SELECT hire_id, module_id, question_id, MIN(id) AS mid FROM attempt "
        "      GROUP BY hire_id, module_id, question_id) f ON f.mid = a.id")
    stats: dict[tuple[int, str], dict] = {}
    for a in first:
        s = stats.setdefault((a["module_id"], a["question_id"]), {"attempted": 0, "missed": 0})
        s["attempted"] += 1
        s["missed"] += 0 if a["passed"] else 1
    out = []
    from ..db import module_by_id

    for (mid, qid), s in stats.items():
        if not s["missed"]:
            continue
        m = module_by_id(mid)
        q = next(q for q in m["questions"] if q["id"] == qid)
        hint = next((c for c in m["cards"] if c["id"] == q.get("hint_card")), None)
        out.append({"module": pick(m["title"], "en"), "module_icon": m["icon"], "role": m["role"],
                    "question": pick(q["prompt"], "en"), "missed": s["missed"], "attempted": s["attempted"],
                    "lesson_line": pick(hint["text"], "en") if hint else ""})
    out.sort(key=lambda x: (-x["missed"] / x["attempted"], -x["missed"]))
    return out[:limit]
