export interface Prediction {
  id: number;
  predictor_name: string;
  predictor_type: string;
  prediction_date: string;
  predicted_year_low: number | null;
  predicted_year_high: number | null;
  predicted_year_best: number | null;
  prediction_type: string;
  confidence_level: string;
  criteria_definition: string;
  source_name: string;
  source_url: string;
  headshot_url: string;
  headline: string;
  tldr_summary: string;
  graphic_url: string;
  target_date: string | null;
  has_countdown: boolean;
  headshot_local: string | null;
}

export function slugify(prediction: Prediction): string {
  return prediction.predictor_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
