from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.core.event_bus import EventType, event_bus

logger = logging.getLogger(__name__)


class BackgroundScheduler:
    _instance: BackgroundScheduler | None = None
    _tasks: dict[str, asyncio.Task] = {}
    _running: bool = False

    def __new__(cls) -> BackgroundScheduler:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        logger.info("Background scheduler started")

        self._tasks["sync_worker"] = asyncio.create_task(
            self._sync_worker(), name="sync_worker"
        )

    async def stop(self) -> None:
        self._running = False
        for name, task in self._tasks.items():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._tasks.clear()
        logger.info("Background scheduler stopped")

    async def _sync_worker(self) -> None:
        while self._running:
            try:
                await self._auto_sync_all()
            except Exception as e:
                logger.error("Auto-sync worker error: %s", e)
            await asyncio.sleep(settings.sync_interval_seconds)

    async def _auto_sync_all(self) -> None:
        from app.database.session import async_session_factory
        from app.modules.gmail.service import GmailService
        from app.modules.gmail.repository import EmailAccountRepository

        async with async_session_factory() as session:
            repo = EmailAccountRepository(session)
            accounts = await repo.get_all_connected()

            for account in accounts:
                try:
                    service = GmailService(session)
                    sync_result = await service.fetch_emails_incremental(
                        account_id=account.id,
                        user_id=account.user_id,
                    )
                    if sync_result["synced"] > 0:
                        logger.info(
                            "Auto-sync %s: %d new emails",
                            account.email, sync_result["synced"],
                        )
                except Exception as e:
                    logger.warning(
                        "Auto-sync failed for %s: %s", account.email, e,
                    )


scheduler = BackgroundScheduler()
