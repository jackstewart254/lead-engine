"""
Headless browser crawl using Playwright.
Spawned by Node.js worker as: python3 crawl.py <url>
Outputs JSON to stdout matching the CrawlResult interface.
"""

import json
import re
import sys
from html import unescape
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

SEED_PATHS = [
    "/about",
    "/about-us",
    "/about-me",
    "/contact",
    "/contact-us",
    "/team",
    "/our-team",
    "/the-team",
    "/meet-the-team",
    "/meet-our-team",
    "/staff",
    "/our-staff",
    "/people",
    "/our-people",
    "/leadership",
    "/management",
    "/who-we-are",
    "/partners",
]

TEAM_PAGE_KEYWORDS = re.compile(
    r"\b(team|staff|about|people|who[\s-]we[\s-]are|meet|leadership|management|partners|directors)\b",
    re.IGNORECASE,
)

MAX_DISCOVERED_LINKS = 5
PAGE_TIMEOUT_MS = 15_000

BLOCK_TAGS = ["script", "style", "noscript", "svg", "iframe", "nav", "footer", "header"]

CHAR_LIMITS = {
    "homepage": 4000,
    "team": 8000,
    "about": 2000,
    "contact": 2000,
    "other": 2000,
}


def classify_page(path: str) -> str:
    p = path.lower()
    if p == "/":
        return "homepage"
    if re.search(r"team|staff|people|meet|leadership|management|partners|directors", p):
        return "team"
    if re.search(r"about|who[\s\-]?we", p):
        return "about"
    if re.search(r"contact", p):
        return "contact"
    return "other"


def html_to_text(html: str, max_chars: int) -> str:
    text = html
    for tag in BLOCK_TAGS:
        text = re.sub(rf"<{tag}[^>]*>[\s\S]*?</{tag}>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    text = re.sub(r"<(?:br|/p|/div|/li|/tr|/h[1-6])[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n\s*\n", "\n\n", text)
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(line for line in lines if line)
    if len(text) > max_chars:
        text = text[:max_chars] + "\n[truncated]"
    return text


def normalize_base_url(website: str) -> str:
    url = website.strip()
    if not url.startswith("http"):
        url = f"https://{url}"
    return url.rstrip("/")


def discover_team_links(html: str, base_url: str) -> list[str]:
    discovered: list[str] = []
    seen = {p.lower() for p in SEED_PATHS}
    seen.add("/")

    base_host = urlparse(base_url).hostname

    for match in re.finditer(r'<a\s[^>]*href=["\']([^"\'#]+)["\'][^>]*>([\s\S]*?)</a>', html, re.IGNORECASE):
        if len(discovered) >= MAX_DISCOVERED_LINKS:
            break

        href = match.group(1).strip()
        anchor_text = re.sub(r"<[^>]+>", "", match.group(2)).strip()

        if href.startswith("/"):
            pathname = href
        elif href.startswith("http"):
            parsed = urlparse(href)
            if parsed.hostname != base_host:
                continue
            pathname = parsed.path
        else:
            continue

        pathname = pathname.rstrip("/") or "/"
        if pathname.lower() in seen:
            continue

        if TEAM_PAGE_KEYWORDS.search(pathname) or TEAM_PAGE_KEYWORDS.search(anchor_text):
            seen.add(pathname.lower())
            discovered.append(pathname)

    return discovered


def fetch_page(page, url: str) -> str | None:
    try:
        response = page.goto(url, wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
        if response is None or response.status >= 400:
            return None
        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            return None
        # Wait a bit for JS to render
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except PwTimeout:
            pass  # proceed with whatever rendered
        return page.content()
    except (PwTimeout, Exception):
        return None


def crawl(url: str) -> dict | None:
    base = normalize_base_url(url)
    pages = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (compatible; LeadEngine/1.0; +https://mcleanstewart.co.uk)"
        )
        page = context.new_page()

        # Fetch homepage
        homepage_html = fetch_page(page, base)
        if not homepage_html:
            browser.close()
            return None

        homepage_text = html_to_text(homepage_html, CHAR_LIMITS["homepage"])
        pages.append({
            "path": "/",
            "html": homepage_html,
            "text": homepage_text,
            "type": "homepage",
        })

        # Discover additional team links from homepage
        discovered_paths = discover_team_links(homepage_html, base)
        all_sub_paths = list(dict.fromkeys(SEED_PATHS + discovered_paths))  # dedupe, preserve order

        for sub_path in all_sub_paths:
            sub_url = f"{base}{sub_path}"
            html = fetch_page(page, sub_url)
            if not html:
                continue
            page_type = classify_page(sub_path)
            limit = CHAR_LIMITS.get(page_type, 2000)
            text = html_to_text(html, limit)
            if len(text) < 50:
                continue
            pages.append({
                "path": sub_path,
                "html": html,
                "text": text,
                "type": page_type,
            })

        browser.close()

    sections = [f"[{pg['path']}]\n{pg['text']}" for pg in pages]
    combined = "\n\n".join(sections)

    return {
        "url": base,
        "text": combined,
        "pages": pages,
        "pagesCrawled": len(pages),
        "totalChars": len(combined),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps(None))
        sys.exit(1)

    target_url = sys.argv[1]
    result = crawl(target_url)
    print(json.dumps(result))
