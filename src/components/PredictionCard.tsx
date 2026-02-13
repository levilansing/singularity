import type { Prediction } from "../data/types";
import { PredictorAvatar } from "./PredictorAvatar";

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <div className="bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 mb-16 max-sm:p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="shrink-0 size-14 rounded-full overflow-hidden">
          <PredictorAvatar
            name={prediction.predictor_name}
            headshotLocal={prediction.headshot_local}
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-[1.1rem] font-semibold m-0 mb-1 text-(--text)">{prediction.predictor_name}</h2>
          <div className="flex flex-wrap items-center gap-1.5 text-[0.8rem] text-(--text-muted)">
            <span className="bg-[#8b5cf620] text-[#a78bfa] px-2 py-0.5 rounded-full text-[0.7rem] font-medium">{prediction.prediction_type}</span>
            <span className="text-(--text-dim)">·</span>
            <span>Predicted in {prediction.prediction_date}</span>
            {prediction.confidence_level && (
              <>
                <span className="text-(--text-dim)">·</span>
                <span>{prediction.confidence_level}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-base font-semibold m-0 mb-2 text-(--text) leading-snug">{prediction.headline}</h3>
      <p className="text-[0.85rem] text-(--text-muted) leading-relaxed m-0 mb-3">{prediction.tldr_summary}</p>

      {prediction.source_url && (
        <a
          href={prediction.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8rem] text-(--accent) font-medium"
        >
          {prediction.source_name || "Source"} →
        </a>
      )}
    </div>
  );
}
