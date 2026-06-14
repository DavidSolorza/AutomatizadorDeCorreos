from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationListResponse, NotificationResponse


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.repository = NotificationRepository(session)

    async def get_notifications(self, user_id: str, page: int = 1, size: int = 50) -> NotificationListResponse:
        skip = (page - 1) * size
        items, total, unread_count = await self.repository.get_by_user(user_id, skip=skip, limit=size)
        return NotificationListResponse(
            items=[NotificationResponse.model_validate(n) for n in items],
            total=total,
            unread_count=unread_count,
        )

    async def mark_as_read(self, notification_id: str, user_id: str) -> NotificationResponse:
        notification = await self.repository.mark_as_read(notification_id)
        if not notification:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("Notification not found")
        return NotificationResponse.model_validate(notification)

    async def mark_all_as_read(self, user_id: str) -> int:
        return await self.repository.mark_all_as_read(user_id)
