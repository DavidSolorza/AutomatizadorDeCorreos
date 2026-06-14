import json
import os
import urllib.parse
from datetime import datetime, timezone
from typing import Optional

import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.event_bus import EventType, event_bus
from app.core.exceptions import UnauthorizedException
from app.modules.gmail.repository import EmailAccountRepository
from app.modules.gmail.schemas import AccountResponse


class GmailService:
    def __init__(self, session: AsyncSession):
        self.repository = EmailAccountRepository(session)
        self.session = session

    def get_auth_url(self) -> str:
        params = urllib.parse.urlencode({
            "response_type": "code",
            "client_id": settings.google_client_id,
            "redirect_uri": settings.gmail_redirect_uri,
            "scope": settings.gmail_scopes.replace(",", " "),
            "access_type": "offline",
            "prompt": "consent",
        })
        return f"https://accounts.google.com/o/oauth2/auth?{params}"

    async def _exchange_code(self, code: str) -> dict:
        token_data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.gmail_redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://oauth2.googleapis.com/token", data=token_data)
            return resp.json()

    async def handle_callback(self, user_id: str, code: str) -> AccountResponse:
        tokens = await self._exchange_code(code)
        error = tokens.get("error")
        if error:
            raise ValueError(f"Token error: {tokens.get('error_description', error)}")

        creds = Credentials(
            token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token", ""),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=settings.scopes_list,
        )

        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        gmail_email = profile.get("emailAddress", "")
        gmail_user_id = profile.get("id", "")

        existing = await self.repository.get_by_user_and_email(user_id, gmail_email)
        if existing:
            existing.access_token = tokens["access_token"]
            existing.refresh_token = tokens.get("refresh_token", existing.refresh_token)
            existing.token_expiry = creds.expiry
            existing.is_connected = True
            existing.gmail_user_id = gmail_user_id
            await self.session.flush()
        else:
            from app.models.models import EmailAccount as EmailAccountModel
            account = EmailAccountModel(
                user_id=user_id,
                email=gmail_email,
                provider="gmail",
                is_connected=True,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token", ""),
                token_expiry=creds.expiry,
                gmail_user_id=gmail_user_id,
            )
            self.session.add(account)
            await self.session.flush()

        account_data = existing or account
        result = AccountResponse.model_validate(account_data)

        await event_bus.publish(
            EventType.GMAIL_CONNECTED,
            data={"user_id": user_id, "email": gmail_email, "account_id": account_data.id},
            source="gmail.service.handle_callback",
        )

        if settings.sync_on_auth:
            try:
                sync_result = await self.fetch_emails_incremental(
                    account_id=account_data.id,
                    user_id=user_id,
                    max_results=settings.sync_max_batch,
                )
                if sync_result.get("synced", 0) > 0:
                    result.synced_on_connect = sync_result["synced"]
            except Exception as e:
                pass

        return result

    async def handle_callback_noauth(self, code: str) -> AccountResponse:
        from app.modules.auth.repository import UserRepository

        tokens = await self._exchange_code(code)
        error = tokens.get("error")
        if error:
            raise ValueError(f"Token error: {tokens.get('error_description', error)}")

        creds = Credentials(
            token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token", ""),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=settings.scopes_list,
        )

        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        gmail_email = profile.get("emailAddress", "")
        gmail_user_id = profile.get("id", "")

        user_repo = UserRepository(self.session)
        user = await user_repo.get_by_email(gmail_email)
        if not user:
            if settings.demo_mode:
                from app.models.models import User

                user = User(
                    email=gmail_email,
                    full_name=gmail_email.split("@")[0].replace(".", " ").title(),
                    is_active=True,
                    is_superuser=gmail_email.endswith("@aseesta.com"),
                )
                self.session.add(user)
                await self.session.flush()
            else:
                raise ValueError("No hay una cuenta registrada con este email. Registrate primero.")

        existing = await self.repository.get_by_user_and_email(user.id, gmail_email)
        if existing:
            existing.access_token = tokens["access_token"]
            existing.refresh_token = tokens.get("refresh_token", existing.refresh_token)
            existing.token_expiry = creds.expiry
            existing.is_connected = True
            existing.gmail_user_id = gmail_user_id
            await self.session.flush()
        else:
            from app.models.models import EmailAccount as EmailAccountModel
            account = EmailAccountModel(
                user_id=user.id,
                email=gmail_email,
                provider="gmail",
                is_connected=True,
                access_token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token", ""),
                token_expiry=creds.expiry,
                gmail_user_id=gmail_user_id,
            )
            self.session.add(account)
            await self.session.flush()

        account_data = existing or account
        result = AccountResponse.model_validate(account_data)

        await event_bus.publish(
            EventType.GMAIL_CONNECTED,
            data={"user_id": user.id, "email": gmail_email, "account_id": account_data.id},
            source="gmail.service.handle_callback_noauth",
        )

        if settings.sync_on_auth:
            try:
                sync_result = await self.fetch_emails_incremental(
                    account_id=account_data.id,
                    user_id=user.id,
                    max_results=settings.sync_max_batch,
                )
                if sync_result.get("synced", 0) > 0:
                    result.synced_on_connect = sync_result["synced"]
            except Exception as e:
                pass

        return result

    def _get_credentials(self, account) -> Credentials:
        creds = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=settings.scopes_list,
        )
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return creds

    async def fetch_emails(self, account_id: str, max_results: int = 500, label_ids: str = "INBOX") -> list[dict]:
        account = await self.repository.get(account_id)
        if not account or not account.is_connected:
            raise UnauthorizedException("Email account not connected")

        creds = self._get_credentials(account)
        service = build("gmail", "v1", credentials=creds)

        emails_data = []
        page_token = None
        labels = [l.strip() for l in label_ids.split(",") if l.strip()] if label_ids else None

        while len(emails_data) < max_results:
            results = service.users().messages().list(
                userId="me",
                maxResults=min(500, max_results - len(emails_data)),
                pageToken=page_token,
                labelIds=labels,
            ).execute()
            messages = results.get("messages", [])
            for msg in messages:
                if len(emails_data) >= max_results:
                    break
                msg_data = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
                emails_data.append(self._parse_gmail_message(msg_data))

            page_token = results.get("nextPageToken")
            if not page_token:
                break

        return emails_data

    async def fetch_emails_incremental(
        self,
        account_id: str,
        user_id: str,
        max_results: int = 200,
        label_ids: str = "INBOX",
    ) -> dict:
        await event_bus.publish(
            EventType.SYNC_STARTED,
            data={"account_id": account_id, "user_id": user_id},
            source="gmail.service.fetch_emails_incremental",
        )

        account = await self.repository.get(account_id)

        try:
            raw_emails = await self.fetch_emails(account_id, max_results=max_results, label_ids=label_ids)

            from app.modules.emails.service import EmailService

            email_service = EmailService(self.session)
            saved = []
            for email_data in raw_emails:
                email_resp = await email_service.save_email(user_id, account_id, email_data)
                saved.append(email_resp)
                await self.session.commit()
                await event_bus.publish(
                    EventType.EMAIL_CREATED,
                    data={
                        "id": email_resp.id,
                        "subject": email_resp.subject,
                        "sender": email_resp.sender,
                        "sender_name": email_resp.sender_name,
                        "body_plain": email_resp.body_plain,
                        "body_html": email_resp.body_html,
                        "received_at": email_resp.received_at,
                        "user_id": user_id,
                        "account_id": account_id,
                    },
                    source="gmail.service.fetch_emails_incremental",
                )

            await self.repository.update_last_sync(account_id)

            result = {
                "synced": len(saved),
                "account_id": account_id,
                "user_id": user_id,
                "email": account.email if account else "",
            }

            await event_bus.publish(
                EventType.SYNC_COMPLETED,
                data=result,
                source="gmail.service.fetch_emails_incremental",
            )

            return result
        except Exception as e:
            await event_bus.publish(
                EventType.SYNC_ERROR,
                data={"account_id": account_id, "user_id": user_id, "error": str(e)},
                source="gmail.service.fetch_emails_incremental",
            )
            raise

    def _parse_gmail_message(self, msg: dict) -> dict:
        headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}
        payload = msg["payload"]

        body_plain = ""
        body_html = ""

        def extract_parts(parts):
            nonlocal body_plain, body_html
            for part in parts:
                mime = part["mimeType"]
                if "parts" in part:
                    extract_parts(part["parts"])
                elif mime == "text/plain" and "data" in part.get("body", {}):
                    import base64
                    body_plain = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
                elif mime == "text/html" and "data" in part.get("body", {}):
                    import base64
                    body_html = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")

        if "parts" in payload:
            extract_parts(payload["parts"])
        elif "body" in payload and "data" in payload.get("body", {}):
            import base64
            body_plain = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")

        received_at = headers.get("Date", "")
        try:
            from email.utils import parsedate_to_datetime
            received_at_dt = parsedate_to_datetime(received_at) if received_at else datetime.now(timezone.utc)
        except Exception:
            received_at_dt = datetime.now(timezone.utc)

        return {
            "gmail_message_id": msg["id"],
            "thread_id": msg.get("threadId"),
            "sender": headers.get("From", "").split("<")[-1].replace(">", "").strip() if "<" in headers.get("From", "") else headers.get("From", ""),
            "sender_name": headers.get("From", "").split("<")[0].strip().strip("\"'") if "<" in headers.get("From", "") else None,
            "recipient": headers.get("To", ""),
            "subject": headers.get("Subject", ""),
            "body_plain": body_plain,
            "body_html": body_html,
            "received_at": received_at_dt,
        }
