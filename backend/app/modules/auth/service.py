from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import TokenResponse, UserCreate, UserLogin, UserResponse


class AuthService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)

    async def register(self, data: UserCreate) -> UserResponse:
        exists = await self.repository.email_exists(data.email)
        if exists:
            raise ConflictException("Email already registered")

        from app.models.models import User as UserModel
        user = UserModel(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        self.repository.session.add(user)
        await self.repository.session.flush()
        return UserResponse.model_validate(user)

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.repository.get_by_email(data.email)
        if not user or not user.hashed_password:
            raise UnauthorizedException("Invalid credentials")

        if not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid credentials")

        user.last_login = datetime.now(timezone.utc)
        await self.repository.session.flush()

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            expires_in=30,
        )

    async def refresh_token(self, token: str) -> TokenResponse:
        try:
            payload = decode_token(token)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type")
            user_id = payload.get("sub")
            if not user_id:
                raise UnauthorizedException("Invalid token")
        except ValueError:
            raise UnauthorizedException("Invalid or expired token")

        user = await self.repository.get(user_id)
        if not user:
            raise NotFoundException("User not found")

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            expires_in=30,
        )

    async def get_current_user(self, user_id: str) -> UserResponse:
        user = await self.repository.get(user_id)
        if not user:
            raise NotFoundException("User not found")
        return UserResponse.model_validate(user)

    async def google_login(self, email: str, full_name: str) -> TokenResponse:
        user = await self.repository.get_by_email(email)
        if not user:
            from app.models.models import User as UserModel
            user = UserModel(email=email, full_name=full_name, hashed_password="")
            self.repository.session.add(user)
            await self.repository.session.flush()

        user.last_login = datetime.now(timezone.utc)
        await self.repository.session.flush()

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
            expires_in=30,
        )
