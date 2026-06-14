import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import engine
from app.database.base import Base
from app.models.models import DailySummary


async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Table daily_summaries created (if not exists)")


if __name__ == "__main__":
    asyncio.run(migrate())
