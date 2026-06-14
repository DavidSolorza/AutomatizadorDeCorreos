from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.database.session import get_session
from app.modules.summary.schemas import DailySummaryResponse
from app.modules.summary.service import generate_daily_summary, get_summaries, mark_summary_read

router = APIRouter(prefix="/summaries", tags=["Daily Summaries"])


@router.post("/daily", response_model=DailySummaryResponse)
async def create_daily_summary(
    summary_date: str = Query(default=None, description="Date in YYYY-MM-DD format, defaults to today"),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    target_date = date.fromisoformat(summary_date) if summary_date else date.today()
    return await generate_daily_summary(user_id, session, target_date)


@router.get("", response_model=list[DailySummaryResponse])
async def list_summaries(
    limit: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    return await get_summaries(user_id, session, limit)


@router.patch("/{summary_id}/read", response_model=DailySummaryResponse)
async def mark_read(
    summary_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    result = await mark_summary_read(summary_id, user_id, session)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Summary not found")
    return result
