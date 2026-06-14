"""Token-aware AI service with caching, metrics, and minimal prompts."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings
from app.core.email_pipeline.compressor import build_minimal_prompt, compress_context
from app.core.email_pipeline.metrics import (
    TokenMetrics,
    end_timer,
    estimate_tokens,
    metrics_collector,
    start_timer,
)
from app.modules.emails.schemas import AnalyzeResponse

logger = logging.getLogger(__name__)

CACHE_PREFIX = "ai_analysis_"
CACHE_TTL_SECONDS = 3600


class AnalysisCache:
    _instance: AnalysisCache | None = None
    _store: Dict[str, Any]

    def __new__(cls) -> AnalysisCache:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._store = {}
        return cls._instance

    def _make_key(self, sender: str, subject: str, body_snippet: str) -> str:
        raw = f"{sender}|{subject}|{body_snippet[:200]}"
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, sender: str, subject: str, body: str) -> Optional[Any]:
        key = self._make_key(sender, subject, body)
        return self._store.get(key)

    def set(self, sender: str, subject: str, body: str, result: Any) -> None:
        key = self._make_key(sender, subject, body)
        self._store[key] = result
        if len(self._store) > 500:
            oldest = next(iter(self._store))
            del self._store[oldest]

    def clear(self) -> None:
        self._store.clear()


analysis_cache = AnalysisCache()

ANALYZE_PROMPT_TEMPLATE = """Eres un asistente de una oficina de seguros. Analiza este correo operativo:

{compressed}

Extrae en JSON:
{{"summary": "resumen operativo 2-3 líneas", "action_items": ["tarea específica 1", "tarea 2"], "deadlines": ["fecha límite si hay"], "priority": "urgente|alto|media|bajo"}}"""


def _parse_gemini_response(text: str) -> Optional[dict]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            brace_start = text.index("{")
            brace_end = text.rindex("}") + 1
            return json.loads(text[brace_start:brace_end])
        except (ValueError, json.JSONDecodeError):
            return None


async def analyze_with_ai(
    sender: str,
    subject: str,
    body_text: str,
    skip_cache: bool = False,
) -> AnalyzeResponse:
    timer_start = start_timer()
    metrics = TokenMetrics()

    raw_chars = len(body_text or "") + len(subject or "") + len(sender or "")
    metrics.raw_chars = raw_chars
    metrics.had_html = bool(body_text and ("<" in body_text and ">" in body_text))

    if not skip_cache:
        cached = analysis_cache.get(sender, subject, body_text)
        if cached is not None:
            metrics.cache_hit = True
            metrics.processing_time_ms = end_timer(timer_start)
            metrics_collector.record(metrics)
            logger.debug("Cache hit for %s - %s", sender, subject[:40])
            return cached

    compressed = build_minimal_prompt(sender, subject, body_text)

    if not compressed:
        return AnalyzeResponse(
            summary="Sin contenido para analizar",
            action_items=[],
            deadlines=[],
            priority="media",
        )

    metrics.cleaned_chars = len(compressed)

    if not settings.gemini_api_key:
        metrics.compressed_chars = len(compressed)
        metrics.processing_time_ms = end_timer(timer_start)
        metrics_collector.record(metrics)
        return AnalyzeResponse(
            summary="Analizador no configurado",
            action_items=[],
            deadlines=[],
            priority="media",
        )

    prompt = ANALYZE_PROMPT_TEMPLATE.format(compressed=compressed)
    metrics.compressed_chars = len(prompt)

    metrics.estimated_tokens_saved = estimate_tokens(raw_chars) - estimate_tokens(len(prompt))
    if metrics.estimated_tokens_saved < 0:
        metrics.estimated_tokens_saved = 0

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
                params={"key": settings.gemini_api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 300,
                        "topP": 0.9,
                    },
                },
            )
            data = resp.json()
            if resp.status_code != 200:
                error_msg = data.get("error", {}).get("message", "Unknown error")
                logger.warning("Gemini API error: %s", error_msg)
                metrics.processing_time_ms = end_timer(timer_start)
                metrics_collector.record(metrics)
                return AnalyzeResponse(
                    summary=f"Error: {error_msg}",
                    action_items=[],
                    deadlines=[],
                    priority="media",
                )

            text = data["candidates"][0]["content"]["parts"][0]["text"]
            result = _parse_gemini_response(text)
            if not result:
                logger.warning("Failed to parse Gemini response: %.100s", text)
                metrics.processing_time_ms = end_timer(timer_start)
                metrics_collector.record(metrics)
                return AnalyzeResponse(
                    summary="No se pudo interpretar la respuesta",
                    action_items=[],
                    deadlines=[],
                    priority="media",
                )

            response = AnalyzeResponse(**result)
            analysis_cache.set(sender, subject, body_text, response)

            metrics.processing_time_ms = end_timer(timer_start)
            metrics_collector.record(metrics)
            logger.debug(metrics.summary())
            return response

    except Exception as e:
        logger.error("AI analysis failed: %s", e)
        metrics.processing_time_ms = end_timer(timer_start)
        metrics_collector.record(metrics)
        return AnalyzeResponse(
            summary=f"Error de análisis: {str(e)[:100]}",
            action_items=[],
            deadlines=[],
            priority="media",
        )
