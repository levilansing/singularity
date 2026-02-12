import type { UrgencyLevel } from "../data/types";

interface CountdownDigitProps {
  value: number;
  label: string;
  urgency: UrgencyLevel;
  compact?: boolean;
}

export function CountdownDigit({ value, label, urgency, compact = false }: CountdownDigitProps) {
  const isNegative = value < 0;
  const displayValue = Math.abs(value);
  let padLength = 2;
  if (label === "Days" || label === "D") padLength = 1;
  if (label === "Milliseconds" || label === "MS") padLength = 3;
  const formatted = String(displayValue).padStart(padLength, "0");

  return (
    <div className={`countdown-digit-group urgency-${urgency} ${compact ? "compact" : ""}`}>
      <div className="countdown-digit-value">
        {isNegative && (label === "Days" || label === "D") && <span className="countdown-negative">-</span>}
        {formatted}
      </div>
      <div className="countdown-digit-label">{label}</div>
    </div>
  );
}
