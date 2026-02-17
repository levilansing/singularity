/**
 * Global headshot image cache.
 *
 * Ensures each headshot URL is fetched exactly once, shares the result across
 * all consumers, and never marks a load as failed due to a race / abort.
 */

type CacheEntry =
  | { status: "loading"; img: HTMLImageElement; listeners: Set<() => void> }
  | { status: "loaded" }
  | { status: "error" };

const cache = new Map<string, CacheEntry>();

/** Start loading a headshot (if not already in-flight) and return its current status. */
export function getHeadshot(src: string): "loading" | "loaded" | "error" {
  if (typeof window === "undefined") return "loading";

  const entry = cache.get(src);
  if (entry) return entry.status;

  const listeners = new Set<() => void>();
  const img = new window.Image();
  cache.set(src, { status: "loading", img, listeners });

  img.onload = () => {
    cache.set(src, { status: "loaded" });
    for (const fn of listeners) fn();
  };
  img.onerror = () => {
    cache.set(src, { status: "error" });
    for (const fn of listeners) fn();
  };
  img.src = src;

  return "loading";
}

/** Subscribe to cache changes for a given src. Returns an unsubscribe function. */
export function subscribeHeadshot(src: string, cb: () => void): () => void {
  const entry = cache.get(src);
  if (entry && entry.status === "loading") {
    entry.listeners.add(cb);
    return () => entry.listeners.delete(cb);
  }
  return () => {};
}
