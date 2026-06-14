import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.database.session import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        for col in ["is_archived", "is_pinned"]:
            try:
                await conn.execute(text(f"ALTER TABLE emails ADD COLUMN {col} BOOLEAN DEFAULT FALSE NOT NULL"))
                print(f"Column {col} added")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"Column {col} already exists")
                else:
                    print(f"Error adding {col}: {e}")


if __name__ == "__main__":
    asyncio.run(migrate())
