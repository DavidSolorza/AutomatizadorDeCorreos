from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cases.analysis import analyze_case_email
from app.modules.cases.repository import CaseHistoryRepository, CaseRepository
from app.modules.cases.schemas import CaseCreate, CaseUpdate
from app.modules.rules.engine import RuleEngine
from app.modules.rules.repository import RuleRepository
from app.models.models import OperationalCase

ANALYSTS = [
    {"id": "paula", "name": "Paula", "email": "paula@aseesta.com"},
    {"id": "cristina", "name": "Cristina", "email": "cristina@aseesta.com"},
    {"id": "marcela", "name": "Marcela", "email": "marcela@aseesta.com"},
]

CATEGORY_TO_ANALYST = {
    "cotizaciones": "paula",
    "cartera": "paula",
    "renovaciones": "cristina",
    "licitaciones": "cristina",
    "emisiones": "marcela",
    "colectivas": "marcela",
    "sin_clasificar": "paula",
}


def _analyst_for_category(category: str) -> dict:
    analyst_id = CATEGORY_TO_ANALYST.get(category, "paula")
    return next(a for a in ANALYSTS if a["id"] == analyst_id)


def _resolve_analyst(category: str, assigned_to: Optional[str] = None) -> dict:
    if assigned_to:
        match = next((a for a in ANALYSTS if a["id"] == assigned_to), None)
        if match:
            return match
    return _analyst_for_category(category)


class CaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CaseRepository(session)
        self.history_repo = CaseHistoryRepository(session)
        self.rule_engine = RuleEngine(RuleRepository(session))

    async def create_from_email(
        self,
        email_data: dict,
        user_id: str = "admin",
    ) -> OperationalCase:
        email_id = email_data.get("id")
        if email_id:
            existing = await self.repo.get_by_email_id(email_id)
            if existing:
                return existing

        classification = await self.rule_engine.classify(email_data, user_id)
        category = classification.category or "sin_clasificar"
        analyst = _resolve_analyst(category, classification.assigned_to)
        now = datetime.now(timezone.utc)

        body = email_data.get("body_plain") or email_data.get("body") or ""
        analysis = await analyze_case_email(
            sender=email_data.get("sender", ""),
            subject=email_data.get("subject") or "",
            body=body,
            body_html=email_data.get("body_html"),
            category=category,
        )

        case = OperationalCase(
            sender=email_data.get("sender", ""),
            sender_name=email_data.get("sender_name"),
            subject=email_data.get("subject"),
            body=body,
            received_at=email_data.get("received_at", now),
            assigned_at=now,
            source_mailbox=email_data.get("source_mailbox") or email_data.get("mailbox"),
            assigned_to=analyst["id"],
            assigned_name=analyst["name"],
            status="nuevo",
            category=category,
            email_id=email_data.get("id"),
            ai_summary=analysis.summary,
            action_items=analysis.action_items,
            deadlines=analysis.deadlines,
            priority=analysis.priority,
            created_at=now,
            updated_at=now,
        )
        self.session.add(case)
        await self.session.flush()

        await self.history_repo.add_entry(case.id, "Caso creado automáticamente desde correo entrante")
        if classification.rule_name:
            await self.history_repo.add_entry(
                case.id,
                f"Clasificado por regla «{classification.rule_name}» → {category}",
            )
        elif category != "sin_clasificar":
            await self.history_repo.add_entry(case.id, f"Clasificado como {category} por regla automática")
        await self.history_repo.add_entry(
            case.id,
            f"Asignado a {analyst['name']}"
            + (" (regla personalizada)" if classification.assigned_to else ""),
        )
        await self.history_repo.add_entry(
            case.id,
            f"Análisis generado: {len(analysis.action_items)} tarea(s) identificada(s)",
        )
        await self.session.commit()
        await self.session.refresh(case)
        return case

    async def list_cases(self, viewer_id: str = "admin", **filters) -> tuple[list[OperationalCase], int]:
        if viewer_id != "admin":
            filters["assigned_to"] = viewer_id
        return await self.repo.list_filtered(**filters)

    async def get_case(self, case_id: str) -> Optional[OperationalCase]:
        return await self.repo.get(case_id)

    async def update_case(
        self,
        case_id: str,
        data: CaseUpdate,
        performed_by: str = "system",
        performed_by_name: str = "Sistema",
    ) -> Optional[OperationalCase]:
        case = await self.repo.get(case_id)
        if not case:
            return None

        update_data = data.model_dump(exclude_unset=True)
        prev_status = case.status
        now = datetime.now(timezone.utc)

        if "status" in update_data and update_data["status"] == "en_proceso" and not case.started_at:
            case.started_at = now

        if "status" in update_data and update_data["status"] == "cerrado" and not case.closed_at:
            case.closed_at = datetime.now(timezone.utc)
            elapsed = (case.closed_at - case.received_at).total_seconds() / 3600
            case.response_time = round(elapsed, 1)

        for key, value in update_data.items():
            setattr(case, key, value)
        case.updated_at = now

        if "status" in update_data and update_data["status"] != prev_status:
            await self.history_repo.add_entry(
                case_id,
                f"Estado cambiado de {prev_status} a {update_data['status']}",
                performed_by,
                performed_by_name,
            )
        if "assigned_to" in update_data:
            await self.history_repo.add_entry(
                case_id,
                f"Reasignado a {update_data.get('assigned_name', update_data['assigned_to'])}",
                performed_by,
                performed_by_name,
            )

        await self.session.commit()
        await self.session.refresh(case)
        return case
