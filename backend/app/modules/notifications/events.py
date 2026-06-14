import logging

from app.core.event_bus import Event, EventType, event_bus
from app.core.sse import stream_manager

logger = logging.getLogger(__name__)


async def on_notification_created(event: Event) -> None:
    data = event.data or {}
    logger.info("[Notifications] Created for user %s: %s", data.get("user_id", "?"), data.get("title", ""))

    from app.database.session import async_session_factory
    from app.models.models import Notification as NotificationModel

    user_id = data.get("user_id")
    if not user_id:
        return

    async with async_session_factory() as session:
        notif = NotificationModel(
            user_id=user_id,
            title=data.get("title", ""),
            message=data.get("message", ""),
            notification_type=data.get("notification_type", "info"),
        )
        session.add(notif)
        await session.flush()

    event_for_sse = Event(type=EventType.NOTIFICATION_CREATED, data=data)
    await stream_manager.broadcast(event_for_sse)


def register_notification_events() -> None:
    event_bus.subscribe(EventType.NOTIFICATION_CREATED, on_notification_created)
    logger.debug("Notification event subscribers registered")
