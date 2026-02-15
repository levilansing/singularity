export interface IconProps {
  size?: string | number;
}

const s: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  flexShrink: 0,
};

/** Intelligence Explosion — recursive arrows spiraling outward from a core */
export function IntelligenceExplosionConceptIcon({ size = "1.4em" }: IconProps) {
  const c = "#f97316"; // orange — explosive energy
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <circle cx="12" cy="12" r="2.5" fill={c} fillOpacity={0.25} />
      {/* Burst rays */}
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      {/* Diagonal rays */}
      <line x1="7.8" y1="7.8" x2="4.9" y2="4.9" opacity={0.6} />
      <line x1="16.2" y1="7.8" x2="19.1" y2="4.9" opacity={0.6} />
      <line x1="7.8" y1="16.2" x2="4.9" y2="19.1" opacity={0.6} />
      <line x1="16.2" y1="16.2" x2="19.1" y2="19.1" opacity={0.6} />
      {/* Expanding circles */}
      <circle cx="12" cy="12" r="5.5" opacity={0.4} strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="9" opacity={0.2} strokeDasharray="3 3" />
    </svg>
  );
}

/** Hard Takeoff — steep vertical arrow, like a rocket launch */
export function HardTakeoffIcon({ size = "1.4em" }: IconProps) {
  const c = "#ef4444"; // red — danger/urgency
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Baseline */}
      <line x1="3" y1="20" x2="10" y2="20" opacity={0.4} />
      {/* Steep curve up */}
      <path d="M4 20 Q8 19 10 16 Q12 12 12.5 3" strokeWidth={2} />
      {/* Arrowhead */}
      <polyline points="10,4 12.5,2 15,5" strokeWidth={1.8} />
      {/* Speed lines */}
      <line x1="8" y1="18" x2="6" y2="16" opacity={0.3} />
      <line x1="10" y1="14" x2="7.5" y2="13" opacity={0.3} />
      <line x1="11" y1="10" x2="8.5" y2="9.5" opacity={0.3} />
      {/* Time reference */}
      <line x1="16" y1="20" x2="21" y2="20" opacity={0.2} strokeDasharray="2 2" />
    </svg>
  );
}

/** Soft Takeoff — gentle upward S-curve */
export function SoftTakeoffIcon({ size = "1.4em" }: IconProps) {
  const c = "#10b981"; // green — gradual/safe
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Baseline */}
      <line x1="2" y1="20" x2="22" y2="20" opacity={0.2} />
      {/* Gentle S-curve */}
      <path d="M3 18 C6 18 8 16 10 14 C12 12 14 9 17 7 C19 5.5 21 5 22 5" strokeWidth={2} />
      {/* Progress dots along the curve */}
      <circle cx="6" cy="17.2" r="0.8" fill={c} stroke="none" opacity={0.3} />
      <circle cx="10" cy="14" r="0.8" fill={c} stroke="none" opacity={0.5} />
      <circle cx="14" cy="9.5" r="0.8" fill={c} stroke="none" opacity={0.7} />
      <circle cx="18" cy="6.2" r="0.8" fill={c} stroke="none" opacity={0.9} />
      {/* Small arrow at end */}
      <polyline points="20,6 22,5 20.5,3.5" strokeWidth={1.3} />
    </svg>
  );
}

/** Event Horizon (Vinge) — black hole with question mark beyond */
export function EventHorizonIcon({ size = "1.4em" }: IconProps) {
  const c = "#8b5cf6"; // accent purple — philosophical
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Black hole circle */}
      <circle cx="10" cy="12" r="6" strokeWidth={2} />
      <circle cx="10" cy="12" r="2" fill={c} fillOpacity={0.4} stroke="none" />
      {/* Accretion ring */}
      <ellipse cx="10" cy="12" rx="8.5" ry="2.5" opacity={0.25} />
      {/* Question mark beyond the horizon */}
      <path d="M19 8.5c1 0 1.8.5 1.8 1.5s-1 1.5-1.8 2" opacity={0.5} strokeWidth={1.5} />
      <circle cx="19" cy="14" r="0.5" fill={c} fillOpacity={0.5} stroke="none" />
    </svg>
  );
}

/** Accelerating Change — exponential curve with clock marks */
export function AcceleratingChangeIcon({ size = "1.4em" }: IconProps) {
  const c = "#fbbf24"; // amber — Kurzweil energy
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Exponential curve */}
      <path d="M3 20 Q6 19.5 9 18 Q12 16 15 12 Q17 9 19 4 Q20 2 21 1.5" strokeWidth={2} />
      {/* Time tick marks on bottom */}
      <line x1="5" y1="21" x2="5" y2="19.5" opacity={0.3} />
      <line x1="9" y1="21" x2="9" y2="19.5" opacity={0.3} />
      <line x1="13" y1="21" x2="13" y2="19.5" opacity={0.3} />
      <line x1="17" y1="21" x2="17" y2="19.5" opacity={0.3} />
      {/* Tick marks getting closer together near top */}
      <circle cx="21" cy="1.5" r="1" fill={c} fillOpacity={0.5} stroke="none" />
      {/* Double-arrow acceleration */}
      <polyline points="19,3 21,1.5 22,3.5" strokeWidth={1.3} />
    </svg>
  );
}

/** Economic Singularity — chart going vertical with dollar sign */
export function EconomicSingularityIcon({ size = "1.4em" }: IconProps) {
  const c = "#10b981"; // green — money/economy
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Chart axes */}
      <line x1="3" y1="21" x2="3" y2="3" opacity={0.3} />
      <line x1="3" y1="21" x2="21" y2="21" opacity={0.3} />
      {/* GDP curve going vertical */}
      <path d="M4 19 C7 18.5 10 17 13 14 Q15 11 16 6 Q16.5 3 17 1" strokeWidth={2} />
      {/* Dollar sign */}
      <path d="M20 9c0-1.2-1-2-2.2-2s-2.2.9-2.2 2 1 2 2.2 2 2.2.9 2.2 2-1 2-2.2 2" opacity={0.5} strokeWidth={1.2} />
      <line x1="17.8" y1="6" x2="17.8" y2="16" opacity={0.3} strokeWidth={1} />
    </svg>
  );
}

/** Sharp Left Turn — path that suddenly veers */
export function SharpLeftTurnIcon({ size = "1.4em" }: IconProps) {
  const c = "#ef4444"; // red — danger
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Straight path */}
      <path d="M3 18 L14 18" opacity={0.4} strokeWidth={1.5} />
      {/* Sharp turn upward-left */}
      <path d="M14 18 L14 5" strokeWidth={2} />
      <polyline points="11,8 14,5 17,8" strokeWidth={2} />
      {/* Dashed expected path */}
      <line x1="14" y1="18" x2="22" y2="18" strokeDasharray="2 2" opacity={0.2} />
      {/* Surprise indicator */}
      <circle cx="20" cy="4" r="0.8" fill={c} fillOpacity={0.5} stroke="none" />
      <line x1="20" y1="6" x2="20" y2="8.5" opacity={0.4} strokeWidth={1.2} />
    </svg>
  );
}

/** Biological Anchors — brain outline with compute/measurement marks */
export function BiologicalAnchorsIcon({ size = "1.4em" }: IconProps) {
  const c = "#f472b6"; // pink — biological
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Brain outline */}
      <path d="M12 4 C9 4 7 5.5 6.5 7.5 C5 7.8 4 9 4 10.5 C4 12 5 13 6 13.5 C6 15.5 7.5 17 9.5 17 L12 17" />
      <path d="M12 4 C15 4 17 5.5 17.5 7.5 C19 7.8 20 9 20 10.5 C20 12 19 13 18 13.5 C18 15.5 16.5 17 14.5 17 L12 17" />
      {/* Center line */}
      <line x1="12" y1="4" x2="12" y2="17" opacity={0.2} />
      {/* Measurement ruler marks on bottom */}
      <line x1="6" y1="20" x2="18" y2="20" opacity={0.4} />
      <line x1="6" y1="19" x2="6" y2="21" opacity={0.4} />
      <line x1="9" y1="19.5" x2="9" y2="20.5" opacity={0.3} />
      <line x1="12" y1="19" x2="12" y2="21" opacity={0.4} />
      <line x1="15" y1="19.5" x2="15" y2="20.5" opacity={0.3} />
      <line x1="18" y1="19" x2="18" y2="21" opacity={0.4} />
      {/* FLOP annotation */}
      <text x="12" y="22.8" textAnchor="middle" fill={c} fillOpacity={0.35} fontSize="2.5" fontFamily="monospace" stroke="none">FLOP</text>
    </svg>
  );
}

/** Scaling Hypothesis — growing stacked blocks / ladder */
export function ScalingHypothesisIcon({ size = "1.4em" }: IconProps) {
  const c = "#06b6d4"; // cyan — technical
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Stacking blocks getting bigger */}
      <rect x="9" y="17" width="4" height="4" rx="0.5" fill={c} fillOpacity={0.1} />
      <rect x="7" y="12" width="6" height="5" rx="0.5" fill={c} fillOpacity={0.15} />
      <rect x="5" y="6" width="8" height="6" rx="0.5" fill={c} fillOpacity={0.2} />
      {/* Arrow pointing up */}
      <line x1="17" y1="19" x2="17" y2="5" opacity={0.4} />
      <polyline points="15,7 17,5 19,7" opacity={0.4} />
      {/* Labels */}
      <text x="18.5" y="19" fill={c} fillOpacity={0.3} fontSize="2.5" fontFamily="monospace" stroke="none">10x</text>
      <text x="18.5" y="13" fill={c} fillOpacity={0.3} fontSize="2.5" fontFamily="monospace" stroke="none">100x</text>
      <text x="18.5" y="8" fill={c} fillOpacity={0.3} fontSize="2.5" fontFamily="monospace" stroke="none">1000x</text>
    </svg>
  );
}

/** Prediction Markets — bar chart with bet markers */
export function PredictionMarketsIcon({ size = "1.4em" }: IconProps) {
  const c = "#fbbf24"; // amber — money/markets
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Chart bars */}
      <rect x="3" y="14" width="3" height="7" rx="0.5" fill={c} fillOpacity={0.15} />
      <rect x="7.5" y="10" width="3" height="11" rx="0.5" fill={c} fillOpacity={0.25} />
      <rect x="12" y="6" width="3" height="15" rx="0.5" fill={c} fillOpacity={0.35} />
      <rect x="16.5" y="9" width="3" height="12" rx="0.5" fill={c} fillOpacity={0.2} />
      {/* Percentage marker */}
      <text x="13.5" y="4.5" textAnchor="middle" fill={c} fillOpacity={0.6} fontSize="3" fontFamily="monospace" fontWeight="bold" stroke="none">%</text>
      {/* Baseline */}
      <line x1="2" y1="21" x2="21" y2="21" opacity={0.2} />
    </svg>
  );
}

/** Turing Test — chat bubbles: human vs machine */
export function TuringTestIcon({ size = "1.4em" }: IconProps) {
  const c = "#a855f7"; // purple — classic AI
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Human speech bubble (left) */}
      <path d="M3 5h7c1 0 1.5.5 1.5 1.5v4c0 1-.5 1.5-1.5 1.5H5.5L3.5 14V12H3c-1 0-1.5-.5-1.5-1.5v-4C1.5 5.5 2 5 3 5z" />
      {/* Machine speech bubble (right) */}
      <path d="M14 10h7c1 0 1.5.5 1.5 1.5v4c0 1-.5 1.5-1.5 1.5h-.5v2l-2-2H14c-1 0-1.5-.5-1.5-1.5v-4c0-1 .5-1.5 1.5-1.5z" strokeDasharray="1.5 1.5" />
      {/* Question mark between */}
      <text x="12" y="21.5" textAnchor="middle" fill={c} fillOpacity={0.4} fontSize="4" fontFamily="monospace" stroke="none">?</text>
      {/* Human lines */}
      <line x1="3.5" y1="7.5" x2="8" y2="7.5" opacity={0.3} strokeWidth={1} />
      <line x1="3.5" y1="9.5" x2="6.5" y2="9.5" opacity={0.3} strokeWidth={1} />
      {/* Machine lines (binary) */}
      <text x="17.5" y="14" textAnchor="middle" fill={c} fillOpacity={0.3} fontSize="2.2" fontFamily="monospace" stroke="none">010</text>
      <text x="17.5" y="16.2" textAnchor="middle" fill={c} fillOpacity={0.3} fontSize="2.2" fontFamily="monospace" stroke="none">101</text>
    </svg>
  );
}

/** Recursive Self-Improvement — ouroboros-style loop with arrow */
export function RecursiveSelfImprovementIcon({ size = "1.4em" }: IconProps) {
  const c = "#f97316"; // orange — recursive energy
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Outer loop */}
      <path d="M12 3 A9 9 0 1 1 5.5 7" strokeWidth={1.8} />
      <polyline points="3,5.5 5.5,7 7,4.5" strokeWidth={1.8} />
      {/* Inner loop */}
      <path d="M12 7.5 A4.5 4.5 0 1 1 8.5 10" strokeWidth={1.3} opacity={0.6} />
      <polyline points="7,9 8.5,10 9.5,8.5" strokeWidth={1.2} opacity={0.6} />
      {/* Center dot — the improving core */}
      <circle cx="12" cy="12" r="1.5" fill={c} fillOpacity={0.3} />
      <circle cx="12" cy="12" r="0.6" fill={c} stroke="none" />
    </svg>
  );
}

/** Superintelligence (ASI) — radiating eye above a horizon */
export function SuperintelligenceConceptIcon({ size = "1.4em" }: IconProps) {
  const c = "#ef4444"; // red — power/danger
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* All-seeing eye */}
      <path d="M2 12 C5 7 8 5.5 12 5.5 S19 7 22 12" strokeWidth={1.8} />
      <path d="M2 12 C5 17 8 18.5 12 18.5 S19 17 22 12" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="1" fill={c} stroke="none" />
      {/* Crown rays */}
      <line x1="12" y1="2" x2="12" y2="4" opacity={0.4} />
      <line x1="8" y1="2.8" x2="9" y2="4.5" opacity={0.3} />
      <line x1="16" y1="2.8" x2="15" y2="4.5" opacity={0.3} />
      <line x1="4.5" y1="5" x2="6.5" y2="6.5" opacity={0.2} />
      <line x1="19.5" y1="5" x2="17.5" y2="6.5" opacity={0.2} />
    </svg>
  );
}

/** AGI — brain-circuit hybrid */
export function AgiConceptIcon({ size = "1.4em" }: IconProps) {
  const c = "#8b5cf6"; // accent purple
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Brain/chip shape */}
      <rect x="5" y="5" width="14" height="14" rx="3" fill={c} fillOpacity={0.08} />
      {/* Internal grid — neural net */}
      <circle cx="9" cy="9" r="1" fill={c} fillOpacity={0.4} stroke="none" />
      <circle cx="15" cy="9" r="1" fill={c} fillOpacity={0.4} stroke="none" />
      <circle cx="9" cy="15" r="1" fill={c} fillOpacity={0.4} stroke="none" />
      <circle cx="15" cy="15" r="1" fill={c} fillOpacity={0.4} stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill={c} fillOpacity={0.6} stroke="none" />
      {/* Connections */}
      <line x1="9" y1="9" x2="12" y2="12" opacity={0.3} />
      <line x1="15" y1="9" x2="12" y2="12" opacity={0.3} />
      <line x1="9" y1="15" x2="12" y2="12" opacity={0.3} />
      <line x1="15" y1="15" x2="12" y2="12" opacity={0.3} />
      {/* Pins */}
      <line x1="9" y1="5" x2="9" y2="2.5" opacity={0.3} />
      <line x1="15" y1="5" x2="15" y2="2.5" opacity={0.3} />
      <line x1="9" y1="19" x2="9" y2="21.5" opacity={0.3} />
      <line x1="15" y1="19" x2="15" y2="21.5" opacity={0.3} />
      <line x1="5" y1="9" x2="2.5" y2="9" opacity={0.3} />
      <line x1="5" y1="15" x2="2.5" y2="15" opacity={0.3} />
      <line x1="19" y1="9" x2="21.5" y2="9" opacity={0.3} />
      <line x1="19" y1="15" x2="21.5" y2="15" opacity={0.3} />
    </svg>
  );
}

/** Expert Timeline Drift — shifting timeline markers */
export function SurveyDriftIcon({ size = "1.4em" }: IconProps) {
  const c = "#fbbf24"; // amber — caution
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Timeline base */}
      <line x1="2" y1="12" x2="22" y2="12" opacity={0.2} />
      {/* Survey markers drifting left (closer) */}
      <circle cx="18" cy="7" r="1" fill={c} fillOpacity={0.2} stroke={c} strokeWidth={1} />
      <circle cx="14" cy="12" r="1" fill={c} fillOpacity={0.4} stroke={c} strokeWidth={1} />
      <circle cx="9" cy="17" r="1" fill={c} fillOpacity={0.7} stroke={c} strokeWidth={1} />
      {/* Arrows showing drift */}
      <path d="M17 8 L15 11" opacity={0.3} strokeWidth={1} />
      <path d="M13 13 L10 16" opacity={0.5} strokeWidth={1} />
      {/* Year labels */}
      <text x="18" y="5.5" textAnchor="middle" fill={c} fillOpacity={0.25} fontSize="2.3" fontFamily="monospace" stroke="none">'16</text>
      <text x="14" y="10.5" textAnchor="middle" fill={c} fillOpacity={0.4} fontSize="2.3" fontFamily="monospace" stroke="none">'23</text>
      <text x="9" y="15.5" textAnchor="middle" fill={c} fillOpacity={0.65} fontSize="2.3" fontFamily="monospace" stroke="none">'26</text>
    </svg>
  );
}

/** Industry vs. Academia Gap — two diverging bars */
export function IndustryAcademiaDivergenceIcon({ size = "1.4em" }: IconProps) {
  const c1 = "#f97316"; // orange — industry (hot/fast)
  const c2 = "#06b6d4"; // cyan — academia (cool/measured)
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Diverging paths from a shared origin */}
      <circle cx="4" cy="12" r="1.5" stroke={c1} fill={c1} fillOpacity={0.15} />
      {/* Industry path — steep, close prediction */}
      <path d="M5.5 11 L12 6 L20 4" stroke={c1} strokeWidth={1.8} />
      <text x="20" y="3" fill={c1} fillOpacity={0.5} fontSize="2.5" fontFamily="monospace" stroke="none">2028</text>
      {/* Academia path — gradual, far prediction */}
      <path d="M5.5 13 L12 17 L20 19" stroke={c2} strokeWidth={1.8} />
      <text x="20" y="22" fill={c2} fillOpacity={0.5} fontSize="2.5" fontFamily="monospace" stroke="none">2050</text>
      {/* Gap indicator */}
      <line x1="18" y1="6" x2="18" y2="17.5" strokeDasharray="1.5 1.5" stroke={c1} opacity={0.2} />
    </svg>
  );
}

/** Transformative AI — gears turning with wave */
export function TransformativeAiConceptIcon({ size = "1.4em" }: IconProps) {
  const c = "#06b6d4"; // cyan — transformative
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Globe outline */}
      <circle cx="12" cy="12" r="9" opacity={0.3} />
      <ellipse cx="12" cy="12" rx="4" ry="9" opacity={0.15} />
      <line x1="3" y1="12" x2="21" y2="12" opacity={0.15} />
      {/* Lightning bolt — transformation */}
      <path d="M13 4 L10 11 L14 11 L11 19" strokeWidth={2} fill={c} fillOpacity={0.15} />
      {/* Radiating change */}
      <circle cx="12" cy="12" r="3" fill={c} fillOpacity={0.1} stroke="none" />
    </svg>
  );
}

/** AI Alignment — target/crosshair with heart center */
export function AlignmentIcon({ size = "1.4em" }: IconProps) {
  const c = "#10b981"; // green — safety
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Target rings */}
      <circle cx="12" cy="12" r="9" opacity={0.2} />
      <circle cx="12" cy="12" r="5.5" opacity={0.4} />
      {/* Crosshairs */}
      <line x1="12" y1="2" x2="12" y2="6" opacity={0.3} />
      <line x1="12" y1="18" x2="12" y2="22" opacity={0.3} />
      <line x1="2" y1="12" x2="6" y2="12" opacity={0.3} />
      <line x1="18" y1="12" x2="22" y2="12" opacity={0.3} />
      {/* Arrow hitting center — slightly off */}
      <path d="M19 5 L13 11" strokeWidth={1.5} opacity={0.6} />
      <polyline points="15,5.5 19,5 18.5,9" opacity={0.5} strokeWidth={1.2} />
      {/* Center — the alignment target */}
      <circle cx="12" cy="12" r="1.5" fill={c} fillOpacity={0.5} stroke={c} strokeWidth={1.2} />
    </svg>
  );
}

/** Map from concept key to icon component */
export const CONCEPT_ICONS: Record<string, React.FC<IconProps>> = {
  "intelligence-explosion": IntelligenceExplosionConceptIcon,
  "hard-takeoff": HardTakeoffIcon,
  "soft-takeoff": SoftTakeoffIcon,
  "event-horizon": EventHorizonIcon,
  "accelerating-change": AcceleratingChangeIcon,
  "economic-singularity": EconomicSingularityIcon,
  "sharp-left-turn": SharpLeftTurnIcon,
  "biological-anchors": BiologicalAnchorsIcon,
  "scaling-hypothesis": ScalingHypothesisIcon,
  "prediction-markets": PredictionMarketsIcon,
  "turing-test": TuringTestIcon,
  "recursive-self-improvement": RecursiveSelfImprovementIcon,
  "superintelligence": SuperintelligenceConceptIcon,
  "agi": AgiConceptIcon,
  "survey-drift": SurveyDriftIcon,
  "industry-academia-divergence": IndustryAcademiaDivergenceIcon,
  "transformative-ai": TransformativeAiConceptIcon,
  "alignment": AlignmentIcon,
};
