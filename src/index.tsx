import { serve } from "bun";
import index from "./index.html";

const server = serve({
  static: {
    "/portraits/*": "public/portraits/*",
  },
  routes: {
    "/portraits/:file": async (req) => {
      const file = Bun.file(`public/portraits/${req.params.file}`);
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    },
    "/data/predictions/:file": async (req) => {
      const file = Bun.file(`public/data/predictions/${req.params.file}`);
      if (await file.exists()) return new Response(file, {
        headers: { "Content-Type": "application/json" }
      });
      return new Response("Not found", { status: 404 });
    },
    "/art/:file": async (req) => {
      const file = Bun.file(`public/art/${req.params.file}`);
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    },
    "/logo.svg": async () => new Response(Bun.file("public/logo.svg"), { headers: { "Content-Type": "image/svg+xml" } }),
    "/favicon.svg": async () => new Response(Bun.file("public/favicon.svg"), { headers: { "Content-Type": "image/svg+xml" } }),
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
