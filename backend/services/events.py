"""In-process pub/sub for Server-Sent Events. Publish only from the event loop thread (async routes)."""
from __future__ import annotations

import asyncio


class EventBus:
    def __init__(self) -> None:
        self.subscribers: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self.subscribers.discard(q)

    def publish(self, event: dict) -> None:
        for q in list(self.subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass


bus = EventBus()
