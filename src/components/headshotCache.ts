/**
 * Global headshot image cache.
 *
 * Ensures each headshot URL is fetched exactly once, shares the result across
 * all consumers, and never marks a load as failed due to a race / abort.
 */

type CacheEntry =
  | { status: "loading"; listeners: Set<() => void> }
  | { status: "loaded"; src: string }
  | { status: "error" };

const cache = new Map<string, CacheEntry>();

/** Start loading a headshot (if not already in-flight) and return its current status. */
export function getHeadshot(src: string): "loading" | "loaded" | "error" {
  // During SSR, Image isn't available — report loading and let the client hydrate
  if (typeof window === "undefined") return "loading";

  const entry = cache.get(src);
  if (entry) return entry.status;

  // Start loading
  const listeners = new Set<() => void>();
  cache.set(src, { status: "loading", listeners });

  const img = new window.Image();
  img.onload = () => {
    cache.set(src, { status: "loaded", src });
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
  // Already resolved — nothing to subscribe to
  return () => {};
}
