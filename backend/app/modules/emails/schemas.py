from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EmailResponse(BaseModel):
    id: str
    account_id: str
    gmail_message_id: str
    thread_id: Optional[str] = None
    sender: str
    sender_name: Optional[str] = None
    recipient: str
    subject: Optional[str] = None
    body_plain: Optional[str] = None
    body_html: Optional[str] = None
    received_at: datetime
    is_read: bool
    is_starred: bool
    is_archived: bool
    is_pinned: bool
    category: Optional[str] = None
    urgency_score: Optional[int] = None
    priority: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailListResponse(BaseModel):
    items: list[EmailResponse]
    total: int
    page: int
    size: int
    pages: int


class EmailSearchParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    sender: Optional[str] = None
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    has_attachment: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    size: int = 50


class EmailUpdateParams(BaseModel):
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    category: Optional[str] = None
    urgency_score: Optional[int] = None
    priority: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: str
    email_id: str
    filename: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None

    model_config = {"from_attributes": True}


class AnalyzeResponse(BaseModel):
    summary: str
    action_items: list[str]
    deadlines: list[str]
    priority: str


class EmailSummaryResponse(BaseModel):
    sender: str
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    received_at: datetime
    links: list[str]
    attachments: list[AttachmentResponse]
    important_words: list[str]
    detected_dates: list[str]
    is_urgent: bool
    priority: str
