from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TokenMetrics:
    raw_chars: int = 0
    cleaned_chars: int = 0
    compressed_chars: int = 0
    estimated_tokens_saved: int = 0
    processing_time_ms: float = 0.0
    had_html: bool = False
    skipped_ai: bool = False
    cache_hit: bool = False

    @property
    def compression_ratio(self) -> float:
        if self.raw_chars == 0:
            return 0.0
        return round((1 - self.compressed_chars / self.raw_chars) * 100, 1)

    @property
    def tokens_saved_pct(self) -> str:
        return f"{self.compression_ratio}%"

    def summary(self) -> str:
        return (
            f"Raw: {self.raw_chars}ch → Cleaned: {self.cleaned_chars}ch → "
            f"Compressed: {self.compressed_chars}ch | "
            f"Saved: ~{self.estimated_tokens_saved} tokens ({self.tokens_saved_pct}) | "
            f"Time: {self.processing_time_ms:.1f}ms | "
            f"AI: {'skipped' if self.skipped_ai else 'used'}{' (cache)' if self.cache_hit else ''}"
        )


class TokenMetricsCollector:
    _instance: TokenMetricsCollector | None = None
    _metrics: list[TokenMetrics]

    def __new__(cls) -> TokenMetricsCollector:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._metrics = []
        return cls._instance

    def record(self, m: TokenMetrics) -> None:
        self._metrics.append(m)

    def total_saved(self) -> int:
        return sum(m.estimated_tokens_saved for m in self._metrics)

    def total_processed(self) -> int:
        return len(self._metrics)

    def ai_calls_saved(self) -> int:
        return sum(1 for m in self._metrics if m.skipped_ai)

    def cache_hits(self) -> int:
        return sum(1 for m in self._metrics if m.cache_hit)

    def avg_compression(self) -> float:
        if not self._metrics:
            return 0.0
        ratios = [m.compression_ratio for m in self._metrics if m.raw_chars > 0]
        return round(sum(ratios) / len(ratios), 1) if ratios else 0.0

    def report(self) -> str:
        return (
            f"[Pipeline Metrics] "
            f"Processed: {self.total_processed()} | "
            f"Tokens saved: ~{self.total_saved()} | "
            f"AI calls avoided: {self.ai_calls_saved()} | "
            f"Cache hits: {self.cache_hits()} | "
            f"Avg compression: {self.avg_compression()}%"
        )

    def reset(self) -> None:
        self._metrics.clear()


metrics_collector = TokenMetricsCollector()


def estimate_tokens(text: str) -> int:
    return len(text) // 4


def start_timer() -> float:
    return time.time()


def end_timer(start: float) -> float:
    return (time.time() - start) * 1000
