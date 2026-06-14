import logging
from typing import Any

from app.core.event_bus import Event, EventType, event_bus
from app.core.sse import stream_manager

logger = logging.getLogger(__name__)


async def on_email_created(event: Event) -> None:
    data = event.data or {}
    logger.debug("[Email] Created: %s", data.get("id", "?"))

    try:
        from app.database.session import async_session_factory
        from app.modules.cases.service import CaseService

        async with async_session_factory() as session:
            case_service = CaseService(session)
            await case_service.create_from_email(data, user_id=data.get("user_id", "admin"))
            logger.info("[Cases] Operational case created from email %s", data.get("id", "?"))
    except Exception as e:
        logger.warning("[Cases] Failed to create case from email: %s", e)

    await stream_manager.broadcast(event)


async def on_sync_completed(event: Event) -> None:
    data: dict[str, Any] = event.data or {}
    synced_count = data.get("synced", 0)
    user_id = data.get("user_id", "")
    account_id = data.get("account_id", "")

    if synced_count == 0:
        return

    from app.database.session import async_session_factory
    from app.modules.tasks.service import TaskService

    async with async_session_factory() as session:
        detector = TaskService(session)
        try:
            result = await detector.detect_from_recent(user_id, account_id, synced_count)
            if result.get("detected", 0) > 0:
                logger.info(
                    "[Email] Auto-detected %d tasks from %d new emails",
                    result["detected"], synced_count,
                )
        except Exception as e:
            logger.warning("[Email] Task detection after sync failed: %s", e)

    from app.core.event_bus import EventType

    await event_bus.publish(
        EventType.NOTIFICATION_CREATED,
        data={
            "user_id": user_id,
            "title": "Sincronización completada",
            "message": f"{synced_count} nuevos correos sincronizados",
            "notification_type": "info",
        },
        source="emails.events.on_sync_completed",
    )


def register_email_events() -> None:
    event_bus.subscribe(EventType.EMAIL_CREATED, on_email_created)
    event_bus.subscribe(EventType.SYNC_COMPLETED, on_sync_completed)
    logger.debug("Email event subscribers registered")
