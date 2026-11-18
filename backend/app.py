"""FirstShift API. Run: uvicorn backend.app:app --reload  (FS_MODE=mock by default)."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .ai import provider_info
from .routes import demo, events, hires, jobs, training
from .seed import ensure_seeded

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_seeded()
    yield


app = FastAPI(title="FirstShift", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

for r in (jobs.router, hires.router, training.router, training.media_router, events.router, demo.router):
    app.include_router(r)


@app.get("/api/health")
async def health():
    return {"ok": True, **provider_info()}


MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"
MEDIA_DIR.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")  # Framia assets downloaded locally

if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        f = DIST / path
        if path and f.is_file() and DIST in f.resolve().parents:
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
