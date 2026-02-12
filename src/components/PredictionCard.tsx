import { useState } from "react";
import type { Prediction } from "../data/types";

interface PredictionCardProps {
  prediction: Prediction;
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/[\s&]+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  // Deterministic color from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className="prediction-card-initials"
      style={{ backgroundColor: `hsl(${hue}, 40%, 30%)` }}
    >
      {initials}
    </div>
  );
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = prediction.headshot_local && !imgError;

  return (
    <div className="prediction-card">
      <div className="prediction-card-header">
        <div className="prediction-card-avatar">
          {hasImage ? (
            <img
              src={prediction.headshot_local!}
              alt={prediction.predictor_name}
              className="prediction-card-headshot"
              onError={() => setImgError(true)}
            />
          ) : (
            <Initials name={prediction.predictor_name} />
          )}
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
