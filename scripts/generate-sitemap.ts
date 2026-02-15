#!/usr/bin/env bun
import predictions from "../src/data/predictions.json";
import type { Prediction } from "../src/data/types";
import { slugify } from "../src/data/types";
import path from "path";

const DOMAIN = process.env.SITE_DOMAIN ?? "https://when-is-the-singularity.com";
const outdir = process.argv[2] || path.join(process.cwd(), "dist");

const allPredictions = predictions as Prediction[];
const slugs = allPredictions.map((p) => slugify(p));

const urls = [
  DOMAIN + "/",
  ...slugs.map((s) => `${DOMAIN}/${s}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;

const outPath = path.join(outdir, "sitemap.xml");
await Bun.write(outPath, sitemap);
console.log(`📍 Sitemap generated at ${outPath} (${urls.length} URLs)`);
