#!/usr/bin/env bun
/**
 * Extracts name, headline, tldr from predictions.json; calls Anthropic Haiku
 * in small batches to generate a short slug (~half headline length); appends
 * results as a new column "headline_slug" to data/predictions-v2.csv.
 *
 * By default only generates slugs for rows that don't have one yet.
 * Use --overwrite (or -o) to regenerate all slugs.
 *
 * Requires: ANTHROPIC_API_KEY
 * Run: bun run scripts/generate-headline-slugs.ts [--overwrite]
 */

import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const JSON_PATH = path.join(ROOT, "src", "data", "predictions.json");
const CSV_PATH = path.join(ROOT, "data", "predictions-v2.csv");

const BATCH_SIZE = 5;
const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

type PredictionRow = {
  id: number;
  predictor_name: string;
  headline: string;
  tldr_summary: string;
};

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

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

async function generateSlugsForBatch(
  apiKey: string,
  items: PredictionRow[]
): Promise<string[]> {
  const list = items
    .map(
      (p, i) =>
        `${i + 1}. Name: ${p.predictor_name}\n   Headline: ${p.headline}\n   (TLDR: ${p.tldr_summary.length > 220 ? p.tldr_summary.slice(0, 220) + "..." : p.tldr_summary})`
    )
    .join("\n\n");

  const prompt = `You are a copy editor. For each of the following prediction entries, output a seo friendly article slug (phrase) that is slightly shorter than the headline (in characters). Keep the slug punchy and descriptive; no full sentences. Use title case. Output ONLY a JSON array of ${items.length} strings, one slug per entry, in the same order as the list. No other text.

Entries:
${list}`;

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: "You output only valid JSON arrays of strings. No markdown, no explanation.",
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text =
    data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
  // Strip possible markdown code fence
  const raw = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.length !== items.length) {
    throw new Error(`Expected JSON array of ${items.length} slugs, got: ${raw.slice(0, 200)}`);
  }
  return parsed.map((s) => (typeof s === "string" ? s : String(s)));
}

async function main() {
  const overwrite = process.argv.includes("--overwrite") || process.argv.includes("-o");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Set ANTHROPIC_API_KEY to run this script.");
    process.exit(1);
  }

  const predictions: PredictionRow[] = (await Bun.file(JSON_PATH).json()).map(
    (p: { id: number; predictor_name: string; headline: string; tldr_summary: string }) => ({
      id: p.id,
      predictor_name: p.predictor_name,
      headline: p.headline,
      tldr_summary: p.tldr_summary ?? "",
    })
  );

  const slugCol = "headline_slug";
  const existingSlug = new Map<number, string>();
  const csvText = await Bun.file(CSV_PATH).text();
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCSVLine(lines[0]!);
  if (header.includes(slugCol)) {
    const idx = header.indexOf(slugCol);
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]!);
      const id = parseInt(fields[0] ?? "", 10);
      const slug = (fields[idx] ?? "").trim();
      if (!isNaN(id)) existingSlug.set(id, slug);
    }
  }

  const toGenerate = overwrite
    ? predictions
    : predictions.filter((p) => !existingSlug.get(p.id)?.trim());
  const idToSlug = new Map(existingSlug);

  if (toGenerate.length === 0) {
    console.log("All rows already have slugs. Use --overwrite to regenerate.");
    return;
  }

  if (!overwrite && toGenerate.length < predictions.length) {
    console.log(`Skipping ${predictions.length - toGenerate.length} rows with existing slugs.`);
  }
  console.log(`Generating slugs for ${toGenerate.length} predictions in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < toGenerate.length; i += BATCH_SIZE) {
    const batch = toGenerate.slice(i, i + BATCH_SIZE);
    const ids = batch.map((p) => p.id);
    try {
      const slugs = await generateSlugsForBatch(apiKey, batch);
      batch.forEach((p, j) => idToSlug.set(p.id, slugs[j] ?? ""));
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ids ${ids.join(", ")}`);
    } catch (e) {
      console.error(`Batch for ids ${ids.join(", ")} failed:`, e);
      throw e;
    }
    if (i + BATCH_SIZE < toGenerate.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const hasSlugCol = header.includes(slugCol);
  const newHeader = hasSlugCol ? header : [...header, slugCol];
  const slugColIndex = newHeader.indexOf(slugCol);

  const outputLines: string[] = [newHeader.map(escapeCSVField).join(",")];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]!);
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      row[h] = fields[j] ?? "";
    });
    const id = parseInt(row.id ?? "", 10);
    const slug = idToSlug.get(id) ?? "";
    const newRow = hasSlugCol
      ? [...fields.slice(0, slugColIndex), slug, ...fields.slice(slugColIndex + 1)]
      : [...fields, slug];
    outputLines.push(newRow.map(escapeCSVField).join(","));
  }

  await Bun.write(CSV_PATH, outputLines.join("\n") + "\n");
  console.log(`Done. Updated "headline_slug" in ${CSV_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
