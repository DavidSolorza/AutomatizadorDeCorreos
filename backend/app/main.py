import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger

from app.api.middleware import setup_exception_handlers, setup_middleware
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine

logger.remove()
logger.add(sys.stdout, format=settings.log_format, level=settings.log_level, colorize=True)
logger.add(settings.log_file, rotation=settings.log_rotation, retention=settings.log_retention, level=settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified")

        from app.database.session import async_session_factory
        from app.core.demo_seed import run_startup_migrations, run_demo_setup

        async with async_session_factory() as session:
            await run_startup_migrations(session)
            if settings.demo_mode:
                await run_demo_setup(session)
    except Exception as e:
        logger.warning(f"Database not available: {e}")
        logger.warning("App will start without database connection")

    from app.core.event_bus import event_bus
    from app.core.scheduler import scheduler

    from app.modules.gmail.events import register_gmail_events
    from app.modules.emails.events import register_email_events
    from app.modules.tasks.events import register_task_events
    from app.modules.notifications.events import register_notification_events
    from app.modules.summary.events import register_summary_events

    register_gmail_events()
    register_email_events()
    register_task_events()
    register_notification_events()
    register_summary_events()

    await scheduler.start()
    logger.info("Background scheduler started")

    yield

    await scheduler.stop()
    logger.info("Shutting down...")
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Plataforma de trazabilidad operativa para oficinas de seguros",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)

setup_middleware(app)
setup_exception_handlers(app)

from app.modules.auth.api import router as auth_router
from app.modules.users.api import router as users_router
from app.modules.gmail.api import router as gmail_router
from app.modules.emails.api import router as emails_router
from app.modules.rules.api import router as rules_router
from app.modules.notifications.api import router as notifications_router
from app.modules.tasks.api import router as tasks_router
from app.modules.summary.api import router as summary_router
from app.modules.cases.api import router as cases_router

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(gmail_router, prefix=API_PREFIX)
app.include_router(emails_router, prefix=API_PREFIX)
app.include_router(rules_router, prefix=API_PREFIX)
app.include_router(notifications_router, prefix=API_PREFIX)
app.include_router(tasks_router, prefix=API_PREFIX)
app.include_router(summary_router, prefix=API_PREFIX)
app.include_router(cases_router, prefix=API_PREFIX)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
