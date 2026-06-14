from typing import Optional

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Email, EmailAccount, Attachment
from app.repositories.base import BaseRepository
from app.modules.emails.schemas import EmailResponse, EmailUpdateParams


class EmailRepository(BaseRepository[Email, EmailResponse, EmailUpdateParams]):
    def __init__(self, session: AsyncSession):
        super().__init__(Email, session)

    async def get_with_relations(self, id: str) -> Email | None:
        result = await self.session.execute(
            select(Email)
            .options(selectinload(Email.attachments), selectinload(Email.labels))
            .where(Email.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_gmail_id(self, gmail_message_id: str) -> Email | None:
        result = await self.session.execute(
            select(Email).where(Email.gmail_message_id == gmail_message_id)
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        *,
        user_id: str,
        query: Optional[str] = None,
        category: Optional[str] = None,
        sender: Optional[str] = None,
        is_read: Optional[bool] = None,
        is_starred: Optional[bool] = None,
        is_archived: Optional[bool] = None,
        is_pinned: Optional[bool] = None,
        has_attachment: Optional[bool] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Email], int]:
        base = select(Email).join(EmailAccount).where(EmailAccount.user_id == user_id)
        count_base = select(func.count()).select_from(Email).join(EmailAccount).where(EmailAccount.user_id == user_id)

        if query is not None:
            parts = query.split()
            for part in parts:
                if part.startswith("from:"):
                    sender_q = part[5:]
                    base = base.where(Email.sender.ilike(f"%{sender_q}%"))
                    count_base = count_base.where(Email.sender.ilike(f"%{sender_q}%"))
                elif part.startswith("has:"):
                    if part[4:] == "attachment":
                        base = base.where(Email.attachments.any())
                        count_base = count_base.where(Email.attachments.any())
                elif part.startswith("before:"):
                    pass
                elif part.startswith("after:"):
                    pass
                elif part.startswith("category:"):
                    cat = part[9:]
                    base = base.where(Email.category == cat)
                    count_base = count_base.where(Email.category == cat)
                else:
                    search_filter = or_(
                        Email.subject.ilike(f"%{part}%"),
                        Email.sender.ilike(f"%{part}%"),
                        Email.body_plain.ilike(f"%{part}%"),
                        Email.sender_name.ilike(f"%{part}%"),
                    )
                    base = base.where(search_filter)
                    count_base = count_base.where(search_filter)

        if category:
            base = base.where(Email.category == category)
            count_base = count_base.where(Email.category == category)

        if sender:
            sender_filter = or_(
                Email.sender.ilike(f"%{sender}%"),
                Email.sender_name.ilike(f"%{sender}%"),
            )
            base = base.where(sender_filter)
            count_base = count_base.where(sender_filter)

        if is_read is not None:
            base = base.where(Email.is_read == is_read)
            count_base = count_base.where(Email.is_read == is_read)

        if is_starred is not None:
            base = base.where(Email.is_starred == is_starred)
            count_base = count_base.where(Email.is_starred == is_starred)

        if is_archived is not None:
            base = base.where(Email.is_archived == is_archived)
            count_base = count_base.where(Email.is_archived == is_archived)

        if is_pinned is not None:
            base = base.where(Email.is_pinned == is_pinned)
            count_base = count_base.where(Email.is_pinned == is_pinned)

        count_result = await self.session.execute(count_base)
        total = count_result.scalar() or 0

        base = base.order_by(Email.received_at.desc()).offset(skip).limit(limit)
        base = base.options(selectinload(Email.attachments), selectinload(Email.labels))
        result = await self.session.execute(base)
        items = list(result.scalars().all())

        return items, total
