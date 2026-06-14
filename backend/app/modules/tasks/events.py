import logging

from app.core.event_bus import Event, EventType, event_bus

logger = logging.getLogger(__name__)


async def on_task_detected(event: Event) -> None:
    data = event.data or {}
    logger.info("[Tasks] Detected %s: %s", data.get("id", "?"), data.get("title", "")[:60])


def register_task_events() -> None:
    event_bus.subscribe(EventType.TASK_DETECTED, on_task_detected)
    logger.debug("Task event subscribers registered")
