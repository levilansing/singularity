/** Canonical prediction type colors — used everywhere (charts, badges, legends) */

// Hex colors for SVG charts
export const TYPE_HEX: Record<string, string> = {
  "AGI": "#06b6d4",
  "Transformative AI": "#a78bfa",
  "Human-level AI": "#ef4444",
  "Superintelligence": "#f97316",
  "Singularity": "#fbbf24",
};

// Tailwind classes for badges
export const TYPE_BADGE: Record<string, string> = {
  "AGI": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Transformative AI": "bg-violet-400/20 text-violet-300 border-violet-400/30",
  "Human-level AI": "bg-red-500/20 text-red-300 border-red-500/30",
  "Superintelligence": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Singularity": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

/** Legend order — consistent across all charts */
export const TYPE_LEGEND_ORDER = Object.keys(TYPE_HEX);

/** Normalize variant types to canonical keys */
export function canonicalType(type: string): string {
  if (type.startsWith("AGI")) return "AGI";
  if (type === "HLMI") return "Human-level AI";
  return type;
}

export function getTypeHex(type: string): string {
  return TYPE_HEX[canonicalType(type)] ?? "#6b7280";
}

export function getTypeBadge(type: string): string {
  return TYPE_BADGE[canonicalType(type)] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
}

/** Confidence colors — by confidence_type (low/medium/high/certain) */
export const CONFIDENCE_BADGE: Record<string, string> = {
  low: "bg-red-500/20 text-red-300 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  certain: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  none: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

/** Confidence category from label text */
export function confidenceCategory(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("certain") || l.includes("confident") || l.includes("insider")) return "Confident";
  if (l.includes("skeptic") || l.includes("dismissive") || l.includes("contrarian")) return "Skeptical";
  if (l.includes("uncertain") || l.includes("hedging") || l.includes("maybe")) return "Uncertain";
  return "Other";
}

export const CONFIDENCE_CATEGORY_BADGE: Record<string, string> = {
  "Confident": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Skeptical": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Uncertain": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "Other": "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function getConfidenceBadge(confidenceType: string): string {
  return CONFIDENCE_BADGE[confidenceType] ?? CONFIDENCE_BADGE.none;
}
