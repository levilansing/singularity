import { useState, useEffect } from "react";
import type { Prediction } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplayCompact } from "./MillisecondsDisplay";
import { ShuffleIcon } from "./ShuffleIcon";

interface StickyHeaderProps {
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

export function StickyHeader({ prediction, onRandom }: StickyHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const urgency = getUrgencyLevel(prediction.target_date, prediction.has_countdown);
  const [time, setTime] = useState<TimeRemaining | null>(
    prediction.target_date ? computeTimeRemaining(prediction.target_date) : null
  );

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header when scrolled down more than 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className={`sticky-header fixed top-0 left-0 right-0 z-[100] border-b border-[#ffffff08] backdrop-blur-[10px] bg-[#12121ae6] -translate-y-full transition-[transform,box-shadow] duration-300 ${isVisible ? "visible" : ""} urgency-${urgency}`}>
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap max-sm:px-3 max-sm:py-2 max-sm:justify-center">
        {isPhilosophical && (
          <div className="flex items-start gap-[0.15rem]">
            <span className="font-mono text-2xl font-extralight text-(--accent)">∞</span>
          </div>
        )}
        {!isPhilosophical && time && (
          <div className="flex items-start gap-[0.15rem] max-sm:gap-[0.1rem]">
            <CountdownDigit value={time.days} label="D" urgency={urgency} compact />
            <span className="font-mono text-[1.2rem] font-bold text-(--text-dim) leading-snug max-sm:text-[1rem]">:</span>
            <CountdownDigit value={time.hours} label="H" urgency={urgency} compact />
            <span className="font-mono text-[1.2rem] font-bold text-(--text-dim) leading-snug max-sm:text-[1rem]">:</span>
            <CountdownDigit value={time.minutes} label="M" urgency={urgency} compact />
            <span className="font-mono text-[1.2rem] font-bold text-(--text-dim) leading-snug max-sm:text-[1rem]">:</span>
            <CountdownDigit value={time.seconds} label="S" urgency={urgency} compact />
            <span className="font-mono text-[1.2rem] font-bold text-(--text-dim) leading-snug max-sm:text-[1rem]">:</span>
            <MillisecondsDisplayCompact />
          </div>
        )}
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-0.5 max-sm:text-center">
            <span className="text-[0.7rem] uppercase tracking-[0.1em] text-(--text-muted)">
              {isPhilosophical ? "Beyond time" : isPast ? "Since" : "Until"} {isPhilosophical ? "" : "the singularity"}
            </span>
            <span className="sticky-header-prediction text-[0.85rem] text-(--text-muted)">
              {isPhilosophical ? (
                <strong>{prediction.predictor_name}</strong>
              ) : (
                <>
                  According to <strong>{prediction.predictor_name}</strong>
                  {prediction.predicted_year_best && (
                    <> ({prediction.predicted_year_best})</>
                  )}
                </>
              )}
            </span>
          </div>
          {onRandom && (
            <button
              onClick={onRandom}
              title="Random prediction"
              className="ml-auto p-1.5 rounded-md text-(--text-dim) hover:text-(--text) hover:bg-[#ffffff0a] transition-colors cursor-pointer max-sm:ml-0"
            >
              <ShuffleIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
