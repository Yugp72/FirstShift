"""Order In: one entry -> channel-formatted posts. Copy/export only (no platform APIs)."""
from __future__ import annotations

import csv
import io
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from ..ai import get_provider, provider_info
from ..ai.base import ALL_CHANNELS, JobInput
from ..db import execute, now_iso, row
from ..services.events import bus

router = APIRouter(prefix="/api", tags=["jobs"])
ROLES = json.loads((Path(__file__).resolve().parent.parent / "seed" / "roles.json").read_text(encoding="utf-8"))


@router.get("/meta")
async def meta():
    return {**{k: ROLES[k] for k in ["roles", "requirements", "languages", "pilot_languages", "channels", "send_back_notes"]},
            "ai": provider_info()}


def _job_out(j: dict) -> dict:
    return {**{k: j[k] for k in ["id", "role", "title", "location", "pay_range", "schedule", "notes", "created_at"]},
            "requirements": json.loads(j["requirements"]), "languages": json.loads(j["languages"]),
            "posts": json.loads(j["posts"] or "[]")}


@router.post("/jobs")
async def create_job(job: JobInput):
    if not job.title.strip():
        raise HTTPException(400, "Give the role a title")
    posts = [p.model_dump() for p in get_provider().generate_job_posts(job, ALL_CHANNELS)]
    jid = execute(
        "INSERT INTO job(role,title,location,pay_range,schedule,requirements,languages,notes,posts,created_at)"
        " VALUES (?,?,?,?,?,?,?,?,?,?)",
        job.role, job.title.strip(), job.location, job.pay_range, job.schedule, json.dumps(job.requirements),
        json.dumps(job.languages), job.notes, json.dumps(posts, ensure_ascii=False), now_iso())
    bus.publish({"type": "job.created", "job_id": jid})
    return _job_out(row("SELECT * FROM job WHERE id=?", jid))


@router.get("/jobs/{job_id}")
async def get_job(job_id: int):
    j = row("SELECT * FROM job WHERE id=?", job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    return _job_out(j)


@router.get("/jobs/{job_id}/export")
async def export_job(job_id: int, fmt: str = "csv"):
    j = row("SELECT * FROM job WHERE id=?", job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    out = _job_out(j)
    name = f"firstshift-job-{job_id}"
    if fmt == "json":
        return Response(json.dumps(out, ensure_ascii=False, indent=2), media_type="application/json",
                        headers={"Content-Disposition": f'attachment; filename="{name}.json"'})
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["channel", "label", "lang", "char_count", "limit", "text"])
    for p in out["posts"]:
        w.writerow([p["channel"], p["label"], p["lang"], len(p["text"]), p["limit"], p["text"]])
    return Response("﻿" + buf.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{name}.csv"'})
