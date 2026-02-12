# Headshot processor

Python tool (managed with [uv](https://docs.astral.sh/uv/)) that:

1. **Download** – Reads a CSV of image URLs and downloads each image into a folder, named by an identifier column.
2. **Detect & crop** – Uses face detection to find the head, then crops a consistent **300×300** headshot (head + part of bust) suitable for a circle frame.
3. **Report** – Documents which images were **too close**, **too far**, or had **no face** detected.
4. **Normalize** – Applies a final pass so all headshots have similar brightness/color (auto-filter style).

## Setup

From the repo root or from `scripts/`:

```bash
cd scripts
uv sync
```

## Usage

```bash
# Use the example CSV (downloads from example URLs, then process)
uv run python process_headshots.py

# Custom CSV and output directory
uv run python process_headshots.py path/to/sources.csv -o path/to/headshots

# Skip download and re-run only detection + crop + normalize on existing downloaded images
uv run python process_headshots.py --skip-download -o headshots
```

### CSV format

Default columns:

- **`id`** – Unique identifier; used for filenames (e.g. `alice`, `bob`). Safe characters only.
- **`image_url`** – Full URL of the image to download.

You can override column names with `--id-column` and `--url-column`.

Example (`example_sources.csv`):

```csv
id,name,image_url
alice,Alice Smith,https://example.com/photos/alice.jpg
bob,Bob Jones,https://example.com/photos/bob.jpg
```

The example file uses placeholder URLs; replace with real photo URLs for best results. For face detection to work, images should contain a clear front-facing face.

## Output layout

- **`<output-dir>/downloaded/`** – Original images, named `{id}.jpg` (or original extension).
- **`<output-dir>/cropped/`** – 300×300 headshots, named `{id}.jpg`, normalized.
- **`<output-dir>/report.json`** – Per-image status and summary.

### Report (`report.json`)

- **`summary`** – Counts: `ok`, `too_close`, `too_far`, `no_face`.
- **`images`** – For each row:
  - **`status`** – `ok` | `too_close` | `too_far` | `no_face`.
  - **`face_frac`** – Face height as fraction of crop side (used to classify too close/far).
  - **`face_height_in_crop`**, **`crop_side`** – For debugging or filtering.

Images with **no face** are not cropped; they are still listed in the report. **Too close** / **too far** images are cropped but flagged so you can replace or adjust source photos if needed.

## Pipeline (3 passes)

1. **Pass 1 – Detect**
   OpenCV Haar cascade finds the face in each image, computes a square crop region (head + bust), and classifies scale as `ok` / `too_close` / `too_far` / `no_face`.

2. **Pass 2 – Crop**
   Each image is cropped to that region and resized to **300×300**, then saved under `cropped/`.

3. **Pass 3 – Normalize**
   All cropped images are adjusted for similar median brightness and light contrast/color and sharpening so they look like a consistent set of headshots.

## Options

| Option | Description |
|--------|-------------|
| `sources` | CSV path (default: `example_sources.csv` in script dir). |
| `-o`, `--output-dir` | Base dir for `downloaded/`, `cropped/`, and `report.json` (default: `headshots`). |
| `--skip-download` | Do not download; use existing files in `output-dir/downloaded/`. |
| `--url-column` | CSV column for image URL (default: `image_url`). |
| `--id-column` | CSV column for identifier (default: `id`). |

## Dependencies

- **httpx** – Download images.
- **opencv-python-headless** – Face detection and crop/resize.
- **Pillow** – Normalization (brightness, contrast, color, sharpening).
- **pandas** – CSV reading.

All are listed in `pyproject.toml` and installed with `uv sync`.
