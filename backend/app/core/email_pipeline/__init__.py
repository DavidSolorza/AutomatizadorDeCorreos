"""
Email Content Optimization Pipeline.
...
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.email_pipeline.classifier import ClassificationResult, classify_email
from app.core.email_pipeline.cleaner import clean_html
from app.core.email_pipeline.compressor import compress_context
from app.core.email_pipeline.detector import strip_noise_lines
from app.core.email_pipeline.extractor import extract_from_html, extract_from_plain
from app.core.email_pipeline.metrics import (
    TokenMetrics,
    end_timer,
    metrics_collector,
    start_timer,
)
from app.core.email_pipeline.sanitizer import sanitize_html

logger = logging.getLogger(__name__)


@dataclass
class ProcessedEmail:
    text: str = ""
    classification: ClassificationResult = field(default_factory=ClassificationResult)
    analysis: Any = None
    metrics: TokenMetrics = field(default_factory=TokenMetrics)


async def process_email(
    sender: str = "",
    subject: str = "",
    body_html: Optional[str] = None,
    body_plain: Optional[str] = None,
    force_ai: bool = False,
    skip_cache: bool = False,
) -> ProcessedEmail:
    from app.modules.emails.schemas import AnalyzeResponse

    timer = start_timer()
    result = ProcessedEmail()
    result.analysis = AnalyzeResponse(summary="", action_items=[], deadlines=[], priority="media")
    metrics = result.metrics
    raw_total_chars = len(subject or "") + len(sender or "")

    raw_html = (body_html or "").strip()
    raw_plain = (body_plain or "").strip()
    raw_total_chars += len(raw_html) + len(raw_plain)
    metrics.raw_chars = raw_total_chars

    has_html = bool(raw_html) and "<" in raw_html and ">" in raw_html
    metrics.had_html = has_html

    body_text = ""

    if has_html:
        sanitized = sanitize_html(raw_html)
        cleaned = clean_html(sanitized)
        body_text = extract_from_html(cleaned)
        logger.debug(
            "HTML pipeline: raw=%d → cleaned=%d chars",
            len(raw_html), len(body_text),
        )
    elif raw_plain:
        body_text = extract_from_plain(raw_plain)
        logger.debug(
            "Plain text pipeline: raw=%d → cleaned=%d chars",
            len(raw_plain), len(body_text),
        )

    metrics.cleaned_chars = len(body_text)

    classification = classify_email(subject, body_text)
    result.classification = classification

    compressed = compress_context(sender, subject, body_text)
    metrics.compressed_chars = len(compressed)
    result.text = compressed

    metrics.estimated_tokens_saved = max(0, (raw_total_chars - len(compressed)) // 4)

    should_run_ai = force_ai or classification.requires_ai

    if should_run_ai:
        from app.core.email_pipeline.ai_service import analyze_with_ai, analysis_cache

        result.analysis = await analyze_with_ai(
            sender=sender,
            subject=subject,
            body_text=compressed,
            skip_cache=skip_cache,
        )
    else:
        metrics.skipped_ai = True
        result.analysis = AnalyzeResponse(
            summary=classification.category.replace("_", " ").title(),
            action_items=[f"{kw} detectado" for kw in classification.detected_keywords[:3]],
            deadlines=[] if not classification.has_deadline else ["Revisar correo para fechas"],
            priority=classification.priority,
        )

    metrics.processing_time_ms = end_timer(timer)
    metrics_collector.record(metrics)

    logger.debug("Pipeline: %s", metrics.summary())
    return result


async def get_pipeline_stats() -> dict:
    return {
        "total_processed": metrics_collector.total_processed(),
        "total_tokens_saved": metrics_collector.total_saved(),
        "ai_calls_avoided": metrics_collector.ai_calls_saved(),
        "cache_hits": metrics_collector.cache_hits(),
        "avg_compression_pct": metrics_collector.avg_compression(),
    }
