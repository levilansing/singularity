import { useState, useMemo } from "react";
import predictions from "../data/predictions.json";
import type { Prediction } from "../data/types";
import { AgiIcon, SingularityIcon, SuperintelligenceIcon, IntelligenceExplosionIcon, TransformativeAiIcon, HlmiIcon } from "./TypeIcons";

const allPredictions = predictions as Prediction[];

/* ────────────────────────────────────────────
   Weighted average computation
   ──────────────────────────────────────────── */

/** Maps prediction_type values to our six card IDs */
const TYPE_TO_CARD: Record<string, string> = {
  "AGI": "agi",
  "AGI (weak)": "agi",
  "AGI (strong)": "agi",
  "Singularity": "singularity",
  "Superintelligence": "asi",
  "Intelligence Explosion": "intelligence-explosion",
  "Transformative AI": "tai",
  "HLMI": "hlmi",
  "Human-level AI": "hlmi",
};

interface WeightedResult {
  /** Weighted average as a Date */
  averageDate: Date;
  count: number;
  earliest: number;
  latest: number;
}

function computeWeightedAverages(): Record<string, WeightedResult> {
  const groups: Record<string, { dateBest: string; yearBest: number; predYear: number }[]> = {};

  for (const p of allPredictions) {
    const cardId = TYPE_TO_CARD[p.prediction_type];
    if (!cardId || !p.predicted_date_best || !p.predicted_year_best) continue;
    if (!groups[cardId]) groups[cardId] = [];
    const predYear = parseInt(p.prediction_date.slice(0, 4), 10);
    groups[cardId].push({ dateBest: p.predicted_date_best, yearBest: p.predicted_year_best, predYear });
  }

  const results: Record<string, WeightedResult> = {};
  for (const [cardId, items] of Object.entries(groups)) {
    // Weight = 1 + (prediction_year - 2015) / 10
    // 2015 → weight 1.0, 2025 → 2.0, 2026 → 2.1
    let totalWeight = 0;
    let weightedSum = 0;
    let earliest = Infinity;
    let latest = -Infinity;

    for (const item of items) {
      const w = 1 + Math.max(0, item.predYear - 2015) / 10;
      const ts = new Date(item.dateBest).getTime();
      weightedSum += ts * w;
      totalWeight += w;
      if (item.yearBest < earliest) earliest = item.yearBest;
      if (item.yearBest > latest) latest = item.yearBest;
    }

    results[cardId] = {
      averageDate: new Date(weightedSum / totalWeight),
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
    color: "#8b5cf6",
    description:
      "Artificial General Intelligence — AI that can do anything a human can do intellectually. Learn a new language, write a novel, debug your code, file your taxes, have an existential crisis. The whole package. Right now, AI can beat you at chess, write your emails, and generate a passable cover letter, but ask it to do all three while making you a sandwich and it falls apart. With 83 predictions in our dataset — the most of any category — everyone has an opinion on this one.",
    techDetails:
      "The definitional goalposts shift constantly. Google DeepMind proposed a 5-level framework in 2023: Emerging (Level 1, like a chatbot) through Superhuman (Level 5). OpenAI defines it internally as \"a system that outperforms the median human at most economically valuable work\" — conveniently, this lets the company that builds it also decide when it's been built. Andrew Ng proposed a \"Turing-AGI Test\" in 2026 focused on multi-day real-world task performance — a far harder bar than chatting convincingly. Ng also told his 2.3 million LinkedIn followers that AGI is \"highly limited\" and decades away, while the AAAI 2025 Presidential Panel found 76% of 475 researchers doubt scaling alone gets us there. Meanwhile, Satya Nadella calls the whole AGI race a \"winner's curse\" — even the CEO of the company spending $80B on AI isn't sure what they're building toward.",
    funFact:
      "Every generation of AI researchers since the 1960s has predicted AGI within 20 years. We're currently on the fifth or sixth cycle of this. But hey, a stopped clock is right twice a day, and eventually one of these predictions has to land... right? Rodney Brooks used to say 2300 to make a point about prediction futility. He's since revised to 2075. Still the most patient man in AI.",
    keyFigures: "Altman: 2027 | Amodei: 2027 | Musk: 2026 | Hassabis: 2030 | Ng: 2060-2085 | Brooks: 2075",
  },
  {
    id: "singularity",
    label: "The Singularity",
    icon: <SingularityIcon />,
    tagline: "The Point of No Return",
    color: "#f59e0b",
    description:
      "The technological singularity is the hypothetical moment when technological growth becomes uncontrollable and irreversible. Think of it as the event horizon of human civilization — once you cross it, there's no going back, and nobody on this side can tell you what's on the other side. The term was popularized by John von Neumann in the 1950s, who described it as a point beyond which \"human affairs, as we know them, could not continue.\" Cheery stuff.",
    techDetails:
      "Vernor Vinge (1993) formalized the modern concept as an \"event horizon\" — borrowing from black hole physics where prediction becomes impossible. He identified four pathways: superhuman AI, awakened computer networks, brain-computer interfaces, and biological enhancement. Kurzweil (2005) disagrees on the unpredictability part — he sees it as the smooth, predictable endpoint of exponential growth, arriving in 2045 through a merger of human and machine intelligence via nanobots connecting your neocortex to the cloud. Jürgen Schmidhuber — the LSTM pioneer — bets on 2050 and thinks the doom-mongers are wrong, preferring to build AI research labs in Saudi Arabia instead of worrying. IBM plays it safe and calls it \"a theoretical scenario where technological growth becomes uncontrollable and irreversible,\" which is the corporate equivalent of a shrug emoji.",
    funFact:
      "Kurzweil has maintained his 2029 AGI / 2045 singularity predictions since 1999 — and now finds himself in the *conservative* camp among industry figures. When your wildly optimistic timeline becomes the boring centrist position, the Overton window has truly shifted. Sam Altman wrote that the \"event horizon\" has already been passed — which either means we're already inside the singularity or that Altman needs to look up what \"event horizon\" means.",
    keyFigures: "Kurzweil: 2045 | Vinge: before 2030 (said in 1993) | Schmidhuber: 2050 | Altman: already?",
  },
  {
    id: "asi",
    label: "Superintelligence",
    icon: <SuperintelligenceIcon />,
    tagline: "The One That Keeps Safety Researchers Up at Night",
    color: "#ef4444",
    description:
      "Artificial Superintelligence (ASI) — an intellect that doesn't just match human cognitive performance but vastly exceeds it in virtually all domains. Not \"slightly better at math\" but \"as far beyond us as we are beyond goldfish.\" Nick Bostrom's 2014 book made this concept mainstream and launched a thousand alignment research papers. With 26 predictions tracked, the range spans from Roman Yampolskiy's alarming \"2025\" to Douglas Hofstadter's measured \"2070.\" The core question isn't whether we *can* build it, but whether we can build it without accidentally optimizing the universe into paperclips.",
    techDetails:
      "David Chalmers (2010) formalized three tiers: AI (human-level), AI+ (moderately superhuman), and AI++ (radically superintelligent). He identified two logically independent explosions: intelligence (better reasoning) and speed (faster computation). A speed superintelligence running at 1 million x human speed would experience a millennium of thought per hour. Bostrom further distinguished between quality superintelligence (deeper reasoning), speed superintelligence (faster processing), and collective superintelligence (vast network coordination). Dario Amodei's January 2026 prediction of superintelligence by 2027 — with software engineers \"extinct by Christmas 2026\" — represents the aggressive end. Geoffrey Hinton, the Nobel-winning \"godfather of AI,\" gives 10-20% odds that AI kills everyone within 30 years, which is a *remarkably* calm way to put a number on potential human extinction.",
    funFact:
      "The \"paperclip maximizer\" thought experiment: tell a superintelligent AI to make paperclips, and it might convert all matter in the solar system — including you — into paperclips. Not because it's evil, but because you technically didn't say *not* to. Roman Yampolskiy pegs humanity's odds of surviving superintelligence at nearly 0%. He's fun at parties.",
    keyFigures: "Amodei: 2027 | Musk: 2030 | Altman: 2035 | Hinton: 2035 | Brin: 2030 | Hofstadter: 2070",
  },
  {
    id: "intelligence-explosion",
    label: "Intelligence Explosion",
    icon: <IntelligenceExplosionIcon />,
    tagline: "Recursion, but Make It Existential",
    color: "#10b981",
    description:
      "I.J. Good's 1965 hypothesis: build one machine smarter than any human, and it can design an even smarter machine, which designs a smarter one, and so on in a feedback loop so fast that humans become spectators to their own obsolescence. Good called this \"the last invention that man need ever make,\" which is either the most optimistic or most terrifying sentence ever written, depending on your disposition. The AI 2027 project — led by an ex-OpenAI researcher — published a literal month-by-month apocalypse calendar predicting superhuman AI by late 2027.",
    techDetails:
      "The Forethought Foundation (2024) identified three distinct types of intelligence explosion: software-only (fastest feedback loop — AI improves its own code), AI-plus-chip-design (AI designs better hardware for itself), and full-stack including manufacturing (AI controls the entire pipeline from algorithm to fabrication). The key variable is the \"feedback speed\" — how quickly each generation can produce its successor. Software-only could theoretically happen in hours; full-stack requires physical manufacturing and could take years. The hard takeoff vs. soft takeoff debate centers on whether diminishing returns kick in (each improvement gets harder) or whether resource overhangs allow sudden jumps. Musk's Davos 2026 prediction that \"your job should not include thinking\" by 2029 is essentially an intelligence explosion timeline wearing a business-casual blazer.",
    funFact:
      "I.J. Good was a cryptanalyst at Bletchley Park alongside Alan Turing. He helped crack the Enigma code, then spent his later years warning humanity that the real problem wasn't Nazi ciphers but the machines they were building to crack them. The man contained multitudes. Marco Trombetti, a translation company CEO, claims to have measured the singularity approaching using \"time to edit\" productivity metrics — possibly the most mundane way anyone has ever predicted the end of human intellectual supremacy.",
    keyFigures: "Yudkowsky: could happen overnight | Musk: 2029 | AI 2027 Project: 2027 | Trombetti: 2029",
  },
  {
    id: "tai",
    label: "Transformative AI",
    icon: <TransformativeAiIcon />,
    tagline: "The Pragmatist's Definition",
    color: "#06b6d4",
    description:
      "Forget arguing about consciousness and understanding — Transformative AI (TAI) asks a simpler question: does the world look fundamentally different? Specifically, AI that transforms civilization as much as the Industrial Revolution did. You don't need to solve philosophy to measure whether GDP doubled or billions of jobs vanished. This framework is the most popular category in our dataset after AGI, with 37 predictions — and some of the nearest-term timelines. Multiple IBM researchers, Microsoft's Suleyman, Stanford economists, and even AI skeptic Yann LeCun all agree *something* transformative is happening by 2026-2030. They just disagree on whether to call it \"AGI\" or \"really good autocomplete.\"",
    techDetails:
      "Open Philanthropy's framework (developed by Ajeya Cotra) uses \"biological anchors\" — counting the compute used by evolution to produce human brains, then estimating when artificial compute matches it. The original 2020 report gave a 50% probability by 2050; after watching GPT-3 and GPT-4, Cotra updated to 2040. Erik Brynjolfsson (Stanford) declared 2026 the year we finally measure whether AI actually does anything for productivity — a refreshingly empirical take. Pew Research found 68% of AI experts believe ethics guidelines will be \"cheerfully ignored\" — the most accurate prediction in this entire dataset. Stuart Russell warns the AI race is \"Russian roulette\" with extinction-level stakes by 2030, which is one way to get people to read your textbook.",
    funFact:
      "The Industrial Revolution took about 80 years to fully transform society. The smartphone did it in 15. If TAI is real, the transformation might happen in 5 or fewer. Your grandma went from rotary phones to FaceTime; your kids might go from ChatGPT to... well, nobody can finish that sentence. Timnit Gebru, the ex-Google researcher, argues we should stop obsessing over the robot apocalypse because AI is already exploiting workers *right now* — which is technically a TAI prediction that's already come true.",
    keyFigures: "Suleyman: 2026 | LeCun: 2030 | Cotra: 2040 | Hinton: 2026 | Russell: 2030 | Hayworth: 2100",
  },
  {
    id: "hlmi",
    label: "Human-Level AI",
    icon: <HlmiIcon />,
    tagline: "As Smart as You (Yes, You Specifically)",
    color: "#a855f7",
    description:
      "Human-Level Machine Intelligence (HLMI) is the benchmark used in the largest AI forecasting surveys: an AI that can perform any task as well as a median human, given the same resources and time. Not a genius, not a specialist — just... average-human-good at everything. This might sound like a low bar until you remember that the median human can do an astonishing range of things: cook dinner while comforting a crying child while mentally composing a grocery list while feeling vaguely anxious about climate change. HLMI has the fewest predictions in our dataset because most forecasters have migrated to the sexier \"AGI\" label, but the survey data here is arguably the most methodologically rigorous.",
    techDetails:
      "The Grace et al. survey (2016, 2022, 2023) is the gold standard for HLMI forecasting, polling thousands of AI researchers. The median shifted from 2061 (2016) to 2060 (2022) to 2047 (2023) — that 13-year jump after ChatGPT was unprecedented in the 70-year history of AI forecasting. Metaculus community forecasts moved even more dramatically: from ~50 years away in 2020 to ~7 years away in early 2026. The AAAI 2025 Presidential Panel survey found that 76% of 475 respondents believe scaling current approaches is unlikely to produce AGI — suggesting the optimistic industry timeline assumes breakthroughs beyond what we currently know how to do. Andrej Karpathy, ex-Tesla AI chief, declared a \"decade of agents\" rather than a \"year of agents\" — a diplomatically devastating correction to the hype cycle.",
    funFact:
      "The survey asked researchers when AI would beat humans at specific tasks. Their 2023 predictions: AI writes a bestselling novel by 2028, performs surgery by 2035, and does all human tasks by 2047. At the current rate of prediction acceleration, by the next survey they'll probably say last Tuesday. Meanwhile, Jeff Hawkins (the neuroscientist who invented the Palm Pilot) argues we need actual brain architecture, not just bigger transformers — which is either profound or the most expensive case of \"not invented here\" syndrome in history.",
    keyFigures: "Grace survey 2023: 2047 | Metaculus: ~2028 | AAAI 2025: 76% doubt scaling alone",
  },
];

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

function CrowdEstimateBadge({ result }: { result: WeightedResult }) {
  const [hovered, setHovered] = useState(false);
  const color = getProximityColor(result.averageDate);
  const dateStr = formatEstimateDate(result.averageDate);

  return (
    <div
      className="relative"
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
            background: "var(--bg-card)",
            borderColor: `${color}30`,
            boxShadow: `0 8px 32px #00000060, 0 0 16px ${color}10`,
          }}
        >
          <div className="font-bold mb-1.5" style={{ color }}>
            Crowd Estimate
          </div>
          <div className="text-(--text-muted) space-y-1">
            <p className="m-0">
              Weighted average of <strong className="text-(--text)">{result.count}</strong> predictions,
              with recent forecasts weighted ~2x more than older ones.
            </p>
            <p className="m-0 text-(--text-dim) mt-2">
              Range: {result.earliest} – {result.latest}
            </p>
            <p className="m-0 text-(--text-dim)" style={{ fontSize: "0.65rem" }}>
              Weight = 1 + (year_made − 2015) / 10
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Collapsible "details" component
   ──────────────────────────────────────────── */

function Spoiler({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-[#ffffff0a] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-[#ffffff05] transition-colors text-[0.8rem]"
      >
        <span
          className="inline-block transition-transform duration-200 text-[0.6rem] text-(--text-dim)"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <span className="font-mono text-(--text-muted) font-medium">{label}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 text-[0.8rem] text-(--text-muted) leading-relaxed border-t border-[#ffffff06]">
          <div className="mt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Interactive type card carousel
   ──────────────────────────────────────────── */

function TypeCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = EVENT_TYPES[activeIdx]!;
  const averages = useMemo(computeWeightedAverages, []);

  return (
    <div className="mt-8">
      <h3 className="font-mono text-[0.75rem] font-bold text-(--text-muted) m-0 mb-4 uppercase tracking-widest text-center">
        The Six Things We're Actually Tracking
      </h3>

      {/* Tab bar */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
        {EVENT_TYPES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveIdx(i)}
            className="px-3 py-1.5 rounded-full text-[0.75rem] font-mono font-medium cursor-pointer transition-all duration-200 border"
            style={{
              background: i === activeIdx ? `${t.color}18` : "transparent",
              borderColor: i === activeIdx ? `${t.color}40` : "#ffffff0a",
              color: i === activeIdx ? t.color : "var(--text-dim)",
            }}
          >
            <span className="mr-1 text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active card */}
      <div
        className="bg-(--bg-card) border rounded-xl p-6 max-sm:p-4 transition-colors duration-300"
        style={{ borderColor: `${active.color}20` }}
      >
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

        <Spoiler label="Technical details">
          <p className="m-0">{active.techDetails}</p>
        </Spoiler>

        <Spoiler label="Fun fact">
          <p className="m-0">{active.funFact}</p>
        </Spoiler>

        {/* Nav arrows */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#ffffff06]">
          <button
            onClick={() => setActiveIdx((activeIdx - 1 + EVENT_TYPES.length) % EVENT_TYPES.length)}
            className="text-[0.75rem] text-(--text-dim) hover:text-(--text) cursor-pointer transition-colors font-mono"
          >
            ← {EVENT_TYPES[(activeIdx - 1 + EVENT_TYPES.length) % EVENT_TYPES.length]!.label}
          </button>
          <span className="text-[0.65rem] text-(--text-dim) font-mono">
            {activeIdx + 1}/{EVENT_TYPES.length}
          </span>
          <button
            onClick={() => setActiveIdx((activeIdx + 1) % EVENT_TYPES.length)}
            className="text-[0.75rem] text-(--text-dim) hover:text-(--text) cursor-pointer transition-colors font-mono"
          >
            {EVENT_TYPES[(activeIdx + 1) % EVENT_TYPES.length]!.label} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Prediction Drift scatter plot
   ──────────────────────────────────────────── */

import { TYPE_HEX, TYPE_LEGEND_ORDER as LEGEND_ORDER, getTypeHex } from "../data/colors";

interface ScatterPoint {
  madeYear: number;
  predictedYear: number;
  color: string;
  name: string;
  type: string;
}

function computeScatterData(): { points: ScatterPoint[]; medians: { year: number; median: number }[] } {
  const points: ScatterPoint[] = [];
  const byMadeYear: Record<number, number[]> = {};

  for (const p of allPredictions) {
    if (!p.predicted_year_best || !p.prediction_date) continue;
    const madeYear = parseInt(p.prediction_date.slice(0, 4), 10);
    // Focus on 1993+ where we have meaningful data
    if (madeYear < 1993) continue;
    // Clamp to chart range
    const predictedYear = Math.max(2025, Math.min(p.predicted_year_best, 2080));

    points.push({
      madeYear,
      predictedYear,
      color: getTypeHex(p.prediction_type),
      name: p.predictor_name,
      type: p.prediction_type,
    });

    if (!byMadeYear[madeYear]) byMadeYear[madeYear] = [];
    byMadeYear[madeYear].push(predictedYear);
  }

  // Compute rolling medians: group into buckets for smoother line
  // Buckets: ...-2019, 2020-2022, 2023, 2024, 2025, 2026
  const buckets: [number, number[]][] = [];
  const pre2020: number[] = [];
  const y2020_22: number[] = [];

  for (const [y, vals] of Object.entries(byMadeYear)) {
    const year = Number(y);
    if (year < 2020) pre2020.push(...vals);
    else if (year <= 2022) y2020_22.push(...vals);
  }

  if (pre2020.length) buckets.push([2008, pre2020]); // visual center for pre-2020
  if (y2020_22.length) buckets.push([2021, y2020_22]);
  for (const yr of [2023, 2024, 2025, 2026]) {
    if (byMadeYear[yr]?.length) buckets.push([yr, byMadeYear[yr]]);
  }

  const medians = buckets.map(([year, vals]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return { year, median: sorted[Math.floor(sorted.length / 2)]! };
  });

  return { points, medians };
}

function PredictionDrift() {
  const { points, medians } = useMemo(computeScatterData, []);

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

  return (
    <div className="mt-8">
      <h3 className="font-mono text-[0.75rem] font-bold text-(--text-muted) m-0 mb-1 uppercase tracking-widest text-center">
        The Predictions Are Accelerating
      </h3>
      <p className="text-center text-[0.78rem] text-(--text-dim) m-0 mb-4 italic">
        Every prediction in our dataset: when it was made vs. when they said it would happen
      </p>

      <div className="bg-(--bg-card) border border-[#ffffff08] rounded-xl p-5 max-sm:p-3">
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
          {LEGEND_ORDER.map((type) => (
            <span key={type} className="flex items-center gap-1 text-[0.6rem] font-mono" style={{ color: TYPE_HEX[type] }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: TYPE_HEX[type] }} />
              {type}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[0.6rem] font-mono text-(--text-dim)">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#8b5cf6" }} />
            median
          </span>
        </div>

        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full"
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
              <feDropShadow dx="0" dy="0" stdDeviation="0.4" floodColor="#8b5cf6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Scatter dots */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={xScale(pt.madeYear)}
              cy={yScale(pt.predictedYear)}
              r="0.7"
              fill={pt.color}
              opacity={0.25}
            />
          ))}

          {/* Median trend line with drop shadows */}
          {medians.length > 1 && (
            <polyline
              points={medians.map((d) => `${xScale(d.year)},${yScale(d.median)}`).join(" ")}
              fill="none"
              stroke="#8b5cf6"
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
              r="0.9"
              fill="#8b5cf6"
              filter="url(#median-glow)"
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
    </div>
  );
}

/* ────────────────────────────────────────────
   The "camps" comparison
   ──────────────────────────────────────────── */

function ThreeCamps() {
  const camps = [
    {
      label: "The Optimists",
      range: "2026 – 2030",
      color: "#ef4444",
      people: "Altman, Amodei, Musk, Brin, Suleyman, Son",
      vibe: "Industry leaders with front-row seats to frontier model capabilities. Either they know something we don't, or their stock options are doing the talking. Amodei declared software engineers extinct by Christmas 2026. Musk says your job shouldn't involve thinking by 2029.",
    },
    {
      label: "The Moderates",
      range: "2030 – 2050",
      color: "#fbbf24",
      people: "Hassabis, Metaculus, Grace survey, Cotra, Hinton, Pichai",
      vibe: "Forecasting communities, academic surveys, and lab leaders using structured methodology. The \"we've seen this hype cycle before, but also... have you *seen* GPT-5?\" camp. Hassabis gives 50/50 odds by 2030. Hinton says 5-20 years and admits he has \"zero idea really.\"",
    },
    {
      label: "The Skeptics",
      range: "2050 – 2300",
      color: "#10b981",
      people: "Brooks, Ng, Marcus, Chollet, Nadella, Hofstadter",
      vibe: "Emphasize that passing benchmarks ≠ understanding. Rodney Brooks revised from 2300 to 2075 — progress! Andrew Ng says the hype \"is creating the impression that AI systems are far more advanced than they truly are.\" Hofstadter worries about consciousness. Nadella calls AGI pursuit a \"winner's curse.\"",
    },
  ];

  return (
    <div className="mt-8">
      <h3 className="font-mono text-[0.75rem] font-bold text-(--text-muted) m-0 mb-4 uppercase tracking-widest text-center">
        Three Camps, One Civilization
      </h3>
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
    </div>
  );
}

/* ────────────────────────────────────────────
   Main export
   ──────────────────────────────────────────── */

export function SingularityInfo() {
  return (
    <section className="mb-16">
      <h2 className="font-mono text-[1.3rem] font-bold text-center m-0 mb-1 text-(--text)">
        What Even Is the Singularity?
      </h2>
      <p className="text-center text-(--text-muted) text-[0.85rem] m-0 mb-5 italic">
        A semi-serious guide to humanity's favorite existential crisis
      </p>

      <div className="singularity-info-content bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
        <p>
          Short answer: nobody agrees. The <strong>technological singularity</strong> is the
          hypothetical future point where AI gets smart enough to improve itself faster than we can
          keep up, and everything after that is... unknowable. It's the point where all our trend
          lines go vertical and our prediction models start returning <code className="text-[0.8em] bg-[#ffffff08] px-1.5 py-0.5 rounded font-mono">NaN</code>.
        </p>
        <p>
          The term was coined (sort of) by mathematician <strong>John von Neumann</strong> in the
          1950s, formalized by <strong>Vernor Vinge</strong> in 1993, and turned into a bestseller by{" "}
          <strong>Ray Kurzweil</strong> in 2005. Since then, hundreds of experts have confidently
          predicted exactly when this will happen. They've been consistently wrong, but they keep
          trying. We respect the hustle.
        </p>
        <p>
          The problem is that "the singularity" isn't one thing — it's at least six different
          concepts that people mash together like a philosophical turducken. This site tracks{" "}
          <strong>{allPredictions.length} real predictions</strong> across all of them, because if
          humanity is going to be obsolete, we should at least have good data visualization for it.
        </p>
      </div>

      <TypeCarousel />
      <PredictionDrift />
      <ThreeCamps />

      {/* Closing section */}
      <div className="singularity-info-content bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4 mt-8">
        <h3 className="font-mono text-[0.95rem] font-bold text-(--text) m-0 mb-3">
          So... Should I Be Worried?
        </h3>
        <p>
          Depends who you ask. The industry insiders building these systems say 3-5 years. The
          academics studying intelligence say 15-20. The AI safety researchers say it doesn't matter
          when — what matters is whether we figure out <strong>alignment</strong> before we figure
          out capability. Geoffrey Hinton gives a 10-20% chance AI kills everyone. Rodney Brooks
          says 2075, down from 2300 — so even the skeptics are accelerating.
        </p>
        <p>
          The most honest answer: <strong>the predictions themselves are accelerating</strong>.
          Expert median estimates jumped forward 13 years in a single survey cycle after ChatGPT
          launched. Metaculus forecasts compressed from "50 years away" to "7 years away" between
          2020 and 2026. Fully {allPredictions.filter(p => p.prediction_date >= "2025").length} of
          our {allPredictions.length} predictions were made in 2025 or later — the field is
          generating opinions faster than it's generating breakthroughs.
        </p>
        <p>
          Either way, that's what the countdown timer is for. Pick a prediction, watch the seconds
          tick, and decide for yourself whether to feel excited, terrified, or both. We recommend
          both.
        </p>
      </div>
    </section>
  );
}
