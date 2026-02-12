#!/usr/bin/env python3
"""
Download images from a CSV source, detect faces, crop to consistent 300×300 headshots
(head + bust, circle-friendly), and normalize style (brightness/color) across all images.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

import cv2
import httpx
import numpy as np
import pandas as pd
from PIL import Image, ImageEnhance, ImageFilter

# Target headshot size (fits nicely in a circle; head + part of bust)
TARGET_SIZE = 300
# Face height in crop as fraction of TARGET_SIZE for "ideal" headshot
IDEAL_FACE_FRAC_MIN = 0.22  # face too small → "too far"
IDEAL_FACE_FRAC_MAX = 0.45  # face too large → "too close"
# Head+bust crop: expand face box to include head and shoulders
# (scale from face center; face sits in upper ~40% of crop)
CROP_FACE_SCALE = 2.6  # crop side = face_height * this
FACE_OFFSET_UP = 0.35   # crop top: face center - (crop_height * this)
FACE_OFFSET_DOWN = 0.65  # crop bottom: face center + (crop_height * (1 - FACE_OFFSET_UP))


def slug(s: str) -> str:
    """Safe filename from id/name."""
    return re.sub(r"[^\w\-]", "_", s.strip()).strip("_") or "unknown"


def download_images(csv_path: Path, out_dir: Path, url_column: str = "image_url", id_column: str = "id") -> list[dict]:
    """Download each image from CSV into out_dir, named by id. Returns list of {id, path}. Deduplicates by id (first row wins)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(csv_path)
    if url_column not in df.columns or id_column not in df.columns:
        raise SystemExit(f"CSV must have columns: {id_column}, {url_column}")
    # Deduplicate by id (e.g. predictor_name) so we download one image per person
    seen: set[str] = set()
    results = []
    with httpx.Client(follow_redirects=True, timeout=30) as client:
        for _, row in df.iterrows():
            uid = slug(str(row[id_column]))
            if uid in seen:
                continue
            url = str(row[url_column]).strip()
            if not url or url.lower() in ("nan", "none", ""):
                continue
            seen.add(uid)
            ext = Path(url).suffix or ".jpg"
            if "?" in ext:
                ext = ".jpg"
            path = out_dir / f"{uid}{ext}"
            try:
                r = client.get(url)
                r.raise_for_status()
                path.write_bytes(r.content)
                results.append({"id": uid, "path": str(path)})
                print(f"Downloaded: {path.name}")
            except Exception as e:
                print(f"Skip {uid}: {e}")
    return results


def _face_detector():
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    return cascade


def _best_face(face_rects: list[tuple[int, int, int, int]]) -> tuple[int, int, int, int] | None:
    """Pick largest face (likely main subject)."""
    if not face_rects:
        return None
    return max(face_rects, key=lambda r: r[2] * r[3])


def detect_face(image_path: Path, cascade) -> tuple[int, int, int, int] | None:
    """Return (x, y, w, h) of best face in image, or None."""
    img = cv2.imread(str(image_path))
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )
    return _best_face([(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces])


def compute_crop_region(
    img_shape: tuple[int, int],
    face: tuple[int, int, int, int],
) -> tuple[int, int, int, int]:
    """Compute (x1, y1, x2, y2) square crop for head+bust from face (x,y,w,h)."""
    h_img, w_img = img_shape[:2]
    fx, fy, fw, fh = face
    fcx = fx + fw / 2
    fcy = fy + fh / 2
    side = int(fh * CROP_FACE_SCALE)
    side = max(side, TARGET_SIZE // 2)
    # Center vertically: face in upper part (head), rest bust
    cy = fcy - side * (FACE_OFFSET_UP - 0.5)
    cx = fcx
    x1 = int(cx - side / 2)
    y1 = int(cy - side / 2)
    x2 = x1 + side
    y2 = y1 + side
    # Clamp to image
    x1 = max(0, min(x1, w_img - side))
    y1 = max(0, min(y1, h_img - side))
    x2 = min(w_img, x1 + side)
    y2 = min(h_img, y1 + side)
    # Ensure we have a square (trim to min dimension)
    w_crop = x2 - x1
    h_crop = y2 - y1
    if w_crop > h_crop:
        d = (w_crop - h_crop) // 2
        x1 += d
        x2 -= w_crop - h_crop - d
    elif h_crop > w_crop:
        d = (h_crop - w_crop) // 2
        y1 += d
        y2 -= h_crop - w_crop - d
    return (x1, y1, x2, y2)


def pass1_detect(
    downloaded: list[dict],
    cascade,
) -> list[dict]:
    """
    First pass: detect face in each image, compute crop region, flag scale issues.
    Returns list of {id, path, face, crop_rect, face_height_in_crop, status}.
    """
    records = []
    for item in downloaded:
        path = Path(item["path"])
        face = detect_face(path, cascade)
        if face is None:
            records.append({
                "id": item["id"],
                "path": str(path),
                "face": None,
                "crop_rect": None,
                "face_height_in_crop": None,
                "status": "no_face",
            })
            continue
        img = cv2.imread(str(path))
        crop_rect = compute_crop_region(img.shape, face)
        x1, y1, x2, y2 = crop_rect
        crop_side = min(x2 - x1, y2 - y1)
        # Face height in the crop (approx)
        face_in_crop_h = face[3]
        face_frac = face_in_crop_h / crop_side if crop_side else 0
        if face_frac < IDEAL_FACE_FRAC_MIN:
            status = "too_far"
        elif face_frac > IDEAL_FACE_FRAC_MAX:
            status = "too_close"
        else:
            status = "ok"
        records.append({
            "id": item["id"],
            "path": str(path),
            "face": list(face),
            "crop_rect": list(crop_rect),
            "face_height_in_crop": int(face_in_crop_h),
            "crop_side": crop_side,
            "face_frac": round(face_frac, 3),
            "status": status,
        })
    return records


def pass2_crop(
    records: list[dict],
    cropped_dir: Path,
) -> list[dict]:
    """Crop each image to 300×300 and save to cropped_dir. Adds out_path to each record."""
    cropped_dir.mkdir(parents=True, exist_ok=True)
    for rec in records:
        if rec.get("crop_rect") is None:
            continue
        path = Path(rec["path"])
        img = cv2.imread(str(path))
        if img is None:
            continue
        x1, y1, x2, y2 = rec["crop_rect"]
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        # Resize with antialiasing: BGR -> RGB, Pillow LANCZOS, then save
        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        pil_crop = Image.fromarray(crop_rgb)
        resized = pil_crop.resize(
            (TARGET_SIZE, TARGET_SIZE),
            resample=Image.LANCZOS,
            reducing_gap=3,
        )
        out_path = cropped_dir / f"{rec['id']}.jpg"
        resized.save(str(out_path), "JPEG", quality=92)
        rec["out_path"] = str(out_path)
    return records


def normalize_image(pil_img: Image.Image, ref_median_brightness: float | None = None) -> Image.Image:
    """
    Normalize brightness/color toward a consistent headshot style (auto-filter-like).
    Optional ref_median_brightness to match other images.
    """
    img = pil_img
    arr = np.array(img)
    brightness = float(np.median(arr))
    if ref_median_brightness is not None:
        ratio = ref_median_brightness / max(brightness, 1)
        ratio = max(0.7, min(1.3, ratio))
    else:
        target = 128
        ratio = target / max(brightness, 1)
        ratio = max(0.85, min(1.15, ratio))
    img = ImageEnhance.Brightness(img).enhance(ratio)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageEnhance.Color(img).enhance(1.02)
    img = img.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=2))
    return img


def pass3_normalize(cropped_dir: Path, records: list[dict]) -> None:
    """Overwrite cropped images with normalized versions (consistent brightness/color)."""
    paths = [Path(r["out_path"]) for r in records if r.get("out_path")]
    if not paths:
        return
    # First pass: compute reference median brightness from all cropped images
    brightnesses = []
    for p in paths:
        if not p.exists():
            continue
        img = Image.open(p).convert("RGB")
        arr = np.array(img)
        brightnesses.append(float(np.median(arr)))
    ref_median = float(np.median(brightnesses)) if brightnesses else 128.0
    # Second pass: normalize each image
    for p in paths:
        if not p.exists():
            continue
        img = Image.open(p).convert("RGB")
        img = normalize_image(img, ref_median_brightness=ref_median)
        img.save(p, "JPEG", quality=92)
    print(f"Normalized {len(paths)} images (reference brightness ≈ {ref_median:.0f})")


def write_report(records: list[dict], report_path: Path) -> None:
    """Write JSON report including too-close / too-far / no_face entries."""
    summary = {
        "total": len(records),
        "ok": sum(1 for r in records if r.get("status") == "ok"),
        "too_close": sum(1 for r in records if r.get("status") == "too_close"),
        "too_far": sum(1 for r in records if r.get("status") == "too_far"),
        "no_face": sum(1 for r in records if r.get("status") == "no_face"),
    }
    # Sanitize for JSON (paths and lists only)
    out_records = []
    for r in records:
        out_records.append({
            "id": r["id"],
            "path": r.get("path"),
            "status": r.get("status"),
            "face_frac": r.get("face_frac"),
            "face_height_in_crop": r.get("face_height_in_crop"),
            "crop_side": r.get("crop_side"),
            "out_path": r.get("out_path"),
        })
    report = {"summary": summary, "images": out_records}
    report_path.write_text(json.dumps(report, indent=2))
    print(f"Report written: {report_path}")
    if summary["too_close"] or summary["too_far"] or summary["no_face"]:
        print(f"  Summary: {summary['ok']} ok, {summary['too_close']} too close, "
              f"{summary['too_far']} too far, {summary['no_face']} no face")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download images from CSV, crop to 300×300 headshots, normalize style."
    )
    parser.add_argument(
        "sources",
        type=Path,
        nargs="?",
        default=Path(__file__).parent.parent / "data" / "predictions.csv",
        help="CSV path (default: data/predictions.csv)",
    )
    parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("headshots"),
        help="Base directory for downloaded and cropped images (default: headshots)",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip download; use existing files in output-dir/downloaded",
    )
    parser.add_argument(
        "--url-column",
        default="headshot_url",
        help="CSV column for image URL (default: headshot_url for data/predictions.csv)",
    )
    parser.add_argument(
        "--id-column",
        default="predictor_name",
        help="CSV column for identifier (default: predictor_name for data/predictions.csv)",
    )
    args = parser.parse_args()

    base = args.output_dir.resolve()
    downloaded_dir = base / "downloaded"
    cropped_dir = base / "cropped"
    report_path = base / "report.json"

    if not args.skip_download:
        if not args.sources.exists():
            raise SystemExit(f"Sources CSV not found: {args.sources}")
        downloaded = download_images(args.sources, downloaded_dir, args.url_column, args.id_column)
        if not downloaded:
            raise SystemExit("No images downloaded.")
    else:
        # Discover from downloaded_dir
        downloaded = [
            {"id": p.stem, "path": str(p)}
            for p in downloaded_dir.iterdir()
            if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
        ]
        if not downloaded:
            raise SystemExit("No images in downloaded dir. Run without --skip-download first.")

    cascade = _face_detector()
    print("Pass 1: Detecting faces and computing crop regions...")
    records = pass1_detect(downloaded, cascade)
    print("Pass 2: Cropping to 300×300...")
    pass2_crop(records, cropped_dir)
    write_report(records, report_path)
    # print("Pass 3: Normalizing brightness/color...")
    # pass3_normalize(cropped_dir, records)
    print("Done. Cropped headshots in:", cropped_dir)


if __name__ == "__main__":
    main()
