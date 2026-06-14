import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database.session import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE rules ALTER COLUMN priority TYPE VARCHAR(20) USING
                CASE
                    WHEN priority <= 3 THEN 'bajo'
                    WHEN priority <= 10 THEN 'medio'
                    WHEN priority <= 30 THEN 'alto'
                    WHEN priority > 30 THEN 'urgente'
                    ELSE 'medio'
                END
        """))
        await conn.execute(text("""
            ALTER TABLE rules ALTER COLUMN priority SET DEFAULT 'medio'
        """))
        print("Rules priority column migrated from INTEGER to VARCHAR(20) with 4 levels")

    print("Migration complete")


if __name__ == "__main__":
    asyncio.run(migrate())
