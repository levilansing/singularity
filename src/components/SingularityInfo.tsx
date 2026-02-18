import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import predictions from "../data/predictions-slim.json";
import type { PredictionSlim } from "../data/types";
import { AgiIcon, SingularityIcon, SuperintelligenceIcon, TransformativeAiIcon } from "./TypeIcons";
import { SectionHeader } from "./SectionHeader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./Select";

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>
    </svg>
  );
}

const allPredictions = predictions as PredictionSlim[];

/* ────────────────────────────────────────────
   Crowd estimate via weighted median
   ──────────────────────────────────────────── */

/** Maps prediction_type values to our five card IDs */
const TYPE_TO_CARD: Record<string, string> = {
  "AGI": "agi",
  "AGI (weak)": "agi",
  "AGI (strong)": "agi",
  "Singularity": "singularity",
  "Superintelligence": "asi",
  "Transformative AI": "tai",
};

/** Confidence multiplier: high-confidence predictions count more */
const CONFIDENCE_WEIGHT: Record<string, number> = {
  high: 1.5,
  medium: 1.0,
  low: 0.6,
};

interface CrowdEstimate {
  /** Weighted median as a Date */
  medianDate: Date;
  count: number;
  earliest: number;
  latest: number;
}

/** Weighted median: the value where cumulative weight reaches 50% */
function weightedMedianDate(items: { ts: number; weight: number }[]): number {
  const sorted = [...items].sort((a, b) => a.ts - b.ts);
  const totalWeight = sorted.reduce((s, i) => s + i.weight, 0);
  const halfWeight = totalWeight / 2;
  let cumulative = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i]!.weight;
    if (cumulative >= halfWeight) {
      // Interpolate between this point and the previous for smoother results
      if (i > 0 && cumulative - sorted[i]!.weight < halfWeight) {
        const prev = sorted[i - 1]!;
        const curr = sorted[i]!;
        const gap = cumulative - halfWeight;
        const frac = curr.weight > 0 ? gap / curr.weight : 0;
        return curr.ts - frac * (curr.ts - prev.ts);
      }
      return sorted[i]!.ts;
    }
  }
  return sorted[sorted.length - 1]!.ts;
}

function computeCrowdEstimates(): Record<string, CrowdEstimate> {
  const groups: Record<string, { ts: number; yearBest: number; weight: number }[]> = {};

  for (const p of allPredictions) {
    const cardId = TYPE_TO_CARD[p.prediction_type];
    if (!cardId || !p.predicted_date_best || !p.predicted_year_best) continue;
    if (!groups[cardId]) groups[cardId] = [];
    const predYear = parseInt(p.prediction_date.slice(0, 4), 10);
    // Recency weight: recent predictions count more (2015→1.0, 2025→2.0, 2026→2.1)
    const recency = 1 + Math.max(0, predYear - 2015) / 10;
    // Confidence weight: high-confidence predictions count more
    const conf = CONFIDENCE_WEIGHT[p.confidence_type] ?? 1.0;
    groups[cardId].push({
      ts: new Date(p.predicted_date_best).getTime(),
      yearBest: p.predicted_year_best,
      weight: recency * conf,
    });
  }

  const results: Record<string, CrowdEstimate> = {};
  for (const [cardId, items] of Object.entries(groups)) {
    let earliest = Infinity;
    let latest = -Infinity;
    for (const item of items) {
      if (item.yearBest < earliest) earliest = item.yearBest;
      if (item.yearBest > latest) latest = item.yearBest;
    }

    results[cardId] = {
      medianDate: new Date(weightedMedianDate(items)),
      count: items.length,
      earliest,
      latest,
    };
  }

  return results;
}

/* ────────────────────────────────────────────
   Data for the interactive "type cards"
   ──────────────────────────────────────────── */

interface EventType {
  id: string;
  label: string;
  icon: React.ReactNode;
  tagline: string;
  color: string;
  description: string;
  techDetails: string;
  funFact: string;
  keyFigures: string;
}

const EVENT_TYPES: EventType[] = [
  {
    id: "agi",
    label: "AGI",
    icon: <AgiIcon />,
    tagline: "The One Everyone Argues About",
    color: "#06b6d4",
    description:
      "Artificial General Intelligence — AI that can do anything a human can do intellectually. Learn a language, write a novel, debug your code, have an existential crisis. The whole package. Right now AI can beat you at chess and write your emails, but ask it to do both while making a sandwich and it falls apart. With 83 predictions in our dataset, everyone has an opinion on this one.",
    techDetails:
      "The definitional goalposts shift constantly. Google DeepMind proposed a 5-level framework in 2023: Emerging (Level 1, like a chatbot) through Superhuman (Level 5). OpenAI defines it internally as \"a system that outperforms the median human at most economically valuable work\" — conveniently, this lets the company that builds it also decide when it's been built. Andrew Ng proposed a \"Turing-AGI Test\" in 2026 focused on multi-day real-world task performance — a far harder bar than chatting convincingly. Ng also told his 2.3 million LinkedIn followers that AGI is \"highly limited\" and decades away, while the AAAI 2025 Presidential Panel found 76% of 475 researchers doubt scaling alone gets us there. Meanwhile, Satya Nadella calls the whole AGI race a \"winner's curse\" — even the CEO of the company spending $80B on AI isn't sure what they're building toward.",
    funFact:
      "Every generation of AI researchers since the 1960s has predicted AGI within 20 years. We're currently on the fifth or sixth cycle of this. But hey, a stopped clock is right twice a day, and eventually one of these predictions has to land... right? Rodney Brooks used to say 2300 to make a point about prediction futility. He's since revised to 2075. Still the most patient man in AI.",
    keyFigures: "Altman: 2027 | Amodei: 2027 | Musk: 2026 | Hassabis: 2030 | Ng: 2060-2085 | Brooks: 2075",
  },
  {
    id: "tai",
    label: "Transformative AI",
    icon: <TransformativeAiIcon />,
    tagline: "The Pragmatist's Definition",
    color: "#a78bfa",
    description:
      "Forget arguing about consciousness — Transformative AI asks a simpler question: does the world look fundamentally different? AI that transforms civilization as much as the Industrial Revolution did. You don't need philosophy to measure whether GDP doubled or billions of jobs vanished. With 37 predictions and some of the nearest-term timelines, everyone from Suleyman to LeCun agrees *something* transformative is happening by 2026-2030. They just disagree on whether to call it \"AGI\" or \"really good autocomplete.\"",
    techDetails:
      "Open Philanthropy's framework (developed by Ajeya Cotra) uses \"biological anchors\" — counting the compute used by evolution to produce human brains, then estimating when artificial compute matches it. The original 2020 report gave a 50% probability by 2050; after watching GPT-3 and GPT-4, Cotra updated to 2040. Erik Brynjolfsson (Stanford) declared 2026 the year we finally measure whether AI actually does anything for productivity — a refreshingly empirical take. Pew Research found 68% of AI experts believe ethics guidelines will be \"cheerfully ignored\" — the most accurate prediction in this entire dataset. Stuart Russell warns the AI race is \"Russian roulette\" with extinction-level stakes by 2030, which is one way to get people to read your textbook.",
    funFact:
      "The Industrial Revolution took about 80 years to fully transform society. The smartphone did it in 15. If TAI is real, the transformation might happen in 5 or fewer. Your grandma went from rotary phones to FaceTime; your kids might go from ChatGPT to... well, nobody can finish that sentence. Timnit Gebru, the ex-Google researcher, argues we should stop obsessing over the robot apocalypse because AI is already exploiting workers *right now* — which is technically a TAI prediction that's already come true.",
    keyFigures: "Suleyman: 2026 | LeCun: 2030 | Cotra: 2040 | Hinton: 2026 | Russell: 2030 | Hayworth: 2100",
  },
  {
    id: "asi",
    label: "Superintelligence",
    icon: <SuperintelligenceIcon />,
    tagline: "The One That Keeps Safety Researchers Up at Night",
    color: "#f97316",
    description:
      "Artificial Superintelligence — an intellect that doesn't just match human performance but vastly exceeds it in all domains. Not \"slightly better at math\" but \"as far beyond us as we are beyond goldfish.\" Bostrom's 2014 book made this mainstream and launched a thousand alignment papers. With 26 predictions ranging from Yampolskiy's \"2025\" to Hofstadter's \"2070,\" the core question isn't whether we *can* build it, but whether we can do so without optimizing the universe into paperclips.",
    techDetails:
      "David Chalmers (2010) formalized three tiers: AI (human-level), AI+ (moderately superhuman), and AI++ (radically superintelligent). He identified two logically independent explosions: intelligence (better reasoning) and speed (faster computation). A speed superintelligence running at 1 million x human speed would experience a millennium of thought per hour. Bostrom further distinguished between quality superintelligence (deeper reasoning), speed superintelligence (faster processing), and collective superintelligence (vast network coordination). Dario Amodei's January 2026 prediction of superintelligence by 2027 — with software engineers \"extinct by Christmas 2026\" — represents the aggressive end. Geoffrey Hinton, the Nobel-winning \"godfather of AI,\" gives 10-20% odds that AI kills everyone within 30 years, which is a *remarkably* calm way to put a number on potential human extinction.",
    funFact:
      "The \"paperclip maximizer\" thought experiment: tell a superintelligent AI to make paperclips, and it might convert all matter in the solar system — including you — into paperclips. Not because it's evil, but because you technically didn't say *not* to. Roman Yampolskiy pegs humanity's odds of surviving superintelligence at nearly 0%. He's fun at parties.",
    keyFigures: "Amodei: 2027 | Musk: 2030 | Altman: 2035 | Hinton: 2035 | Brin: 2030 | Hofstadter: 2070",
  },
  {
    id: "singularity",
    label: "The Singularity",
    icon: <SingularityIcon />,
    tagline: "The Point of No Return",
    color: "#fbbf24",
    description:
      "The hypothetical moment when technological growth becomes uncontrollable and irreversible — the event horizon of civilization. Once you cross it, there's no going back, and nobody on this side can tell you what's on the other side. Von Neumann described it as a point beyond which \"human affairs, as we know them, could not continue.\" Cheery stuff.",
    techDetails:
      "Vernor Vinge (1993) formalized the modern concept as an \"event horizon\" — borrowing from black hole physics where prediction becomes impossible. He identified four pathways: superhuman AI, awakened computer networks, brain-computer interfaces, and biological enhancement. Kurzweil (2005) disagrees on the unpredictability part — he sees it as the smooth, predictable endpoint of exponential growth, arriving in 2045 through a merger of human and machine intelligence via nanobots connecting your neocortex to the cloud. Jürgen Schmidhuber — the LSTM pioneer — bets on 2050 and thinks the doom-mongers are wrong, preferring to build AI research labs in Saudi Arabia instead of worrying. IBM plays it safe and calls it \"a theoretical scenario where technological growth becomes uncontrollable and irreversible,\" which is the corporate equivalent of a shrug emoji.",
    funFact:
      "Kurzweil has maintained his 2029 AGI / 2045 singularity predictions since 1999 — and now finds himself in the *conservative* camp among industry figures. When your wildly optimistic timeline becomes the boring centrist position, the Overton window has truly shifted. Sam Altman wrote that the \"event horizon\" has already been passed — which either means we're already inside the singularity or that Altman needs to look up what \"event horizon\" means.",
    keyFigures: "Kurzweil: 2045 | Vinge: before 2030 (said in 1993) | Schmidhuber: 2050 | Altman: already?",
  },
];

/** Comparison key: sorted pair of event type IDs joined by "|" */
function comparisonKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

const COMPARISONS: Record<string, { title: string; body: string }> = {
  [comparisonKey("agi", "tai")]: {
    title: "AGI vs Transformative AI",
    body: "{agi:AGI is about matching human cognition} — can the machine think like us? {tai:Transformative AI asks whether civilization changed}. You could have transformative AI without anything resembling general intelligence (imagine a narrow system that automates 80% of jobs), and you could theoretically have AGI without transformation (a human-level AI that's too expensive to deploy). In practice, the TAI crowd thinks the AGI debate is philosophical navel-gazing, while the AGI crowd thinks TAI is just kicking the definitional can down the road. They're both right.",
  },
  [comparisonKey("agi", "asi")]: {
    title: "AGI vs Superintelligence",
    body: "{agi:AGI is the finish line everyone's racing toward}. {asi:Superintelligence is what happens five minutes later} — and it's the part that keeps safety researchers awake. AGI matches us; ASI surpasses us in every domain, potentially by an incomprehensible margin. The critical question is the 'takeoff speed': if there's a long gap between AGI and ASI, we have time to align it. If AGI immediately bootstraps to ASI — the 'hard takeoff' scenario — we get one shot at the alignment problem. Bostrom argues the gap could be days or hours. Optimists say decades. Nobody actually knows, which is exactly the problem.",
  },
  [comparisonKey("agi", "singularity")]: {
    title: "AGI vs The Singularity",
    body: "{agi:AGI is an engineering milestone}. {singularity:The Singularity is a civilizational phase transition}. You can have AGI without a singularity — maybe we build it and it's just... useful. Boring, even. The Singularity requires a feedback loop — intelligence improving intelligence improving intelligence until the curve goes vertical. Most singularity timelines assume AGI is a prerequisite, but Kurzweil argues the Singularity emerges from the broader convergence of nanotech, biotech, and AI — AGI is just one ingredient. Think of it this way: AGI is inventing fire. The Singularity is the resulting wildfire burning down the forest and growing a new one.",
  },
  [comparisonKey("tai", "asi")]: {
    title: "Transformative AI vs Superintelligence",
    body: "{tai:Transformative AI could arrive without anything superhuman} — it just needs to change the world as much as the Industrial Revolution did. A fleet of competent-but-not-genius AI systems automating most knowledge work would qualify. {asi:Superintelligence requires exceeding human capability in essentially every domain}. The irony: TAI might be more dangerous in the short term precisely because it's more plausible. Nobody's deploying superintelligence tomorrow, but 'AI that's good enough to replace your team' is already in pitch decks. The transformation might be less dramatic and more insidious than the superintelligence crowd imagines.",
  },
  [comparisonKey("tai", "singularity")]: {
    title: "Transformative AI vs The Singularity",
    body: "TAI is the Industrial Revolution comparison — {tai:massive, measurable, but ultimately comprehensible change}. The Singularity is the 'event horizon' — {singularity:change so profound that prediction becomes impossible from this side}. You can model a post-TAI world: different jobs, different economics, different power structures. You can't model a post-Singularity world by definition. TAI timelines are generally shorter because the bar is lower — you don't need recursively self-improving superintelligence, just AI capable enough to reshape the economy. Most forecasters think we'll cross the TAI threshold well before anything resembling a singularity — if the singularity happens at all.",
  },
  [comparisonKey("asi", "singularity")]: {
    title: "Superintelligence vs The Singularity",
    body: "These are often conflated but they're distinct concepts. {asi:Superintelligence is an entity — a mind vastly smarter than any human}. {singularity:The Singularity is an event — the moment technological change becomes irreversible}. You could theoretically have superintelligence without a singularity (a contained, controlled ASI that doesn't trigger runaway change) or a singularity without a single superintelligent entity (a network effect of many narrow AIs creating emergent transformation). In practice, most scenarios where ASI exists do lead to singularity-like conditions, because it's hard to imagine something that much smarter than us choosing to maintain the status quo. But 'hard to imagine' is different from 'impossible.'",
  },
};

/** Parse {typeId:phrase} markup into React nodes with colored underlines */
function renderComparison(text: string): React.ReactNode[] {
  const colorMap: Record<string, string> = {};
  for (const t of EVENT_TYPES) colorMap[t.id] = t.color;

  const nodes: React.ReactNode[] = [];
  const re = /\{(\w+):([^}]+)\}/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index));
    const color = colorMap[m[1]] ?? "#888";
    nodes.push(
      <span key={key++} style={{ textDecorationLine: "underline", textDecorationColor: color, textUnderlineOffset: "3px", textDecorationThickness: "2px" }}>
        {m[2]}
      </span>
    );
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function ComparisonView({ initialLeft, initialRight, activeLabel, onClose }: { initialLeft: string; initialRight: string; activeLabel: string; onClose: () => void }) {
  const [leftId, setLeftId] = useState(initialLeft);
  const [rightId, setRightId] = useState(initialRight);

  const key = comparisonKey(leftId, rightId);
  const comparison = COMPARISONS[key];
  const leftType = EVENT_TYPES.find((t) => t.id === leftId)!;
  const rightType = EVENT_TYPES.find((t) => t.id === rightId)!;

  const handleLeftChange = (id: string) => {
    setLeftId(id);
    if (id === rightId) {
      const other = EVENT_TYPES.find((t) => t.id !== id);
      if (other) setRightId(other.id);
    }
  };

  const handleRightChange = (id: string) => {
    setRightId(id);
    if (id === leftId) {
      const other = EVENT_TYPES.find((t) => t.id !== id);
      if (other) setLeftId(other.id);
    }
  };

  return (
    <div className="flex flex-col justify-center h-full min-h-[inherit]">
      <h4 className="font-mono text-[1rem] font-bold text-(--text) m-0 mb-4 text-center">
        What's the Difference?
      </h4>

      {/* Dropdowns */}
      <div className="flex max-sm:flex-col gap-3 mb-5">
        <div className="flex-1">
          <Select value={leftId} onValueChange={handleLeftChange}>
            <SelectTrigger
              className="w-full font-mono text-[0.85rem] cursor-pointer"
              style={{
                background: `${leftType.color}10`,
                borderColor: `${leftType.color}30`,
                color: leftType.color,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id} className="font-mono text-[0.85rem]">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center text-(--text-dim) font-mono text-[0.8rem] max-sm:py-0">
          vs
        </div>

        <div className="flex-1">
          <Select value={rightId} onValueChange={handleRightChange}>
            <SelectTrigger
              className="w-full font-mono text-[0.85rem] cursor-pointer"
              style={{
                background: `${rightType.color}10`,
                borderColor: `${rightType.color}30`,
                color: rightType.color,
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id} className="font-mono text-[0.85rem]">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison content */}
      {comparison && (
        <p className="m-0 text-[0.85rem] text-(--text-muted) leading-relaxed">
          {renderComparison(comparison.body)}
        </p>
      )}

      {/* Back button */}
      <div className="flex justify-center mt-5 pt-3 border-t border-[#ffffff06]">
        <button
          onClick={onClose}
          className="text-[0.75rem] text-(--text-dim) hover:text-(--text) cursor-pointer transition-colors font-mono"
        >
          ← Back to {activeLabel}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Crowd Estimate badge (top-right of card)
   ──────────────────────────────────────────── */

function getProximityColor(date: Date): string {
  const now = Date.now();
  const target = date.getTime();
  const yearsAway = (target - now) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsAway <= 0) return "#ff4444";       // past
  if (yearsAway <= 3) return "#ff6644";        // imminent
  if (yearsAway <= 8) return "#fbbf24";        // near
  if (yearsAway <= 20) return "#10b981";       // moderate
  return "#888898";                             // far
}

function formatEstimateDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function CrowdEstimateBadge({ result }: { result: CrowdEstimate }) {
  const [hovered, setHovered] = useState(false);
  const color = getProximityColor(result.medianDate);
  const dateStr = formatEstimateDate(result.medianDate);

  return (
    <div
      className="relative z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="font-mono text-[0.75rem] font-bold px-2.5 py-1 rounded-full border cursor-default select-none whitespace-nowrap"
        style={{
          color,
          borderColor: `${color}40`,
          background: `${color}12`,
          textShadow: `0 0 10px ${color}30`,
        }}
      >
        ⌀ {dateStr}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border p-3 text-[0.72rem] font-mono leading-relaxed shadow-xl"
          style={{
            background: "var(--bg-card-solid)",
            borderColor: `${color}30`,
            boxShadow: `0 8px 32px #00000060, 0 0 16px ${color}10`,
          }}
        >
          <div className="font-bold mb-1.5" style={{ color }}>
            Crowd Estimate
          </div>
          <div className="text-(--text-muted) space-y-1">
            <p className="m-0">
              Weighted median of <strong className="text-(--text)">{result.count}</strong> predictions.
              Recent and high-confidence forecasts weighted more heavily.
            </p>
            <p className="m-0 text-(--text-dim) mt-2">
              Range: {result.earliest} – {result.latest}
            </p>
            <p className="m-0 text-(--text-dim)" style={{ fontSize: "0.65rem" }}>
              recency × confidence weighting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Interactive type card carousel
   ──────────────────────────────────────────── */

export function TypeCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const highWaterRef = useRef(0);
  const active = EVENT_TYPES[activeIdx]!;
  const averages = useMemo(computeCrowdEstimates, []);

  // Ratchet min-height upward as the user navigates between types
  useEffect(() => {
    if (!compareMode && cardRef.current) {
      const h = cardRef.current.scrollHeight + 2; // +2 for border
      if (h > highWaterRef.current) highWaterRef.current = h;
    }
  }, [activeIdx, detailsOpen, compareMode]);

  return (
    <section>
      <SectionHeader title="The Four Things We're Actually Tracking" />

      {/* Tab bar */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
        {EVENT_TYPES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setActiveIdx(i); setDetailsOpen(false); setCompareMode(false); }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="px-3 py-1.5 rounded-full text-[0.75rem] font-mono font-medium cursor-pointer transition-all duration-200 border"
            style={{
              background: i === activeIdx ? `${t.color}18` : i === hoveredIdx ? `${t.color}0c` : "transparent",
              borderColor: i === activeIdx ? `${t.color}40` : i === hoveredIdx ? `${t.color}25` : "#ffffff0a",
              color: i === activeIdx ? t.color : i === hoveredIdx ? `${t.color}cc` : "var(--text-dim)",
            }}
          >
            <span className="mr-1 text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active card */}
      <div
        ref={cardRef}
        className="flex flex-col bg-(--bg-card) border rounded-xl p-6 max-sm:p-4 transition-colors duration-300 min-h-[540px]"
        style={{
          borderColor: compareMode ? "#ffffff15" : `${active.color}20`,
          ...(lockedHeight != null ? { height: lockedHeight } : {}),
          ...(highWaterRef.current > 0 && lockedHeight == null ? { minHeight: highWaterRef.current } : {}),
        }}
      >
        {compareMode ? (
          <ComparisonView initialLeft={active.id} initialRight={EVENT_TYPES[(activeIdx + 1) % EVENT_TYPES.length]!.id} activeLabel={active.label} onClose={() => { setCompareMode(false); setLockedHeight(null); }} />
        ) : (
          <div className="flex flex-col flex-1">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl leading-none -mt-1" style={{ fontSize: "2rem" }}>{active.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className="text-[1.05rem] font-bold font-mono m-0 leading-tight"
                      style={{ color: active.color }}
                    >
                      {active.label}
                    </h4>
                    <p className="text-[0.75rem] text-(--text-dim) m-0 mt-0.5 italic">
                      {active.tagline}
                    </p>
                  </div>
                  {averages[active.id] != null && (
                    <CrowdEstimateBadge result={averages[active.id]!} />
                  )}
                </div>
              </div>
            </div>

            <p className="singularity-article-body">{active.description}</p>

            <div
              className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] font-mono px-3 py-2 rounded-lg mt-3 mb-1"
              style={{ background: `${active.color}08`, color: `${active.color}cc` }}
            >
              {active.keyFigures.split(" | ").map((f, i) => (
                <span key={i}>{f}</span>
              ))}
            </div>

            {/* Fun Fact - always visible */}
            <div className="mt-3 rounded-lg border border-[#ffffff0a] p-4" style={{ background: `${active.color}05` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: active.color }}><SparkleIcon /></span>
                <span className="font-mono text-[0.8rem] font-bold" style={{ color: active.color }}>Fun Fact</span>
              </div>
              <p className="m-0 text-[0.8rem] text-(--text-muted) leading-relaxed">{active.funFact}</p>
            </div>

            {/* More Details - accordion, closed by default */}
            <div className="mt-4 rounded-lg border border-[#ffffff0a]" style={{ background: `${active.color}05` }}>
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center gap-2 w-full p-4 cursor-pointer text-left bg-transparent border-none"
              >
                <span style={{ color: active.color }}><GearIcon /></span>
                <span className="font-mono text-[0.8rem] font-bold flex-1" style={{ color: active.color }}>More Details</span>
                <span
                  className="text-[0.75rem] transition-transform duration-200"
                  style={{ color: `${active.color}80`, transform: detailsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  ▼
                </span>
              </button>
              {detailsOpen && (
                <div className="px-4 pb-4">
                  <p className="m-0 text-[0.8rem] text-(--text-muted) leading-relaxed">{active.techDetails}</p>
                </div>
              )}
            </div>

            {/* Nav arrows */}
            <div className="flex items-center mt-auto pt-3 border-t border-[#ffffff06]">
              <button
                onClick={() => { setActiveIdx((activeIdx - 1 + EVENT_TYPES.length) % EVENT_TYPES.length); setDetailsOpen(false); }}
                className="flex-1 text-left text-[0.75rem] text-(--text-dim) hover:text-(--text) cursor-pointer transition-colors font-mono truncate"
              >
                ← {EVENT_TYPES[(activeIdx - 1 + EVENT_TYPES.length) % EVENT_TYPES.length]!.label}
              </button>
              <button
                onClick={() => { if (cardRef.current) setLockedHeight(cardRef.current.offsetHeight); setCompareMode(true); }}
                className="shrink-0 text-[0.7rem] cursor-pointer transition-colors font-mono px-3 py-1 rounded-full border"
                style={{ color: `${active.color}`, borderColor: `${active.color}30`, background: `${active.color}08` }}
              >
                <span className="max-sm:hidden">What's the Difference?</span>
                <span className="sm:hidden">What's the Diff?</span>
              </button>
              <button
                onClick={() => { setActiveIdx((activeIdx + 1) % EVENT_TYPES.length); setDetailsOpen(false); }}
                className="flex-1 text-right text-[0.75rem] text-(--text-dim) hover:text-(--text) cursor-pointer transition-colors font-mono truncate"
              >
                {EVENT_TYPES[(activeIdx + 1) % EVENT_TYPES.length]!.label} →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   Prediction Drift scatter plot
   ──────────────────────────────────────────── */

import { TYPE_HEX, TYPE_LEGEND_ORDER as LEGEND_ORDER, getTypeHex, canonicalType } from "../data/colors";

interface ScatterPoint {
  madeYear: number;
  predictedYear: number;
  color: string;
  name: string;
  type: string;
}

/** True median: averages the two middle values for even-length arrays */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  if (sorted.length % 2 !== 0) return sorted[Math.floor(mid)]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Lower quartile (Q1) */
function q1(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return median(sorted.slice(0, Math.floor(sorted.length / 2)));
}

/** Upper quartile (Q3) */
function q3(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return median(sorted.slice(Math.ceil(sorted.length / 2)));
}

interface MedianPoint {
  year: number;
  median: number;
  q1: number;
  q3: number;
  count: number;
}

function computeScatterData(filterType: string | null): { points: ScatterPoint[]; medians: MedianPoint[] } {
  const points: ScatterPoint[] = [];
  // Use unclamped values for median computation
  const byMadeYear: Record<number, number[]> = {};

  for (const p of allPredictions) {
    if (!p.predicted_year_best || !p.prediction_date) continue;
    const madeYear = parseInt(p.prediction_date.slice(0, 4), 10);
    if (madeYear < 1993) continue;

    const predictedYear = p.predicted_year_best;
    const displayYear = Math.max(2025, Math.min(predictedYear, 2080));
    const pType = canonicalType(p.prediction_type);

    points.push({
      madeYear,
      predictedYear: displayYear,
      color: getTypeHex(p.prediction_type),
      name: p.predictor_name,
      type: p.prediction_type,
    });

    // Only include matching type in median computation
    if (filterType === null || pType === filterType) {
      if (!byMadeYear[madeYear]) byMadeYear[madeYear] = [];
      byMadeYear[madeYear].push(predictedYear);
    }
  }

  // Adaptive rolling window: for each year with data, gather nearby years
  // until we have at least minN points. Recent years (2023+) use tighter windows.
  const allYears = Object.keys(byMadeYear).map(Number).sort((a, b) => a - b);
  const minN = 5;
  const results: MedianPoint[] = [];

  for (const centerYear of allYears) {
    const centerVals = byMadeYear[centerYear]!;

    // For recent years with enough data, use them standalone
    if (centerYear >= 2023 && centerVals.length >= minN) {
      results.push({
        year: centerYear,
        median: median(centerVals),
        q1: q1(centerVals),
        q3: q3(centerVals),
        count: centerVals.length,
      });
      continue;
    }

    // Otherwise, expand window symmetrically until we have enough points
    let pooled = [...centerVals];
    let radius = 0;
    while (pooled.length < minN && radius < 15) {
      radius++;
      for (const yr of allYears) {
        if (yr !== centerYear && Math.abs(yr - centerYear) === radius) {
          pooled.push(...byMadeYear[yr]!);
        }
      }
    }

    // Skip years where even a wide window can't gather enough data
    if (pooled.length < 3) continue;

    results.push({
      year: centerYear,
      median: median(pooled),
      q1: q1(pooled),
      q3: q3(pooled),
      count: pooled.length,
    });
  }

  // Deduplicate: for years that got rolled into their neighbors' windows,
  // keep only every Nth point in the sparse early region to avoid clutter
  const dedupedMedians: MedianPoint[] = [];
  let lastKeptYear = -Infinity;
  for (const pt of results) {
    // Recent years: keep every year
    if (pt.year >= 2020) {
      dedupedMedians.push(pt);
      lastKeptYear = pt.year;
      continue;
    }
    // Sparse early region: keep points at least 3 years apart
    if (pt.year - lastKeptYear >= 3) {
      dedupedMedians.push(pt);
      lastKeptYear = pt.year;
    }
  }

  // Clamp median/quartile values to chart range for display
  for (const m of dedupedMedians) {
    m.median = Math.max(2025, Math.min(m.median, 2080));
    m.q1 = Math.max(2025, Math.min(m.q1, 2080));
    m.q3 = Math.max(2025, Math.min(m.q3, 2080));
  }

  return { points, medians: dedupedMedians };
}

export function PredictionDrift() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const { points, medians } = useMemo(() => computeScatterData(filterType), [filterType]);
  const [hoveredMedian, setHoveredMedian] = useState<{ d: MedianPoint; x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Chart bounds
  const xMin = 1993;
  const xMax = 2027;
  const yMin = 2025;
  const yMax = 2080;

  // Chart area within SVG
  const padL = 14;
  const padR = 2;
  const padT = 3;
  const padB = 10;
  const w = 100;
  const h = 70;

  const xScale = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * (w - padL - padR);
  const yScale = (v: number) => padT + ((yMax - Math.max(yMin, Math.min(yMax, v))) / (yMax - yMin)) * (h - padT - padB);

  const gridYears = [2030, 2040, 2050, 2060, 2070, 2080];
  const gridXYears = [1995, 2000, 2005, 2010, 2015, 2020, 2025];
  const medianColor = filterType ? (TYPE_HEX[filterType] ?? "#ffffff") : "#ffffff";

  const MEDIAN_TIP_W = 300;
  const MEDIAN_TIP_H = 48;

  const handleMedianEnter = useCallback((d: MedianPoint, e: React.MouseEvent<SVGCircleElement>) => {
    const container = chartRef.current;
    const circle = e.currentTarget;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();
    const dotCenterX = circleRect.left + circleRect.width / 2 - containerRect.left;
    const dotTopY = circleRect.top - containerRect.top;

    // Center horizontally above dot, clamp to container edges
    let x = dotCenterX - MEDIAN_TIP_W / 2;
    if (x + MEDIAN_TIP_W > containerRect.width - 4) {
      x = containerRect.width - MEDIAN_TIP_W - 4;
    }
    if (x < 4) x = 4;

    // Place above dot, flip below if not enough room
    let y = dotTopY - MEDIAN_TIP_H - 8;
    if (y < 4) y = dotTopY + circleRect.height + 8;

    setHoveredMedian({ d, x, y });
  }, []);

  const handleMedianLeave = useCallback(() => {
    setHoveredMedian(null);
  }, []);

  return (
    <section>
      <SectionHeader title="The Predictions Are Accelerating" />

      <div ref={chartRef} className="relative bg-(--bg-card) border border-[#ffffff08] rounded-xl p-5 max-sm:p-3">
        <div className="flex max-md:flex-col">
          {/* Legend — fixed-width side column on large screens, horizontal wrap on small */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3 md:flex-col md:mb-0 md:mr-4 md:justify-between md:gap-y-1.5 md:pt-2 md:w-40 md:shrink-0">
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 md:flex-col md:gap-y-1.5">
              {LEGEND_ORDER.map((type) => {
                const isActive = filterType === null || filterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? null : type)}
                    className="flex items-center gap-1 text-[0.6rem] font-mono whitespace-nowrap cursor-pointer transition-opacity duration-150"
                    style={{ color: TYPE_HEX[type], opacity: isActive ? 1 : 0.3 }}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TYPE_HEX[type] }} />
                    {type}
                  </button>
                );
              })}
              {/* Divider */}
              <div className="w-full h-px bg-[#ffffff0a] my-0.5 max-md:hidden" />
              <div className="max-md:basis-full max-md:h-0" />
              <span className="flex items-center gap-1 text-[0.6rem] font-mono text-(--text-dim) whitespace-nowrap">
                <span className="inline-block w-3 h-0.5 rounded shrink-0" style={{ background: medianColor }} />
                median
              </span>
              <span className="flex items-center gap-1 text-[0.6rem] font-mono text-(--text-dim) whitespace-nowrap">
                <span className="inline-block w-3 h-2 rounded-sm shrink-0" style={{ background: medianColor, opacity: 0.25 }} />
                IQR
              </span>
            </div>
            {/* Methodology blurb — bottom of legend column on desktop */}
            <p className="hidden md:block text-[0.55rem] text-(--text-dim) font-mono leading-relaxed m-0 opacity-60">
              Median &amp; IQR per year (min 5 predictions). Sparse years use an adaptive rolling window. Click a type to isolate.
            </p>
          </div>

          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full flex-1 min-w-0"
            style={{ maxHeight: "340px" }}
          >
          {/* Horizontal grid lines + Y-axis labels */}
          {gridYears.map((y, i , arr) => (
            <g key={`gy-${y}`}>
              <line
                x1={padL} y1={yScale(y)} x2={w - padR} y2={yScale(y)}
                stroke="#ffffff06" strokeWidth="0.15"
              />
              <text
                x={padL - 1} y={yScale(y) + 0.8}
                fill="#555568" fontSize="2.2" textAnchor="end" fontFamily="monospace"
              >
                {i === arr.length - 1 ? `${y}+` : y}
              </text>
            </g>
          ))}

          {/* Vertical grid lines + X-axis labels */}
          {gridXYears.map((x) => (
            <g key={`gx-${x}`}>
              <line
                x1={xScale(x)} y1={padT} x2={xScale(x)} y2={h - padB}
                stroke="#ffffff04" strokeWidth="0.15"
              />
              <text
                x={xScale(x)} y={h - padB + 4}
                fill="#555568" fontSize="2" textAnchor="middle" fontFamily="monospace"
              >
                {x}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={w / 2} y={h - 0.5}
            fill="#555568" fontSize="1.8" textAnchor="middle" fontFamily="monospace"
          >
            year prediction was made
          </text>
          <text
            x={2} y={h / 2}
            fill="#555568" fontSize="1.8" textAnchor="middle" fontFamily="monospace"
            transform={`rotate(-90, 2, ${h / 2})`}
          >
            predicted year
          </text>

          {/* Drop shadow filters for median line */}
          <defs>
            <filter id="median-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor={medianColor} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* IQR confidence band (Q1–Q3) */}
          {medians.length > 1 && (
            <polygon
              points={
                medians.map((d) => `${xScale(d.year)},${yScale(d.q3)}`).join(" ") +
                " " +
                [...medians].reverse().map((d) => `${xScale(d.year)},${yScale(d.q1)}`).join(" ")
              }
              fill={medianColor}
              opacity={0.08}
            />
          )}

          {/* Scatter dots */}
          {points.map((pt, i) => {
            const dimmed = filterType !== null && canonicalType(pt.type) !== filterType;
            return (
              <circle
                key={i}
                cx={xScale(pt.madeYear)}
                cy={yScale(pt.predictedYear)}
                r="0.7"
                fill={dimmed ? "#333340" : pt.color}
                opacity={dimmed ? 0.08 : 0.3}
              />
            );
          })}

          {/* Median trend line with drop shadows */}
          {medians.length > 1 && (
            <polyline
              points={medians.map((d) => `${xScale(d.year)},${yScale(d.median)}`).join(" ")}
              fill="none"
              stroke={medianColor}
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#median-glow)"
            />
          )}

          {/* Median dots */}
          {medians.map((d, i) => (
            <circle
              key={`med-${i}`}
              cx={xScale(d.year)}
              cy={yScale(d.median)}
              r={hoveredMedian?.d === d ? 1.3 : 0.9}
              fill={medianColor}
              filter="url(#median-glow)"
              style={{ transition: "r 0.15s ease" }}
            />
          ))}

          {/* Median hit areas */}
          {medians.map((d, i) => (
            <circle
              key={`medhit-${i}`}
              cx={xScale(d.year)}
              cy={yScale(d.median)}
              r="2.5"
              fill="transparent"
              style={{ cursor: "default" }}
              onMouseEnter={(e) => handleMedianEnter(d, e)}
              onMouseLeave={handleMedianLeave}
            />
          ))}

          {/* "ChatGPT launches" annotation */}
          <line
            x1={xScale(2022.9)} y1={padT - 2.25} x2={xScale(2022.9)} y2={h - padB}
            stroke="#ffffff15" strokeWidth="0.2" strokeDasharray="0.8 0.5"
          />
          <text
            x={xScale(2022.9) + 0.5} y={padT - 1}
            fill="#ffffff30" fontSize="1.6" fontFamily="monospace"
          >
            ChatGPT Launches
          </text>
        </svg>
        </div>

        {/* Median tooltip */}
        {hoveredMedian && (() => {
          const { d, x, y } = hoveredMedian;
          const medianRounded = Math.round(d.median);
          const text = filterType
            ? `${d.year} predictions suggest ${filterType} by ~${medianRounded}`
            : `${d.year} median prediction: ~${medianRounded}`;
          const sub = `median of ${d.count} predictions (IQR: ${Math.round(d.q1)}–${Math.round(d.q3)})`;
          return (
            <div
              className="absolute z-50 pointer-events-none rounded-lg border px-3 py-2 shadow-xl opacity-90"
              style={{
                top: y - 10,
                left: x,
                width: MEDIAN_TIP_W,
                background: "rgba(10, 10, 15, 0.95)",
                borderColor: `${medianColor}30`,
                boxShadow: `0 8px 24px #00000060, 0 0 12px ${medianColor}15`,
              }}
            >
              <div className="text-[0.7rem] font-mono font-medium leading-snug" style={{ color: medianColor }}>
                {text}
              </div>
              <div className="text-[0.6rem] font-mono text-(--text-dim) mt-0.5">
                {sub}
              </div>
            </div>
          );
        })()}

        {/* Methodology blurb — under graph on small screens only */}
        <p className="md:hidden text-[0.55rem] text-(--text-dim) font-mono mt-2 mb-0 leading-relaxed opacity-60">
          Median &amp; IQR per year (min 5 predictions). Sparse years use an adaptive rolling window. Click a type to isolate.
        </p>
      </div>

      {/* Explainer blurb */}
      <div className="singularity-info-content mt-6 bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
        <p>
          Every year, experts say we have <em>less</em> time left — and they're not
          revising gradually. The predictions are accelerating faster than the
          technology they're predicting.
        </p>
        <p>
          Every generation of AI researchers since the 1960s has predicted human-level AI
          within 20 years — and been wrong. But the current shift is structurally different:
          it's driven by <em>demonstrated capabilities</em>, not theoretical arguments. Industry
          leaders with direct access to frontier models cluster years ahead of academic surveys.
          Whether that gap reflects genuine information advantage or commercial incentive is the
          trillion-dollar question.
        </p>
        <p className="text-(--text-dim)! text-[0.78rem]! font-mono italic">
          History favors caution. But history has also never seen capability curves quite like these.
        </p>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   The "camps" comparison
   ──────────────────────────────────────────── */

export function ThreeCamps() {
  const camps = [
    {
      label: "The Optimists",
      range: "2026 – 2030",
      color: "#ef4444",
      people: "Altman, Amodei, Musk, Brin, Suleyman, Son",
      vibe: "Industry leaders with front-row seats to frontier models. Either they know something we don't, or their stock options are doing the talking. Amodei: software engineers extinct by Christmas 2026.",
    },
    {
      label: "The Moderates",
      range: "2030 – 2050",
      color: "#fbbf24",
      people: "Hassabis, Metaculus, Grace survey, Cotra, Hinton, Pichai",
      vibe: "Forecasting communities, academic surveys, and lab leaders. The \"we've seen this hype before, but have you *seen* GPT-5?\" camp. Hinton says 5-20 years and admits he has \"zero idea really.\"",
    },
    {
      label: "The Skeptics",
      range: "2050 – 2300",
      color: "#10b981",
      people: "Brooks, Ng, Marcus, Chollet, Nadella, Hofstadter",
      vibe: "Passing benchmarks ≠ understanding. Brooks revised from 2300 to 2075 — progress! Ng says the hype \"is creating the impression AI systems are far more advanced than they truly are.\"",
    },
  ];

  return (
    <section>
      <SectionHeader title="Three Camps, One Civilization" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {camps.map((c) => (
          <div
            key={c.label}
            className="bg-(--bg-card) border rounded-lg p-4"
            style={{ borderColor: `${c.color}20` }}
          >
            <div className="font-mono text-[0.85rem] font-bold mb-0.5" style={{ color: c.color }}>
              {c.label}
            </div>
            <div className="font-mono text-[1.1rem] font-bold text-(--text) mb-2">{c.range}</div>
            <p className="text-[0.78rem] text-(--text-muted) m-0 mb-2 leading-relaxed">{c.vibe}</p>
            <div className="text-[0.7rem] text-(--text-dim) font-mono">{c.people}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────── */

export function SingularityInfo() {
  return (
    <section>
      <SectionHeader title="What Even Is the Singularity?" />

      <div className="singularity-info-content bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
        <img src="/art/singularity.png" alt="" className="float-left w-64 h-64 object-cover rounded-xl opacity-80 mr-6 mb-4 max-md:w-36 max-md:h-36 max-sm:float-none max-sm:w-full max-sm:h-auto max-sm:mr-0 max-sm:mb-4" />
        <p>
          Short answer: nobody agrees. The <strong>technological singularity</strong> is the
          hypothetical future point where AI gets smart enough to improve itself faster than we can
          keep up — the <strong>intelligence explosion</strong> — and everything after that is
          unknowable. It's where our trend lines go vertical and our models start
          returning <code className="text-[0.8em] bg-[#ffffff08] px-1.5 py-0.5 rounded font-mono">NaN</code>.
        </p>
        <p className="pull-quote">
          "The first ultraintelligent machine is the last invention that man need ever make."
          <span className="attribution">— I.J. Good, 1965</span>
        </p>
        <p>
          The term traces back to <strong>von Neumann</strong> in the 1950s, was formalized
          by <strong>Vernor Vinge</strong> in 1993, and became a bestseller
          with <strong>Kurzweil</strong> in 2005. Nobody agrees on what it actually <em>is</em> — Vinge
          says event horizon, Kurzweil says predictable endpoint, Bostrom focuses on superintelligence — but
          almost all versions orbit Good's intelligence explosion: the first machine smarter than us designs
          a smarter one, and the loop leaves humanity as spectators. With expert timelines lurching
          forward by over a decade in a single survey cycle, that hypothesis is getting harder to dismiss.
        </p>
        <p>
          This site tracks <strong>{allPredictions.length} predictions</strong> across four
          flavors of singularity, because if we're going to be obsolete, we should at least have
          good data visualization for it.
        </p>
      </div>

    </section>
  );
}

export function ShouldIBeWorried() {
  return (
    <section>
      <SectionHeader title="So... Should I Be Worried?" />

      <div className="singularity-info-content bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
        <img src="/art/robot-crystal-ball.png" alt="" className="float-right w-64 h-64 object-cover rounded-xl opacity-80 ml-6 mb-4 max-md:w-36 max-md:h-36 max-sm:float-none max-sm:w-full max-sm:h-auto max-sm:ml-0 max-sm:mb-4" />
        <p>
          Depends who you ask. Industry insiders say 3-5 years. Academics say 15-20. Safety
          researchers say it doesn't matter when — what matters is whether we figure
          out <strong>alignment</strong> before we figure out capability. Even the skeptics are
          accelerating: Brooks revised from 2300 to 2075, and expert medians jumped forward
          13 years in a single survey cycle after ChatGPT launched.
        </p>
        <p className="pull-quote">
          "There's a 10 to 20% chance that AI leads to human extinction within the next 30 years."
          <span className="attribution">— Geoffrey Hinton, Nobel laureate &amp; "godfather of AI"</span>
        </p>
        <p>
          That's what the countdown timer is for. Pick a prediction, watch the seconds
          tick, and decide for yourself whether to feel excited, terrified, or both. We recommend
          both.
        </p>
      </div>
    </section>
  );
}
