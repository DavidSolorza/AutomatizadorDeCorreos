from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.database.session import get_session


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token")
        return user_id
    except ValueError:
        raise UnauthorizedException("Invalid or expired token")


async def get_optional_user_id(
    authorization: Optional[str] = Header(None),
) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except ValueError:
        return None


async def get_demo_viewer_id(
    x_demo_user_id: Optional[str] = Header(None, alias="X-Demo-User-Id"),
    authorization: Optional[str] = Header(None),
) -> str:
    """Demo mode: use simulated user header. Falls back to JWT or admin."""
    if x_demo_user_id:
        return x_demo_user_id
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = decode_token(authorization.replace("Bearer ", ""))
            user_id = payload.get("sub")
            if user_id:
                return user_id
        except ValueError:
            pass
    return "admin"


async def get_gmail_user_id(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_session),
) -> str:
    """Usuario dueño de cuentas Gmail. En demo mode usa el usuario sistema."""
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = decode_token(authorization.replace("Bearer ", ""))
            user_id = payload.get("sub")
            if user_id:
                return user_id
        except ValueError:
            pass

    if settings.demo_mode:
        from app.core.demo_seed import get_or_create_system_user

        user = await get_or_create_system_user(session)
        return user.id

    raise UnauthorizedException("Missing or invalid authorization header")
