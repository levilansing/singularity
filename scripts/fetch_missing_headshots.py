#!/usr/bin/env python3
"""
Load data/predictions-v2.csv; for each unique predictor, if no matching headshot
exists in public/headshots/ and no staged images exist in scripts/headshots_staging/,
search the web for up to 10 headshot/logo candidates and download them into
scripts/headshots_staging/ as {predictor_slug}-{n}.jpg.

Uses Serper (serper.dev) image search. Set SERPER_API_KEY in your environment.
"""

from __future__ import annotations

import csv
import os
import random
import re
import time
from pathlib import Path

import httpx

SERPER_IMAGES_URL = "https://google.serper.dev/images"

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
CSV_PATH = REPO_ROOT / "data" / "predictions-v2.csv"
HEADSHOTS_DIR = REPO_ROOT / "public" / "headshots"
STAGING_DIR = SCRIPT_DIR / "headshots_staging"
NUM_CANDIDATES = 10
REQUEST_DELAY_MIN = 0.5  # seconds between Serper requests (polite)
REQUEST_DELAY_MAX = 1.5


def slug(name: str) -> str:
    """Same as convert-csv.ts: lowercase, non-alphanumeric -> underscore, strip _."""
    s = (name or "").lower()
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s or "unknown"


def get_unique_predictors(csv_path: Path) -> list[tuple[str, str]]:
    """(predictor_name, predictor_type) for each unique predictor (first occurrence)."""
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("predictor_name") or "").strip()
            ptype = (row.get("predictor_type") or "").strip()
            if not name or name in seen:
                continue
            seen.add(name)
            out.append((name, ptype))
    return out


def has_headshot(headshots_dir: Path, predictor_slug: str) -> bool:
    """True if headshots_dir/{slug}.jpg exists."""
    return (headshots_dir / f"{predictor_slug}.jpg").exists()


def has_staging_images(staging_dir: Path, predictor_slug: str) -> bool:
    """True if staging_dir has any {predictor_slug}-*.jpg (already staged)."""
    if not staging_dir.exists():
        return False
    return any(staging_dir.glob(f"{predictor_slug}-*.jpg"))


def search_image_urls(
    query: str,
    api_key: str,
    client: httpx.Client,
    max_results: int = NUM_CANDIDATES,
) -> list[str]:
    """Search Serper for images. Returns list of image URLs (up to max_results)."""
    urls: list[str] = []
    try:
        r = client.post(
            SERPER_IMAGES_URL,
            json={"q": query, "num": max_results},
            headers={
                "x-api-key": api_key,
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        for item in (data.get("images") or data.get("imageResults") or [])[:max_results]:
            url = (
                (
                    item.get("imageUrl")
                    or item.get("original_image_url")
                    or item.get("image")
                    or item.get("link")
                    or item.get("original")
                )
                or ""
            ).strip()
            if url and url not in urls:
                urls.append(url)
    except Exception as e:
        print(f"    search error: {e}")
    return urls[:max_results]


def build_query(name: str, predictor_type: str) -> str:
    """Search query: person name for Individual, else name + logo."""
    if (predictor_type or "").strip().lower() == "individual":
        return name
    return f"{name} {predictor_type}"


def download_image(client: httpx.Client, url: str, dest: Path) -> bool:
    """Download url to dest as JPEG; return True on success."""
    try:
        r = client.get(url, follow_redirects=True, timeout=20)
        r.raise_for_status()
        content = r.content
        ct = (r.headers.get("content-type") or "").split(";")[0].strip().lower()
        if not (ct.startswith("image/") or len(content) > 100):
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        # Normalize to .jpg: write bytes as-is if already jpeg, else try to convert
        if "jpeg" in ct or "jpg" in ct or url.lower().split("?")[0].endswith((".jpg", ".jpeg")):
            dest.write_bytes(content)
            return True
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(content))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(dest, "JPEG", quality=90)
            return True
        except Exception:
            dest.write_bytes(content)
            return True
    except Exception:
        return False


def main() -> None:
    api_key = os.environ.get("SERPER_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Set SERPER_API_KEY in your environment (get one at https://serper.dev/api-key)")

    if not CSV_PATH.exists():
        raise SystemExit(f"CSV not found: {CSV_PATH}")

    HEADSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    STAGING_DIR.mkdir(parents=True, exist_ok=True)

    predictors = get_unique_predictors(CSV_PATH)
    missing = []
    for name, ptype in predictors:
        s = slug(name)
        if has_headshot(HEADSHOTS_DIR, s):
            continue
        if has_staging_images(STAGING_DIR, s):
            continue
        missing.append((name, ptype, s))

    if not missing:
        print("All predictors have a headshot or staged candidates. Nothing to do.")
        return

    print(f"Found {len(predictors)} unique predictors; {len(missing)} need search (no headshot, no staging).")
    print(f"Staging dir: {STAGING_DIR}")
    print(f"Fetching up to {NUM_CANDIDATES} candidates per predictor (Serper).\n")

    with httpx.Client(follow_redirects=True, timeout=30) as client:
        for name, ptype, predictor_slug in missing:
            if ptype == "Survey":
                print(f"Skipping survey: {name} ({ptype})")
                continue
            query = build_query(name, ptype)
            print(f"{name} ({ptype}) -> “{query}”")

            time.sleep(random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX))

            urls = search_image_urls(query, api_key, client, max_results=NUM_CANDIDATES)
            if not urls:
                print("  -> no image results")
                continue
            for n, url in enumerate(urls, start=1):
                dest = STAGING_DIR / f"{predictor_slug}-{n}.jpg"
                if download_image(client, url, dest):
                    print(f"  -> {dest.name}")
                else:
                    print(f"  -> skip #{n}")

    print(f"\nDone. Staged files in {STAGING_DIR}")


if __name__ == "__main__":
    main()
