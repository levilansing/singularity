#!/usr/bin/env python3
"""
Use LangSearch Web Search API to find headshot/logo URLs for each predictor
in data/predictions.csv. Downloads up to 5 result URLs per predictor as
{name}_{num}.{ext} into headshots/downloaded. For non-image URLs, fetches the
page and extracts the best image (og:image or main img), then runs
process_headshots.py on that folder (--skip-download).
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import httpx

# Config from env (required)
LANGSEARCH_API_KEY = os.environ.get("LANGSEARCH_API_KEY")
BREAK_EARLY = os.environ.get("BREAK_EARLY", "1").strip().lower() in ("1", "true", "yes")

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
CSV_PATH = REPO_ROOT / "data" / "predictions.csv"
HEADSHOTS_BASE = SCRIPT_DIR / "headshots"
DOWNLOADED_DIR = HEADSHOTS_BASE / "downloaded"
LOGS_DIR = REPO_ROOT / "logs"
SEARCH_CACHE_DIR = LOGS_DIR / "search"
API_URL = "https://api.langsearch.com/v1/web-search"
NUM_RESULTS = 15
MIN_IMAGE_BYTES = 0  # accept any image when extracting from HTML (set higher to skip tiny icons)
EXCLUDED_DOMAINS = ("alamy.com",)  # search result URLs containing these are skipped


def slug(s: str) -> str:
    """Safe filename segment from name."""
    return re.sub(r"[^\w\-]", "_", s.strip()).strip("_") or "unknown"


def get_unique_predictors(csv_path: Path) -> list[tuple[str, str]]:
    """Yield (predictor_name, predictor_type) for each unique predictor (first occurrence)."""
    seen: set[str] = set()
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("predictor_name") or "").strip()
            ptype = (row.get("predictor_type") or "").strip()
            if not name or name in seen:
                continue
            seen.add(name)
            yield (name, ptype)


def build_query(name: str, predictor_type: str) -> str:
    if predictor_type == "Individual":
        return f"{name}"
    return f"{name} logo"


def _query_hash(query: str) -> str:
    """Stable hash of the search query for cache filenames."""
    return hashlib.sha256(query.strip().encode("utf-8")).hexdigest()


def _is_excluded_url(url: str) -> bool:
    """True if URL should be excluded from search results (e.g. paywall/stock sites)."""
    lower = url.lower()
    return any(domain in lower for domain in EXCLUDED_DOMAINS)


def _urls_from_response(data: dict, count: int) -> list[str]:
    """Extract result URLs from LangSearch API response (same structure as cache)."""
    urls: list[str] = []
    res = data.get("data") or data
    web_pages = (res.get("webPages") or {}).get("value") or []
    for item in web_pages:
        url = (item.get("url") or "").strip()
        if url and not _is_excluded_url(url):
            urls.append(url)
    images = (res.get("images") or {}).get("value") or []
    for item in images:
        url = (item.get("contentUrl") or item.get("url") or "").strip()
        if url and url not in urls and not _is_excluded_url(url):
            urls.insert(0, url)
    return urls[:count]


def search_urls(query: str, api_key: str, count: int = NUM_RESULTS) -> tuple[list[str], dict]:
    """Call LangSearch API or load cached result; return (url list, raw response)."""
    SEARCH_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    h = _query_hash(query)
    cache_path = SEARCH_CACHE_DIR / f"{h}.json"

    if cache_path.exists():
        try:
            data = json.loads(cache_path.read_text(encoding="utf-8"))
            urls = _urls_from_response(data, count)
            print("  (using cached search result)")
            return urls, data
        except (json.JSONDecodeError, KeyError):
            pass

    payload = {"query": query, "count": min(count, 10), "freshness": "noLimit"}
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=15) as client:
        r = client.post(API_URL, json=payload, headers=headers)
        if r.status_code != 200:
            raise RuntimeError(f"LangSearch API {r.status_code}: {r.text}")
        data = r.json()

    cache_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    urls = _urls_from_response(data, count)
    return urls, data


def extract_image_urls_from_html(html: str, base_url: str) -> list[str]:
    """Parse HTML and return candidate image URLs in preference order: og:image first, then img src."""
    candidates: list[str] = []
    base = base_url.strip()

    # og:image (often the main share image)
    for m in re.finditer(
        r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.I,
    ):
        candidates.append(urljoin(base, m.group(1).strip()))
    if not candidates:
        for m in re.finditer(
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']',
            html,
            re.I,
        ):
            candidates.append(urljoin(base, m.group(1).strip()))

    # img src (skip data: and very small-looking paths like icons)
    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I):
        src = m.group(1).strip()
        if src.startswith("data:"):
            continue
        full = urljoin(base, src)
        if full not in candidates:
            candidates.append(full)
    return candidates


def ext_from_url(url: str, content_type: str | None = None) -> str:
    """Infer image extension from URL or Content-Type; default .jpg."""
    if content_type:
        ct = content_type.split(";")[0].strip().lower()
        if "jpeg" in ct or "jpg" in ct:
            return ".jpg"
        if "png" in ct:
            return ".png"
        if "webp" in ct:
            return ".webp"
        if "gif" in ct:
            return ".gif"
    path = url.split("?")[0]
    suf = Path(path).suffix.lower()
    if suf in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        return suf if suf != ".jpeg" else ".jpg"
    return ".jpg"


def download_image(client: httpx.Client, url: str, dest: Path) -> bool:
    """Download url to dest. If url is HTML, fetch page and download best image from it."""
    try:
        r = client.get(url, follow_redirects=True, timeout=30)
        r.raise_for_status()
        ct = (r.headers.get("content-type") or "").split(";")[0].strip().lower()
        if ct.startswith("image/"):
            ext = ext_from_url(url, r.headers.get("content-type"))
            out = dest.parent / (dest.stem + ext)
            out.write_bytes(r.content)
            if out != dest and dest.exists():
                dest.unlink()
            return True
        if "text/html" not in ct:
            return False
        # Page is HTML: extract image URLs and try each
        try:
            text = r.text
        except Exception:
            return False
        candidates = extract_image_urls_from_html(text, url)
        for img_url in candidates:
            try:
                ir = client.get(img_url, follow_redirects=True, timeout=30)
                ir.raise_for_status()
                ict = (ir.headers.get("content-type") or "").split(";")[0].strip().lower()
                if not ict.startswith("image/"):
                    continue
                if len(ir.content) < MIN_IMAGE_BYTES:
                    continue
                ext = ext_from_url(img_url, ir.headers.get("content-type"))
                out = dest.parent / (dest.stem + ext)
                out.write_bytes(ir.content)
                if out != dest and dest.exists():
                    dest.unlink()
                return True
            except Exception:
                continue
        return False
    except Exception:
        return False


def main() -> None:
    if not LANGSEARCH_API_KEY:
        print(
            "Set LANGSEARCH_API_KEY. Get a free key at https://langsearch.com/api-keys",
            file=sys.stderr,
        )
        sys.exit(1)

    if not CSV_PATH.exists():
        print(f"CSV not found: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    DOWNLOADED_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    predictors = list(get_unique_predictors(CSV_PATH))
    print(f"Found {len(predictors)} unique predictors. Break early: {BREAK_EARLY}")
    print(f"Downloading up to {NUM_RESULTS} image results per predictor into {DOWNLOADED_DIR}")
    api_log_entries: list[dict] = []

    with httpx.Client(follow_redirects=True, timeout=30) as client:
        for name, ptype in predictors:
            query = build_query(name, ptype)
            print(f"\n{name} ({ptype}) -> {query}")
            try:
                urls, raw_response = search_urls(query, LANGSEARCH_API_KEY)
                api_log_entries.append({"query": query, "name": name, "type": ptype, "response": raw_response})
            except Exception as e:
                print(f"  search error: {e}")
                api_log_entries.append({"query": query, "name": name, "type": ptype, "error": str(e)})
                if BREAK_EARLY:
                    break
                continue

            if not urls:
                print("  -> no results")
                if BREAK_EARLY:
                    break
                continue

            name_slug = slug(name)
            for i, url in enumerate(urls, start=1):
                ext = ext_from_url(url)
                dest = DOWNLOADED_DIR / f"{name_slug}_{i}{ext}"
                if download_image(client, url, dest):
                    print(f"  -> {dest.name}")
                else:
                    print(f"  -> skip {url[:100]}...")

            if BREAK_EARLY:
                break

    # Write API results log
    log_path = LOGS_DIR / f"langsearch_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    log_path.write_text(json.dumps(api_log_entries, indent=2), encoding="utf-8")
    print(f"\nAPI results logged to {log_path}")

    # Run process_headshots.py on downloaded folder
    process_script = SCRIPT_DIR / "process_headshots.py"
    if not process_script.exists():
        print(f"Processor not found: {process_script}", file=sys.stderr)
        sys.exit(1)
    print(f"\nRunning process_headshots.py --skip-download -o {HEADSHOTS_BASE} ...")
    subprocess.run(
        [sys.executable, str(process_script), "--skip-download", "-o", str(HEADSHOTS_BASE)],
        cwd=SCRIPT_DIR.parent,
        check=True,
    )


if __name__ == "__main__":
    main()
