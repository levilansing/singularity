import { CONCEPTS, type Concept } from "../data/concepts";
import type { Prediction } from "../data/types";
import { CONCEPT_ICONS, type IconProps } from "./ConceptIcons";

function LightbulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>
    </svg>
  );
}

interface ConceptBlurbsProps {
  prediction: Prediction;
}

export function ConceptBlurbs({ prediction }: ConceptBlurbsProps) {
  const relevantConcepts = prediction.concept_keys
    .map((key) => CONCEPTS[key])
    .filter(Boolean) as Concept[];

  if (relevantConcepts.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-center gap-2 mt-12 mb-4">
        <span className="text-(--accent)"><LightbulbIcon /></span>
        <h3 className="font-mono text-[0.75rem] font-bold text-(--text-muted) m-0 uppercase tracking-widest">
          Concepts at Play
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        {relevantConcepts.map((concept) => (
          <div
            key={concept.key}
            className="bg-(--bg-card) border border-[#ffffff08] rounded-lg p-4"
          >
            <h4 className="text-[0.85rem] font-semibold text-(--text) m-0 mb-2 flex items-center gap-2">
              {CONCEPT_ICONS[concept.key] && (() => { const Icon = CONCEPT_ICONS[concept.key] as React.FC<IconProps>; return <Icon size="1.3em" />; })()}
              {concept.label}
            </h4>
            <p className="m-0 text-[0.8rem] text-(--text-muted) leading-relaxed">{concept.blurb}</p>
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
        ))}
      </div>
    </section>
  );
}
