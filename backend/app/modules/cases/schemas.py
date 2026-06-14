from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CaseCreate(BaseModel):
    sender: str
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    email_id: Optional[str] = None


class CaseUpdate(BaseModel):
    assigned_to: Optional[str] = None
    assigned_name: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    observations: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    sender: str
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    received_at: datetime
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    source_mailbox: Optional[str] = None
    assigned_to: str
    assigned_name: str
    status: str
    category: str
    closed_at: Optional[datetime] = None
    response_time: Optional[float] = None
    observations: Optional[str] = None
    email_id: Optional[str] = None
    ai_summary: Optional[str] = None
    action_items: list[str] = Field(default_factory=list)
    deadlines: list[str] = Field(default_factory=list)
    priority: Optional[str] = "media"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("action_items", "deadlines", mode="before")
    @classmethod
    def _list_default(cls, v: list[str] | None) -> list[str]:
        return v if v is not None else []


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    size: int
    pages: int


class CaseHistoryResponse(BaseModel):
    id: str
    case_id: str
    action: str
    performed_by: str
    performed_by_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CaseHistoryListResponse(BaseModel):
    items: list[CaseHistoryResponse]
    total: int


class AnalystWorkloadResponse(BaseModel):
    active: int = 0
    in_process: int = 0
    pending: int = 0
    blocked: int = 0
    closed: int = 0
    avg_time: float = 0.0
    accumulated_hours: float = 0.0


class DashboardMetricsResponse(BaseModel):
    received_today: int
    pending: int
    closed: int
    blocked: int = 0
    critical: int = 0
    avg_response_time: float
    by_category: dict[str, int]
    by_analyst: dict[str, AnalystWorkloadResponse]


class PeriodMetricsResponse(BaseModel):
    period: str
    avg_response_time: float
    cases_attended: int
    cases_pending: int
    cases_backlogged: int


class AnalystStatsResponse(BaseModel):
    id: str
    name: str
    email: str
    active_cases: int
    in_process_cases: int = 0
    pending_cases: int = 0
    blocked_cases: int = 0
    closed_cases: int
    avg_response_time: float
    accumulated_hours: float = 0.0
    workload: int


class SimulateEmailRequest(BaseModel):
    sender: str
    sender_name: Optional[str] = None
    subject: str
    body: str = ""
