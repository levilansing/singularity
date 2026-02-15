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

export function MillisecondsDisplay({ hasYears = false }: { hasYears?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useMilliseconds(ref);
  return (
    <div className="countdown-digit-group flex flex-col items-center min-w-14 max-sm:min-w-10">
      <div className="countdown-digit-value countdown-ms-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) tabular-nums">
        <span ref={ref}>000</span>
      </div>
      {hasYears ? (
        <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">
          <span className="max-sm:hidden">Milliseconds</span>
          <span className="sm:hidden">MS</span>
        </div>
      ) : (
        <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">Milliseconds</div>
      )}
    </div>
  );
}

export function MillisecondsDisplayCompact() {
  const ref = useRef<HTMLSpanElement>(null);
  useMilliseconds(ref);
  return (
    <div className="countdown-digit-group compact flex flex-col items-center !min-w-0">
      <div className="countdown-digit-value countdown-ms-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) tabular-nums">
        <span ref={ref}>000</span>
      </div>
      <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">MS</div>
    </div>
  );
}
