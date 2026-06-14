"""HTML sanitization — strip scripts, styles, event handlers, XSS vectors, base64 images."""

import re
from typing import Optional

import bleach


ALLOWED_TAGS = {
    "p", "br", "div", "span", "strong", "b", "em", "i", "u", "s",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "thead", "tbody", "tr", "th", "td",
    "a", "img",
    "blockquote", "pre", "code", "hr",
    "abbr", "cite", "sub", "sup",
}

ALLOWED_ATTRS = {
    "a": ["href", "title", "rel"],
    "img": ["src", "alt", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
    "*": ["id"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize_html(raw_html: str) -> str:
    if not raw_html or not raw_html.strip():
        return ""

    cleaned = bleach.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )

    cleaned = re.sub(
        r'<[^>]*?\b(on\w+|style|class|data-\w+|role|aria-\w+)\s*=[^>]*>',
        lambda m: re.sub(r'\b(on\w+|style|class|data-\w+|role|aria-\w+)\s*=[\'"][^\'"]*[\'"]\s*', '', m.group(0)),
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(r'<img[^>]*?src\s*=\s*["\']data:image/[^"\']*["\'][^>]*?>', '', cleaned, flags=re.IGNORECASE)

    return cleaned


def sanitize_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'<[^>]*>', '', text)
    text = bleach.clean(text, tags=set(), strip=True)
    return text.strip()
