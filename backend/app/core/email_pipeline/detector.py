"""Noise detection — signatures, footers, disclaimers, ads, unsubscribe blocks."""

import re
from typing import List, Optional, Set

SIGNATURE_MARKERS: Set[str] = {
    "saludos cordiales",
    "atentamente",
    "atte.",
    "atte",
    "cordialmente",
    "sinceramente",
    "thanks",
    "regards",
    "best regards",
    "cheers",
    "sincerely",
    "best",
    "thank you",
    "thanks,",
    "saludos",
    "un abrazo",
    "quedo atento",
    "quedamos atentos",
    "quedo pendiente",
    "cordial saludo",
    "muchas gracias",
    "gracias,",
    "gracias",
}

DISCLAIMER_MARKERS: Set[str] = {
    "confidencialidad",
    "confidentiality",
    "privilegiada",
    "privileged",
    "this message contains",
    "this e-mail contains",
    "este mensaje contiene",
    "información confidencial",
    "informacion confidencial",
    "esta información es",
    "esta informacion es",
    "protegida por",
    "protected by",
    "disclaimer",
    "aviso legal",
    "legal notice",
}

UNSUBSCRIBE_PATTERNS = [
    re.compile(r"(unsubscribe|cancelar\s+suscripción|darse\s+de\s+baja)", re.I),
    re.compile(r"(dejar\s+de\s+recibir|no\s+recibir\s+más)", re.I),
    re.compile(r"(this email was sent|you are receiving this)", re.I),
    re.compile(r"(si\s+no\s+desea|if\s+you\s+don.t\s+want)", re.I),
]

FOOTER_LINE_PATTERNS = [
    re.compile(r"^\s*_{2,}\s*$"),
    re.compile(r"^\s*[-–—]{3,}\s*$"),
    re.compile(r"^\s*[*•·]{3,}\s*$"),
    re.compile(r"^\s*\|+\s*$"),
]

AUTO_REPLY_MARKERS: Set[str] = {
    "---original message---",
    "---mensaje original---",
    "-----original message-----",
    "-----mensaje original-----",
    "---------- Forwarded message ---------",
    "---------- Mensaje reenviado ---------",
    "on.*wrote:",
    "el.*escribió:",
    "el.*escribio:",
}

COMPANY_NAME_PATTERNS = [
    re.compile(r"\buniversidad\s+de\b", re.I),
    re.compile(r"\buniversity\s+of\b", re.I),
    re.compile(r"\bcorp(oración)?\b", re.I),
    re.compile(r"\bltda?\b", re.I),
    re.compile(r"\bs\.?a\.?\b", re.I),
    re.compile(r"\bs\.?a\.?\s+s\.?", re.I),
    re.compile(r"\bsas\b", re.I),
]

PHONE_PATTERN = re.compile(r"\+?\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}")
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
URL_PATTERN = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+")


def detect_signature_line(line: str) -> bool:
    line_lower = line.strip().lower().rstrip(".,;:")
    for marker in SIGNATURE_MARKERS:
        if line_lower == marker or line_lower.startswith(marker):
            return True
    return False


def detect_disclaimer_line(line: str) -> bool:
    line_lower = line.strip().lower()
    for marker in DISCLAIMER_MARKERS:
        if marker in line_lower:
            return True
    return False


def detect_unsubscribe(line: str) -> bool:
    return any(p.search(line) for p in UNSUBSCRIBE_PATTERNS)


def detect_footer_separator(line: str) -> bool:
    return any(p.match(line) for p in FOOTER_LINE_PATTERNS)


def detect_auto_reply(line: str) -> bool:
    line_lower = line.strip().lower()
    for marker in AUTO_REPLY_MARKERS:
        if marker in line_lower or re.match(marker, line_lower):
            return True
    return False


def detect_empty_line(line: str) -> bool:
    return not line.strip()


def is_noise_line(line: str, line_index: int, total_lines: int) -> bool:
    """
    Heuristic: returns True if the line looks like noise (footer, disclaimer, etc.).
    Uses position in the text — footers are usually at the end.
    """
    stripped = line.strip()
    if not stripped:
        return False

    last_third = line_index > total_lines * 0.7

    if last_third:
        if detect_signature_line(stripped):
            return True
        if detect_footer_separator(stripped):
            return True
        if detect_unsubscribe(stripped):
            return True

    if detect_disclaimer_line(stripped):
        return True

    if detect_auto_reply(stripped):
        return True

    if len(stripped) > 150 and line_index > total_lines * 0.5:
        return True

    return False


def strip_noise_lines(lines: List[str]) -> List[str]:
    total = len(lines)
    result: List[str] = []
    found_signature_block = False

    for i, line in enumerate(lines):
        if is_noise_line(line, i, total):
            found_signature_block = True
            continue
        if found_signature_block and (
            detect_empty_line(line) or
            (len(line.strip()) < 80 and any(
                p.search(line.strip()) for p in [
                    re.compile(r"\bcel|phone|tel|fax|móvil|movil|whatsapp", re.I),
                    re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+\s+\d{4,}", re.I),
                ]
            ))
        ):
            continue
        if found_signature_block and detect_empty_line(line):
            continue
        if found_signature_block and line.strip().startswith("-"):
            continue

        result.append(line)

    return result
