/** Fields needed by countdown, timeline, picker, browse, sticky header, SingularityInfo */
export interface PredictionSlim {
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
  confidence_type: string;
  confidence_label: string;
  headline: string;
  headline_slug: string;
  target_date: string | null;
}

/** Detail fields fetched per-prediction on demand */
export interface PredictionDetail {
  tldr_summary: string;
  criteria_definition: string;
  confidence_level: string;
  source_name: string;
  source_url: string;
  concept_keys: string[];
}

/** Full prediction — used by prerender script and as the union of slim + detail */
export type Prediction = PredictionSlim & PredictionDetail;

export function getHeadshotPath(predictorName: string): string {
  const slug = predictorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `/headshots/${slug}.jpg`;
}

export function slugify(prediction: PredictionSlim): string {
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
  const countdown = hasCountdown ?? (targetDate !== null);
  if (!targetDate && !countdown) return "philosophical";
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
