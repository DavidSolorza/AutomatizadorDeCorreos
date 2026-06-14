"""Intelligent HTML-to-text extraction — keep only meaningful content."""

import re
from typing import List, Optional

from bs4 import BeautifulSoup, Tag

IMPORTANT_TAGS = {"h1", "h2", "h3", "h4", "strong", "b", "th", "dt"}

MAX_LINE_LENGTH = 200
MAX_LINES = 80
MAX_TOTAL_CHARS = 6000


def _extract_from_soup(soup: BeautifulSoup) -> List[str]:
    lines: List[str] = []

    def process_node(node, depth: int = 0) -> None:
        if depth > 10:
            return
        if isinstance(node, Tag):
            tag = node.name
            text = node.get_text(separator=" ", strip=True)

            if tag in {"br", "hr"}:
                if lines and lines[-1] != "":
                    lines.append("")
                return

            if tag in {"table", "tr", "td", "th", "thead", "tbody", "ul", "ol", "li"}:
                children = [c for c in node.children if isinstance(c, Tag) or (isinstance(c, str) and c.strip())]
                if len(children) <= 3 and tag in {"td", "th", "li", "p"}:
                    if text and len(text) < MAX_LINE_LENGTH:
                        prefix = "  " * depth if tag == "li" else ""
                        lines.append(f"{prefix}{text}")
                        return
                for child in node.children:
                    process_node(child, depth + 1)
                return

            if tag in {"div", "span", "a", "blockquote", "pre", "code"}:
                if text and len(text) < MAX_LINE_LENGTH:
                    lines.append(text)
                    return
                for child in node.children:
                    process_node(child, depth + 1)
                return

            if tag in {"p", "h1", "h2", "h3", "h4", "h5", "h6"}:
                if text:
                    lines.append(text)
                return

            for child in node.children:
                process_node(child, depth + 1)
        elif isinstance(node, str):
            text = node.strip()
            if text and len(text) > 2:
                lines.append(text)

    process_node(soup)
    return lines


def _deduplicate_lines(lines: List[str]) -> List[str]:
    seen: set = set()
    result: List[str] = []
    for line in lines:
        key = line.strip().lower()
        if key and key not in seen:
            seen.add(key)
            result.append(line)
        elif not key:
            result.append(line)
    return result


def _remove_repeated_phrases(lines: List[str]) -> List[str]:
    """Remove sequential repeat blocks (common in forwarded/replied emails)."""
    if len(lines) < 4:
        return lines
    result = lines[:1]
    for i in range(1, len(lines)):
        current = lines[i].strip().lower()
        prev = lines[i - 1].strip().lower()
        if current == prev and current:
            continue
        result.append(lines[i])
    return result


def extract_important_text(soup: BeautifulSoup) -> str:
    lines = _extract_from_soup(soup)

    lines = [l for l in lines if len(l) > 1]

    lines = _deduplicate_lines(lines)

    lines = _remove_repeated_phrases(lines)

    lines = [l[:MAX_LINE_LENGTH] for l in lines]

    lines = lines[:MAX_LINES]

    text = "\n".join(lines)

    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)

    if len(text) > MAX_TOTAL_CHARS:
        text = text[:MAX_TOTAL_CHARS]
        last_newline = text.rfind("\n")
        if last_newline > MAX_TOTAL_CHARS * 0.8:
            text = text[:last_newline]

    return text.strip()


def extract_from_html(html: str) -> str:
    if not html or not html.strip():
        return ""
    soup = BeautifulSoup(html, "lxml")
    return extract_important_text(soup)


def extract_from_plain(plain: str) -> str:
    if not plain or not plain.strip():
        return ""
    lines = plain.split("\n")
    lines = [l.strip() for l in lines if l.strip() and len(l.strip()) > 1]
    lines = lines[:MAX_LINES]
    text = "\n".join(lines)
    return text[:MAX_TOTAL_CHARS].strip()
