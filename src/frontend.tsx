/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

// Set favicon (added dynamically to avoid Bun bundler resolving the href)
const faviconLink = document.createElement("link");
faviconLink.rel = "icon";
faviconLink.type = "image/svg+xml";
faviconLink.href = "/favicon.svg";
document.head.appendChild(faviconLink);

function start() {
  const container = document.getElementById("root")!;
  const app = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // If the root has pre-rendered content (from SSG build), hydrate it.
  // Otherwise (dev mode), create a fresh root.
  if (container.children.length > 0) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
