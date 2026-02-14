import { useState } from "react";
import type { Prediction } from "../data/types";

interface ShareButtonProps {
  prediction: Prediction;
}

export function ShareButton({ prediction }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const days = prediction.target_date
      ? Math.floor((new Date(prediction.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const message = days !== null
      ? days > 0
        ? `According to ${prediction.predictor_name}, we have ${days.toLocaleString()} days until ${prediction.prediction_type}. No pressure.`
        : `According to ${prediction.predictor_name}, ${prediction.prediction_type} was supposed to happen ${Math.abs(days).toLocaleString()} days ago. Awkward.`
      : `${prediction.predictor_name} thinks ${prediction.prediction_type} is coming... eventually.`;

    const url = window.location.href;
    const text = `${message}\n${url}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) {
        navigator.share({ text: message, url });
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-[0.8rem] text-(--text-dim) hover:text-(--text-muted) cursor-pointer transition-colors font-mono flex items-center gap-1.5"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
