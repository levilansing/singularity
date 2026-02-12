import { serve } from "bun";
import index from "./index.html";

const server = serve({
  static: {
    "/headshots/*": "public/headshots/*",
  },
  routes: {
    "/headshots/:file": async (req) => {
      const file = Bun.file(`public/headshots/${req.params.file}`);
      if (await file.exists()) return new Response(file);
      return new Response("Not found", { status: 404 });
    },
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
