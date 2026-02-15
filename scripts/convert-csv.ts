#!/usr/bin/env bun
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const CSV_PATH = path.join(ROOT, "data", "predictions-v2.csv");
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

function extractYear(dateStr: string): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

function deriveConceptKeys(row: Record<string, string>): string[] {
  const keys = new Set<string>();
  const text = [
    row.prediction_type,
    row.criteria_definition,
    row.tldr_summary,
    row.confidence_level,
    row.predictor_type,
  ]
    .join(" ")
    .toLowerCase();

  // Prediction type mappings
  if (row.prediction_type === "Superintelligence") keys.add("superintelligence");
  if (row.prediction_type === "AGI" || row.prediction_type === "AGI (weak)" || row.prediction_type === "AGI (strong)") keys.add("agi");
  if (row.prediction_type === "Intelligence Explosion") keys.add("intelligence-explosion");
  if (row.prediction_type === "HLMI") keys.add("agi");
  if (row.prediction_type === "Transformative AI") keys.add("transformative-ai");
  if (row.prediction_type === "Singularity") keys.add("event-horizon");

  // Mechanism keywords
  if (text.includes("recursive self-improvement") || text.includes("self-improving")) keys.add("recursive-self-improvement");
  if (text.includes("intelligence explosion")) keys.add("intelligence-explosion");
  if (text.includes("hard takeoff")) keys.add("hard-takeoff");
  if (text.includes("soft takeoff") || text.includes("gradual")) keys.add("soft-takeoff");
  if (text.includes("accelerating") || text.includes("exponential") || text.includes("law of accelerating returns")) keys.add("accelerating-change");
  if (text.includes("scaling") || text.includes("scale")) keys.add("scaling-hypothesis");
  if (text.includes("biological anchor")) keys.add("biological-anchors");
  if (text.includes("turing test")) keys.add("turing-test");
  if (text.includes("economic") || text.includes("labor") || text.includes("unemploy") || text.includes("gdp") || text.includes("gwp")) keys.add("economic-singularity");
  if (text.includes("sharp left turn")) keys.add("sharp-left-turn");
  if (text.includes("event horizon") || text.includes("unpredictab")) keys.add("event-horizon");
  if (text.includes("world model") || text.includes("neurosymbolic")) keys.add("scaling-hypothesis");
  if (text.includes("alignment") || text.includes("misalignment") || text.includes("safety")) keys.add("alignment");

  // Predictor type
  if (row.predictor_type === "Survey") keys.add("survey-drift");
  if (row.predictor_type === "Prediction Market") keys.add("prediction-markets");

  // Industry vs academia signal
  if (row.predictor_type === "Individual") {
    const name = row.predictor_name.toLowerCase();
    const industryNames = ["altman", "amodei", "musk", "huang", "legg", "goertzel", "kurzweil", "hassabis", "son"];
    const academicNames = ["chollet", "lecun", "brooks", "marcus", "bengio", "hinton", "hawking", "tegmark"];
    if (industryNames.some((n) => name.includes(n)) || academicNames.some((n) => name.includes(n))) {
      keys.add("industry-academia-divergence");
    }
  }

  return Array.from(keys);
}

const csv = await Bun.file(CSV_PATH).text();
const lines = csv.split("\n").filter((l) => l.trim().length > 0);
const headers = parseCSVLine(lines[0]!);

const predictions = lines.slice(1).map((line) => {
  const values = parseCSVLine(line);
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    row[h] = values[i] ?? "";
  });

  const predicted_date_low = row.predicted_date_low || null;
  const predicted_date_high = row.predicted_date_high || null;
  const predicted_date_best = row.predicted_date_best || null;

  const predicted_year_low = extractYear(row.predicted_date_low);
  const predicted_year_high = extractYear(row.predicted_date_high);
  const predicted_year_best = extractYear(row.predicted_date_best);

  const has_countdown = predicted_year_best !== null;
  const target_date = predicted_date_best
    ? `${predicted_date_best}T00:00:00Z`
    : predicted_year_best
      ? `${predicted_year_best}-07-01T00:00:00Z`
      : null;

  // Derive local headshot path from predictor name
  const slug = (row.predictor_name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const headshot_local = `/headshots/${slug}.jpg`;

  return {
    id: parseInt(row.id, 10),
    predictor_name: row.predictor_name,
    predictor_type: row.predictor_type,
    prediction_date: row.prediction_date,
    predicted_date_low,
    predicted_date_high,
    predicted_date_best,
    predicted_year_low,
    predicted_year_high,
    predicted_year_best,
    prediction_type: row.prediction_type,
    confidence_level: row.confidence_level,
    confidence_label: row.confidence_label || "",
    confidence_type: row.confidence_type || "",
    concept_keys: deriveConceptKeys(row),
    criteria_definition: row.criteria_definition,
    source_name: row.source_name,
    source_url: row.source_url,
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
