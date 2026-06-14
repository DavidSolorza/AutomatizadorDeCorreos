from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.modules.rules.repository import RuleRepository
from app.modules.rules.schemas import RuleCreate, RuleResponse, RuleUpdate


class RuleService:
    def __init__(self, session: AsyncSession):
        self.repository = RuleRepository(session)

    async def create_rule(self, user_id: str, data: RuleCreate) -> RuleResponse:
        from app.models.models import Rule as RuleModel
        rule = RuleModel(
            user_id=user_id,
            name=data.name,
            description=data.description,
            field=data.field,
            operator=data.operator,
            value=data.value,
            category=data.category,
            label=data.label,
            assigned_to=data.assigned_to,
            priority=data.priority,
            is_active=True,
        )
        self.repository.session.add(rule)
        await self.repository.session.flush()
        return RuleResponse.model_validate(rule)

    async def get_rules(self, user_id: str) -> list[RuleResponse]:
        rules = await self.repository.get_by_user(user_id)
        return [RuleResponse.model_validate(r) for r in rules]

    async def get_rule(self, rule_id: str, user_id: str) -> RuleResponse:
        rule = await self.repository.get(rule_id)
        if not rule or rule.user_id != user_id:
            raise NotFoundException("Rule not found")
        return RuleResponse.model_validate(rule)

    async def update_rule(self, rule_id: str, user_id: str, data: RuleUpdate) -> RuleResponse:
        rule = await self.repository.get(rule_id)
        if not rule or rule.user_id != user_id:
            raise NotFoundException("Rule not found")
        updated = await self.repository.update(rule_id, data)
        return RuleResponse.model_validate(updated)

    async def delete_rule(self, rule_id: str, user_id: str) -> None:
        rule = await self.repository.get(rule_id)
        if not rule or rule.user_id != user_id:
            raise NotFoundException("Rule not found")
        await self.repository.delete(rule_id)
