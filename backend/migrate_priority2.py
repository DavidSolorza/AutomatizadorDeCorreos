import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

async def migrate():
    from app.database.session import engine
    from sqlalchemy import text
    async with engine.connect() as conn:
        try:
            await conn.execute(text("ALTER TABLE emails ADD COLUMN priority VARCHAR(20)"))
            await conn.commit()
            print("Column priority added")
        except Exception as e:
            await conn.rollback()
            if "already exists" in str(e):
                print("Column priority already exists")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
