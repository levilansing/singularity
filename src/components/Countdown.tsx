import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import type { PredictionSlim } from "../data/types";
import { getUrgencyLevel } from "../data/types";
import { canonicalType } from "../data/colors";
import { getCommentary } from "../data/commentary";
import { CountdownDigit } from "./CountdownDigit";
import { MillisecondsDisplay } from "./MillisecondsDisplay";
import { ShuffleIcon } from "./ShuffleIcon";
import { ListIcon } from "./ListIcon";
import { useCountdownDom, computeInitialTime } from "../hooks/useCountdownDom";

interface CountdownProps {
  prediction: PredictionSlim;
  onRandom?: () => void;
}

export function Countdown({ prediction, onRandom }: CountdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const urgency = getUrgencyLevel(prediction.target_date, prediction.predicted_year_best !== null);
  const commentary = useMemo(() => getCommentary(urgency, prediction.id), [urgency, prediction.id]);

  const initialTime = prediction.target_date
    ? computeInitialTime(prediction.target_date)
    : null;

  useCountdownDom(prediction.target_date, containerRef);

  const isPast = urgency === "past";
  const isPhilosophical = urgency === "philosophical";

  return (
    <div className={`countdown-container text-center py-7 px-4 mb-8 rounded-xl bg-(--bg-card) border border-[#ffffff08] transition-all duration-500 max-sm:py-5 max-sm:px-3 urgency-${urgency}`}>

      <div className="countdown-prediction-year text-[0.95rem] text-(--text-muted) mb-5 min-h-[2lh]">
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

      {!isPhilosophical && initialTime && (() => {
        const hasYears = initialTime.years !== 0;
        const sepClass = `countdown-separator font-mono ${hasYears ? "text-[clamp(1.5rem,4.5vw,3rem)]" : "text-[clamp(2rem,6vw,4rem)]"} font-bold text-(--text-dim) leading-none pt-[0.1em] shrink-0`;
        return (
          <div ref={containerRef} className={`flex flex-row justify-center items-start gap-1 mb-4 max-sm:gap-[0.1rem] ${hasYears ? "countdown-has-years" : ""}`}>
            {hasYears && (
              <>
                <CountdownDigit unit="years" initialValue={initialTime.years} label="Years" shortLabel="Y" urgency={urgency} />
                <span className={sepClass}>&nbsp;</span>
              </>
            )}
            <CountdownDigit unit="days" initialValue={initialTime.days} label="Days" shortLabel={hasYears ? "D" : undefined} urgency={urgency} />
            <span className={sepClass}>&nbsp;</span>
            <CountdownDigit unit="hours" initialValue={initialTime.hours} label="Hours" shortLabel={hasYears ? "H" : undefined} urgency={urgency} />
            <span className={sepClass}>:</span>
            <CountdownDigit unit="minutes" initialValue={initialTime.minutes} label="Minutes" shortLabel={hasYears ? "M" : undefined} urgency={urgency} />
            <span className={sepClass}>:</span>
            <CountdownDigit unit="seconds" initialValue={initialTime.seconds} label="Seconds" shortLabel={hasYears ? "S" : undefined} urgency={urgency} />
            <span className={sepClass}>.</span>
            <MillisecondsDisplay hasYears={hasYears} />
          </div>
        );
      })()}

      {!isPhilosophical && !initialTime && (
        <div className="font-mono text-2xl text-(--text-muted) py-8">
          <p>No specific date predicted</p>
          <p className="text-[0.9rem] text-(--text-dim) mt-2">Just vibes and existential dread</p>
        </div>
      )}

      <div className="countdown-commentary text-[0.9rem] italic h-12 mb-2 flex justify-center items-center w-full" suppressHydrationWarning>{commentary}</div>

      <div className="flex justify-center gap-4 text-[0.8rem] text-(--text-dim)">
        {onRandom && (
          <button onClick={onRandom} className="hover:text-(--text-muted) transition-colors cursor-pointer bg-transparent border-none font-inherit text-inherit flex items-center gap-1.5">
            <ShuffleIcon size={14} />
            Shuffle
          </button>
        )}
        <Link to="/browse" className="hover:text-(--text-muted) transition-colors no-underline text-inherit inline-flex items-center gap-1.5">
          <ListIcon size={14} /> Browse all predictions
        </Link>
      </div>
    </div>
  );
}
