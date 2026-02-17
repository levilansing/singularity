import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { PredictionSlim } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplayCompact } from "./MillisecondsDisplay";
import { ShuffleIcon } from "./ShuffleIcon";
import { ListIcon } from "./ListIcon";
import { useCountdownDom, computeInitialTime } from "../hooks/useCountdownDom";

interface StickyHeaderProps {
  prediction: PredictionSlim;
  onRandom?: () => void;
}

export function StickyHeader({ prediction, onRandom }: StickyHeaderProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const urgency = getUrgencyLevel(prediction.target_date, prediction.predicted_year_best !== null);

  const initialTime = prediction.target_date
    ? computeInitialTime(prediction.target_date)
    : null;

  useCountdownDom(prediction.target_date, containerRef);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        {!isPhilosophical && initialTime && (() => {
          const hasYears = initialTime.years !== 0;
          const sepClass = "font-mono text-[1.2rem] font-bold text-(--text-dim) leading-snug max-sm:text-[1rem]";
          return (
            <div ref={containerRef} className="flex items-start gap-[0.15rem] max-sm:gap-[0.1rem]">
              {hasYears && (
                <>
                  <CountdownDigit unit="years" initialValue={initialTime.years} label="Y" urgency={urgency} compact />
                  <span className={sepClass}>&nbsp;</span>
                </>
              )}
              <CountdownDigit unit="days" initialValue={initialTime.days} label="D" urgency={urgency} compact />
              <span className={sepClass}>&nbsp;</span>
              <CountdownDigit unit="hours" initialValue={initialTime.hours} label="H" urgency={urgency} compact />
              <span className={sepClass}>:</span>
              <CountdownDigit unit="minutes" initialValue={initialTime.minutes} label="M" urgency={urgency} compact />
              <span className={sepClass}>:</span>
              <CountdownDigit unit="seconds" initialValue={initialTime.seconds} label="S" urgency={urgency} compact />
              {/* <span className={sepClass}>.</span>
              <MillisecondsDisplayCompact /> */}
            </div>
          );
        })()}
        <div className="flex flex-col gap-0.5 max-sm:text-center">
          <span className="text-[0.7rem] uppercase tracking-[0.1em] text-(--text-muted) max-sm:hidden">
            {isPhilosophical ? "Eventually" : isPast ? "Since" : "Until"} {isPhilosophical ? "" : "the singularity"}
          </span>
          <span className="sticky-header-prediction text-[0.85rem] text-(--text-muted) flex items-center gap-2">
            <span>
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
            {onRandom && (
              <button
                onClick={onRandom}
                className="group relative p-1 rounded-md text-(--text-dim) hover:text-(--text) hover:bg-[#ffffff0a] transition-colors cursor-pointer"
              >
                <ShuffleIcon size={16} />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-[0.65rem] bg-[#1a1a2e] text-(--text-muted) rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">Shuffle</span>
              </button>
            )}
            <button
              onClick={() => navigate("/browse")}
              className="group relative p-1 rounded-md text-(--text-dim) hover:text-(--text) hover:bg-[#ffffff0a] transition-colors cursor-pointer"
            >
              <ListIcon size={16} />
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-[0.65rem] bg-[#1a1a2e] text-(--text-muted) rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">Browse all</span>
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
