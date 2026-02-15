import { useState, useEffect } from "react";
import type { PredictionDetail } from "../data/types";

const cache = new Map<number, PredictionDetail>();

export function usePredictionDetail(id: number | null): {
  detail: PredictionDetail | null;
  loading: boolean;
} {
  const [detail, setDetail] = useState<PredictionDetail | null>(
    id !== null ? cache.get(id) ?? null : null
  );
  const [loading, setLoading] = useState(id !== null && !cache.has(id));

  useEffect(() => {
    if (id === null) {
      setDetail(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(id);
    if (cached) {
      setDetail(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    fetch(`/data/predictions/${id}.json`)
      .then((res) => res.json())
      .then((data: PredictionDetail) => {
        cache.set(id, data);
        if (!cancelled) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { detail, loading };
}
