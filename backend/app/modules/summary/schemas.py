from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    id: str
    user_id: str
    summary_date: date
    summary_text: str
    email_count: int
    categories: Optional[str] = None
    key_highlights: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DailySummaryListResponse(BaseModel):
    items: list[DailySummaryResponse]
    total: int
