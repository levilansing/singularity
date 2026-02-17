import { useEffect, useRef } from "react";

function DigitStrip({ className }: { className: string }) {
  return (
    <span className={`ms-strip ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <span key={d}>{d}</span>
      ))}
    </span>
  );
}

function Roller() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hundreds = el.querySelector(".ms-hundreds") as HTMLElement | null;
    const tens = el.querySelector(".ms-tens") as HTMLElement | null;
    const ones = el.querySelector(".ms-ones") as HTMLElement | null;
    if (!hundreds || !tens || !ones) return;

    let raf: number;
    const tick = () => {
      const ms = Date.now() % 1000;
      const h = Math.floor(ms / 100);
      const t = Math.floor((ms % 100) / 10);
      const o = ms % 10;
      // Each digit occupies 1em (--digit-h). Shift by -digit * 1em.
      hundreds.style.transform = `translateY(${-h}em)`;
      tens.style.transform = `translateY(${-t}em)`;
      ones.style.transform = `translateY(${-o}em)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="ms-roller" ref={ref}>
      <DigitStrip className="ms-hundreds" />
      <DigitStrip className="ms-tens" />
      <DigitStrip className="ms-ones" />
    </span>
  );
}

export function MillisecondsDisplay({ hasYears = false }: { hasYears?: boolean }) {
  return (
    <div className="countdown-digit-group flex flex-col items-center min-w-14 max-sm:min-w-10">
      <div className="countdown-digit-value countdown-ms-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) tabular-nums">
        <Roller />
      </div>
      <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">
        <span className="max-sm:hidden">Milliseconds</span>
        <span className="sm:hidden">MS</span>
      </div>
    </div>
  );
}

export function MillisecondsDisplayCompact() {
  return (
    <div className="countdown-digit-group compact flex flex-col items-center !min-w-0">
      <div className="countdown-digit-value countdown-ms-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) tabular-nums">
        <Roller />
      </div>
      <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">MS</div>
    </div>
  );
}
