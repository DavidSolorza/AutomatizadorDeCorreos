import re
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.models import Task, Email
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.schemas import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate


# Confidence thresholds
CONFIDENCE_HIGH = 80
CONFIDENCE_MEDIUM = 55
CONFIDENCE_LOW = 30
CONFIDENCE_MINIMUM = 50  # minimum to create a task

# Negative patterns — if any match, task creation is skipped entirely
NEGATIVE_PATTERNS = [
    r'\bya\s+(entregué|entregó|entregaron|subí|subió|presenté|presentó)\b',
    r'\bnota[s]?\s+(publicada[s]?|final[es]?|del\s+curso|obtenida[s]?)\b',
    r'\bcalificacion(es)?\b',
    r'\bcalificación(es)?\b',
    r'\bresultados?\s+(académicos|finales|examen|parcial)\b',
    r'\bbolet(in|ín)\s+(informativo|de\s+notas)\b',
    r'\bcódigo\s+de\s+verificación\b',
    r'\b(restablecer|cambiar)\s+(contraseña|password|clave)\b',
    r'\bverificar\s+correo\b',
    r'\bbienvenido\s+(a|al)\b',
    r'\bcambio\s+de\s+contraseña\b',
    r'\bconfirmación\s+de\s+(registro|cuenta|suscripción)\b',
    r'\b(reactivación|activación)\s+de\s+cuenta\b',
    r'\blas\s+(clases|actividades)\s+(están|serán|serán)\s+(suspendidas|canceladas)\b',
    r'\bpromoción\s+exclusiva\b',
    r'\bdescuento\s+especial\b',
    r'\boferta\s+(limitada|especial)\b',
    r'\bno\s+responder\b',
    r'\bnoreply\b',
    r'\bno-reply\b',
]

# Detection patterns: (regex, task_type, confidence_score, is_boost)
# Higher confidence = more likely this is a real task
PATTERNS = [
    # ── FRASES DE ALTA CONFIANZA (80-100) ──
    (r'\bfecha\s+(de\s+)?(entrega|límite|limite|tope|culminación)\b', 'entrega', 98),
    (r'\bdeadline\b', 'entrega', 98),
    (r'\ba\s+más\s+tardar\b', 'entrega', 95),
    (r'\bplazo\s+(máximo|final|límite|limite|de\s+entrega)\b', 'entrega', 95),
    (r'\b(parcial|examen)\s+(final|parcial)?\s*\d?\s*(\.\d)?\b', 'parcial', 95),
    (r'\bentregar\s+(el|la|los|las|antes\s+del?|hasta\s+el|para\s+el)\b', 'entrega', 92),
    (r'\bhay\s+que\s+entregar\b', 'entrega', 92),
    (r'\b(deben?|tienen?)\s+que\s+entregar\b', 'entrega', 92),
    (r'\bdebe(n)?\s+ser\s+entregado\b', 'entrega', 92),
    (r'\b(se\s+)?(debe|deben)\s+(entregar|presentar|subir|enviar)\b', 'entrega', 88),
    (r'\bsubir\s+(a\s+)?(la\s+)?plataforma\b', 'subida', 88),
    (r'\b(subir|adjuntar|enviar)\s+(el|la|los|las)\s+(taller|tarea|trabajo|informe|actividad)\b', 'subida', 85),
    (r'\bpresentar\s+(el|la|los|las)\s+(trabajo|informe|proyecto|exposición|exposicion)\b', 'presentación', 85),
    (r'\bexposición\s+(del|de\s+la|final|grupal)\b', 'exposición', 88),
    (r'\bexposicion\s+(del|de\s+la|final|grupal)\b', 'exposición', 88),
    (r'\btaller\s+(\d+|práctico|evaluativo|de\s+entrega)\b', 'taller', 85),
    (r'\binforme\s+(final|técnico|escrito|de\s+lab(oratorio)?|de\s+investigación|de\s+práctica)\b', 'informe', 85),
    (r'\blaboratorio\s+(\d+|final|práctico)\b', 'laboratorio', 82),
    (r'\bpráctica\s+(\d+|final|de\s+campo|de\s+lab(oratorio)?)\b', 'práctica', 80),
    (r'\bentregar\s+(hoy|mañana|esta\s+semana)\b', 'entrega', 90),

    # ── FRASES DE CONFIANZA MEDIA (55-79) ──
    (r'\btarea[s]?\s+(de\s+la\s+)?(semana|clase|materia|final|práctica|del\s+curso)\b', 'tarea', 75),
    (r'\btrabajo\s+(final|práctico|grupal|individual|de\s+investigación|escrito)\b', 'trabajo', 75),
    (r'\bproyecto\s+(final|de\s+investigación|de\s+aula|integrador)\b', 'proyecto', 72),
    (r'\binvestigación\s+(formativa|académica|de\s+campo)\b', 'investigación', 65),
    (r'\bejercicio[s]?\s+(de\s+)?(entrega|evaluativo|práctico|final)\b', 'ejercicio', 65),
    (r'\bactividad\s+(de\s+)?(entrega|evaluativa|práctica|final)\b', 'actividad', 65),
    (r'\bsustentación\b', 'sustentación', 75),
    (r'\b(quiz|quices?)\b', 'quiz', 70),
    (r'\b(prueba|evaluación)\s+(escrita|oral|final|parcial|corta)\b', 'evaluación', 72),

    # ── PALABRAS SUELTAS (confianza base baja, se apilan) ──
    (r'\bentregar\b', 'entrega', 35),
    (r'\bsubir\b', 'subida', 30),
    (r'\btaller\b', 'taller', 30),
    (r'\binforme\b', 'informe', 30),
    (r'\blaboratorio\b', 'laboratorio', 30),
    (r'\btarea[s]?\b', 'tarea', 30),
    (r'\btrabajo\b', 'trabajo', 25),
    (r'\bproyecto\b', 'proyecto', 25),
    (r'\binvestigación\b', 'investigación', 25),
    (r'\bejercicio[s]?\b', 'ejercicio', 25),
    (r'\bexposición\b', 'exposición', 35),
    (r'\bexposicion\b', 'exposición', 35),
    (r'\bpráctica\b', 'práctica', 25),
    (r'\bactividad\b', 'actividad', 20),
    (r'\bentrega\b', 'entrega', 30),
    (r'\bentregable\b', 'entrega', 45),

    # ── BOOST: patrones que suben la confianza si coinciden ──
    (r'\b(para|antes\s+del?)\s+\d{1,2}\s+(de\s+)?\w+\s*(del?\s*)?(\d{4}|\d{2})\b', None, 20, True),
    (r'\b(para|antes\s+del?)\s+\w+\s+\d{1,2}\b', None, 15, True),
    (r'\bfecha\s+(límite|limite|tope|maxima|máxima)\b', None, 20, True),
    (r'\b(último|última)\s+(día|semana|plazo)\b', None, 15, True),
    (r'\b(vencimiento|vencer|vence)\b', None, 20, True),
    (r'\b(prórroga|extensión|extension|ampliación)\s+(del\s+)?(plazo|de\s+entrega)\b', None, 15, True),
    (r'\bhora[s]?\s+(límite|limite|maxima|máxima)\b', None, 10, True),
]

# Month name to number mapping
SPANISH_MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
    "jul": 7, "ago": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dic": 12,
}

DATE_TEXT_PATTERNS = [
    # "15 de marzo de 2025" or "15 de marzo 2025"
    (r'(\d{1,2})\s*de\s+([a-zA-Záéíóúñ]+)\s*(?:de\s*)?(\d{4})', 'text'),
    # "15/03/2025" or "15-03-2025"
    (r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', 'numeric'),
    # "15/03/25"
    (r'(\d{1,2})[/-](\d{1,2})[/-](\d{2})(?!\d)', 'short'),
]


def _parse_date_from_text(text: str) -> Optional[datetime]:
    """Extract the first reasonable future date from text."""
    now = datetime.now()
    found_dates = []
    for pattern, fmt in DATE_TEXT_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            groups = match.groups()
            try:
                if fmt == 'text':
                    day = int(groups[0])
                    month = SPANISH_MONTHS.get(groups[1].lower())
                    year = int(groups[2])
                    if month and 1 <= day <= 31:
                        found_dates.append(datetime(year, month, day))
                elif fmt == 'numeric':
                    a, b, c = int(groups[0]), int(groups[1]), int(groups[2])
                    if 1 <= a <= 31 and 1 <= b <= 12:
                        found_dates.append(datetime(c, b, a))  # DD/MM/YYYY
                    elif 1 <= b <= 31 and 1 <= a <= 12:
                        found_dates.append(datetime(c, a, b))  # MM/DD/YYYY
                elif fmt == 'short':
                    a, b, c = int(groups[0]), int(groups[1]), int(groups[2]) + 2000
                    if 1 <= a <= 31 and 1 <= b <= 12:
                        found_dates.append(datetime(c, b, a))
                    elif 1 <= b <= 31 and 1 <= a <= 12:
                        found_dates.append(datetime(c, a, b))
            except (ValueError, OverflowError):
                continue

    future_dates = [d for d in found_dates if d > now]
    if future_dates:
        return min(future_dates)
    if found_dates:
        return max(found_dates)
    return None


def _has_negative_pattern(text: str) -> bool:
    """Check if text matches any negative pattern (should skip task creation)."""
    for pattern in NEGATIVE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def _calculate_confidence(text: str) -> tuple[int, Optional[str], str, Optional[str]]:
    """
    Analyze text and return (confidence, task_type, best_title_info, tags).
    Returns None for task_type if confidence is below minimum.
    """
    confidence = 0
    task_type = None
    tags_set = set()

    for entry in PATTERNS:
        pattern = entry[0]
        ptype = entry[2] if len(entry) >= 4 else None
        if isinstance(ptype, bool) and ptype:
            # Boost pattern
            if re.search(pattern, text, re.IGNORECASE):
                confidence += entry[1]  # entry[1] is the boost value
            continue

        # Normal pattern: (regex, task_type, score, [is_boost])
        p_task_type = entry[1]
        score = entry[2]

        if re.search(pattern, text, re.IGNORECASE):
            confidence += score
            if p_task_type:
                task_type = p_task_type
                tags_set.add(p_task_type)

    # Determine priority based on confidence
    priority = "bajo"
    if confidence >= CONFIDENCE_HIGH:
        priority = "urgente"
    elif confidence >= CONFIDENCE_MEDIUM:
        priority = "alto"
    elif confidence >= CONFIDENCE_LOW:
        priority = "medio"

    tags = ", ".join(sorted(tags_set)) if tags_set else None

    return confidence, task_type, priority, tags


class TaskService:
    def __init__(self, session: AsyncSession):
        self.repository = TaskRepository(session)
        self.session = session

    async def create_task(self, user_id: str, data: TaskCreate) -> TaskResponse:
        task = Task(
            email_id=data.email_id,
            user_id=user_id,
            title=data.title,
            description=data.description,
            due_date=data.due_date,
            status=data.status,
            priority=data.priority,
            source=data.source,
            tags=data.tags,
        )
        self.session.add(task)
        await self.session.flush()
        return TaskResponse.model_validate(task)

    async def get_tasks(
        self,
        user_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        page: int = 1,
        size: int = 50,
    ) -> TaskListResponse:
        base = select(Task).where(Task.user_id == user_id)
        count_base = select(func.count()).select_from(Task).where(Task.user_id == user_id)

        if status:
            base = base.where(Task.status == status)
            count_base = count_base.where(Task.status == status)
        if priority:
            base = base.where(Task.priority == priority)
            count_base = count_base.where(Task.priority == priority)

        count_result = await self.session.execute(count_base)
        total = count_result.scalar() or 0

        base = base.order_by(Task.created_at.desc()).offset((page - 1) * size).limit(size)
        result = await self.session.execute(base)
        items = list(result.scalars().all())

        return TaskListResponse(
            items=[TaskResponse.model_validate(t) for t in items],
            total=total,
            page=page,
            size=size,
            pages=max(1, (total + size - 1) // size),
        )

    async def get_task(self, task_id: str, user_id: str) -> TaskResponse:
        task = await self.repository.get(task_id)
        if not task or task.user_id != user_id:
            raise NotFoundException("Task not found")
        return TaskResponse.model_validate(task)

    async def update_task(self, task_id: str, user_id: str, data: TaskUpdate) -> TaskResponse:
        task = await self.repository.get(task_id)
        if not task or task.user_id != user_id:
            raise NotFoundException("Task not found")
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        await self.session.flush()
        return TaskResponse.model_validate(task)

    async def delete_task(self, task_id: str, user_id: str) -> None:
        task = await self.repository.get(task_id)
        if not task or task.user_id != user_id:
            raise NotFoundException("Task not found")
        await self.session.delete(task)
        await self.session.flush()

    async def detect_tasks_from_email(self, email_id: str, user_id: str) -> list[TaskResponse]:
        result = await self.session.execute(
            select(Email).where(Email.id == email_id)
        )
        email = result.scalar_one_or_none()
        if not email:
            raise NotFoundException("Email not found")

        subject = email.subject or ""
        body = email.body_plain or ""
        full_text = f"{subject} {body}".lower()

        # Skip if negative patterns match (password resets, grades, spam, etc.)
        if _has_negative_pattern(full_text):
            return []

        # Calculate confidence and task type
        confidence, task_type, priority, tags = _calculate_confidence(full_text)

        if confidence < CONFIDENCE_MINIMUM or not task_type:
            return []

        # Try to extract a due date
        due_date = _parse_date_from_text(full_text)

        # Generate title
        task_type_title = task_type.capitalize()
        if subject:
            title = f"{task_type_title} - {subject}"[:500]
        else:
            title = f"{task_type_title} detectado"[:500]

        # Check for duplicate
        existing = await self.session.execute(
            select(Task).where(Task.email_id == email_id, Task.title == title)
        )
        if existing.scalar_one_or_none():
            return []

        # Build description with detection info
        desc_parts = [f"Detectado del correo: {subject or 'Sin asunto'}"]
        if due_date:
            desc_parts.append(f"Fecha estimada: {due_date.strftime('%d/%m/%Y')}")
        desc_parts.append(f"Confianza: {confidence}%")
        description = " | ".join(desc_parts)

        task = Task(
            email_id=email_id,
            user_id=user_id,
            title=title,
            description=description,
            due_date=due_date,
            status="pending",
            priority=priority,
            source="auto_detect",
            tags=tags or task_type,
        )
        self.session.add(task)
        await self.session.flush()

        return [TaskResponse.model_validate(task)]

    async def detect_from_recent(
        self,
        user_id: str,
        account_id: str,
        limit: int = 200,
    ) -> dict:
        from sqlalchemy import select as sa_select

        subq = sa_select(Task.email_id).where(Task.email_id.isnot(None))
        result = await self.session.execute(
            sa_select(Email).where(
                Email.account_id == account_id,
                ~Email.id.in_(subq),
            )
            .order_by(Email.received_at.desc())
            .limit(limit)
        )
        emails = list(result.scalars().all())

        detected = 0
        for email in emails:
            try:
                tasks = await self.detect_tasks_from_email(email.id, user_id)
                detected += len(tasks)
            except Exception:
                continue

        return {"detected": detected, "emails_checked": len(emails)}
