import type { PredictionSlim, PredictionDetail } from "../data/types";
import { getHeadshotPath } from "../data/types";
import { getTypeBadge, getConfidenceBadge } from "../data/colors";
import { PredictorAvatar } from "./PredictorAvatar";
import { ShareButton } from "./ShareButton";

interface PredictionCardProps {
  prediction: PredictionSlim;
  detail: PredictionDetail | null;
}

export function PredictionCard({ prediction, detail }: PredictionCardProps) {
  const predictionYear = prediction.prediction_date.length === 4
    ? prediction.prediction_date
    : new Date(prediction.prediction_date).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  const targetYear = prediction.predicted_year_best
    ? prediction.predicted_year_best.toString()
    : prediction.predicted_date_best
      ? new Date(prediction.predicted_date_best).getFullYear().toString()
      : "Undefined";

  const displayType = prediction.prediction_type.startsWith("AGI")
    ? "AGI"
    : prediction.prediction_type === "HLMI"
      ? "Human-level AI"
      : prediction.prediction_type;

  return (
    <div className="bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
      {/* Predictor header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="shrink-0 size-14 rounded-full overflow-hidden">
          <PredictorAvatar
            key={prediction.id}
            name={prediction.predictor_name}
            headshotLocal={getHeadshotPath(prediction.predictor_name)}
          />
        </div>
        <h2 className="text-[1.1rem] font-semibold m-0 text-(--text)">{prediction.predictor_name}</h2>
      </div>

      {/* Metadata stat block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 px-1">
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Predicted</div>
          <div className="text-[0.85rem] text-(--text-muted) font-medium">{predictionYear}</div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Target</div>
          <div className="text-[0.85rem] text-(--text-muted) font-medium">{targetYear}</div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Type</div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-medium border ${getTypeBadge(prediction.prediction_type)}`}>{displayType}</span>
          </div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Confidence</div>
          <div className="flex items-center">
            {prediction.confidence_label ? (
              <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-medium border whitespace-nowrap ${getConfidenceBadge(prediction.confidence_type)}`}>
                {prediction.confidence_label}
              </span>
            ) : (
              <span className="text-[0.8rem] text-(--text-dim)">—</span>
            )}
          </div>
        </div>
      </div>

      {/* "How wrong were they?" badge for past predictions */}
      {prediction.target_date && new Date(prediction.target_date).getTime() < Date.now() && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#ff444410] border border-[#ff444420]">
          <span className="text-[1rem] leading-none">💀</span>
          <span className="text-[0.8rem] text-[#ff6666] font-mono" suppressHydrationWarning>
            {(() => {
              const days = Math.floor((Date.now() - new Date(prediction.target_date!).getTime()) / (1000 * 60 * 60 * 24));
              if (days < 365) return `${days} days overdue — any minute now...`;
              const years = Math.floor(days / 365);
              return `${years} ${years === 1 ? "year" : "years"} overdue — still waiting...`;
            })()}
          </span>
        </div>
      )}

      {/* Content */}
      <h3 className="text-base font-semibold m-0 mb-2 text-(--text) leading-snug">{prediction.headline}</h3>
      {detail ? (
        <p className="text-[0.85rem] text-(--text-muted) leading-relaxed m-0 mb-3 animate-[fadeIn_0.3s_ease-in]">{detail.tldr_summary}</p>
      ) : (
        <div className="h-[3.6rem] mb-3 rounded bg-[#ffffff08] animate-pulse" />
      )}

      <div className="flex items-center justify-between">
        {detail?.source_url ? (
          <a
            href={detail.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.8rem] text-(--accent) font-medium"
          >
            {detail.source_name || "Source"} →
          </a>
        ) : <span />}
        <ShareButton prediction={prediction} />
      </div>
    </div>
  );
}
