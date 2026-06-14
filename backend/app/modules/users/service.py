from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserResponse, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)

    async def get_user(self, user_id: str) -> UserResponse:
        user = await self.repository.get(user_id)
        if not user:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("User not found")
        return UserResponse.model_validate(user)

    async def update_user(self, user_id: str, data: UserUpdate) -> UserResponse:
        user = await self.repository.update(user_id, data)
        if not user:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("User not found")
        return UserResponse.model_validate(user)

    async def delete_user(self, user_id: str) -> None:
        deleted = await self.repository.delete(user_id)
        if not deleted:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("User not found")
