"""Local email classifier — regex/keyword/heuristic. NO AI calls."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Pattern, Set


@dataclass
class ClassificationResult:
    category: str = "general"
    priority: str = "media"
    is_task: bool = False
    is_event: bool = False
    is_announcement: bool = False
    has_deadline: bool = False
    detected_professor: Optional[str] = None
    detected_subject: Optional[str] = None
    detected_keywords: List[str] = field(default_factory=list)
    confidence: float = 0.0
    requires_ai: bool = False


PROFESSOR_PATTERNS = [
    re.compile(r"\b(prof(esor(a|es)?)?\.?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s*){1,3})", re.I),
    re.compile(r"\b(dr\.?|dra\.?|docente|tutor|maestr[oa])\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s*){1,3}", re.I),
    re.compile(r"\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)\s*(prof|docente|tutor)", re.I),
]

SUBJECT_PATTERNS = [
    re.compile(r"\b(asignatura|materia|curso|clase|módulo|modulo|semestre)\s*:?\s*([^\n,.]+)", re.I),
    re.compile(r"\b([^\n,.]{3,60})\s*(\(?\d{4}\)?|-\s*grupo|-\s*sección|-\s*seccion)", re.I),
]

TASK_KEYWORDS: Set[str] = {
    "tarea", "taller", "trabajo", "ejercicio", "actividad", "laboratorio",
    "proyecto", "informe", "ensayo", "resumen", "mapa conceptual",
    "cuestionario", "guía", "guia", "investigación", "investigacion",
    "práctica", "practica", "reporte",
}

EXAM_KEYWORDS: Set[str] = {
    "parcial", "examen", "evaluación", "evaluacion", "prueba", "quiz",
    "test", "final", "sustentación", "sustentacion", "exposición",
    "exposicion", "presentación", "presentacion", "oral",
}

DEADLINE_PATTERNS = [
    re.compile(r"\b(fecha\s*(límite|limite|entrega|máxima|maxima|tope))\s*:?\s*(\d{1,2}\s*(de\s*)?[a-zñ]+\s*(de\s*)?\d{2,4})", re.I),
    re.compile(r"\b(deadline|vencimiento|entrega|entregar)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", re.I),
    re.compile(r"\b(para\s+el|hasta\s+el|antes\s+del)\s+(\d{1,2}\s*(de\s*)?[a-zñ]+\s*(de\s*)?\d{2,4})", re.I),
    re.compile(r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\s*(fecha\s*(límite|limite|tope|entrega))?", re.I),
]

EVENT_KEYWORDS: Set[str] = {
    "reunión", "reunion", "encuentro", "sesión", "sesion", "clase",
    "conferencia", "videollamada", "llamada", "meeting", "webinar",
    "tutorial", "orientación", "orientacion", "socialización",
    "socializacion", "evento", "taller virtual",
}

URGENT_KEYWORDS: Set[str] = {
    "urgente", "inmediato", "importante", "pronto", "ya", "hoy",
    "mañana", "ma\u00f1ana", "critical", "important", "asap",
}

LINK_PATTERNS = [
    ("meet", re.compile(r"(meet\.google\.com|google\.meet)")),
    ("classroom", re.compile(r"(classroom\.google\.com|google\.classroom)")),
    ("zoom", re.compile(r"(zoom\.us|zoom\.com)")),
    ("teams", re.compile(r"(teams\.microsoft\.com|microsoft\.teams)")),
]


def _normalize_text(text: str) -> str:
    return text.lower().strip()


def _extract_professor(text: str) -> Optional[str]:
    for pattern in PROFESSOR_PATTERNS:
        m = pattern.search(text)
        if m:
            return m.group(0).strip()[:60]
    return None


def _extract_subject(text: str) -> Optional[str]:
    for pattern in SUBJECT_PATTERNS:
        m = pattern.search(text)
        if m:
            return m.group(2).strip()[:60] if m.lastindex and m.lastindex >= 2 else m.group(1).strip()[:60]
    return None


def _has_deadline(text: str) -> bool:
    return any(p.search(text) for p in DEADLINE_PATTERNS)


def _count_keyword_matches(text: str, keywords: Set[str]) -> int:
    normalized = _normalize_text(text)
    return sum(1 for kw in keywords if kw in normalized)


def classify_email(subject: str, body: str) -> ClassificationResult:
    combined = f"{subject or ''} {body or ''}"
    combined_lower = _normalize_text(combined)

    result = ClassificationResult()
    result.detected_professor = _extract_professor(combined)
    result.detected_subject = _extract_subject(combined)
    result.has_deadline = _has_deadline(combined)

    task_score = _count_keyword_matches(combined_lower, TASK_KEYWORDS)
    exam_score = _count_keyword_matches(combined_lower, EXAM_KEYWORDS)
    event_score = _count_keyword_matches(combined_lower, EVENT_KEYWORDS)
    urgent_score = _count_keyword_matches(combined_lower, URGENT_KEYWORDS)

    if exam_score > 0:
        result.category = "universidad"
        result.is_task = True
        result.confidence = 0.6 + (exam_score * 0.1)
        result.requires_ai = exam_score < 2 and not result.has_deadline

    if task_score > 0:
        if result.category == "general":
            result.category = "universidad"
        result.is_task = True
        result.confidence = max(result.confidence, 0.5 + (task_score * 0.1))
        if task_score >= 2 and result.has_deadline:
            result.requires_ai = False
        else:
            result.requires_ai = result.requires_ai or task_score < 2

    if event_score > 0:
        if result.category == "general":
            result.category = "reuniones"
        result.is_event = True
        result.confidence = max(result.confidence, 0.5 + (event_score * 0.1))

    if urgent_score > 0:
        result.priority = "urgente" if urgent_score >= 2 else "alto"
        result.confidence = max(result.confidence, 0.6)

    if result.is_task and result.has_deadline and not result.requires_ai:
        result.requires_ai = False

    if result.detected_professor and not any([task_score, exam_score, event_score]):
        result.category = "universidad"

    if not result.is_task and not result.is_event and not result.detected_professor and not result.has_deadline:
        long_text = len(combined) > 500
        has_important = _count_keyword_matches(combined_lower, {"importante", "aviso", "información", "informacion", "comunicado", "recordatorio"}) > 0
        result.requires_ai = long_text or has_important or result.confidence < 0.3

    result.detected_keywords = []
    for kw in list(TASK_KEYWORDS | EXAM_KEYWORDS | EVENT_KEYWORDS | URGENT_KEYWORDS):
        if kw in combined_lower:
            result.detected_keywords.append(kw)
    result.detected_keywords = result.detected_keywords[:8]

    return result
