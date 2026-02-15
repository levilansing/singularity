export interface Prediction {
  id: number;
  predictor_name: string;
  predictor_type: string;
  prediction_date: string;
  predicted_date_low: string | null;
  predicted_date_high: string | null;
  predicted_date_best: string | null;
  predicted_year_low: number | null;
  predicted_year_high: number | null;
  predicted_year_best: number | null;
  prediction_type: string;
  confidence_level: string;
  confidence_label: string;
  confidence_type: string;
  concept_keys: string[];
  criteria_definition: string;
  source_name: string;
  source_url: string;
  headshot_url: string;
  headline: string;
  headline_slug: string;
  tldr_summary: string;
  graphic_url: string;
  target_date: string | null;
  has_countdown: boolean;
  headshot_local: string | null;
}

export function slugify(prediction: Prediction): string {
  return `${prediction.id}/${prediction.headline_slug}`;
}

/** Convert a date string (YYYY-MM-DD or YYYY) to a fractional year for plotting */
export function dateToFractionalYear(dateStr: string): number {
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (dateStr.length <= 4) return year;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return year;
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return year + (d.getTime() - start) / (end - start);
}

export type UrgencyLevel = "past" | "imminent" | "near" | "far" | "philosophical";

export function getUrgencyLevel(targetDate: string | null, hasCountdown?: boolean): UrgencyLevel {
  if (!targetDate && !hasCountdown) return "philosophical";
  if (!targetDate) return "far";
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  if (diff <= 0) return "past";
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const fifteenYears = 15 * oneYear;
  if (diff < oneYear) return "imminent";
  if (diff < fifteenYears) return "near";
  return "far";
}
