import type { Prediction } from "../data/types";
import { canonicalType } from "../data/colors";

interface TimelineTooltipProps {
  prediction: Prediction;
  x: number;
  y: number;
}

function formatPredictedDate(p: Prediction): string | null {
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

function formatYearRange(p: Prediction): string | null {
  if (!p.predicted_year_low && !p.predicted_year_high) return null;
  const low = p.predicted_year_low ?? "?";
  const high = p.predicted_year_high ?? "?";
  return `${low}–${high}`;
}

export function TimelineTooltip({ prediction, x, y }: TimelineTooltipProps) {
  const bestDate = formatPredictedDate(prediction);
  const range = formatYearRange(prediction);

  return (
    <div
      className="absolute pointer-events-none bg-[#1a1a28ee] border border-[#ffffff20] rounded-lg px-3 py-2.5 max-w-[280px] z-50 text-[0.8rem] shadow-[0_4px_20px_#00000060]"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="flex justify-between items-baseline gap-3">
        <div className="font-semibold text-(--text) mb-0.5">{prediction.predictor_name}</div>
        {range && <div className="text-[0.65rem] text-(--text-dim) font-mono whitespace-nowrap">{range}</div>}
      </div>
      {bestDate && (
        <div className="font-mono font-bold text-(--accent) text-[0.9rem]">{bestDate}</div>
      )}
      <div className="text-[0.7rem] text-(--text-muted) mb-1">{canonicalType(prediction.prediction_type)}</div>
      <div className="text-(--text-muted) leading-snug text-xs">{prediction.headline}</div>
    </div>
  );
}
