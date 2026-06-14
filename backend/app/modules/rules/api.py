from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_gmail_user_id
from app.database.session import get_session
from app.modules.rules.schemas import RuleCreate, RuleResponse, RuleUpdate
from app.modules.rules.insurance_seed import build_insurance_rules
from app.modules.rules.service import RuleService

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.post("", response_model=RuleResponse, status_code=201)
async def create_rule(
    data: RuleCreate,
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    return await service.create_rule(user_id, data)


@router.get("", response_model=list[RuleResponse])
async def list_rules(
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    return await service.get_rules(user_id)


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(
    rule_id: str,
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    return await service.get_rule(rule_id, user_id)


@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    data: RuleUpdate,
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    return await service.update_rule(rule_id, user_id, data)


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: str,
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    await service.delete_rule(rule_id, user_id)


@router.post("/seed", response_model=list[RuleResponse])
async def seed_rules(
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = RuleService(session)
    rules = await service.get_rules(user_id)
    if rules:
        return rules

    created = []
    for rule_data in build_insurance_rules(user_id):
        create_data = RuleCreate(**rule_data)
        created.append(await service.create_rule(user_id, create_data))
    return created
