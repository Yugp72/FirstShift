"""The manager's Rail: board, hire action, stamp, send-back, insights."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..ai import get_provider
from ..db import execute, now_iso, row
from ..services.readiness import board, insights, move, ticket

router = APIRouter(prefix="/api", tags=["rail"])


@router.get("/board")
async def get_board():
    return board()


@router.post("/candidates/{candidate_id}/hire")
async def hire(candidate_id: int):
    c = row("SELECT * FROM candidate WHERE id=?", candidate_id)
    if not c:
        raise HTTPException(404, "Candidate not found")
    if c["status"] != "APPLIED":
        raise HTTPException(409, "Already hired")
    token = secrets.token_urlsafe(6).replace("-", "x").replace("_", "y")
    execute("INSERT INTO hire(candidate_id,token,lang,started_at) VALUES (?,?,?,?)",
            candidate_id, token, c["preferred_lang"], now_iso())
    move(candidate_id, "APPLIED", "TRAINING")
    return {"token": token, "path": f"/t/{token}", "ticket": ticket(row("SELECT * FROM candidate WHERE id=?", candidate_id))}


def _hire_row(hire_id: int) -> dict:
    h = row("SELECT h.*, c.status, c.id AS cid FROM hire h JOIN candidate c ON c.id=h.candidate_id WHERE h.id=?", hire_id)
    if not h:
        raise HTTPException(404, "Hire not found")
    return h


@router.post("/hires/{hire_id}/stamp")
async def stamp(hire_id: int):
    h = _hire_row(hire_id)
    if h["status"] != "REVIEW":
        raise HTTPException(409, "Only tickets at the pass can be stamped")
    execute("UPDATE hire SET stamped_at=?, stamped_by=? WHERE id=?", now_iso(), "Manager", hire_id)
    move(h["cid"], "REVIEW", "SHIFT_READY", stamped=True)
    return {"ok": True}


class SendBackIn(BaseModel):
    module_id: int
    note: str


@router.post("/hires/{hire_id}/send-back")
async def send_back(hire_id: int, body: SendBackIn):
    h = _hire_row(hire_id)
    if h["status"] not in ("REVIEW", "TRAINING"):
        raise HTTPException(409, "Only tickets in training or at the pass can be sent back")
    note = body.note.strip()[:400]
    lang = h["lang"] or "en"
    translated = get_provider().translate(note, lang) if note else ""
    execute("UPDATE attempt SET superseded=1 WHERE hire_id=? AND module_id=?", hire_id, body.module_id)
    execute("DELETE FROM module_result WHERE hire_id=? AND module_id=?", hire_id, body.module_id)
    execute("UPDATE hire SET sent_back_module_id=?, sent_back_note=?, sent_back_note_original=? WHERE id=?",
            body.module_id, translated, note, hire_id)
    if h["status"] == "REVIEW":
        move(h["cid"], "REVIEW", "TRAINING", sent_back=True)
    return {"ok": True, "lang": lang, "note": translated, "translated": lang == "en" or translated != note}


@router.get("/insights")
async def get_insights():
    return {"gaps": insights(3)}
