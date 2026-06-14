"""Análisis de correos operativos para oficina de seguros."""

from __future__ import annotations

import re
from typing import Optional

from app.modules.emails.schemas import AnalyzeResponse

URGENT_WORDS = {"urgente", "inmediato", "hoy", "mañana", "asap", "prioritario", "crítico", "critico"}
DEADLINE_PATTERNS = [
    re.compile(r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b"),
    re.compile(r"\b(\d{1,2}\s+de\s+[a-zñ]+\s+(de\s+)?\d{2,4})\b", re.I),
    re.compile(r"\b(hasta el|antes del|para el|vence|vencimiento)\s+([^.,\n]{4,40})", re.I),
]

CATEGORY_ACTIONS = {
    "cotizaciones": [
        "Revisar documentación adjunta del cliente",
        "Preparar cotización con coberturas solicitadas",
        "Enviar propuesta con plazo y condiciones comerciales",
    ],
    "renovaciones": [
        "Verificar vigencia y condiciones de la póliza actual",
        "Solicitar tarifas actualizadas al reasegurador",
        "Preparar propuesta de renovación para el cliente",
    ],
    "emisiones": [
        "Validar documentos firmados y datos del contrato",
        "Registrar póliza(s) en el sistema core",
        "Enviar certificados de cobertura al cliente",
    ],
    "cartera": [
        "Revisar listado de pólizas próximas a vencer",
        "Contactar clientes con cartera en riesgo",
        "Coordinar gestión de cobro o renovación",
    ],
    "licitaciones": [
        "Revisar pliego y requisitos de participación",
        "Preparar documentación técnica y económica",
        "Registrar fechas clave del proceso licitatorio",
    ],
    "colectivas": [
        "Validar nómina y coberturas del colectivo",
        "Calcular prima según número de asegurados",
        "Coordinar emisión o renovación del colectivo",
    ],
}


def _detect_deadlines(text: str) -> list[str]:
    deadlines: list[str] = []
    for pattern in DEADLINE_PATTERNS:
        for match in pattern.finditer(text):
            fragment = match.group(0).strip()
            if fragment and fragment not in deadlines:
                deadlines.append(fragment)
    return deadlines[:5]


def _detect_priority(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in URGENT_WORDS):
        return "urgente"
    if any(w in lower for w in ("importante", "prioridad", "plazo")):
        return "alto"
    return "media"


def _insurance_heuristic(
    sender: str,
    subject: str,
    body: str,
    category: str = "sin_clasificar",
) -> AnalyzeResponse:
    text = f"{subject} {body}".strip()
    lower = text.lower()

    if "cotiz" in lower:
        category = "cotizaciones"
    elif "renov" in lower:
        category = "renovaciones"
    elif "emisi" in lower or "contrato firmado" in lower:
        category = "emisiones"
    elif "cartera" in lower or "venc" in lower:
        category = "cartera"
    elif "licit" in lower:
        category = "licitaciones"
    elif "colectiv" in lower:
        category = "colectivas"

    sender_label = sender.split("@")[0] if sender else "remitente"
    summary = (
        f"Correo de {sender_label} sobre {subject or 'gestión operativa'}. "
        f"Clasificado como {category.replace('_', ' ')}. "
        f"Requiere atención del analista asignado."
    )

    actions = list(CATEGORY_ACTIONS.get(category, [
        "Leer y clasificar el correo completo",
        "Identificar documentos o datos faltantes",
        "Responder al cliente con siguiente paso operativo",
    ]))

    if "adjunt" in lower:
        actions.insert(0, "Revisar archivos adjuntos mencionados en el correo")
    if "confirm" in lower or "proceder" in lower:
        actions.insert(0, "Confirmar autorización interna antes de proceder")
    if "?" in text or "favor" in lower or "solicit" in lower:
        actions.append("Preparar respuesta a las solicitudes del cliente")

    return AnalyzeResponse(
        summary=summary,
        action_items=actions[:6],
        deadlines=_detect_deadlines(text),
        priority=_detect_priority(text),
    )


async def analyze_case_email(
    *,
    sender: str = "",
    subject: str = "",
    body: Optional[str] = None,
    body_html: Optional[str] = None,
    category: str = "sin_clasificar",
) -> AnalyzeResponse:
    from app.core.config import settings
    from app.core.email_pipeline import process_email

    body_text = body or ""
    force_ai = bool(settings.gemini_api_key and settings.gemini_api_key.strip())

    try:
        result = await process_email(
            sender=sender,
            subject=subject or "",
            body_plain=body_text,
            body_html=body_html,
            force_ai=force_ai,
        )
        analysis = result.analysis
        if analysis and analysis.summary and len(analysis.action_items) >= 1:
            if not analysis.action_items or analysis.action_items[0].endswith("detectado"):
                return _insurance_heuristic(sender, subject, body_text, category)
            return analysis
    except Exception:
        pass

    return _insurance_heuristic(sender, subject, body_text, category)
