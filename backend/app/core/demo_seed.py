"""Seed de datos demo y migraciones ligeras para modo demostración."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import User

logger = logging.getLogger(__name__)

DEMO_USERS = [
    {"email": "admin@aseesta.com", "full_name": "Administrador", "is_superuser": True},
    {"email": "paula@aseesta.com", "full_name": "Paula", "is_superuser": False},
    {"email": "cristina@aseesta.com", "full_name": "Cristina", "is_superuser": False},
    {"email": "marcela@aseesta.com", "full_name": "Marcela", "is_superuser": False},
]

_system_user_id: str | None = None


async def ensure_email_columns(session: AsyncSession) -> None:
    statements = [
        "ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL",
        "ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE NOT NULL",
        "ALTER TABLE emails ADD COLUMN IF NOT EXISTS priority VARCHAR(20)",
    ]
    for stmt in statements:
        try:
            await session.execute(text(stmt))
        except Exception as e:
            logger.debug("Email column migration skipped: %s", e)
    await session.commit()


async def ensure_case_analysis_columns(session: AsyncSession) -> None:
    statements = [
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS ai_summary TEXT",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS action_items JSONB",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS deadlines JSONB",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'media'",
        "ALTER TABLE rules ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100)",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ",
        "ALTER TABLE operational_cases ADD COLUMN IF NOT EXISTS source_mailbox VARCHAR(255)",
    ]
    for stmt in statements:
        try:
            await session.execute(text(stmt))
        except Exception as e:
            logger.debug("Column migration skipped: %s", e)
    await session.commit()


async def seed_demo_users(session: AsyncSession) -> None:
    from app.modules.auth.repository import UserRepository

    repo = UserRepository(session)
    created = 0
    for demo in DEMO_USERS:
        existing = await repo.get_by_email(demo["email"])
        if not existing:
            user = User(
                email=demo["email"],
                full_name=demo["full_name"],
                is_active=True,
                is_superuser=demo["is_superuser"],
            )
            session.add(user)
            created += 1
    if created:
        await session.commit()
        logger.info("Demo users seeded: %d", created)


async def get_or_create_system_user(session: AsyncSession) -> User:
    global _system_user_id
    from app.modules.auth.repository import UserRepository

    repo = UserRepository(session)
    user = await repo.get_by_email("admin@aseesta.com")
    if not user:
        user = User(
            email="admin@aseesta.com",
            full_name="Administrador",
            is_active=True,
            is_superuser=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    _system_user_id = user.id
    return user


async def run_startup_migrations(session: AsyncSession) -> None:
    await ensure_email_columns(session)
    await ensure_case_analysis_columns(session)


async def run_demo_setup(session: AsyncSession) -> None:
    if not settings.demo_mode:
        return
    await seed_demo_users(session)
    await get_or_create_system_user(session)
    logger.info("Demo mode setup complete")
