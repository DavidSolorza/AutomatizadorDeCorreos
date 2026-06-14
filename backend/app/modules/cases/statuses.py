"""Estados operativos — alineados con frontend case-statuses.ts"""

from __future__ import annotations

PENDING_STATUSES = [
    "pendiente_cliente",
    "pendiente_documentacion",
    "en_revision_bogota",
    "requiere_autorizacion",
    "pendiente",
]

BLOCKED_STATUSES = ["bloqueado", "represado"]
CLOSED_STATUSES = ["cerrado"]
IN_PROCESS_STATUSES = ["en_proceso"]

LEGACY_STATUS_MAP = {
    "recibido": "nuevo",
    "pendiente": "pendiente_cliente",
    "represado": "bloqueado",
}

ACTIVE_STATUSES = [
    "nuevo",
    "asignado",
    "en_proceso",
    "recibido",
    *PENDING_STATUSES,
    *BLOCKED_STATUSES,
]

# Filtros de URL legacy → estados reales en BD
STATUS_FILTER_EXPAND: dict[str, list[str]] = {
    "pendiente": PENDING_STATUSES,
    "represado": BLOCKED_STATUSES,
    "recibido": ["recibido", "nuevo"],
    "pendiente_cliente": ["pendiente_cliente", "pendiente"],
    "bloqueado": BLOCKED_STATUSES,
}


def normalize_status(status: str) -> str:
    return LEGACY_STATUS_MAP.get(status, status)


def expand_status_filter(status: str) -> list[str]:
    if status in STATUS_FILTER_EXPAND:
        return STATUS_FILTER_EXPAND[status]
    return [status]


def is_critical_case(status: str, priority: str | None) -> bool:
    return priority == "urgente" or normalize_status(status) in BLOCKED_STATUSES
