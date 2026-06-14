from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CaseHistory, OperationalCase
from app.modules.cases.schemas import CaseCreate, CaseHistoryResponse, CaseUpdate
from app.modules.cases.statuses import (
    BLOCKED_STATUSES,
    CLOSED_STATUSES,
    IN_PROCESS_STATUSES,
    PENDING_STATUSES,
    expand_status_filter,
    is_critical_case,
)
from app.repositories.base import BaseRepository


class CaseRepository(BaseRepository[OperationalCase, CaseCreate, CaseUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(OperationalCase, session)

    async def list_filtered(
        self,
        *,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        category: Optional[str] = None,
        assigned_to: Optional[str] = None,
        query: Optional[str] = None,
        sort_by: str = "received_at",
        sort_order: str = "desc",
    ) -> tuple[list[OperationalCase], int]:
        stmt = select(OperationalCase)

        if status:
            statuses = expand_status_filter(status)
            stmt = stmt.where(OperationalCase.status.in_(statuses))
        if category:
            stmt = stmt.where(OperationalCase.category == category)
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                OperationalCase.subject.ilike(pattern)
                | OperationalCase.sender.ilike(pattern)
                | OperationalCase.body.ilike(pattern)
            )

        sort_col = getattr(OperationalCase, sort_by, OperationalCase.received_at)
        stmt = stmt.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def count_received_today(self, assigned_to: Optional[str] = None) -> int:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.count()).select_from(OperationalCase).where(OperationalCase.received_at >= today_start)
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        return (await self.session.execute(stmt)).scalar() or 0

    async def count_by_status(self, statuses: list[str], assigned_to: Optional[str] = None) -> int:
        stmt = select(func.count()).select_from(OperationalCase).where(OperationalCase.status.in_(statuses))
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        return (await self.session.execute(stmt)).scalar() or 0

    async def avg_response_time(self, assigned_to: Optional[str] = None) -> float:
        stmt = select(func.avg(OperationalCase.response_time)).where(OperationalCase.response_time.isnot(None))
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        value = (await self.session.execute(stmt)).scalar()
        return round(float(value or 0), 1)

    async def count_by_category(self, assigned_to: Optional[str] = None) -> dict[str, int]:
        stmt = (
            select(OperationalCase.category, func.count())
            .group_by(OperationalCase.category)
        )
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        rows = (await self.session.execute(stmt)).all()
        return {row[0]: row[1] for row in rows}

    async def get_by_email_id(self, email_id: str) -> OperationalCase | None:
        result = await self.session.execute(
            select(OperationalCase).where(OperationalCase.email_id == email_id)
        )
        return result.scalar_one_or_none()

    async def count_critical(self, assigned_to: Optional[str] = None) -> int:
        stmt = select(OperationalCase).where(OperationalCase.status != "cerrado")
        if assigned_to:
            stmt = stmt.where(OperationalCase.assigned_to == assigned_to)
        result = await self.session.execute(stmt)
        cases = list(result.scalars().all())
        return sum(1 for c in cases if is_critical_case(c.status, c.priority))

    async def analyst_stats(self, analyst_ids: list[str]) -> dict[str, dict]:
        stats: dict[str, dict] = {}
        now = datetime.now(timezone.utc)
        for aid in analyst_ids:
            result = await self.session.execute(
                select(OperationalCase).where(OperationalCase.assigned_to == aid)
            )
            cases = list(result.scalars().all())
            active_cases = [c for c in cases if c.status not in CLOSED_STATUSES]
            closed_cases = [c for c in cases if c.status in CLOSED_STATUSES]
            times = [c.response_time for c in closed_cases if c.response_time]
            accumulated = 0.0
            for c in active_cases:
                end = c.closed_at or now
                accumulated += (end - c.received_at).total_seconds() / 3600

            stats[aid] = {
                "active": len(active_cases),
                "in_process": sum(1 for c in active_cases if c.status in IN_PROCESS_STATUSES),
                "pending": sum(1 for c in active_cases if c.status in PENDING_STATUSES),
                "blocked": sum(1 for c in active_cases if c.status in BLOCKED_STATUSES),
                "closed": len(closed_cases),
                "avg_time": round(sum(times) / len(times), 1) if times else 0.0,
                "accumulated_hours": round(accumulated, 1),
            }
        return stats

    async def period_metrics(
        self,
        period: str,
        assigned_to: Optional[str] = None,
    ) -> dict:
        days = 1 if period == "daily" else 7 if period == "weekly" else 30
        since = datetime.now(timezone.utc) - timedelta(days=days)
        base = select(OperationalCase).where(OperationalCase.received_at >= since)
        if assigned_to:
            base = base.where(OperationalCase.assigned_to == assigned_to)
        result = await self.session.execute(base)
        cases = list(result.scalars().all())
        closed = [c for c in cases if c.status in CLOSED_STATUSES]
        pending = [c for c in cases if c.status in PENDING_STATUSES]
        backlogged = [c for c in cases if c.status in BLOCKED_STATUSES]
        times = [c.response_time for c in closed if c.response_time]
        return {
            "cases_attended": len(closed),
            "cases_pending": len(pending),
            "cases_backlogged": len(backlogged),
            "avg_response_time": round(sum(times) / len(times), 1) if times else 0.0,
        }


class CaseHistoryRepository(BaseRepository[CaseHistory, CaseHistoryResponse, CaseHistoryResponse]):
    def __init__(self, session: AsyncSession):
        super().__init__(CaseHistory, session)

    async def list_by_case(self, case_id: Optional[str] = None, limit: int = 50) -> list[CaseHistory]:
        stmt = select(CaseHistory).order_by(CaseHistory.created_at.desc()).limit(limit)
        if case_id:
            stmt = stmt.where(CaseHistory.case_id == case_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_entry(
        self,
        case_id: str,
        action: str,
        performed_by: str = "system",
        performed_by_name: str = "Sistema",
    ) -> CaseHistory:
        entry = CaseHistory(
            case_id=case_id,
            action=action,
            performed_by=performed_by,
            performed_by_name=performed_by_name,
            created_at=datetime.now(timezone.utc),
        )
        self.session.add(entry)
        await self.session.flush()
        return entry
