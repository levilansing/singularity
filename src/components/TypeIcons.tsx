interface IconProps {
  size?: string | number;
}

const s: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  flexShrink: 0,
};

/** AGI — brain with circuit nodes */
export function AgiIcon({ size = "1.4em" }: IconProps) {
  const c = "#8b5cf6";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <path d="M12 4C9.5 4 7.5 5.2 6.5 7c-.7 1.2-1 2.6-1 4 0 1.5.5 2.8 1.2 3.8.5.7.8 1.5.8 2.2v2h5" />
      <path d="M12 4c2.5 0 4.5 1.2 5.5 3 .7 1.2 1 2.6 1 4 0 1.5-.5 2.8-1.2 3.8-.5.7-.8 1.5-.8 2.2v2h-5" />
      <line x1="9" y1="19" x2="15" y2="19" />
      <line x1="9.5" y1="21" x2="14.5" y2="21" />
      <circle cx="8.5" cy="9.5" r="0.8" fill={c} stroke="none" />
      <circle cx="15.5" cy="9.5" r="0.8" fill={c} stroke="none" />
      <circle cx="12" cy="7.5" r="0.8" fill={c} stroke="none" />
      <circle cx="10" cy="13" r="0.8" fill={c} stroke="none" />
      <circle cx="14" cy="13" r="0.8" fill={c} stroke="none" />
      <line x1="8.5" y1="9.5" x2="12" y2="7.5" opacity={0.5} strokeWidth={1} />
      <line x1="15.5" y1="9.5" x2="12" y2="7.5" opacity={0.5} strokeWidth={1} />
      <line x1="8.5" y1="9.5" x2="10" y2="13" opacity={0.5} strokeWidth={1} />
      <line x1="15.5" y1="9.5" x2="14" y2="13" opacity={0.5} strokeWidth={1} />
      <line x1="10" y1="13" x2="14" y2="13" opacity={0.5} strokeWidth={1} />
    </svg>
  );
}

/** Singularity — black hole with accretion rings */
export function SingularityIcon({ size = "1.4em" }: IconProps) {
  const c = "#f59e0b";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <ellipse cx="12" cy="12" rx="10" ry="3.5" opacity={0.25} />
      <ellipse cx="12" cy="12" rx="7" ry="2.5" opacity={0.45} />
      <circle cx="12" cy="12" r="4" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="1.5" fill={c} stroke="none" opacity={0.85} />
      <path d="M5 6.5q3.5 2 7 2t7-2" opacity={0.2} strokeWidth={1} />
      <path d="M5 17.5q3.5-2 7-2t7 2" opacity={0.2} strokeWidth={1} />
    </svg>
  );
}

/** Superintelligence — radiating head with crown rays and inner eye */
export function SuperintelligenceIcon({ size = "1.4em" }: IconProps) {
  const c = "#ef4444";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <line x1="12" y1="1.5" x2="12" y2="4.5" strokeWidth={2} />
      <line x1="7.5" y1="3" x2="9" y2="5.5" strokeWidth={1.5} opacity={0.6} />
      <line x1="16.5" y1="3" x2="15" y2="5.5" strokeWidth={1.5} opacity={0.6} />
      <line x1="4.5" y1="6" x2="7" y2="7.5" strokeWidth={1} opacity={0.35} />
      <line x1="19.5" y1="6" x2="17" y2="7.5" strokeWidth={1} opacity={0.35} />
      <path d="M7.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5c0 1.3-.6 2.5-1.5 3.3-.3.2-.5.6-.5 1v.7h-5v-.7c0-.4-.2-.8-.5-1-.9-.8-1.5-2-1.5-3.3z" />
      <line x1="9.5" y1="19" x2="14.5" y2="19" />
      <line x1="10" y1="21" x2="14" y2="21" />
      <circle cx="12" cy="13.5" r="1.8" strokeWidth={1.2} />
      <circle cx="12" cy="13.5" r="0.6" fill={c} stroke="none" />
    </svg>
  );
}

/** Intelligence Explosion — fragmenting arcs with burst rays */
export function IntelligenceExplosionIcon({ size = "1.4em" }: IconProps) {
  const c = "#10b981";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <circle cx="12" cy="12" r="2" fill={c} stroke="none" opacity={0.85} />
      <path d="M12 6a6 6 0 0 1 5.2 3" />
      <path d="M17.2 15a6 6 0 0 1-5.2 3" />
      <path d="M6.8 9a6 6 0 0 0 0 6" />
      <path d="M12 2a10 10 0 0 1 8.7 5" opacity={0.5} />
      <path d="M20.7 17a10 10 0 0 1-8.7 5" opacity={0.5} />
      <path d="M3.3 7a10 10 0 0 0 0 10" opacity={0.5} />
      <line x1="12" y1="8" x2="12" y2="4" strokeWidth={1} opacity={0.35} />
      <line x1="15.5" y1="10" x2="18.5" y2="7.5" strokeWidth={1} opacity={0.35} />
      <line x1="15.5" y1="14" x2="18.5" y2="16.5" strokeWidth={1} opacity={0.35} />
      <line x1="12" y1="16" x2="12" y2="20" strokeWidth={1} opacity={0.35} />
      <line x1="8.5" y1="14" x2="5.5" y2="16.5" strokeWidth={1} opacity={0.35} />
      <line x1="8.5" y1="10" x2="5.5" y2="7.5" strokeWidth={1} opacity={0.35} />
    </svg>
  );
}

/** Transformative AI — fading wave morphing into bold wave */
export function TransformativeAiIcon({ size = "1.4em" }: IconProps) {
  const c = "#06b6d4";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      <path d="M2 7c1.5-2.5 3-2.5 4.5 0S9.5 9.5 11 7" opacity={0.3} />
      <line x1="9" y1="12" x2="15" y2="12" strokeWidth={1.3} />
      <polyline points="13.5,10 15.5,12 13.5,14" strokeWidth={1.3} />
      <path d="M13 17c1.5-3 3-3 4.5 0s3 3 4.5 0" strokeWidth={2} />
      <circle cx="5" cy="7" r="0.6" fill={c} stroke="none" opacity={0.4} />
      <circle cx="8" cy="7" r="0.6" fill={c} stroke="none" opacity={0.4} />
      <circle cx="15.5" cy="17" r="0.7" fill={c} stroke="none" />
      <circle cx="20" cy="17" r="0.7" fill={c} stroke="none" />
    </svg>
  );
}

/** Human-Level AI — chalk-outline humanoid with square CRT head */
export function HlmiIcon({ size = "1.4em" }: IconProps) {
  const c = "#a855f7";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ ...s, width: size, height: size }}>
      {/* Square CRT head */}
      <rect x="7" y="1.5" width="10" height="8" rx="0.8" />
      {/* Eyes on screen */}
      <line x1="9.8" y1="4.8" x2="10.8" y2="4.8" strokeWidth={1.6} opacity={0.8} />
      <line x1="13.2" y1="4.8" x2="14.2" y2="4.8" strokeWidth={1.6} opacity={0.8} />
      {/* Neck */}
      <line x1="12" y1="9.5" x2="12" y2="11" />
      {/* Shoulders + torso — single chalk stroke */}
      <path d="M5.5 13 C5.5 11.5 8 11 12 11 C16 11 18.5 11.5 18.5 13" />
      <line x1="8" y1="12" x2="8" y2="18" />
      <line x1="16" y1="12" x2="16" y2="18" />
      <line x1="8" y1="18" x2="16" y2="18" />
      {/* Arms */}
      <line x1="5.5" y1="13" x2="3.5" y2="17.5" />
      <line x1="18.5" y1="13" x2="20.5" y2="17.5" />
      {/* Legs */}
      <line x1="10" y1="18" x2="8" y2="23" />
      <line x1="14" y1="18" x2="16" y2="23" />
    </svg>
  );
}
