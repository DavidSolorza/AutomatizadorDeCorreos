from datetime import date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DailySummary


class DailySummaryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_and_date(self, user_id: str, summary_date: date) -> DailySummary | None:
        result = await self.session.execute(
            select(DailySummary).where(
                DailySummary.user_id == user_id,
                DailySummary.summary_date == summary_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: str, limit: int = 30, offset: int = 0) -> tuple[list[DailySummary], int]:
        count = await self.session.execute(
            select(func.count()).select_from(DailySummary).where(DailySummary.user_id == user_id)
        )
        total = count.scalar() or 0

        result = await self.session.execute(
            select(DailySummary)
            .where(DailySummary.user_id == user_id)
            .order_by(DailySummary.summary_date.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, user_id: str, summary_date: date, summary_text: str, email_count: int, categories: str | None = None, key_highlights: str | None = None) -> DailySummary:
        summary = DailySummary(
            user_id=user_id,
            summary_date=summary_date,
            summary_text=summary_text,
            email_count=email_count,
            categories=categories,
            key_highlights=key_highlights,
        )
        self.session.add(summary)
        await self.session.flush()
        return summary

    async def mark_as_read(self, summary_id: str, user_id: str) -> DailySummary | None:
        result = await self.session.execute(
            select(DailySummary).where(DailySummary.id == summary_id, DailySummary.user_id == user_id)
        )
        summary = result.scalar_one_or_none()
        if summary:
            summary.is_read = True
            await self.session.flush()
        return summary
