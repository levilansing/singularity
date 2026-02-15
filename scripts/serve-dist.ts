#!/usr/bin/env bun
import { serve } from "bun";
import path from "path";

const distDir = path.join(import.meta.dir, "..", "dist");
const port = parseInt(process.env.PORT || "3000", 10);

const server = serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = path.join(distDir, url.pathname);

    // Try the exact path first
    let file = Bun.file(filePath);
    if (await file.exists() && !filePath.endsWith("/")) {
      return new Response(file);
    }

    // Try index.html in directory
    const indexPath = path.join(filePath, "index.html");
    file = Bun.file(indexPath);
    if (await file.exists()) {
      return new Response(file, { headers: { "Content-Type": "text/html" } });
    }

    // SPA fallback
    return new Response(Bun.file(path.join(distDir, "index.html")), {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Serving dist/ at http://localhost:${server.port}`);
