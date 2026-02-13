import { useState } from "react";
import { CONCEPTS } from "../data/concepts";
import type { Prediction } from "../data/types";

interface ConceptBlurbsProps {
  prediction: Prediction;
}

export function ConceptBlurbs({ prediction }: ConceptBlurbsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const relevantConcepts = prediction.concept_keys
    .map((key) => CONCEPTS[key])
    .filter(Boolean);

  if (relevantConcepts.length === 0) return null;

  return (
    <section className="mb-10">
      <h3 className="font-mono text-[0.75rem] font-bold text-(--text-muted) m-0 mb-3 uppercase tracking-widest">
        Concepts at play
      </h3>
      <div className="flex flex-col gap-2">
        {relevantConcepts.map((concept) => (
          <div
            key={concept.key}
            className="bg-(--bg-card) border border-[#ffffff08] rounded-lg overflow-hidden"
          >
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#ffffff05] transition-colors"
              onClick={() =>
                setExpanded(expanded === concept.key ? null : concept.key)
              }
            >
              <span className="text-[0.85rem] font-semibold text-(--text)">
                {concept.label}
              </span>
              <span className="text-(--text-dim) text-[0.7rem] shrink-0">
                {expanded === concept.key ? "▲" : "▼"}
              </span>
            </button>
            {expanded === concept.key && (
              <div className="px-4 pb-4 text-[0.8rem] text-(--text-muted) leading-relaxed border-t border-[#ffffff06]">
                <p className="m-0 mt-3">{concept.blurb}</p>
                {concept.learnMoreUrl && (
                  <a
                    href={concept.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--accent) text-[0.75rem] font-medium mt-2 block"
                  >
                    Read more →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
