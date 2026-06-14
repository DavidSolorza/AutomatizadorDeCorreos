import logging

from app.core.event_bus import Event, EventType, event_bus

logger = logging.getLogger(__name__)


async def on_sync_started(event: Event) -> None:
    logger.info("[Gmail] Sync started: %s", event.data)


async def on_sync_completed(event: Event) -> None:
    data = event.data or {}
    logger.info(
        "[Gmail] Sync completed: %d synced for %s",
        data.get("synced", 0),
        data.get("email", "?"),
    )


async def on_sync_error(event: Event) -> None:
    logger.error("[Gmail] Sync error: %s", event.data)


def register_gmail_events() -> None:
    event_bus.subscribe(EventType.SYNC_STARTED, on_sync_started)
    event_bus.subscribe(EventType.SYNC_COMPLETED, on_sync_completed)
    event_bus.subscribe(EventType.SYNC_ERROR, on_sync_error)
    logger.debug("Gmail event subscribers registered")
