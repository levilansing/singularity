import { useState } from "react";
import type { PredictionSlim } from "../data/types";

interface ShareButtonProps {
  prediction: PredictionSlim;
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
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.01083 7.88084L8.995 10.2025M8.98917 3.7975L5.01083 6.11917M12.25 2.91667C12.25 3.88317 11.4665 4.66667 10.5 4.66667C9.5335 4.66667 8.75 3.88317 8.75 2.91667C8.75 1.95017 9.5335 1.16667 10.5 1.16667C11.4665 1.16667 12.25 1.95017 12.25 2.91667ZM5.25 7C5.25 7.9665 4.4665 8.75 3.5 8.75C2.5335 8.75 1.75 7.9665 1.75 7C1.75 6.03351 2.5335 5.25 3.5 5.25C4.4665 5.25 5.25 6.03351 5.25 7ZM12.25 11.0833C12.25 12.0498 11.4665 12.8333 10.5 12.8333C9.5335 12.8333 8.75 12.0498 8.75 11.0833C8.75 10.1168 9.5335 9.33334 10.5 9.33334C11.4665 9.33334 12.25 10.1168 12.25 11.0833Z" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
