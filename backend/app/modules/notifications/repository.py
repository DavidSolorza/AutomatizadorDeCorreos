from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Notification
from app.repositories.base import BaseRepository
from app.modules.notifications.schemas import NotificationResponse


class NotificationRepository(BaseRepository[Notification, NotificationResponse, NotificationResponse]):
    def __init__(self, session: AsyncSession):
        super().__init__(Notification, session)

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> tuple[list[Notification], int, int]:
        count_result = await self.session.execute(
            select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
        )
        total = count_result.scalar() or 0

        unread_result = await self.session.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id, Notification.is_read == False
            )
        )
        unread_count = unread_result.scalar() or 0

        result = await self.session.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(result.scalars().all())

        return items, total, unread_count

    async def mark_as_read(self, notification_id: str) -> Notification | None:
        notification = await self.get(notification_id)
        if notification:
            notification.is_read = True
            await self.session.flush()
        return notification

    async def mark_all_as_read(self, user_id: str) -> int:
        from sqlalchemy import update
        result = await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        await self.session.flush()
        return result.rowcount
