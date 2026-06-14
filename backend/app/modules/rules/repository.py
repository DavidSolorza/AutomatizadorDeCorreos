from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Rule
from app.repositories.base import BaseRepository
from app.modules.rules.schemas import RuleCreate, RuleUpdate


class RuleRepository(BaseRepository[Rule, RuleCreate, RuleUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(Rule, session)

    async def get_active_by_user(self, user_id: str) -> list[Rule]:
        priority_order = {
            "urgente": 0, "alto": 1, "medio": 2, "bajo": 3,
        }
        rules = await self.get_by_user(user_id)
        rules = [r for r in rules if r.is_active]
        rules.sort(key=lambda r: priority_order.get(r.priority, 99))
        return rules

    async def get_by_user(self, user_id: str) -> list[Rule]:
        from sqlalchemy import case
        priority_order = case(
            (Rule.priority == "urgente", 0),
            (Rule.priority == "alto", 1),
            (Rule.priority == "medio", 2),
            (Rule.priority == "bajo", 3),
            else_=99,
        )
        result = await self.session.execute(
            select(Rule)
            .where(Rule.user_id == user_id)
            .order_by(priority_order)
        )
        return list(result.scalars().all())
