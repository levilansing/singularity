import type { PredictionSlim } from "../data/types";
import { getHeadshotPath } from "../data/types";
import { canonicalType, getTypeHex, getTypeBadge } from "../data/colors";
import { PredictorAvatar } from "./PredictorAvatar";

interface TimelineTooltipProps {
  prediction: PredictionSlim;
  x: number;
  y: number;
}

function formatPredictedDate(p: PredictionSlim): string | null {
  const dateStr = p.target_date ?? p.predicted_date_best;
  if (!dateStr) return p.predicted_year_best ? String(p.predicted_year_best) : null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return p.predicted_year_best ? String(p.predicted_year_best) : null;
  const month = d.getUTCMonth(); // 0-indexed
  const day = d.getUTCDate();
  // Show month+year unless it's a year-boundary placeholder (Jan 1 or Dec 31)
  if ((month === 0 && day === 1) || (month === 11 && day === 31)) {
    return String(d.getUTCFullYear());
  }
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function formatMadeDate(dateStr: string): { label: string; prefix: string } {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { label: dateStr.slice(0, 4), prefix: "in" };
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  // Year-boundary placeholder → "in YYYY"
  if ((month === 0 && day === 1) || (month === 11 && day === 31)) {
    return { label: String(d.getUTCFullYear()), prefix: "in" };
  }
  // Has a specific day that isn't a boundary → "on Mon DD, YYYY"
  if (day !== 1) {
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
      prefix: "on",
    };
  }
  // First of month (likely month-level precision) → "in Mon YYYY"
  return {
    label: d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
    prefix: "in",
  };
}

export function TimelineTooltip({ prediction, x, y }: TimelineTooltipProps) {
  const bestDate = formatPredictedDate(prediction);
  const type = canonicalType(prediction.prediction_type);
  const typeColor = getTypeHex(prediction.prediction_type);
  const typeBadge = getTypeBadge(prediction.prediction_type);
  const made = formatMadeDate(prediction.prediction_date);

  return (
    <div
      className="absolute pointer-events-none bg-[#1a1a28ee] border border-[#ffffff20] rounded-lg px-3 py-2.5 w-[320px] md:w-[380px] z-50 text-[0.8rem] shadow-[0_4px_20px_#00000060]"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Top row: avatar + name/date on left, target date + type on right */}
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5">
          <PredictorAvatar name={prediction.predictor_name} headshotLocal={getHeadshotPath(prediction.predictor_name)} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-(--text) leading-tight truncate">{prediction.predictor_name}</div>
              <div className="text-[0.65rem] text-(--text-dim) font-mono mt-0.5">Predicted {made.prefix} {made.label}</div>
            </div>
            <div className="shrink-0 text-right">
              {bestDate && (
                <div className="font-mono font-bold text-[0.85rem] leading-tight" style={{ color: typeColor }}>{bestDate}</div>
              )}
              <div className={`inline-block text-[0.6rem] font-mono px-1.5 py-0.5 rounded-full border mt-0.5 ${typeBadge}`}>
                {type}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="text-(--text-muted) leading-snug text-xs mt-2">{prediction.headline}</div>
    </div>
  );
}
