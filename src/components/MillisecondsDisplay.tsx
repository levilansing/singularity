const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function DigitStrip({ className }: { className: string }) {
  return (
    <span className={`ms-strip ${className}`} aria-hidden="true">
      {digits.map((d) => (
        <span key={d}>{d}</span>
      ))}
    </span>
  );
}

function Roller() {
  return (
    <span className="ms-roller">
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
  return (
    <div className="countdown-digit-group compact flex flex-col items-center !min-w-0">
      <div className="countdown-digit-value countdown-ms-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) tabular-nums">
        <Roller />
      </div>
      <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">MS</div>
    </div>
  );
}
