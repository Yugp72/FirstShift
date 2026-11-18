from __future__ import annotations

from fastapi import APIRouter

from ..seed import seed
from ..services.events import bus

router = APIRouter(prefix="/api", tags=["demo"])


@router.post("/demo/reset")
async def reset():
    seed()
    bus.publish({"type": "board.reset"})
    return {"ok": True}
