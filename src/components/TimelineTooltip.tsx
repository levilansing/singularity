import type { Prediction } from "../data/types";

interface TimelineTooltipProps {
  prediction: Prediction;
  x: number;
  y: number;
}

export function TimelineTooltip({ prediction, x, y }: TimelineTooltipProps) {
  return (
    <div
      className="absolute pointer-events-none bg-[#1a1a28ee] border border-[#ffffff20] rounded-lg px-3 py-2.5 max-w-[280px] z-50 text-[0.8rem] shadow-[0_4px_20px_#00000060]"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="font-semibold text-(--text) mb-0.5">{prediction.predictor_name}</div>
      {prediction.predicted_year_best && (
        <div className="font-mono font-bold text-(--accent) text-[0.9rem]">{prediction.predicted_year_best}</div>
      )}
      <div className="text-[0.7rem] text-(--text-muted) mb-1">{prediction.prediction_type}</div>
      <div className="text-(--text-muted) leading-snug text-xs">{prediction.headline}</div>
    </div>
  );
}
