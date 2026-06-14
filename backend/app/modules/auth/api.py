import urllib.parse

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.config import settings
from app.database.session import get_session
from app.modules.auth.schemas import (
    GoogleAuthUrl,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserCreate, session: AsyncSession = Depends(get_session)):
    service = AuthService(session)
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_session)):
    service = AuthService(session)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshTokenRequest, session: AsyncSession = Depends(get_session)):
    service = AuthService(session)
    return await service.refresh_token(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = AuthService(session)
    return await service.get_current_user(user_id)


@router.get("/google/url", response_model=GoogleAuthUrl)
async def google_auth_url():
    from app.database.session import async_session_factory
    from app.modules.gmail.service import GmailService

    async with async_session_factory() as session:
        service = GmailService(session)
        auth_url = service.get_auth_url()
    return GoogleAuthUrl(auth_url=auth_url)


@router.get("/google/login")
async def google_login(
    code: str | None = None,
    state: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    if code:
        return await _handle_login_callback(code, session)

    scopes = "openid email profile " + settings.gmail_scopes.replace(",", " ")
    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_login_redirect_uri,
        "scope": scopes,
        "access_type": "offline",
        "state": "login",
        "prompt": "consent",
    })
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{params}"
    return RedirectResponse(url=auth_url)


async def _handle_login_callback(code: str, session: AsyncSession):
    import traceback
    import httpx
    from google.auth import jwt as google_jwt
    from app.core.security import decode_token
    import logging
    logger = logging.getLogger(__name__)

    try:
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_login_redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://oauth2.googleapis.com/token", data=token_data)
            tokens = resp.json()

        error = tokens.get("error")
        if error:
            desc = tokens.get("error_description", "")
            return RedirectResponse(url=f"http://localhost:5173/login?error={error}&desc={desc}")

        id_token = tokens.get("id_token")
        if not id_token:
            return RedirectResponse(url="http://localhost:5173/login?error=no_id_token")

        payload = google_jwt.decode(id_token, verify=False)
        email = payload.get("email", "")
        name = payload.get("name", email.split("@")[0] if "@" in email else email)

        service = AuthService(session)
        result = await service.google_login(email, name)

        gmail_access_token = tokens.get("access_token")
        gmail_refresh_token = tokens.get("refresh_token")
        if gmail_access_token:
            token_payload = decode_token(result.access_token)
            user_id = token_payload.get("sub", "")
            from app.modules.gmail.repository import EmailAccountRepository
            repo = EmailAccountRepository(session)
            existing = await repo.get_by_email(email)
            if not existing:
                from app.models.models import EmailAccount as EmailAccountModel
                account = EmailAccountModel(
                    user_id=user_id,
                    email=email,
                    access_token=gmail_access_token,
                    refresh_token=gmail_refresh_token or "",
                    is_connected=True,
                )
                session.add(account)
                await session.flush()

        redirect_url = f"http://localhost:5173/auth/callback?access_token={result.access_token}&refresh_token={result.refresh_token}&gmail=auto"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        logger.error(f"Google login callback error: {e}\n{traceback.format_exc()}")
        return RedirectResponse(url=f"http://localhost:5173/login?error=server_error&desc={e}")
