import type { UrgencyLevel } from "../data/types";

interface CountdownDigitProps {
  value: number;
  label: string;
  shortLabel?: string;
  urgency: UrgencyLevel;
  compact?: boolean;
}

export function CountdownDigit({ value, label, shortLabel, urgency, compact = false }: CountdownDigitProps) {
  const isNegative = value < 0;
  const displayValue = Math.abs(value);
  let padLength = 2;
  if (label === "Years" || label === "Y" || label === "Days" || label === "D") padLength = 1;
  if (label === "Milliseconds" || label === "MS") padLength = 3;
  const formatted = String(displayValue).padStart(padLength, "0");

  return (
    <div className={`countdown-digit-group flex flex-col items-center ${compact ? "compact !min-w-0" : "min-w-14 max-sm:min-w-10"} urgency-${urgency}`}>
      <div className="countdown-digit-value font-mono text-[clamp(2rem,6vw,4rem)] font-bold leading-none text-(--text) transition-[color,text-shadow] duration-500 tabular-nums">
        {isNegative && (label === "Days" || label === "D") && <span>-</span>}
        {formatted}
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
