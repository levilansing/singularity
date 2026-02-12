#!/usr/bin/env bun
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const CSV_PATH = path.join(ROOT, "data", "predictions.csv");
const OUT_PATH = path.join(ROOT, "src", "data", "predictions.json");

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

const csv = await Bun.file(CSV_PATH).text();
const lines = csv.split("\n").filter((l) => l.trim().length > 0);
const headers = parseCSVLine(lines[0]!);

const predictions = lines.slice(1).map((line, index) => {
  const values = parseCSVLine(line);
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    row[h] = values[i] ?? "";
  });

  const predicted_year_best = row.predicted_year_best ? parseInt(row.predicted_year_best, 10) : null;
  const predicted_year_low = row.predicted_year_low ? parseInt(row.predicted_year_low, 10) : null;
  const predicted_year_high = row.predicted_year_high ? parseInt(row.predicted_year_high, 10) : null;
  const has_countdown = predicted_year_best !== null;
  const target_date = has_countdown ? `${predicted_year_best}-07-01T00:00:00Z` : null;

  // Derive local headshot path from predictor name
  const slug = (row.predictor_name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const headshot_local = row.headshot_url ? `/headshots/${slug}.jpg` : null;

  return {
    id: index + 1,
    predictor_name: row.predictor_name,
    predictor_type: row.predictor_type,
    prediction_date: row.prediction_date,
    predicted_year_low,
    predicted_year_high,
    predicted_year_best,
    prediction_type: row.prediction_type,
    confidence_level: row.confidence_level,
    criteria_definition: row.criteria_definition,
    source_name: row.source_name,
    source_url: row.source_url,
    headshot_url: row.headshot_url,
    headline: row.headline,
    tldr_summary: row.tldr_summary,
    graphic_url: row.graphic_url,
    target_date,
    has_countdown,
    headshot_local,
  };
});

await Bun.write(OUT_PATH, JSON.stringify(predictions, null, 2));
console.log(`✅ Converted ${predictions.length} predictions → ${OUT_PATH}`);
