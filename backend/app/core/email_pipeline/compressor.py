"""Context compression — reduce text to minimal essential payload for AI."""

import re
from typing import Any, Optional

from app.core.email_pipeline.detector import strip_noise_lines

MAX_AI_INPUT_CHARS = 3000
MAX_SUBJECT_LENGTH = 120
MAX_SENDER_LENGTH = 80


def compress_context(
    sender: str,
    subject: str,
    body_text: str,
    max_chars: int = MAX_AI_INPUT_CHARS,
) -> str:
    if not body_text and not subject:
        return ""

    lines = body_text.split("\n")

    lines = strip_noise_lines(lines)

    lines = [l.strip() for l in lines if l.strip()]
    lines = [re.sub(r'\s+', ' ', l) for l in lines]

    seen: set = set()
    deduped = []
    for line in lines:
        key = line.lower()[:60]
        if key not in seen:
            seen.add(key)
            deduped.append(line)

    truncated_subject = (subject or "")[:MAX_SUBJECT_LENGTH]
    truncated_sender = (sender or "")[:MAX_SENDER_LENGTH]

    parts = []
    if truncated_sender:
        parts.append(f"De: {truncated_sender}")
    if truncated_subject:
        parts.append(f"Asunto: {truncated_subject}")
    if deduped:
        body_text = "\n".join(deduped)

        body_text = re.sub(r'\n{3,}', '\n\n', body_text)

        parts.append(body_text)

    result = "\n".join(parts)

    if len(result) > max_chars:
        result = result[:max_chars]
        last_newline = result.rfind("\n")
        if last_newline > max_chars * 0.7:
            result = result[:last_newline]
        else:
            last_period = result.rfind(".")
            if last_period > max_chars * 0.5:
                result = result[: last_period + 1]
            else:
                last_space = result.rfind(" ", max_chars - 100, max_chars)
                if last_space > 0:
                    result = result[:last_space]

    return result.strip()


def build_minimal_prompt(
    sender: str,
    subject: str,
    body: str,
    classification: any,
    task_type: str = "analyze",
) -> str:
    compressed = compress_context(sender, subject, body)

    if not compressed:
        return ""

    lines = compressed.split("\n")
    header_lines = []
    body_lines = []
    in_header = True
    for line in lines:
        if in_header and (line.startswith("De: ") or line.startswith("Asunto: ")):
            header_lines.append(line)
        else:
            in_header = False
            body_lines.append(line)

    body_text = "\n".join(body_lines)[:2000]

    if task_type == "analyze":
        prompt = f"""Correo:
{compressed}

Extrae en JSON:
{{"summary": "resumen 2-3 líneas", "action_items": ["acción 1", "acción 2"], "deadlines": ["fecha 1"], "priority": "urgente|alto|media|bajo"}}"""
    elif task_type == "classify":
        prompt = f"""Correo:
{compressed}

Clasifica en JSON:
{{"category": "universidad|trabajo|personal|reuniones|pagos|no_deseado|general", "reason": "motivo breve"}}"""
    else:
        prompt = f"""Correo:
{compressed}

Responde en JSON con los campos relevantes."""

    return prompt.strip()
