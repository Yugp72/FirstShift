"""The hire's side: modules in their language, kind grading, confidence, readiness status."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from ..db import execute, module_by_id, modules_for, now_iso, row, rows
from ..i18n import LANGS, pick
from ..services.events import bus
from ..services.grading import grade
from ..services.readiness import recompute

router = APIRouter(prefix="/api/training", tags=["training"])
media_router = APIRouter(prefix="/api/media", tags=["media"])

MEDIA_FILE = Path(__file__).resolve().parent.parent / "seed" / "media.json"
SECONDS_PER_CARD = 6
PREF_IDS = {"captions", "visual", "read_aloud", "seated", "extra_time"}
FORMATS = {"read", "pictures", "video", "listen"}


def _seconds_per_card(slug: str) -> int:
    """Caption timing per lesson; a Framia video can set its own (e.g. 3 s per step for a 15 s clip)."""
    return int(_media().get(slug, {}).get("seconds_per_card", SECONDS_PER_CARD))


def _media() -> dict:
    """Framia-generated media per module slug. Missing entries fall back to the built-in walkthrough."""
    try:
        return json.loads(MEDIA_FILE.read_text(encoding="utf-8")).get("modules", {})
    except (OSError, ValueError):
        return {}

ROLE_TITLES = {"server": {"en": "Server", "zh": "服务员", "es": "Mesero/a"},
               "kitchen": {"en": "Kitchen prep", "zh": "厨房备料", "es": "Preparación en cocina"}}


def _hire(token: str) -> dict:
    h = row("SELECT h.*, c.name, c.status, c.ticket_no, c.id AS candidate_id, j.role FROM hire h "
            "JOIN candidate c ON c.id=h.candidate_id JOIN job j ON j.id=c.job_id WHERE h.token=?", token)
    if not h:
        raise HTTPException(404, "This training link isn't active.")
    return h


def _localize_module(m: dict, lang: str, hire_id: int) -> dict:
    res = row("SELECT * FROM module_result WHERE hire_id=? AND module_id=?", hire_id, m["id"])
    answered = {r["question_id"] for r in rows(
        "SELECT DISTINCT question_id FROM attempt WHERE hire_id=? AND module_id=? AND passed=1 AND superseded=0",
        hire_id, m["id"])}
    return {
        "id": m["id"], "slug": m["slug"], "icon": m["icon"], "title": pick(m["title"], lang),
        "cards": [{"id": c["id"], "icon": c["icon"], "text": pick(c["text"], lang)} for c in m["cards"]],
        "questions": [{
            "id": q["id"], "type": q["type"], "prompt": pick(q["prompt"], lang),
            "options": [{"id": o["id"], "text": pick(o["text"], lang), "icon": o.get("icon", "")}
                        for o in q.get("options", [])],
        } for q in m["questions"]],
        "media": _media().get(m["slug"], {}),
        "seconds_per_card": _seconds_per_card(m["slug"]),
        "passed": bool(res and res["passed"]), "confidence": res["confidence"] if res else None,
        "answered": sorted(answered),
    }


def _status(h: dict) -> dict:
    sent_back = None
    if h["sent_back_module_id"]:
        sent_back = {"module_id": h["sent_back_module_id"], "note": h["sent_back_note"],
                     "original": h["sent_back_note_original"]}
    return {"status": h["status"], "stamped_at": h["stamped_at"], "sent_back": sent_back}


@router.get("/{token}")
async def get_training(token: str, lang: str | None = None):
    h = _hire(token)
    lang = lang if lang in LANGS else (h["lang"] or "en")
    return {
        "hire": {"name": h["name"], "first_name": h["name"].split()[0], "role": h["role"],
                 "role_title": pick(ROLE_TITLES.get(h["role"], ROLE_TITLES["server"]), lang),
                 "ticket_no": h["ticket_no"], "lang": h["lang"],
                 "prefs": json.loads(h["prefs"] or "[]"), "mode": "practice" if h["status"] == "PRACTICE" else "hired",
                 **_status(h)},
        "lang": lang,
        "modules": [_localize_module(m, lang, h["id"]) for m in modules_for(h["role"])],
    }


class LangIn(BaseModel):
    lang: str


@router.post("/{token}/lang")
async def set_lang(token: str, body: LangIn):
    h = _hire(token)
    if body.lang not in LANGS:
        raise HTTPException(400, "Unsupported language")
    execute("UPDATE hire SET lang=? WHERE id=?", body.lang, h["id"])
    execute("UPDATE candidate SET preferred_lang=? WHERE id=?", body.lang, h["candidate_id"])
    bus.publish({"type": "ticket.updated", "candidate_id": h["candidate_id"]})
    return {"ok": True, "lang": body.lang}


class PrefsIn(BaseModel):
    prefs: list[str]


@router.post("/{token}/prefs")
async def set_prefs(token: str, body: PrefsIn):
    h = _hire(token)
    prefs = [p for p in body.prefs if p in PREF_IDS]
    execute("UPDATE hire SET prefs=? WHERE id=?", json.dumps(prefs), h["id"])
    bus.publish({"type": "ticket.updated", "candidate_id": h["candidate_id"]})
    return {"ok": True, "prefs": prefs}


class FormatIn(BaseModel):
    module_id: int
    format: str


@router.post("/{token}/format")
async def used_format(token: str, body: FormatIn):
    h = _hire(token)
    if body.format not in FORMATS:
        raise HTTPException(400, "Unknown format")
    execute("INSERT OR IGNORE INTO format_use(hire_id,module_id,format,created_at) VALUES (?,?,?,?)",
            h["id"], body.module_id, body.format, now_iso())
    return {"ok": True}


class AnswerIn(BaseModel):
    module_id: int
    question_id: str
    answer: str
    confidence: int | None = None


@router.post("/{token}/answers")
async def answer(token: str, body: AnswerIn):
    h = _hire(token)
    if h["status"] == "SHIFT_READY":
        raise HTTPException(409, "Already shift-ready")
    m = module_by_id(body.module_id)
    if not m or m["role"] != h["role"]:
        raise HTTPException(404, "Module not found")
    q = next((q for q in m["questions"] if q["id"] == body.question_id), None)
    if not q:
        raise HTTPException(404, "Question not found")
    lang = h["lang"] or "en"
    prior = row("SELECT COUNT(*) AS n FROM attempt WHERE hire_id=? AND module_id=? AND question_id=? AND superseded=0",
                h["id"], m["id"], q["id"])["n"]
    result = grade(q, body.answer, lang)
    conf = body.confidence if body.confidence in (1, 2, 3) else None
    execute("INSERT INTO attempt(hire_id,module_id,question_id,answer,passed,feedback,confidence,created_at)"
            " VALUES (?,?,?,?,?,?,?,?)",
            h["id"], m["id"], q["id"], body.answer, int(result["passed"]), result["feedback"], conf, now_iso())

    hint_text = None
    if result["hint_card"]:
        card = next((c for c in m["cards"] if c["id"] == result["hint_card"]), None)
        hint_text = pick(card["text"], lang) if card else None

    module_complete = False
    passed_q = {r["question_id"] for r in rows(
        "SELECT DISTINCT question_id FROM attempt WHERE hire_id=? AND module_id=? AND passed=1 AND superseded=0",
        h["id"], m["id"])}
    if all(qq["id"] in passed_q for qq in m["questions"]):
        firsts = rows("SELECT a.passed FROM attempt a JOIN (SELECT question_id, MIN(id) AS mid FROM attempt "
                      "WHERE hire_id=? AND module_id=? AND superseded=0 GROUP BY question_id) f ON f.mid=a.id",
                      h["id"], m["id"])
        score = sum(f["passed"] for f in firsts) / len(m["questions"])
        execute("INSERT INTO module_result(hire_id,module_id,passed,score,confidence,updated_at) VALUES (?,?,?,?,?,?) "
                "ON CONFLICT(hire_id,module_id) DO UPDATE SET passed=1, score=excluded.score, updated_at=excluded.updated_at",
                h["id"], m["id"], 1, score, None, now_iso())
        module_complete = True
    execute("UPDATE candidate SET updated_at=? WHERE id=?", now_iso(), h["candidate_id"])
    bus.publish({"type": "ticket.updated", "candidate_id": h["candidate_id"]})
    return {**result, "hint_text": hint_text, "first_try": prior == 0, "module_complete": module_complete}


class ConfidenceIn(BaseModel):
    module_id: int
    confidence: int


@router.post("/{token}/confidence")
async def confidence(token: str, body: ConfidenceIn):
    h = _hire(token)
    if body.confidence not in (1, 2, 3):
        raise HTTPException(400, "confidence must be 1, 2 or 3")
    res = row("SELECT id FROM module_result WHERE hire_id=? AND module_id=?", h["id"], body.module_id)
    if not res:
        raise HTTPException(409, "Finish the checks for this step first")
    execute("UPDATE module_result SET confidence=?, updated_at=? WHERE id=?", body.confidence, now_iso(), res["id"])
    if h["sent_back_module_id"] == body.module_id:
        execute("UPDATE hire SET sent_back_module_id=NULL, sent_back_note=NULL, sent_back_note_original=NULL WHERE id=?",
                h["id"])
    status = recompute(h["candidate_id"])
    bus.publish({"type": "ticket.updated", "candidate_id": h["candidate_id"]})
    return {"ok": True, "status": status}


@router.get("/{token}/status")
async def status(token: str):
    return _status(_hire(token))


@media_router.get("/{module_id}/captions.vtt")
async def captions(module_id: int, lang: str = "en"):
    """WebVTT captions, one cue per lesson card. Framia videos are generated to the same timing."""
    m = module_by_id(module_id)
    if not m:
        raise HTTPException(404, "Module not found")
    lang = lang if lang in LANGS else "en"

    def ts(sec: int) -> str:
        return f"00:{sec // 60:02d}:{sec % 60:02d}.000"

    per = _seconds_per_card(m["slug"])
    lines = ["WEBVTT", ""]
    for i, c in enumerate(m["cards"]):
        lines += [str(i + 1), f"{ts(i * per)} --> {ts((i + 1) * per)}", pick(c["text"], lang), ""]
    return PlainTextResponse("\n".join(lines), media_type="text/vtt; charset=utf-8")
