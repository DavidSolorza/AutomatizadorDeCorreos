"""Deep HTML cleaning — tracking pixels, Google wrappers, duplicates, invisible content."""

import re
from typing import Set

from bs4 import BeautifulSoup, Tag

TRACKING_PATTERNS: Set[str] = {
    "mail.google.com",
    "google.com/analytics",
    "googleadservices",
    "doubleclick",
    "facebook.com/tr",
    "pixel",
    "open?",
    "track",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "mc_tracking",
    "list-manage.com/track",
}

TAG_BLACKLIST = {
    "script", "style", "noscript", "iframe", "object", "embed",
    "meta", "link", "head", "svg", "canvas", "form", "input",
    "button", "select", "textarea",
}

CLASS_BLACKLIST_PATTERNS = [
    re.compile(r"(gmail|google)_(signature|extra|quote|footer|reply)", re.I),
    re.compile(r"(moz|yahoo|outlook)_(signature|extra|quote)", re.I),
    re.compile(r"ms-outlook", re.I),
    re.compile(r"ydp57", re.I),
    re.compile(r"ad(vertisement)?", re.I),
    re.compile(r"newsletter", re.I),
    re.compile(r"footer", re.I),
    re.compile(r"signature", re.I),
    re.compile(r"disclaimer", re.I),
    re.compile(r"unsubscribe", re.I),
]

ID_BLACKLIST_PATTERNS = [
    re.compile(r"gmail", re.I),
    re.compile(r"signature", re.I),
    re.compile(r"footer", re.I),
    re.compile(r"disclaimer", re.I),
]


def _is_tracking_url(url: str) -> bool:
    url_lower = url.lower()
    return any(p in url_lower for p in TRACKING_PATTERNS)


def _remove_tracking_links(soup: BeautifulSoup) -> None:
    for a in soup.find_all("a", href=True):
        if _is_tracking_url(a["href"]):
            a.decompose()
    for img in soup.find_all("img", src=True):
        if _is_tracking_url(img["src"]):
            img.decompose()


def _remove_invisible_elements(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(True):
        style = tag.get("style", "")
        if isinstance(style, str):
            if re.search(r'display\s*:\s*none', style, re.I):
                tag.decompose()
                continue
            if re.search(r'visibility\s*:\s*hidden', style, re.I):
                tag.decompose()
                continue
            if re.search(r'font-size\s*:\s*0', style, re.I):
                tag.decompose()
                continue
        if tag.name == "img" and tag.get("height") in ("0", "1") and tag.get("width") in ("0", "1"):
            tag.decompose()


def _strip_inline_styles(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(True):
        if tag.has_attr("style"):
            del tag["style"]


def _remove_empty_elements(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(True):
        if tag.name in {"a", "span", "div", "p", "strong", "b", "em", "i", "u"}:
            text = tag.get_text(strip=True)
            if not text and not tag.find_all(["img", "br", "hr"]):
                tag.decompose()


def clean_html(html: str) -> str:
    if not html or not html.strip():
        return ""

    soup = BeautifulSoup(html, "lxml")

    for tag_name in TAG_BLACKLIST:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    _remove_tracking_links(soup)
    _remove_invisible_elements(soup)
    _strip_inline_styles(soup)

    for tag in soup.find_all(True):
        for cls_name in list(tag.get("class", [])):
            if any(p.search(cls_name) for p in CLASS_BLACKLIST_PATTERNS):
                tag.decompose()
                break
        else:
            tag_id = tag.get("id", "")
            if tag_id and any(p.search(tag_id) for p in ID_BLACKLIST_PATTERNS):
                tag.decompose()

    _remove_empty_elements(soup)

    return str(soup)
