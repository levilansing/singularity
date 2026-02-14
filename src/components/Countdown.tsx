import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Prediction } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { canonicalType } from "../data/colors";
import { getCommentary } from "../data/commentary";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplay } from "./MillisecondsDisplay";

interface CountdownProps {
  prediction: Prediction;
  onRandom?: () => void;
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

export function Countdown({ prediction, onRandom }: CountdownProps) {
  const urgency = getUrgencyLevel(prediction.target_date, prediction.has_countdown);
  const [time, setTime] = useState<TimeRemaining | null>(
    prediction.target_date ? computeTimeRemaining(prediction.target_date) : null
  );
  const commentary = useMemo(() => getCommentary(urgency), [urgency, prediction.predictor_name]);

  useEffect(() => {
    if (!prediction.target_date) return;
    setTime(computeTimeRemaining(prediction.target_date));
    const interval = setInterval(() => {
      setTime(computeTimeRemaining(prediction.target_date!));
    }, 1000); // Update every second, CSS handles milliseconds
    return () => clearInterval(interval);
  }, [prediction.target_date]);

  const isPast = urgency === "past";
  const isPhilosophical = urgency === "philosophical";

  return (
    <div className={`countdown-container text-center py-10 px-4 mb-12 rounded-xl bg-(--bg-card) border border-[#ffffff08] transition-all duration-500 max-sm:py-6 max-sm:px-3 urgency-${urgency}`}>

      <div className="countdown-prediction-year text-[0.95rem] text-(--text-muted) mb-8">
        {(() => {
          const year = prediction.prediction_date ? new Date(prediction.prediction_date).getFullYear() : null;
          if (isPhilosophical) {
            return <><strong>{prediction.predictor_name}</strong> didn't set a date — just described the abyss</>;
          }
          if (prediction.predicted_year_best) {
            let byDate = String(prediction.predicted_year_best);
            const dateStr = prediction.target_date ?? prediction.predicted_date_best;
            if (dateStr) {
              const d = new Date(dateStr);
              const month = d.getUTCMonth();
              const day = d.getUTCDate();
              // Show month+year unless it's a year-boundary placeholder (Jan 1 or Dec 31)
              if (!((month === 0 && day === 1) || (month === 11 && day === 31))) {
                byDate = d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
              }
            }
            return <>
              {year ? `In ${year}, ` : ""}<strong>{prediction.predictor_name}</strong>
              {isPast ? " predicted " : " predicted "}
              <strong>{canonicalType(prediction.prediction_type)}</strong> by <strong>{byDate}</strong>
            </>;
          }
          return <><strong>{prediction.predictor_name}</strong> didn't pin down a year. Helpful.</>;
        })()}
      </div>

      {isPhilosophical && (
        <div className="py-6 flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="infinity-symbol">∞</span>
          </div>
          <div className="flex gap-8 font-mono text-[0.7rem] uppercase tracking-widest text-(--text-dim) max-sm:gap-4 max-sm:text-[0.6rem]">
            <span>Days</span>
            <span>Hours</span>
            <span>Minutes</span>
            <span>Seconds</span>
            <span>???</span>
          </div>
        </div>
      )}

      {!isPhilosophical && time && (
        <div className="flex flex-row justify-center items-start gap-1 mb-6 flex-wrap max-sm:gap-[0.1rem]">
          <CountdownDigit value={time.days} label="Days" urgency={urgency} />
          <span className="countdown-separator font-mono text-[clamp(2rem,6vw,4rem)] font-bold text-(--text-dim) leading-none pt-[0.1em] shrink-0">:</span>
          <CountdownDigit value={time.hours} label="Hours" urgency={urgency} />
          <span className="countdown-separator font-mono text-[clamp(2rem,6vw,4rem)] font-bold text-(--text-dim) leading-none pt-[0.1em] shrink-0">:</span>
          <CountdownDigit value={time.minutes} label="Minutes" urgency={urgency} />
          <span className="countdown-separator font-mono text-[clamp(2rem,6vw,4rem)] font-bold text-(--text-dim) leading-none pt-[0.1em] shrink-0">:</span>
          <CountdownDigit value={time.seconds} label="Seconds" urgency={urgency} />
          <span className="countdown-separator font-mono text-[clamp(2rem,6vw,4rem)] font-bold text-(--text-dim) leading-none pt-[0.1em] shrink-0">:</span>
          <MillisecondsDisplay />
        </div>
      )}

      {!isPhilosophical && !time && (
        <div className="font-mono text-2xl text-(--text-muted) py-8">
          <p>No specific date predicted</p>
          <p className="text-[0.9rem] text-(--text-dim) mt-2">Just vibes and existential dread</p>
        </div>
      )}

      <div className="countdown-commentary text-[0.9rem] italic h-16 mb-3 flex justify-center items-center w-full">{commentary}</div>

      <div className="flex justify-center gap-4 text-[0.8rem] text-(--text-dim)">
        {onRandom && (
          <button onClick={onRandom} className="hover:text-(--text-muted) transition-colors cursor-pointer bg-transparent border-none font-inherit text-inherit">
            ↻ Shuffle
          </button>
        )}
        <Link to="/browse" className="hover:text-(--text-muted) transition-colors no-underline text-inherit">
          Browse all predictions →
        </Link>
      </div>
    </div>
  );
}
