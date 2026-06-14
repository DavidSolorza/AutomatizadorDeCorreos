import logging

from app.core.event_bus import Event, EventType, event_bus

logger = logging.getLogger(__name__)


async def on_sync_completed(event: Event) -> None:
    data = event.data or {}
    synced_count = data.get("synced", 0)
    user_id = data.get("user_id", "")

    if not user_id or synced_count == 0:
        return

    logger.debug("[Summary] Auto-generate triggered for user %s (%d emails)", user_id, synced_count)


def register_summary_events() -> None:
    event_bus.subscribe(EventType.SYNC_COMPLETED, on_sync_completed)
    logger.debug("Summary event subscribers registered")
