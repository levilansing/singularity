import type { UrgencyLevel } from "../data/types";

interface CountdownDigitProps {
  unit: string;
  initialValue: number;
  label: string;
  shortLabel?: string;
  urgency: UrgencyLevel;
  compact?: boolean;
}

export function CountdownDigit({ unit, initialValue, label, shortLabel, urgency, compact = false }: CountdownDigitProps) {
  const isNegative = initialValue < 0;
  const displayValue = Math.abs(initialValue);
  const padLength = (unit === "years" || unit === "days") ? 1 : 2;
  const formatted = String(displayValue).padStart(padLength, "0");

  return (
    <div className={`countdown-digit-group flex flex-col items-center ${compact ? "compact !min-w-0" : "min-w-14 max-sm:min-w-10"} urgency-${urgency}`}>
      <div className="countdown-digit-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) transition-[color,text-shadow] duration-500 tabular-nums" suppressHydrationWarning>
        <span data-neg style={{ display: isNegative ? undefined : "none" }}>-</span>
        <span data-unit={unit}>{formatted}</span>
      </div>
      {shortLabel ? (
        <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">
          <span className="max-sm:hidden">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </div>
      ) : (
        <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5">{label}</div>
      )}
    </div>
  );
}
