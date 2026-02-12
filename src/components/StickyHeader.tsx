import { useState, useEffect } from "react";
import type { Prediction } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplayCompact } from "./MillisecondsDisplay";

interface StickyHeaderProps {
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

export function StickyHeader({ prediction }: StickyHeaderProps) {
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
    <div className={`sticky-header ${isVisible ? "visible" : ""} urgency-${urgency}`}>
      <div className="sticky-header-content">
        {isPhilosophical && (
          <div className="sticky-header-countdown">
            <span className="sticky-infinity">∞</span>
          </div>
        )}
        {!isPhilosophical && time && (
          <div className="sticky-header-countdown">
            <CountdownDigit value={time.days} label="D" urgency={urgency} compact />
            <span className="sticky-separator">:</span>
            <CountdownDigit value={time.hours} label="H" urgency={urgency} compact />
            <span className="sticky-separator">:</span>
            <CountdownDigit value={time.minutes} label="M" urgency={urgency} compact />
            <span className="sticky-separator">:</span>
            <CountdownDigit value={time.seconds} label="S" urgency={urgency} compact />
            <span className="sticky-separator">:</span>
            <MillisecondsDisplayCompact />
          </div>
        )}
        <div className="sticky-header-info">
          <span className="sticky-header-label">
            {isPhilosophical ? "Beyond time" : isPast ? "Since" : "Until"} {isPhilosophical ? "" : "the singularity"}
          </span>
          <span className="sticky-header-prediction">
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
      </div>
    </div>
  );
}
