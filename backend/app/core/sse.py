from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

from app.core.event_bus import Event, EventType, event_bus

logger = logging.getLogger(__name__)


class EventStreamManager:
    _instance: EventStreamManager | None = None
    _queues: dict[str, asyncio.Queue] = {}

    def __new__(cls) -> EventStreamManager:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def subscribe(self, client_id: str) -> asyncio.Queue:
        if client_id not in self._queues:
            self._queues[client_id] = asyncio.Queue(maxsize=100)
        return self._queues[client_id]

    def unsubscribe(self, client_id: str) -> None:
        self._queues.pop(client_id, None)

    async def broadcast(self, event: Event) -> None:
        payload = json.dumps({
            "type": event.type.value,
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "source": event.source,
        }, default=str)
        disconnected = []
        for client_id, queue in self._queues.items():
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                disconnected.append(client_id)
        for cid in disconnected:
            self.unsubscribe(cid)


stream_manager = EventStreamManager()


async def event_stream(client_id: str) -> AsyncGenerator[str, None]:
    """
    SSE generator: yields formatted SSE messages for a given client.
    Usage in FastAPI:
        @router.get("/events")
        async def events(request: Request):
            client_id = str(id(request))
            return StreamingResponse(event_stream(client_id), media_type="text/event-stream")
    """
    queue = stream_manager.subscribe(client_id)
    try:
        yield "event: connected\ndata: {}\n\n"
        while True:
            try:
                payload = await asyncio.wait_for(queue.get(), timeout=30)
                yield f"event: message\ndata: {payload}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
    finally:
        stream_manager.unsubscribe(client_id)
