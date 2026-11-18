"""Applicant side: browse open jobs, apply with an account, track applications."""
from __future__ import annotations

import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..auth import current_account, require_account
from ..db import execute, modules_for, now_iso, row, rows
from ..i18n import pick
from ..services.events import bus

router = APIRouter(prefix="/api", tags=["careers"])
ROLE_LABEL = {"server": "Front of house", "kitchen": "Back of house"}


def _job_public(j: dict) -> dict:
    posts = json.loads(j["posts"] or "[]")
    listing = next((p["text"] for p in posts if p["channel"] == "job_board"), "")
    easy = next((p["text"] for p in posts if p["channel"] == "easy_read"), "")
    return {"id": j["id"], "role": j["role"], "area": ROLE_LABEL.get(j["role"], ""), "title": j["title"],
            "location": j["location"], "pay_range": j["pay_range"], "schedule": j["schedule"],
            "requirements": json.loads(j["requirements"]), "languages": json.loads(j["languages"]),
            "created_at": j["created_at"], "listing": listing, "easy_read": easy}


@router.get("/careers/jobs")
async def open_jobs():
    return {"jobs": [_job_public(j) for j in rows("SELECT * FROM job WHERE closed=0 ORDER BY created_at DESC")]}


@router.get("/careers/jobs/{job_id}")
async def open_job(job_id: int):
    j = row("SELECT * FROM job WHERE id=? AND closed=0", job_id)
    if not j:
        raise HTTPException(404, "This job is no longer open.")
    return _job_public(j)


class ApplyIn(BaseModel):
    lang: str | None = None


@router.post("/careers/jobs/{job_id}/apply")
async def apply(job_id: int, body: ApplyIn, acct: dict = Depends(require_account)):
    if acct["role"] != "applicant":
        raise HTTPException(403, "Sign in with an applicant account to apply.")
    j = row("SELECT * FROM job WHERE id=? AND closed=0", job_id)
    if not j:
        raise HTTPException(404, "This job is no longer open.")
    if row("SELECT id FROM candidate WHERE account_id=? AND job_id=? AND status!='PRACTICE'", acct["id"], job_id):
        raise HTTPException(409, "You've already applied to this job.")
    lang = body.lang if body.lang in ("en", "zh", "es") else (acct["lang"] or "en")
    nxt = (row("SELECT MAX(ticket_no) AS n FROM candidate")["n"] or 400) + 1
    cid = execute("INSERT INTO candidate(job_id,ticket_no,name,preferred_lang,source_channel,status,created_at,updated_at,account_id)"
                  " VALUES (?,?,?,?,?,?,?,?,?)", job_id, nxt, acct["name"], lang, "FirstShift jobs", "APPLIED",
                  now_iso(), now_iso(), acct["id"])
    bus.publish({"type": "ticket.moved", "candidate_id": cid, "from": None, "to": "APPLIED"})
    return {"ok": True, "application_id": cid}


@router.get("/me/applications")
async def my_applications(acct: dict = Depends(require_account)):
    out = []
    for c in rows("SELECT c.*, j.title, j.role, j.location, j.schedule FROM candidate c JOIN job j ON j.id=c.job_id "
                  "WHERE c.account_id=? AND c.status!='PRACTICE' ORDER BY c.created_at DESC", acct["id"]):
        h = row("SELECT * FROM hire WHERE candidate_id=?", c["id"])
        mods = modules_for(c["role"])
        passed = 0
        if h:
            passed = row("SELECT COUNT(*) AS n FROM module_result WHERE hire_id=? AND passed=1", h["id"])["n"]
        out.append({"id": c["id"], "job_id": c["job_id"], "title": c["title"], "role": c["role"], "location": c["location"],
                    "schedule": c["schedule"], "status": c["status"], "applied_at": c["created_at"],
                    "training": {"token": h["token"], "passed": passed, "total": len(mods)} if h else None,
                    "stamped_at": h["stamped_at"] if h else None})
    return {"applications": out}


# ---------------- Training catalogue ----------------
ROLE_TITLE = {"server": "Server essentials", "kitchen": "Kitchen prep essentials"}
ROLE_BLURB = {
    "server": "Greet and seat guests, serve tea safely, and handle allergy questions the right way.",
    "kitchen": "Hand-washing and gloves, cold storage and labels, knife and station safety.",
}


@router.get("/learn/courses")
async def courses():
    from .training import _media  # noqa: PLC0415

    media = _media()
    out = []
    for role in ("server", "kitchen"):
        mods = modules_for(role)
        out.append({"role": role, "title": ROLE_TITLE[role], "area": ROLE_LABEL[role], "blurb": ROLE_BLURB[role],
                    "sections": [{"title": pick(m["title"], "en"), "icon": m["icon"], "lessons": len(m["cards"]),
                                  "questions": len(m["questions"]), "has_video": bool(media.get(m["slug"], {}).get("video"))}
                                 for m in mods],
                    "lessons": sum(len(m["cards"]) for m in mods), "quizzes": len(mods)})
    return {"courses": out}


class SessionIn(BaseModel):
    role: str
    token: str | None = None


@router.post("/learn/session")
async def learn_session(body: SessionIn, request: Request):
    """Return the training token to use for a course.

    Hired for this role -> the real hire token (progress counts toward approval).
    Otherwise -> a practice token (never shown on the manager's pipeline), reused per account or per device.
    """
    if body.role not in ROLE_TITLE:
        raise HTTPException(400, "Unknown course")
    acct = current_account(request)
    if acct:
        h = row("SELECT h.token FROM candidate c JOIN job j ON j.id=c.job_id JOIN hire h ON h.candidate_id=c.id "
                "WHERE c.account_id=? AND j.role=? AND c.status IN ('TRAINING','REVIEW','SHIFT_READY') "
                "ORDER BY c.id DESC LIMIT 1", acct["id"], body.role)
        if h:
            return {"token": h["token"], "mode": "hired"}
    if body.token:
        h = row("SELECT h.token, c.id AS cid, c.account_id FROM hire h JOIN candidate c ON c.id=h.candidate_id "
                "JOIN job j ON j.id=c.job_id WHERE h.token=? AND c.status='PRACTICE' AND j.role=?", body.token, body.role)
        if h and (h["account_id"] in (None, acct["id"] if acct else None)):
            if acct and h["account_id"] is None:
                execute("UPDATE candidate SET account_id=?, name=? WHERE id=?", acct["id"], acct["name"], h["cid"])
            return {"token": h["token"], "mode": "practice"}
    if acct:
        h = row("SELECT h.token FROM candidate c JOIN job j ON j.id=c.job_id JOIN hire h ON h.candidate_id=c.id "
                "WHERE c.account_id=? AND j.role=? AND c.status='PRACTICE' ORDER BY c.id DESC LIMIT 1", acct["id"], body.role)
        if h:
            return {"token": h["token"], "mode": "practice"}
    job = row("SELECT id FROM job WHERE role=? ORDER BY id LIMIT 1", body.role)
    if not job:
        raise HTTPException(404, "No course content for this role yet")
    lang = (acct["lang"] if acct else None) or "en"
    cid = execute("INSERT INTO candidate(job_id,ticket_no,name,preferred_lang,source_channel,status,created_at,updated_at,account_id)"
                  " VALUES (?,?,?,?,?,?,?,?,?)", job["id"], 0, acct["name"] if acct else "Learner", lang, "Practice",
                  "PRACTICE", now_iso(), now_iso(), acct["id"] if acct else None)
    token = "p-" + secrets.token_urlsafe(9).replace("-", "x").replace("_", "y")
    execute("INSERT INTO hire(candidate_id,token,lang,started_at,prefs) VALUES (?,?,?,?,?)", cid, token, lang, now_iso(), "[]")
    return {"token": token, "mode": "practice"}
