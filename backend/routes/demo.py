from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth import require_manager
from ..seed import seed
from ..services.events import bus

router = APIRouter(prefix="/api", tags=["demo"], dependencies=[Depends(require_manager)])


@router.post("/demo/reset")
async def reset():
    seed()
    bus.publish({"type": "board.reset"})
    return {"ok": True}
