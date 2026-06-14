import json
from datetime import date, datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import Email, EmailAccount
from app.modules.summary.repository import DailySummaryRepository
from app.modules.summary.schemas import DailySummaryResponse


DAILY_PROMPT = """Eres un asistente que resume el día de correos de un estudiante universitario.

A continuación se listan los correos que llegaron hoy. Genera un resumen diario ÚTIL y CONCISO que le permita al estudiante SABER QUÉ PASÓ sin tener que abrir cada correo.

Correos del día:
{emails_list}

IMPORTANTE - Genera exactamente este JSON:
{{
  "summary": "Resumen de 3-5 líneas en español contando lo más importante del día. Menciona nombres de profesores, materias, entregas, plazos.",
  "key_highlights": "Máximo 3 viñetas separadas por | con lo más crítico. Ej: Entrega de taller de Arquitectura para mañana | Parcial de Software el viernes | Reunión de proyecto cancelada",
  "categories": "Lista separada por comas de las categorías/materias que aparecieron. Ej: Arquitectura de Computadores, Fundamentos de Software"
}}

Responde SOLO el JSON, sin markdown ni explicaciones."""


async def generate_daily_summary(user_id: str, session: AsyncSession, target_date: date | None = None) -> DailySummaryResponse:
    repo = DailySummaryRepository(session)

    if target_date is None:
        target_date = date.today()

    existing = await repo.get_by_user_and_date(user_id, target_date)
    if existing:
        return DailySummaryResponse.model_validate(existing)

    # Get today's emails
    day_start = datetime(target_date.year, target_date.month, target_date.day, tzinfo=timezone.utc)
    day_end = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, tzinfo=timezone.utc)

    account_ids_query = select(EmailAccount.id).where(EmailAccount.user_id == user_id)
    result = await session.execute(
        select(Email).where(
            Email.account_id.in_(account_ids_query),
            Email.received_at >= day_start,
            Email.received_at <= day_end,
        ).order_by(Email.received_at.asc())
    )
    emails = list(result.scalars().all())

    # Count categories
    category_counts = {}
    for e in emails:
        if e.category:
            category_counts[e.category] = category_counts.get(e.category, 0) + 1

    if not emails:
        summary = await repo.create(
            user_id=user_id,
            summary_date=target_date,
            summary_text="No llegaron correos nuevos hoy.",
            email_count=0,
            categories="",
            key_highlights="Sin actividad",
        )
        return DailySummaryResponse.model_validate(summary)

    # Build email list for Gemini
    email_lines = []
    for e in emails:
        sender_label = e.sender_name or e.sender or "Desconocido"
        subject = e.subject or "Sin asunto"
        body = (e.body_plain or "")[:500].replace("\n", " ")
        email_lines.append(f"- De: {sender_label} | Asunto: {subject} | {body}")

    emails_text = "\n".join(email_lines)

    summary_text = ""
    key_highlights = ""
    categories_str = ""

    if not settings.gemini_api_key:
        summary_text = f"Llegaron {len(emails)} correos hoy."
        if category_counts:
            cats = ", ".join(f"{k}: {v}" for k, v in sorted(category_counts.items(), key=lambda x: -x[1]))
            summary_text += f"\n\nCategorías: {cats}"
        highlights = " | ".join(f"{e.subject or 'Sin asunto'} - {e.sender_name or e.sender}" for e in emails[:3])
        key_highlights = highlights
        categories_str = ", ".join(category_counts.keys()) if category_counts else ""
    else:
        prompt = DAILY_PROMPT.format(emails_list=emails_text)
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
                    params={"key": settings.gemini_api_key},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800},
                    },
                )
                data = resp.json()
                if resp.status_code == 200:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    text = text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                    parsed = json.loads(text)
                    summary_text = parsed.get("summary", f"Resumen de {len(emails)} correos.")
                    key_highlights = parsed.get("key_highlights", highlights_fallback(emails))
                    categories_str = parsed.get("categories", categories_fallback(category_counts))
                else:
                    summary_text = f"Llegaron {len(emails)} correos hoy."
                    key_highlights = highlights_fallback(emails)
                    categories_str = categories_fallback(category_counts)
        except Exception:
            summary_text = f"Llegaron {len(emails)} correos hoy."
            key_highlights = highlights_fallback(emails)
            categories_str = categories_fallback(category_counts)

    summary = await repo.create(
        user_id=user_id,
        summary_date=target_date,
        summary_text=summary_text,
        email_count=len(emails),
        categories=categories_str or None,
        key_highlights=key_highlights or None,
    )

    return DailySummaryResponse.model_validate(summary)


async def get_summaries(user_id: str, session: AsyncSession, limit: int = 30) -> list[DailySummaryResponse]:
    repo = DailySummaryRepository(session)
    items, total = await repo.get_by_user(user_id, limit=limit)
    return [DailySummaryResponse.model_validate(s) for s in items]


async def mark_summary_read(summary_id: str, user_id: str, session: AsyncSession) -> DailySummaryResponse | None:
    repo = DailySummaryRepository(session)
    summary = await repo.mark_as_read(summary_id, user_id)
    if summary:
        return DailySummaryResponse.model_validate(summary)
    return None


def highlights_fallback(emails: list) -> str:
    items = []
    for e in emails[:3]:
        name = e.sender_name or e.sender or "Desconocido"
        subject = e.subject or "Sin asunto"
        items.append(f"{subject} - {name}")
    return " | ".join(items)


def categories_fallback(category_counts: dict) -> str:
    if not category_counts:
        return ""
    return ", ".join(f"{k}: {v}" for k, v in sorted(category_counts.items(), key=lambda x: -x[1]))
