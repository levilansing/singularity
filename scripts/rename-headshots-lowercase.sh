#!/usr/bin/env bash
# Rename all files in public/headshots/ to lowercase.
# Uses a two-step rename so it works on case-insensitive filesystems (e.g. macOS).

set -e

DIR="${1:-$(dirname "$0")/../public/headshots}"
cd "$DIR"

for f in *; do
  [[ -e "$f" ]] || continue
  [[ -f "$f" ]] || continue
  low=$(echo "$f" | tr '[:upper:]' '[:lower:]')
  [[ "$f" == "$low" ]] && continue
  tmp="__lowercase_tmp_$$_$f"
  mv "$f" "$tmp"
  mv "$tmp" "$low"
  echo "$f -> $low"
done

echo "Done."
