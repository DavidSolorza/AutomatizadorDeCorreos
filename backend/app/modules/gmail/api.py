from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_gmail_user_id, get_optional_user_id
from app.core.sse import event_stream
from app.database.session import get_session
from app.modules.gmail.schemas import AccountResponse
from app.modules.gmail.service import GmailService

router = APIRouter(prefix="/gmail", tags=["Gmail"])

FRONTEND_URL = "http://localhost:5173"


@router.get("/auth/url")
async def get_auth_url():
    from app.database.session import async_session_factory

    async with async_session_factory() as session:
        service = GmailService(session)
        auth_url = service.get_auth_url()
    return {"auth_url": auth_url}


@router.get("/callback")
async def google_callback(
    code: str,
    session: AsyncSession = Depends(get_session),
):
    service = GmailService(session)
    try:
        result = await service.handle_callback_noauth(code)
        url = f"{FRONTEND_URL}/settings?gmail=connected&email={result.email}"
        if getattr(result, "synced_on_connect", None):
            url += f"&synced={result.synced_on_connect}"
        return RedirectResponse(url=url)
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?gmail=error&msg={str(e)}")


@router.get("/accounts", response_model=list[AccountResponse])
async def get_accounts(
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    from app.modules.gmail.repository import EmailAccountRepository

    repo = EmailAccountRepository(session)
    accounts = await repo.get_by_user_id(user_id)
    return [AccountResponse.model_validate(a) for a in accounts]


@router.post("/accounts/{account_id}/sync")
async def sync_emails(
    account_id: str,
    max_results: Optional[int] = Query(200, alias="max_results"),
    label_ids: str = Query("INBOX", alias="label_ids"),
    user_id: str = Depends(get_gmail_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = GmailService(session)
    result = await service.fetch_emails_incremental(
        account_id=account_id,
        user_id=user_id,
        max_results=max_results,
        label_ids=label_ids,
    )
    return result


@router.get("/events")
async def sync_events(request: Request):
    client_id = str(id(request))
    return StreamingResponse(
        event_stream(client_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
