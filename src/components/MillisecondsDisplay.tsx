import { useRef, useEffect } from "react";

function useMilliseconds(ref: React.RefObject<HTMLSpanElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const tick = () => {
      const ms = 999 - (Date.now() % 1000);
      el.textContent = String(ms).padStart(3, "0");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function MillisecondsDisplay() {
  const ref = useRef<HTMLSpanElement>(null);
  useMilliseconds(ref);
  return (
    <div className="countdown-digit-group countdown-ms-group">
      <div className="countdown-digit-value countdown-ms-value">
        <span ref={ref}>000</span>
      </div>
      <div className="countdown-digit-label">Milliseconds</div>
    </div>
  );
}

export function MillisecondsDisplayCompact() {
  const ref = useRef<HTMLSpanElement>(null);
  useMilliseconds(ref);
  return (
    <div className="countdown-digit-group compact countdown-ms-group">
      <div className="countdown-digit-value countdown-ms-value">
        <span ref={ref}>000</span>
      </div>
      <div className="countdown-digit-label">MS</div>
    </div>
  );
}
