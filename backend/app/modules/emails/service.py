from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.modules.emails.repository import EmailRepository
from app.modules.emails.schemas import EmailListResponse, EmailResponse, EmailSearchParams, EmailUpdateParams, AnalyzeResponse
from app.modules.rules.engine import RuleEngine
from app.modules.rules.repository import RuleRepository


class EmailService:
    def __init__(self, session: AsyncSession):
        self.repository = EmailRepository(session)
        self.session = session

    async def save_email(self, user_id: str, account_id: str, email_data: dict) -> EmailResponse:
        existing = await self.repository.get_by_gmail_id(email_data["gmail_message_id"])
        if existing:
            return EmailResponse.model_validate(existing)

        from app.models.models import Email as EmailModel
        email = EmailModel(
            account_id=account_id,
            gmail_message_id=email_data["gmail_message_id"],
            thread_id=email_data.get("thread_id"),
            sender=email_data["sender"],
            sender_name=email_data.get("sender_name"),
            recipient=email_data["recipient"],
            subject=email_data.get("subject"),
            body_plain=email_data.get("body_plain"),
            body_html=email_data.get("body_html"),
            received_at=email_data["received_at"],
        )

        rule_engine = RuleEngine(RuleRepository(self.session))
        classification = await rule_engine.classify(email_data, user_id)
        if classification.category:
            email.category = classification.category

        self.session.add(email)
        await self.session.flush()
        return EmailResponse.model_validate(email)

    async def get_emails(
        self,
        user_id: str,
        params: EmailSearchParams,
    ) -> EmailListResponse:
        items, total = await self.repository.search(
            user_id=user_id,
            query=params.query,
            category=params.category,
            sender=params.sender,
            is_read=params.is_read,
            is_starred=params.is_starred,
            is_archived=params.is_archived,
            is_pinned=params.is_pinned,
            has_attachment=params.has_attachment,
            date_from=params.date_from.isoformat() if params.date_from else None,
            date_to=params.date_to.isoformat() if params.date_to else None,
            skip=(params.page - 1) * params.size,
            limit=params.size,
        )
        return EmailListResponse(
            items=[EmailResponse.model_validate(e) for e in items],
            total=total,
            page=params.page,
            size=params.size,
            pages=max(1, (total + params.size - 1) // params.size),
        )

    async def get_email(self, email_id: str, user_id: str) -> EmailResponse:
        email = await self.repository.get_with_relations(email_id)
        if not email:
            raise NotFoundException("Email not found")
        return EmailResponse.model_validate(email)

    async def update_email(self, email_id: str, user_id: str, data: EmailUpdateParams) -> EmailResponse:
        email = await self.repository.update(email_id, data)
        if not email:
            raise NotFoundException("Email not found")
        return EmailResponse.model_validate(email)

    async def delete_email(self, email_id: str, user_id: str) -> None:
        deleted = await self.repository.delete(email_id)
        if not deleted:
            raise NotFoundException("Email not found")

    async def bulk_delete_by_category(self, user_id: str, category: str) -> int:
        from app.models.models import Email, EmailAccount
        from sqlalchemy import select

        result = await self.session.execute(
            select(Email.id).join(EmailAccount).where(
                EmailAccount.user_id == user_id,
                Email.category == category,
            )
        )
        ids = [row[0] for row in result.all()]
        if not ids:
            return 0
        return await self.repository.delete_many(ids)

    async def bulk_archive_read(self, user_id: str) -> int:
        from app.models.models import Email, EmailAccount
        from sqlalchemy import select, update

        subq = select(Email.id).join(EmailAccount).where(
            EmailAccount.user_id == user_id,
            Email.is_read == True,
            Email.is_archived == False,
        ).scalar_subquery()
        result = await self.session.execute(
            update(Email).where(Email.id.in_(subq)).values(is_archived=True)
        )
        await self.session.flush()
        return result.rowcount


async def analyze_email_with_gemini(email: EmailResponse) -> AnalyzeResponse:
    from app.core.email_pipeline import process_email

    result = await process_email(
        sender=email.sender_name or email.sender,
        subject=email.subject or "",
        body_html=email.body_html,
        body_plain=email.body_plain,
    )
    return result.analysis
