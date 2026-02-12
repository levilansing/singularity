import { useMemo } from "react";
import type { Prediction } from "../data/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./Select";

interface PredictionPickerProps {
  predictions: Prediction[];
  selectedId: number;
  onSelect: (id: number) => void;
  onRandom: () => void;
}

const SwapIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="swap-icon"
  >
    <path
      d="M3 6L7 2M7 2L7 10M7 2L11 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 14L13 18M13 18L13 10M13 18L9 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function PredictionPicker({ predictions, selectedId, onSelect, onRandom }: PredictionPickerProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, Prediction[]> = {};
    for (const p of predictions) {
      const key = p.prediction_type || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    // Sort groups by name, sort predictions within groups by year
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, preds]) => ({
        type,
        predictions: [...preds].sort((a, b) => (a.predicted_year_best ?? 9999) - (b.predicted_year_best ?? 9999)),
      }));
  }, [predictions]);

  const selectedPrediction = predictions.find((p) => p.id === selectedId);
  const selectedLabel = selectedPrediction
    ? `${selectedPrediction.predictor_name}${
        selectedPrediction.predicted_year_best ? ` (${selectedPrediction.predicted_year_best})` : " (no date)"
      }`
    : "Select a prediction";

  return (
    <div className="prediction-picker">
      <Select value={String(selectedId)} onValueChange={(val) => onSelect(Number(val))}>
        <SelectTrigger className="prediction-picker-select">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {grouped.map((group) => (
            <SelectGroup key={group.type}>
              <SelectLabel>{group.type}</SelectLabel>
              {group.predictions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.predictor_name}
                  {p.predicted_year_best ? ` (${p.predicted_year_best})` : " (no date)"}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <button onClick={onRandom} className="prediction-picker-random" title="Random prediction">
        <SwapIcon />
        <span>Random</span>
      </button>
    </div>
  );
}
