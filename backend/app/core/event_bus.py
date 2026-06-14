from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, Set

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    GMAIL_CONNECTED = "gmail.connected"
    GMAIL_DISCONNECTED = "gmail.disconnected"
    SYNC_STARTED = "sync.started"
    SYNC_PROGRESS = "sync.progress"
    SYNC_COMPLETED = "sync.completed"
    SYNC_ERROR = "sync.error"
    EMAIL_CREATED = "email.created"
    EMAIL_UPDATED = "email.updated"
    EMAIL_DELETED = "email.deleted"
    TASK_DETECTED = "task.detected"
    TASK_CREATED = "task.created"
    TASK_UPDATED = "task.updated"
    RULE_APPLIED = "rule.applied"
    NOTIFICATION_CREATED = "notification.created"
    SUMMARY_GENERATED = "summary.generated"


@dataclass
class Event:
    type: EventType
    data: Any = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = ""


EventHandler = Callable[[Event], Awaitable[None] | None]


class EventBus:
    _instance: EventBus | None = None
    _subscribers: Dict[EventType, Set[EventHandler]]
    _history: list[Event]
    _max_history: int

    def __new__(cls) -> EventBus:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._subscribers = {}
            cls._instance._history = []
            cls._instance._max_history = 200
        return cls._instance

    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = set()
        self._subscribers[event_type].add(handler)
        logger.debug("Subscribed %s.%s to %s", getattr(handler, "__module__", "?"), getattr(handler, "__name__", "?"), event_type.value)

    def unsubscribe(self, event_type: EventType, handler: EventHandler) -> None:
        self._subscribers.get(event_type, set()).discard(handler)

    async def publish(self, event_type: EventType, data: Any = None, source: str = "") -> None:
        event = Event(type=event_type, data=data, source=source)
        await self._publish(event)

    async def _publish(self, event: Event) -> None:
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        logger.info("Event: %s | source=%s", event.type.value, event.source or "?")
        handlers = self._subscribers.get(event.type, set())
        if not handlers:
            return

        results = await asyncio.gather(
            *[self._safe_call(h, event) for h in handlers],
            return_exceptions=True,
        )
        for i, r in enumerate(results):
            if isinstance(r, Exception):
                h = list(handlers)[i]
                logger.error("Handler %s failed for %s: %s", getattr(h, "__name__", "?"), event.type.value, r)

    async def _safe_call(self, handler: EventHandler, event: Event) -> None:
        result = handler(event)
        if asyncio.iscoroutine(result):
            await result

    def get_history(self, event_type: EventType | None = None, limit: int = 20) -> list[Event]:
        if event_type:
            return [e for e in self._history if e.type == event_type][-limit:]
        return self._history[-limit:]

    def clear_history(self) -> None:
        self._history.clear()


event_bus = EventBus()
