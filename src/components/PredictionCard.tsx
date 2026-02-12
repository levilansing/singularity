import type { Prediction } from "../data/types";
import { PredictorAvatar } from "./PredictorAvatar";

interface PredictionCardProps {
  prediction: Prediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  return (
    <div className="prediction-card">
      <div className="prediction-card-header">
        <div className="prediction-card-avatar">
          <PredictorAvatar
            name={prediction.predictor_name}
            headshotLocal={prediction.headshot_local}
          />
        </div>
        <div className="prediction-card-info">
          <h2 className="prediction-card-name">{prediction.predictor_name}</h2>
          <div className="prediction-card-meta">
            <span className="prediction-card-type">{prediction.prediction_type}</span>
            <span className="prediction-card-dot">·</span>
            <span className="prediction-card-date">Predicted in {prediction.prediction_date}</span>
            {prediction.confidence_level && (
              <>
                <span className="prediction-card-dot">·</span>
                <span className="prediction-card-confidence">{prediction.confidence_level}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="prediction-card-headline">{prediction.headline}</h3>
      <p className="prediction-card-summary">{prediction.tldr_summary}</p>

      {prediction.source_url && (
        <a
          href={prediction.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="prediction-card-source"
        >
          {prediction.source_name || "Source"} →
        </a>
      )}
    </div>
  );
}
