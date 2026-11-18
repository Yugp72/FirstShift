"""GET /api/events: Server-Sent Events stream of ticket changes."""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from ..auth import require_manager
from ..services.events import bus

router = APIRouter(prefix="/api", tags=["events"], dependencies=[Depends(require_manager)])


@router.get("/events")
async def events(request: Request):
    q = bus.subscribe()

    async def gen():
        try:
            yield "retry: 2000\n\n"
            yield 'data: {"type": "hello"}\n\n'
            while True:
                if await request.is_disconnected():
                    break
                try:
                    ev = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            bus.unsubscribe(q)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
