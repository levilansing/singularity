#!/usr/bin/env bun
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App } from "../src/App";
import predictions from "../src/data/predictions.json";
import type { Prediction } from "../src/data/types";
import { slugify, getUrgencyLevel } from "../src/data/types";
import { mkdir } from "fs/promises";
import path from "path";

const outdir = process.argv[2] || path.join(process.cwd(), "dist");
const allPredictions = predictions as Prediction[];
const DOMAIN = "https://singularitycountdown.com";

// ---------------------------------------------------------------------------
// 1. Read the built index.html to extract hashed chunk filenames
// ---------------------------------------------------------------------------
const indexHtml = await Bun.file(path.join(outdir, "index.html")).text();

// Extract all <link rel="stylesheet" ...> and <script ...> tags from <head> and <body>
const cssLinkMatches = [...indexHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
const scriptMatches = [...indexHtml.matchAll(/<script[^>]+src="([^"]+)"[^>]*>[^<]*<\/script>/g)];

// Normalize to absolute paths (Bun outputs ./chunk-... which breaks in nested dirs)
const toAbsolute = (href: string) => href.startsWith("./") ? "/" + href.slice(2) : href.startsWith("/") ? href : "/" + href;
const cssHrefs = cssLinkMatches.map(m => toAbsolute(m[1]!));
const scriptSrcs = scriptMatches.map(m => toAbsolute(m[1]!));

// Also extract the inline <style> block from the original
const inlineStyleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
const inlineStyle = inlineStyleMatch ? inlineStyleMatch[0] : "";

// ---------------------------------------------------------------------------
// 2. Helper to build a full HTML page
// ---------------------------------------------------------------------------
function buildHtml({
  bodyHtml,
  title,
  description,
  ogTitle,
  ogDescription,
  ogUrl,
  urgencyClass,
}: {
  bodyHtml: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  urgencyClass: string;
}): string {
  const ogTags = [
    ogTitle ? `<meta property="og:title" content="${escapeAttr(ogTitle)}">` : "",
    ogDescription ? `<meta property="og:description" content="${escapeAttr(ogDescription)}">` : "",
    ogUrl ? `<meta property="og:url" content="${escapeAttr(ogUrl)}">` : "",
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Singularity Countdown">`,
  ].filter(Boolean).join("\n    ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="theme-color" content="#0a0a0f" />
    ${ogTags}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <title>${escapeHtml(title)}</title>
    ${inlineStyle}
${cssHrefs.map(href => `    <link rel="stylesheet" crossorigin href="${href}">`).join("\n")}
  </head>
  <body class="${urgencyClass}">
    <div id="root">${bodyHtml}</div>
${scriptSrcs.map(src => `    <script type="module" crossorigin src="${src}"></script>`).join("\n")}
  </body>
</html>
`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// 3. Render each route
// ---------------------------------------------------------------------------
async function renderRoute(routePath: string, outFile: string, meta: {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  urgencyClass: string;
}) {
  const bodyHtml = renderToString(
    <StaticRouter location={routePath}>
      <App />
    </StaticRouter>
  );

  const html = buildHtml({ bodyHtml, ...meta });

  const dir = path.dirname(outFile);
  await mkdir(dir, { recursive: true });
  await Bun.write(outFile, html);
}

// ---------------------------------------------------------------------------
// 4. Generate all pages
// ---------------------------------------------------------------------------
const start = performance.now();
let count = 0;

// Home page — skeletons for prediction content, everything else pre-rendered
await renderRoute("/", path.join(outdir, "index.html"), {
  title: "The Singularity is Coming — AI Singularity Countdown",
  description: `Tracking humanity's most confident guesses about its own obsolescence. ${allPredictions.length} predictions from notable people, organizations, and prediction markets.`,
  ogTitle: "The Singularity is Coming",
  ogDescription: `${allPredictions.length} predictions about when AI surpasses humanity. How much time do we have left?`,
  ogUrl: DOMAIN + "/",
  urgencyClass: "urgency-far",
});
count++;

// Browse page
await renderRoute("/browse", path.join(outdir, "browse", "index.html"), {
  title: `Browse All ${allPredictions.length} Predictions — Singularity Countdown`,
  description: "Every confident guess about the end of human supremacy, sortable and filterable by type, date, and confidence level.",
  ogTitle: `All ${allPredictions.length} Singularity Predictions`,
  ogDescription: "Browse every prediction about when AI surpasses human intelligence.",
  ogUrl: DOMAIN + "/browse",
  urgencyClass: "urgency-far",
});
count++;

// Individual prediction pages
for (const p of allPredictions) {
  const slug = slugify(p);
  const urgency = getUrgencyLevel(p.target_date, p.has_countdown);
  const typeLabel = p.prediction_type.startsWith("AGI") ? "AGI" : p.prediction_type === "HLMI" ? "human-level AI" : p.prediction_type.toLowerCase();
  const yearStr = p.predicted_year_best ? `by ${p.predicted_year_best}` : "";

  await renderRoute(`/${slug}`, path.join(outdir, ...slug.split("/"), "index.html"), {
    title: `${p.predictor_name} predicts ${typeLabel} ${yearStr} — Singularity Countdown`.replace(/\s+/g, " ").trim(),
    description: p.tldr_summary,
    ogTitle: `${p.predictor_name} predicts ${typeLabel} ${yearStr}`.replace(/\s+/g, " ").trim(),
    ogDescription: p.headline,
    ogUrl: `${DOMAIN}/${slug}`,
    urgencyClass: `urgency-${urgency}`,
  });
  count++;
}

const elapsed = (performance.now() - start).toFixed(0);
console.log(`🎨 Pre-rendered ${count} pages in ${elapsed}ms`);
