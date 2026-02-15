#!/usr/bin/env python3
"""
Process staging headshots (scripts/headshots_staging/{slug}-1.jpg … {slug}-10.jpg).
For each predictor, score the 10 candidates for avatar suitability (single face,
clear, good framing, no text overlay). Picks the best candidate; if none are
acceptable, uses the best available fallback (e.g. multi-face or with text).
Crops to center the face (or image center if no face) and resizes to 300×300,
writing headshots_staging/cropped/{slug}.jpg. Skips when that file already exists.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# Optional: OCR to reject images with text/words (requires tesseract installed)
try:
    import pytesseract
    _HAS_PYTESSERACT = True
except ImportError:
    _HAS_PYTESSERACT = False

# Reuse same geometry as process_headshots.py for consistent avatars
TARGET_SIZE = 300
IDEAL_FACE_FRAC_MIN = 0.22
IDEAL_FACE_FRAC_MAX = 0.45
CROP_FACE_SCALE = 2.6
FACE_OFFSET_UP = 0.35

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_STAGING_DIR = SCRIPT_DIR / "headshots_staging"
CROPPED_SUBDIR = "cropped"

# Minimum face height (px) to consider image acceptable
MIN_FACE_HEIGHT = 40
# Brightness: reject if mean gray outside this range (avoid near-black or blown out)
BRIGHTNESS_MIN = 28
BRIGHTNESS_MAX = 232
# Text: reject if OCR finds at least this many words (or this many alpha chars)
TEXT_WORD_THRESHOLD = 2
TEXT_CHAR_THRESHOLD = 12


def _face_detector():
    return cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )


def detect_all_faces(image_path: Path, cascade) -> list[tuple[int, int, int, int]]:
    """Return all faces (x, y, w, h) sorted by area descending."""
    img = cv2.imread(str(image_path))
    if img is None:
        return []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE,
    )
    rects = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
    return sorted(rects, key=lambda r: r[2] * r[3], reverse=True)


def center_crop_rect(img_shape: tuple[int, ...]) -> tuple[int, int, int, int]:
    """Square center crop (x1, y1, x2, y2) for image with no face."""
    h_img, w_img = img_shape[:2]
    side = min(h_img, w_img)
    x1 = (w_img - side) // 2
    y1 = (h_img - side) // 2
    return (x1, y1, x1 + side, y1 + side)


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
    cy = fcy - side * (FACE_OFFSET_UP - 0.5)
    cx = fcx
    x1 = int(cx - side / 2)
    y1 = int(cy - side / 2)
    x2 = x1 + side
    y2 = y1 + side
    x1 = max(0, min(x1, w_img - side))
    y1 = max(0, min(y1, h_img - side))
    x2 = min(w_img, x1 + side)
    y2 = min(h_img, y1 + side)
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


def sharpness_variance(image_path: Path) -> float:
    """Laplacian variance: higher = sharper. Returns 0 if image cannot be read."""
    img = cv2.imread(str(image_path))
    if img is None:
        return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def has_significant_text(image_path: Path) -> bool:
    """
    True if the image contains enough text (words/overlay) to reject for avatar use.
    Requires pytesseract and system Tesseract. Returns False if OCR unavailable.
    """
    if not _HAS_PYTESSERACT:
        return False
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return False
        # Slight upscale can help OCR on small text
        h, w = img.shape[:2]
        if max(h, w) < 400:
            scale = 400 / max(h, w)
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        text = pytesseract.image_to_string(gray).strip()
        # Count words (split on whitespace, ignore single-char tokens as noise)
        words = [t for t in text.split() if len(t) > 1]
        alpha_chars = sum(1 for c in text if c.isalpha())
        return len(words) >= TEXT_WORD_THRESHOLD or alpha_chars >= TEXT_CHAR_THRESHOLD
    except Exception:
        return False


def mean_brightness(image_path: Path) -> float:
    """Mean intensity of gray image. Returns 0 if unreadable."""
    img = cv2.imread(str(image_path))
    if img is None:
        return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))


def face_centrality(face: tuple[int, int, int, int], img_shape: tuple[int, ...]) -> float:
    """
    Normalized distance from face center to image center (0 = centered, 1 = corner).
    Lower is better for a portrait.
    """
    h_img, w_img = img_shape[:2]
    fx, fy, fw, fh = face
    fcx = fx + fw / 2
    fcy = fy + fh / 2
    img_cx = w_img / 2
    img_cy = h_img / 2
    dist = ((fcx - img_cx) ** 2 + (fcy - img_cy) ** 2) ** 0.5
    diag = (w_img**2 + h_img**2) ** 0.5
    return dist / diag if diag > 0 else 0.0


def group_staging_files(staging_dir: Path) -> dict[str, list[Path]]:
    """
    Find all {slug}-{n}.jpg in staging_dir (not in cropped/). Return {slug: [path1, path2, ...]}.
    """
    groups: dict[str, list[Path]] = {}
    cropped_dir = staging_dir / CROPPED_SUBDIR
    for p in staging_dir.iterdir():
        if p.is_dir() or p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        stem = p.stem
        if "-" not in stem:
            continue
        parts = stem.split("-")
        num_part = parts[-1]
        if not num_part.isdigit():
            continue
        slug = "-".join(parts[:-1])
        if not slug:
            continue
        groups.setdefault(slug, []).append(p)
    for slug in groups:
        groups[slug] = sorted(groups[slug], key=lambda p: int(p.stem.split("-")[-1]))
    return groups


def analyze_candidate(
    path: Path,
    cascade,
) -> dict | None:
    """
    Analyze one image for avatar suitability. Always returns a record when image is
    readable (so we can pick "best" even when none are ideal). Uses center crop for
    0 faces, largest face for 2+. Records has_text, bad_brightness, and status for scoring.
    Returns None only if image cannot be read.
    """
    img = cv2.imread(str(path))
    if img is None:
        return None
    has_text = has_significant_text(path)
    brightness = mean_brightness(path)
    bad_brightness = brightness < BRIGHTNESS_MIN or brightness > BRIGHTNESS_MAX
    faces = detect_all_faces(path, cascade)
    h_img, w_img = img.shape[:2]
    aspect = h_img / w_img if w_img else 1.0
    sharp = sharpness_variance(path)

    if len(faces) == 0:
        crop_rect = center_crop_rect(img.shape)
        return {
            "path": path,
            "face": None,
            "crop_rect": crop_rect,
            "face_frac": 0.0,
            "status": "no_face",
            "face_height": 0,
            "sharpness": sharp,
            "aspect_ratio": aspect,
            "mean_brightness": brightness,
            "face_centrality": 0.5,
            "has_text": has_text,
            "bad_brightness": bad_brightness,
        }
    face = faces[0]
    fh = face[3]
    crop_rect = compute_crop_region(img.shape, face)
    x1, y1, x2, y2 = crop_rect
    crop_side = min(x2 - x1, y2 - y1)
    face_frac = fh / crop_side if crop_side else 0
    if len(faces) > 1:
        status = "multi_face"
    elif fh < MIN_FACE_HEIGHT:
        status = "face_too_small"
    elif face_frac < IDEAL_FACE_FRAC_MIN:
        status = "too_far"
    elif face_frac > IDEAL_FACE_FRAC_MAX:
        status = "too_close"
    else:
        status = "ok"
    centrality = face_centrality(face, img.shape)
    return {
        "path": path,
        "face": face,
        "crop_rect": crop_rect,
        "face_frac": face_frac,
        "status": status,
        "face_height": fh,
        "sharpness": sharp,
        "aspect_ratio": aspect,
        "mean_brightness": brightness,
        "face_centrality": centrality,
        "has_text": has_text,
        "bad_brightness": bad_brightness,
    }


def score_candidate(c: dict) -> float:
    """
    Higher = better avatar. Combines framing, sharpness, aspect ratio, face centrality.
    Penalties for text overlay, bad brightness, and non-ideal face (so we prefer
    acceptable images but can fall back to best available when none are acceptable).
    """
    status_bonus = {
        "ok": 2.0,
        "too_close": 1.0,
        "too_far": 0.5,
        "face_too_small": 0.3,
        "multi_face": 0.2,
        "no_face": 0.0,
    }.get(c["status"], 0)
    sharp = min(c["sharpness"] / 500.0, 1.0)
    # Penalties for fallback-quality issues
    if c.get("has_text"):
        status_bonus -= 1.5
    if c.get("bad_brightness"):
        status_bonus -= 0.5
    # Prefer portrait or square; penalize very wide (group/crowd)
    aspect = c.get("aspect_ratio", 1.0)
    if aspect >= 1.0:
        aspect_bonus = 0.3
    elif aspect < 0.55:
        aspect_bonus = -0.5
    else:
        aspect_bonus = 0.0
    # Prefer face near center of frame
    centrality = c.get("face_centrality", 0.5)
    if centrality <= 0.2:
        centrality_bonus = 0.2
    elif centrality > 0.5:
        centrality_bonus = -0.2
    else:
        centrality_bonus = 0.0
    return status_bonus + sharp + aspect_bonus + centrality_bonus


def crop_and_save(record: dict, out_path: Path) -> None:
    """Crop image to record['crop_rect'], resize to TARGET_SIZE, save as JPEG."""
    path = Path(record["path"])
    img = cv2.imread(str(path))
    if img is None:
        return
    x1, y1, x2, y2 = record["crop_rect"]
    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        return
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pil_crop = Image.fromarray(crop_rgb)
    resized = pil_crop.resize(
        (TARGET_SIZE, TARGET_SIZE),
        resample=Image.LANCZOS,
        reducing_gap=3,
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    resized.save(str(out_path), "JPEG", quality=92)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pick best staging image per predictor, crop to avatar, save to staging/cropped/."
    )
    parser.add_argument(
        "-s",
        "--staging-dir",
        type=Path,
        default=DEFAULT_STAGING_DIR,
        help=f"Staging directory (default: {DEFAULT_STAGING_DIR})",
    )
    args = parser.parse_args()
    staging_dir = args.staging_dir.resolve()
    cropped_dir = staging_dir / CROPPED_SUBDIR

    if not staging_dir.exists():
        print(f"Staging dir not found: {staging_dir}", file=sys.stderr)
        sys.exit(1)

    groups = group_staging_files(staging_dir)
    if not groups:
        print("No staging groups found (expect files named {slug}-1.jpg, {slug}-2.jpg, ...).", file=sys.stderr)
        sys.exit(1)

    if not _HAS_PYTESSERACT:
        print("Note: pytesseract not installed; skipping text-overlay filter (install pytesseract + tesseract to exclude images with words).", file=sys.stderr)
    cascade = _face_detector()
    errors: list[str] = []
    processed = 0

    for slug in sorted(groups.keys()):
        out_path = cropped_dir / f"{slug}.jpg"
        if out_path.exists():
            continue  # already have cropped output; skip
        paths = groups[slug]
        candidates = []
        for p in paths:
            rec = analyze_candidate(p, cascade)
            if rec is not None:
                rec["score"] = score_candidate(rec)
                candidates.append(rec)
        if not candidates:
            msg = f"No image could be read for '{slug}' ({len(paths)} files)."
            errors.append(msg)
            print(msg, file=sys.stderr)
            continue
        best = max(candidates, key=lambda c: c["score"])
        crop_and_save(best, out_path)
        acceptable = best["status"] == "ok" and not best.get("has_text") and not best.get("bad_brightness")
        fallback_note = "" if acceptable else " (fallback: no ideal image)"
        print(f"{slug}: chose {Path(best['path']).name} (status={best['status']}, sharpness={best['sharpness']:.0f}) -> {out_path.name}{fallback_note}")
        processed += 1

    print(f"\nProcessed {processed} predictors; cropped headshots in {cropped_dir}")
    if errors:
        print(f"Errors ({len(errors)}): could not read any image for those entries (see above).", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
