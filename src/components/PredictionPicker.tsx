import { useMemo } from "react";
import type { PredictionSlim } from "../data/types";
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
  predictions: PredictionSlim[];
  selectedId: number;
  onSelect: (id: number) => void;
  onRandom: () => void;
}

const ShuffleIcon = () => (
  <svg width="20" height="15" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 5.37314H4.72872C6.05876 5.37314 7.33433 5.9015 8.27481 6.84198L18.5909 17.158C19.5313 18.0985 20.8069 18.6269 22.137 18.6269H27.9403" stroke="currentColor" strokeWidth="2.86567"/>
    <path d="M25.5181 14.1679L30.7715 18.3081C31.1468 18.6039 31.1328 19.1773 30.7435 19.4545L25.4901 23.1942C25.0158 23.5319 24.3582 23.1928 24.3582 22.6106V14.7305C24.3582 14.1322 25.0482 13.7975 25.5181 14.1679Z" fill="currentColor"/>
    <path d="M25.5181 0.914118L30.7715 5.05441C31.1468 5.35021 31.1328 5.92358 30.7435 6.20072L25.4901 9.94049C25.0158 10.2781 24.3582 9.93905 24.3582 9.35686V1.47679C24.3582 0.878497 25.0482 0.54378 25.5181 0.914118Z" fill="currentColor"/>
    <path d="M0 18.6269H4.72872C6.05876 18.6269 7.33433 18.0985 8.27481 17.158L18.5909 6.84197C19.5313 5.90149 20.8069 5.37313 22.137 5.37313H27.9403" stroke="currentColor" strokeWidth="2.86567"/>
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
    <div className="flex gap-2 mb-6 justify-center flex-wrap">
      <Select value={String(selectedId)} onValueChange={(val) => onSelect(Number(val))}>
        <SelectTrigger className="min-w-[250px] max-w-[400px] max-sm:min-w-0 max-sm:flex-1">
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
      <button onClick={onRandom} className="bg-(--accent) text-white border-none rounded-lg p-2.5 cursor-pointer transition-opacity duration-150 flex items-center hover:opacity-85" title="Random prediction">
        <ShuffleIcon />
      </button>
    </div>
  );
}
