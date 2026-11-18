"""Disk cache + live-call budget. Every live AI call must go through cached_call()."""
from __future__ import annotations

import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Any, Callable

log = logging.getLogger("firstshift.ai")

_live_calls = 0


class BudgetExceeded(RuntimeError):
    pass


def cache_dir() -> Path:
    return Path(os.environ.get("FS_CACHE_DIR", Path(__file__).resolve().parent.parent / "cache"))


def cache_key(adapter: str, method: str, payload: Any) -> str:
    raw = json.dumps([adapter, method, payload], sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def live_calls() -> int:
    return _live_calls


def reset_counter() -> None:
    global _live_calls
    _live_calls = 0


def cached_call(adapter: str, method: str, payload: Any, fn: Callable[[], Any]) -> Any:
    """Return a cached result if present, else spend one live call (within budget) and cache it."""
    global _live_calls
    key = cache_key(adapter, method, payload)
    path = cache_dir() / f"{adapter}-{method}-{key[:20]}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))["result"]

    budget = int(os.environ.get("FS_LIVE_BUDGET", "50"))
    if _live_calls >= budget:
        raise BudgetExceeded(f"Live AI budget of {budget} calls spent in this process; refusing {method}.")
    _live_calls += 1
    log.warning("LIVE CALL #%d for %s.%s", _live_calls, adapter, method)
    result = fn()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"adapter": adapter, "method": method, "payload": payload, "result": result},
                   ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    return result
