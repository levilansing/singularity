import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Prediction } from "../data/types";
import { slugify } from "../data/types";
import { TYPE_BADGE, TYPE_LEGEND_ORDER, CONFIDENCE_BADGE, canonicalType, getTypeBadge, getConfidenceBadge } from "../data/colors";

interface BrowseAllProps {
  predictions: Prediction[];
}

type SortKey = "prediction_date" | "predictor_name" | "predicted_year_best";
type SortDir = "asc" | "desc";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-medium border ${colorClass} whitespace-nowrap`}>
      {label}
    </span>
  );
}

function FilterBadge({ label, colorClass, active, groupActive, onClick }: { label: string; colorClass?: string; active: boolean; groupActive: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-medium border cursor-pointer transition-all font-inherit ${active ? colorClass : groupActive ? "bg-transparent border-[#ffffff10] text-(--text-dim) hover:opacity-80" : `${colorClass} opacity-30 hover:opacity-60`}`}
    >
      {label}
    </button>
  );
}

export function BrowseAll({ predictions }: BrowseAllProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("prediction_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.body.className = "urgency-far";
    return () => { document.body.className = ""; };
  }, []);

  const allTypes = useMemo(() => {
    const present = new Set(predictions.map(p => canonicalType(p.prediction_type)));
    return TYPE_LEGEND_ORDER.filter(t => present.has(t));
  }, [predictions]);
  const allConfidenceTypes = useMemo(() => {
    const present = new Set(predictions.map(p => p.confidence_type));
    return ["certain", "high", "medium", "low", "none"].filter(c => present.has(c));
  }, [predictions]);

  const confidenceTypeLabels: Record<string, string> = {
    certain: "Certain",
    high: "High",
    medium: "Medium",
    low: "Low",
    none: "None",
  };

  const filtered = useMemo(() => {
    return predictions.filter(p => {
      if (typeFilter.size > 0 && !typeFilter.has(canonicalType(p.prediction_type))) return false;
      if (confidenceFilter.size > 0 && !confidenceFilter.has(p.confidence_type)) return false;
      return true;
    });
  }, [predictions, typeFilter, confidenceFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "predictor_name":
          cmp = a.predictor_name.localeCompare(b.predictor_name);
          break;
        case "predicted_year_best":
          if (a.predicted_year_best == null && b.predicted_year_best == null) cmp = 0;
          else if (a.predicted_year_best == null) cmp = 1;
          else if (b.predicted_year_best == null) cmp = -1;
          else cmp = a.predicted_year_best - b.predicted_year_best;
          break;
        case "prediction_date":
          cmp = (a.prediction_date || "").localeCompare(b.prediction_date || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "predictor_name" ? "asc" : "desc");
    }
  }

  function toggleFilter(set: Set<string>, value: string, setter: (s: Set<string>) => void, shiftKey: boolean) {
    if (shiftKey) {
      // Shift-click: toggle individual item
      const next = new Set(set);
      if (next.has(value)) next.delete(value); else next.add(value);
      setter(next);
    } else if (set.size === 1 && set.has(value)) {
      // Click the only selected item: deselect (clear)
      setter(new Set());
    } else {
      // Click without shift: select only this one
      setter(new Set([value]));
    }
  }

  const hasFilters = typeFilter.size > 0 || confidenceFilter.size > 0;

  function SortHeader({ label, col, className }: { label: string; col: SortKey; className?: string }) {
    const active = sortKey === col;
    return (
      <th
        className={`py-3 pr-4 font-medium cursor-pointer select-none hover:text-(--text-muted) transition-colors ${className ?? ""}`}
        onClick={() => toggleSort(col)}
      >
        {label} {active ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-8 pb-16 max-sm:px-3 max-sm:pt-4">
      <div className="mb-8">
        <Link to="/" className="text-[0.85rem] text-(--text-dim) hover:text-(--text-muted) transition-colors no-underline">
          ← Back to countdown
        </Link>
      </div>

      <h1 className="font-mono text-[clamp(1.4rem,4vw,2.2rem)] font-bold mb-2 text-(--text)">All {predictions.length} Predictions</h1>
      <p className="text-(--text-muted) text-[0.9rem] mb-6 italic">Every confident guess about the end of human supremacy</p>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="group flex flex-wrap items-center gap-1.5">
          <span className="text-[0.7rem] uppercase tracking-wider text-(--text-dim) mr-0.5">Type</span>
          {allTypes.map(t => (
            <FilterBadge
              key={t}
              label={t}
              colorClass={TYPE_BADGE[t]}
              active={typeFilter.has(t)}
              groupActive={typeFilter.size > 0}
              onClick={(e) => toggleFilter(typeFilter, t, setTypeFilter, e.shiftKey)}
            />
          ))}
        </div>
        <div className="group flex flex-wrap items-center gap-1.5">
          <span className="text-[0.7rem] uppercase tracking-wider text-(--text-dim) mr-0.5">Confidence</span>
          {allConfidenceTypes.map(c => (
            <FilterBadge
              key={c}
              label={confidenceTypeLabels[c] ?? ""}
              colorClass={CONFIDENCE_BADGE[c]}
              active={confidenceFilter.has(c)}
              groupActive={confidenceFilter.size > 0}
              onClick={(e) => toggleFilter(confidenceFilter, c, setConfidenceFilter, e.shiftKey)}
            />
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={() => { setTypeFilter(new Set()); setConfidenceFilter(new Set()); }}
            className="text-[0.75rem] text-(--text-dim) hover:text-(--text-muted) cursor-pointer bg-transparent border-none font-inherit self-start transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {hasFilters && <div className="text-[0.8rem] text-(--text-dim) mb-3">Showing {sorted.length} of {predictions.length}</div>}

      {/* Desktop table */}
      <div className="max-sm:hidden">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="text-left text-(--text-dim) uppercase tracking-wider text-[0.7rem] border-b border-[#ffffff15]">
              <SortHeader label="Date Made" col="prediction_date" />
              <SortHeader label="Predictor" col="predictor_name" />
              <th className="py-3 pr-4 font-medium">Type</th>
              <SortHeader label="Predicted Year" col="predicted_year_best" />
              <th className="py-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/${slugify(p)}`)}
                className="border-b border-[#ffffff08] cursor-pointer hover:bg-[#ffffff08] transition-colors text-(--text-muted)"
              >
                <td className="py-3 pr-4 text-(--text-dim)">{p.prediction_date ? formatDate(p.prediction_date) : "—"}</td>
                <td className="py-3 pr-4 font-medium text-(--text)">{p.predictor_name}</td>
                <td className="py-3 pr-4">
                  <Badge label={canonicalType(p.prediction_type)} colorClass={getTypeBadge(p.prediction_type)} />
                </td>
                <td className="py-3 pr-4">{p.predicted_year_best ?? "—"}</td>
                <td className="py-3">
                  {p.confidence_label ? <Badge label={p.confidence_label} colorClass={getConfidenceBadge(p.confidence_type)} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-2">
        <div className="flex gap-2 mb-2 flex-wrap">
          {(["prediction_date", "predictor_name", "predicted_year_best"] as SortKey[]).map(key => {
            const labels: Record<SortKey, string> = {
              prediction_date: "Date",
              predictor_name: "Name",
              predicted_year_best: "Year",
            };
            const active = sortKey === key;
            return (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`px-3 py-1 rounded-full text-[0.75rem] border transition-colors cursor-pointer font-inherit ${active ? "bg-[#ffffff15] border-[#ffffff25] text-(--text)" : "bg-transparent border-[#ffffff10] text-(--text-dim)"}`}
              >
                {labels[key]} {active ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            );
          })}
        </div>
        {sorted.map((p) => (
          <Link
            key={p.id}
            to={`/${slugify(p)}`}
            className="block p-3 rounded-lg bg-(--bg-card) border border-[#ffffff08] no-underline text-inherit hover:bg-[#ffffff10] transition-colors"
          >
            <div className="flex justify-between items-baseline mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-(--text) text-[0.9rem]">{p.predictor_name}</span>
                {p.prediction_date && <span className="text-[0.7rem] text-(--text-dim)">{formatDate(p.prediction_date)}</span>}
              </div>
              <span className="text-(--text-dim) text-[0.8rem]">{p.predicted_year_best ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-1.5">
                {p.confidence_label && <Badge label={p.confidence_label} colorClass={getConfidenceBadge(p.confidence_type)} />}
              </div>
              <Badge label={canonicalType(p.prediction_type)} colorClass={getTypeBadge(p.prediction_type)} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
