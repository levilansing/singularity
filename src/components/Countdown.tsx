import { useState, useEffect, useMemo } from "react";
import type { Prediction } from "../data/types";
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
      <div className="countdown-header text-[0.85rem] uppercase tracking-[0.15em] text-(--text-muted) mb-6">
        {isPhilosophical
          ? "Time until the singularity"
          : isPast
            ? "Time since the singularity"
            : "Time until the singularity"}
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

      <div className="countdown-prediction-year text-[0.95rem] text-(--text-muted) mb-3">
        {isPhilosophical ? (
          <>
            <strong>{prediction.predictor_name}</strong> didn't set a date — just described the abyss
          </>
        ) : prediction.predicted_year_best ? (
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

      <div className="text-[0.9rem] italic text-(--text-dim) max-w-[500px] mx-auto">{commentary}</div>
    </div>
  );
}
