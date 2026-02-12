import type { Prediction } from "../data/types";

interface TimelineTooltipProps {
  prediction: Prediction;
  x: number;
  y: number;
}

export function TimelineTooltip({ prediction, x, y }: TimelineTooltipProps) {
  return (
    <div
      className="timeline-tooltip"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="timeline-tooltip-name">{prediction.predictor_name}</div>
      {prediction.predicted_year_best && (
        <div className="timeline-tooltip-year">{prediction.predicted_year_best}</div>
      )}
      <div className="timeline-tooltip-type">{prediction.prediction_type}</div>
      <div className="timeline-tooltip-headline">{prediction.headline}</div>
    </div>
  );
}
