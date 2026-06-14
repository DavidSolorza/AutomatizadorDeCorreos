import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_demo_viewer_id
from app.core.exceptions import NotFoundException
from app.database.session import get_session
from app.modules.cases.schemas import (
    AnalystStatsResponse,
    CaseHistoryListResponse,
    CaseHistoryResponse,
    CaseListResponse,
    CaseResponse,
    CaseUpdate,
    DashboardMetricsResponse,
    PeriodMetricsResponse,
    SimulateEmailRequest,
)
from app.modules.cases.service import ANALYSTS, CaseService

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[str] = None,
    query: Optional[str] = None,
    sort_by: str = "received_at",
    sort_order: str = "desc",
    viewer_id: str = Depends(get_demo_viewer_id),
    session: AsyncSession = Depends(get_session),
):
    service = CaseService(session)
    filters = {
        "page": page,
        "size": size,
        "status": status,
        "category": category,
        "assigned_to": assigned_to if viewer_id == "admin" else None,
        "query": query,
        "sort_by": sort_by,
        "sort_order": sort_order,
    }
    items, total = await service.list_cases(viewer_id, **filters)
    pages = max(1, math.ceil(total / size))
    return CaseListResponse(
        items=[CaseResponse.model_validate(c) for c in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/history", response_model=CaseHistoryListResponse)
async def case_history(
    case_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    service = CaseService(session)
    items = await service.history_repo.list_by_case(case_id, limit)
    return CaseHistoryListResponse(
        items=[CaseHistoryResponse.model_validate(h) for h in items],
        total=len(items),
    )


@router.get("/metrics/dashboard", response_model=DashboardMetricsResponse)
async def dashboard_metrics(
    viewer_id: str = Depends(get_demo_viewer_id),
    session: AsyncSession = Depends(get_session),
):
    return DashboardMetricsResponse(**await _compute_dashboard(session, viewer_id))


@router.get("/metrics/{period}", response_model=PeriodMetricsResponse)
async def period_metrics(
    period: str,
    viewer_id: str = Depends(get_demo_viewer_id),
    session: AsyncSession = Depends(get_session),
):
    if period not in ("daily", "weekly", "monthly"):
        period = "daily"
    data = await _compute_period(session, viewer_id, period)
    return PeriodMetricsResponse(period=period, **data)


@router.get("/analysts", response_model=list[AnalystStatsResponse])
async def analyst_stats(
    viewer_id: str = Depends(get_demo_viewer_id),
    session: AsyncSession = Depends(get_session),
):
    return await _compute_analysts(session, viewer_id)


@router.post("/simulate", response_model=CaseResponse, status_code=201)
async def simulate_email(
    data: SimulateEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    service = CaseService(session)
    case = await service.create_from_email(
        {
            "sender": data.sender,
            "sender_name": data.sender_name,
            "subject": data.subject,
            "body_plain": data.body,
            "received_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
        }
    )
    return CaseResponse.model_validate(case)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    session: AsyncSession = Depends(get_session),
):
    service = CaseService(session)
    case = await service.get_case(case_id)
    if not case:
        raise NotFoundException("Caso no encontrado")
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    data: CaseUpdate,
    viewer_id: str = Depends(get_demo_viewer_id),
    session: AsyncSession = Depends(get_session),
):
    service = CaseService(session)
    performer_name = next((a["name"] for a in ANALYSTS if a["id"] == viewer_id), "Administrador")
    if viewer_id == "admin":
        performer_name = "Administrador"
    case = await service.update_case(case_id, data, viewer_id, performer_name)
    if not case:
        raise NotFoundException("Caso no encontrado")
    return CaseResponse.model_validate(case)


async def _compute_dashboard(session, viewer_id: str) -> dict:
    from app.modules.cases.repository import CaseRepository

    repo = CaseRepository(session)
    assigned = None if viewer_id == "admin" else viewer_id
    by_category = await repo.count_by_category(assigned)
    analyst_ids = [a["id"] for a in ANALYSTS]
    raw_stats = await repo.analyst_stats(analyst_ids)

    from app.modules.cases.schemas import AnalystWorkloadResponse

    from app.modules.cases.statuses import BLOCKED_STATUSES, PENDING_STATUSES

    by_analyst: dict[str, AnalystWorkloadResponse] = {}
    for a in ANALYSTS:
        s = raw_stats.get(a["id"], {})
        by_analyst[a["name"]] = AnalystWorkloadResponse(
            active=s.get("active", 0),
            in_process=s.get("in_process", 0),
            pending=s.get("pending", 0),
            blocked=s.get("blocked", 0),
            closed=s.get("closed", 0),
            avg_time=s.get("avg_time", 0.0),
            accumulated_hours=s.get("accumulated_hours", 0.0),
        )

    return {
        "received_today": await repo.count_received_today(assigned),
        "pending": await repo.count_by_status(PENDING_STATUSES, assigned),
        "closed": await repo.count_by_status(["cerrado"], assigned),
        "blocked": await repo.count_by_status(BLOCKED_STATUSES, assigned),
        "critical": await repo.count_critical(assigned),
        "avg_response_time": await repo.avg_response_time(assigned),
        "by_category": by_category,
        "by_analyst": by_analyst,
    }


async def _compute_period(session, viewer_id: str, period: str) -> dict:
    from app.modules.cases.repository import CaseRepository

    repo = CaseRepository(session)
    assigned = None if viewer_id == "admin" else viewer_id
    return await repo.period_metrics(period, assigned)


async def _compute_analysts(session, viewer_id: str) -> list:
    from app.modules.cases.repository import CaseRepository

    repo = CaseRepository(session)
    analysts = ANALYSTS if viewer_id == "admin" else [a for a in ANALYSTS if a["id"] == viewer_id]
    raw_stats = await repo.analyst_stats([a["id"] for a in analysts])
    max_active = max((raw_stats.get(a["id"], {}).get("active", 0) for a in analysts), default=1) or 1

    return [
        AnalystStatsResponse(
            id=a["id"],
            name=a["name"],
            email=a["email"],
            active_cases=raw_stats.get(a["id"], {}).get("active", 0),
            in_process_cases=raw_stats.get(a["id"], {}).get("in_process", 0),
            pending_cases=raw_stats.get(a["id"], {}).get("pending", 0),
            blocked_cases=raw_stats.get(a["id"], {}).get("blocked", 0),
            closed_cases=raw_stats.get(a["id"], {}).get("closed", 0),
            avg_response_time=raw_stats.get(a["id"], {}).get("avg_time", 0.0),
            accumulated_hours=raw_stats.get(a["id"], {}).get("accumulated_hours", 0.0),
            workload=round((raw_stats.get(a["id"], {}).get("active", 0) / max_active) * 100),
        )
        for a in analysts
    ]
