import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    accounts = relationship("EmailAccount", back_populates="user", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="user", cascade="all, delete-orphan")
    daily_summaries = relationship("DailySummary", back_populates="user", cascade="all, delete-orphan")


class EmailAccount(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "email_accounts"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="gmail", nullable=False)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    gmail_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="accounts")
    emails = relationship("Email", back_populates="account", cascade="all, delete-orphan")


class Email(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "emails"

    account_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("email_accounts.id", ondelete="CASCADE"), nullable=False)
    gmail_message_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    thread_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sender: Mapped[str] = mapped_column(String(500), nullable=False)
    sender_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recipient: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_plain: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    urgency_score: Mapped[int | None] = mapped_column(nullable=True)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)

    account = relationship("EmailAccount", back_populates="emails")
    attachments = relationship("Attachment", back_populates="email", cascade="all, delete-orphan")
    labels = relationship("EmailLabel", back_populates="email", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="email", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="email", cascade="all, delete-orphan")


class Attachment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "attachments"

    email_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(200), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(nullable=True)
    storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    gmail_attachment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    email = relationship("Email", back_populates="attachments")


class EmailLabel(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "email_labels"

    email_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    email = relationship("Email", back_populates="labels")


class Rule(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "rules"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    field: Mapped[str] = mapped_column(String(50), nullable=False)
    operator: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medio", nullable=False)

    user = relationship("User", back_populates="rules")


class Notification(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    email_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    notification_type: Mapped[str] = mapped_column(String(50), default="info", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    email = relationship("Email", back_populates="notifications")


class AuditLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)


class Task(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tasks"

    email_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("emails.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="media", nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)

    email = relationship("Email", back_populates="tasks")


class OperationalCase(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "operational_cases"

    sender: Mapped[str] = mapped_column(String(500), nullable=False)
    sender_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source_mailbox: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assigned_to: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    assigned_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="recibido", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="sin_clasificar", nullable=False, index=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time: Mapped[float | None] = mapped_column(nullable=True)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("emails.id", ondelete="SET NULL"), nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_items: Mapped[list | None] = mapped_column(JSON, nullable=True)
    deadlines: Mapped[list | None] = mapped_column(JSON, nullable=True)
    priority: Mapped[str | None] = mapped_column(String(20), default="media", nullable=True)


class CaseHistory(UUIDMixin, Base):
    __tablename__ = "case_history"

    case_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("operational_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(500), nullable=False)
    performed_by: Mapped[str] = mapped_column(String(100), default="system", nullable=False)
    performed_by_name: Mapped[str] = mapped_column(String(255), default="Sistema", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class DailySummary(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "daily_summaries"

    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    summary_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    email_count: Mapped[int] = mapped_column(default=0)
    categories: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_highlights: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="daily_summaries")

    __table_args__ = (
        UniqueConstraint("user_id", "summary_date", name="uq_user_daily_summary"),
    )
