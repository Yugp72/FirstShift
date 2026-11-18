"""The only place AI is called. Provider chosen by FS_MODE (mock | live) and FS_PROVIDER."""
from __future__ import annotations

import os

from .. import config  # noqa: F401  (loads .env before FS_MODE is read)
from .base import AIProvider
from .mock import MockProvider

_cached: tuple[str, AIProvider] | None = None


def get_provider() -> AIProvider:
    global _cached
    mode = os.environ.get("FS_MODE", "mock").lower()
    which = os.environ.get("FS_PROVIDER", "converge").lower()
    key = f"{mode}:{which}"
    if _cached is None or _cached[0] != key:
        if mode == "live":
            from .converge import ConvergeProvider, FallbackProvider

            provider: AIProvider = FallbackProvider(ConvergeProvider(), MockProvider())
        else:
            provider = MockProvider()
        _cached = (key, provider)
    return _cached[1]


def provider_info() -> dict:
    p = get_provider()
    return {"mode": os.environ.get("FS_MODE", "mock").lower(), "provider": p.name}
