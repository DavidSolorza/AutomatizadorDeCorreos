import re
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.database.session import get_session
from app.core.config import settings
from app.modules.emails.schemas import (
    EmailListResponse,
    EmailResponse,
    EmailSearchParams,
    EmailUpdateParams,
    AnalyzeResponse,
    EmailSummaryResponse,
)
from app.modules.emails.service import EmailService, analyze_email_with_gemini

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.get("", response_model=EmailListResponse)
async def list_emails(
    query: str = Query(None, description="Search query"),
    category: str = Query(None),
    sender: str = Query(None),
    is_read: bool = Query(None),
    is_starred: bool = Query(None),
    is_archived: bool = Query(None),
    is_pinned: bool = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    params = EmailSearchParams(
        query=query,
        category=category,
        sender=sender,
        is_read=is_read,
        is_starred=is_starred,
        is_archived=is_archived,
        is_pinned=is_pinned,
        page=page,
        size=size,
    )
    return await service.get_emails(user_id, params)


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    return await service.get_email(email_id, user_id)


@router.patch("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: str,
    data: EmailUpdateParams,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    return await service.update_email(email_id, user_id, data)


@router.delete("/{email_id}", status_code=204)
async def delete_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    await service.delete_email(email_id, user_id)


@router.post("/{email_id}/analyze", response_model=AnalyzeResponse)
async def analyze_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    email = await service.get_email(email_id, user_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    result = await analyze_email_with_gemini(email)
    return result


@router.get("/{email_id}/summary", response_model=EmailSummaryResponse)
async def email_summary(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    email = await service.get_email(email_id, user_id)

    text = f"{email.subject or ''} {email.body_plain or ''}"
    text_lower = text.lower()

    links = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)

    urgent_keywords = ["urgente", "inmediato", "deadline", "vencimiento", "hoy", "ya"]
    important_keywords = ["importante", "recordatorio", "pendiente", "por favor", "urge"]
    high_keywords = ["entrega", "entregar", "subir", "parcial", "exposición", "examen", "taller", "mañana"]

    priority = "bajo"
    if any(kw in text_lower for kw in urgent_keywords):
        priority = "urgente"
    elif any(kw in text_lower for kw in important_keywords):
        priority = "alto"
    elif any(kw in text_lower for kw in high_keywords):
        priority = "medio"

    all_words = re.findall(r'\b[a-záéíóúñ]{4,}\b', text_lower)
    common_words = {"que", "para", "con", "del", "las", "los", "por", "una", "este", "esta", "entre", "sobre", "tiene", "como", "más", "todo", "correo", "hola", "gracias", "saludos", "buenas", "tardes", "días", "recibir", "favor", "puede", "debe", "ser", "sido", "dicho", "cada", "muy", "sin"}
    word_freq = {}
    for w in all_words:
        if w not in common_words and len(w) > 3:
            word_freq[w] = word_freq.get(w, 0) + 1
    important_words = sorted(word_freq, key=word_freq.get, reverse=True)[:8]

    detected_dates = []
    date_patterns = [
        (r'\d{1,2}\s+de\s+[a-zñ]+(?:\s+de\s+\d{4})?', text_lower),
        (r'\d{1,2}/\d{1,2}(?:/\d{2,4})?', text),
        (r'\bmañana\b', text_lower),
        (r'\b(hoy|ahora)\b', text_lower),
        (r'\b(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b', text_lower),
    ]
    for pattern, source in date_patterns:
        matches = re.findall(pattern, source)
        detected_dates.extend(matches if isinstance(matches, list) else [matches])

    return EmailSummaryResponse(
        sender=email.sender,
        sender_name=email.sender_name,
        subject=email.subject,
        received_at=email.received_at,
        links=list(set(links))[:10],
        attachments=email.attachments or [],
        important_words=important_words,
        detected_dates=list(set(detected_dates)),
        is_urgent=priority in ("urgente", "alto"),
        priority=priority,
    )


@router.post("/bulk/archive", status_code=204)
async def archive_all_read(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    await service.bulk_archive_read(user_id)


@router.post("/{email_id}/archive", response_model=EmailResponse)
async def archive_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    return await service.update_email(email_id, user_id, EmailUpdateParams(is_archived=True))


@router.post("/{email_id}/pin", response_model=EmailResponse)
async def pin_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    return await service.update_email(email_id, user_id, EmailUpdateParams(is_pinned=True))


@router.post("/{email_id}/unpin", response_model=EmailResponse)
async def unpin_email(
    email_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    return await service.update_email(email_id, user_id, EmailUpdateParams(is_pinned=False))


@router.delete("/bulk/no-deseados", status_code=204)
async def delete_no_deseados(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    service = EmailService(session)
    await service.bulk_delete_by_category(user_id, "no_deseado")


@router.get("/pipeline/stats")
async def pipeline_stats():
    from app.core.email_pipeline import get_pipeline_stats

    return await get_pipeline_stats()
