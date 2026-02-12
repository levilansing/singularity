import { useState, useEffect, useCallback } from "react";
import type { Prediction, UrgencyLevel } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { getCommentary } from "../data/commentary";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplay } from "./MillisecondsDisplay";

interface CountdownProps {
  prediction: Prediction;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

function computeTimeRemaining(targetDate: string): TimeRemaining {
  const diff = new Date(targetDate).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;

  const milliseconds = Math.floor(absDiff % 1000);
  const seconds = Math.floor(absDiff / 1000) % 60;
  const minutes = Math.floor(absDiff / (1000 * 60)) % 60;
  const hours = Math.floor(absDiff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  return {
    days: days * sign,
    hours,
    minutes,
    seconds,
    milliseconds,
  };
}

export function Countdown({ prediction }: CountdownProps) {
  const urgency = getUrgencyLevel(prediction.target_date);
  const [time, setTime] = useState<TimeRemaining | null>(
    prediction.target_date ? computeTimeRemaining(prediction.target_date) : null
  );
  const [commentary] = useState(() => getCommentary(urgency));

  useEffect(() => {
    if (!prediction.target_date) return;
    setTime(computeTimeRemaining(prediction.target_date));
    const interval = setInterval(() => {
      setTime(computeTimeRemaining(prediction.target_date!));
    }, 1000); // Update every second, CSS handles milliseconds
    return () => clearInterval(interval);
  }, [prediction.target_date]);

  const isPast = urgency === "past";

  return (
    <div className={`countdown-container urgency-${urgency}`}>
      <div className="countdown-header">
        {isPast ? "Time since the singularity" : "Time until the singularity"}
      </div>

      {time && (
        <div className="countdown-digits">
          <CountdownDigit value={time.days} label="Days" urgency={urgency} />
          <span className="countdown-separator">:</span>
          <CountdownDigit value={time.hours} label="Hours" urgency={urgency} />
          <span className="countdown-separator">:</span>
          <CountdownDigit value={time.minutes} label="Minutes" urgency={urgency} />
          <span className="countdown-separator">:</span>
          <CountdownDigit value={time.seconds} label="Seconds" urgency={urgency} />
          <span className="countdown-separator">:</span>
          <MillisecondsDisplay />
        </div>
      )}

      {!time && (
        <div className="countdown-no-date">
          <p>No specific date predicted</p>
          <p className="countdown-subtitle">Just vibes and existential dread</p>
        </div>
      )}

      <div className="countdown-prediction-year">
        {prediction.predicted_year_best ? (
          <>
            According to <strong>{prediction.predictor_name}</strong>
            {isPast ? ", it already happened in " : ", expect it around "}
            <strong>{prediction.predicted_year_best}</strong>
          </>
        ) : (
          <>
            <strong>{prediction.predictor_name}</strong> didn't pin down a year. Helpful.
          </>
        )}
      </div>

      <div className="countdown-commentary">{commentary}</div>
    </div>
  );
}
