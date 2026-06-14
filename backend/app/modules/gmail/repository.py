from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import EmailAccount
from app.repositories.base import BaseRepository
from app.modules.gmail.schemas import AccountCreate, AccountResponse


class EmailAccountRepository(BaseRepository[EmailAccount, AccountCreate, AccountResponse]):
    def __init__(self, session: AsyncSession):
        super().__init__(EmailAccount, session)

    async def get_by_user_id(self, user_id: str) -> list[EmailAccount]:
        result = await self.session.execute(
            select(EmailAccount).where(EmailAccount.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_by_email(self, email: str) -> EmailAccount | None:
        result = await self.session.execute(
            select(EmailAccount).where(EmailAccount.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_email(self, user_id: str, email: str) -> EmailAccount | None:
        result = await self.session.execute(
            select(EmailAccount).where(
                EmailAccount.user_id == user_id,
                EmailAccount.email == email,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_connected(self) -> list[EmailAccount]:
        result = await self.session.execute(
            select(EmailAccount).where(EmailAccount.is_connected == True)
        )
        return list(result.scalars().all())

    async def update_last_sync(self, account_id: str) -> None:
        await self.session.execute(
            select(EmailAccount).where(EmailAccount.id == account_id)
        )
        account = await self.session.get(EmailAccount, account_id)
        if account:
            account.last_sync_at = datetime.now(timezone.utc)
            await self.session.flush()
