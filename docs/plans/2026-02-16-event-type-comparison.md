# Event Type Comparison Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Compare These" button to the TypeCarousel that opens a full-screen modal where users pick two event types and see a pre-written explanation of the difference.

**Architecture:** A `ComparisonModal` component rendered inside `TypeCarousel`, toggled by state. A `COMPARISONS` data record stores 10 pre-written blurbs keyed by sorted pair IDs. Two styled `<select>` dropdowns control which pair is shown.

**Tech Stack:** React, Tailwind CSS v4, existing CSS custom properties

---

### Task 1: Add COMPARISONS data

**Files:**
- Modify: `src/components/SingularityInfo.tsx` (after `EVENT_TYPES` array, around line 177)

**Step 1: Add the comparison data record**

Insert after the `EVENT_TYPES` array closing bracket (line 177):

```tsx
/** Comparison key: sorted pair of event type IDs joined by "|" */
function comparisonKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

const COMPARISONS: Record<string, { title: string; body: string }> = {
  [comparisonKey("agi", "tai")]: {
    title: "AGI vs Transformative AI",
    body: "AGI is about matching human cognition — can the machine think like us? Transformative AI doesn't care about thinking at all. It asks: did civilization change? You could have transformative AI without anything resembling general intelligence (imagine a narrow system that automates 80% of jobs), and you could theoretically have AGI without transformation (a human-level AI that's too expensive to deploy). In practice, the TAI crowd thinks the AGI debate is philosophical navel-gazing, while the AGI crowd thinks TAI is just kicking the definitional can down the road. They're both right.",
  },
  [comparisonKey("agi", "hlmi")]: {
    title: "AGI vs Human-Level AI",
    body: "These sound identical and everyone uses them interchangeably, which is exactly the problem. HLMI is specifically pegged to the median human — can the machine do everything an average person can? AGI is vaguer and more ambitious: some definitions require creativity, transfer learning, or even understanding. An HLMI could theoretically be a very sophisticated mimic that passes every test without 'getting it.' Whether that distinction matters depends on whether you think the Turing test measures intelligence or acting. The survey data treats them differently: HLMI surveys produce later dates because researchers interpret the bar as higher when the question is phrased more carefully.",
  },
  [comparisonKey("agi", "asi")]: {
    title: "AGI vs Superintelligence",
    body: "AGI is the finish line everyone's racing toward. Superintelligence is what happens five minutes later — and it's the part that keeps safety researchers awake. AGI matches us; ASI surpasses us in every domain, potentially by an incomprehensible margin. The critical question is the 'takeoff speed': if there's a long gap between AGI and ASI, we have time to align it. If AGI immediately bootstraps to ASI (the 'hard takeoff' scenario), we get one shot at the alignment problem. Bostrom argues the gap could be days or hours. Optimists say decades. Nobody actually knows, which is exactly the problem.",
  },
  [comparisonKey("agi", "singularity")]: {
    title: "AGI vs The Singularity",
    body: "AGI is an engineering milestone. The Singularity is a civilizational phase transition. You can have AGI without a singularity — maybe we build it and it's just... useful. Boring, even. The Singularity requires a feedback loop: intelligence improving intelligence improving intelligence until the curve goes vertical. Most singularity timelines assume AGI is a prerequisite, but Kurzweil argues the Singularity emerges from the broader convergence of nanotech, biotech, and AI — AGI is just one ingredient. Think of it this way: AGI is inventing fire. The Singularity is the resulting wildfire burning down the forest and growing a new one.",
  },
  [comparisonKey("tai", "hlmi")]: {
    title: "Transformative AI vs Human-Level AI",
    body: "TAI measures impact on the world. HLMI measures capability of the machine. A transformative AI could be narrow — imagine a system that's terrible at poetry but automates every logistics job on Earth. That's not human-level, but it's definitely transformative. Conversely, a human-level AI might arrive and... not transform much, if deployment is slow or regulated. The TAI framing (pioneered by Open Philanthropy) was specifically designed to sidestep the 'what is intelligence?' debate and focus on measurable economic and social effects. Pragmatic? Yes. Less fun to argue about at conferences? Also yes.",
  },
  [comparisonKey("tai", "asi")]: {
    title: "Transformative AI vs Superintelligence",
    body: "Transformative AI could arrive without anything superhuman — it just needs to change the world as much as the Industrial Revolution did. A fleet of competent-but-not-genius AI systems automating most knowledge work would qualify. Superintelligence, by contrast, requires exceeding human capability in essentially every domain. The irony: TAI might be more dangerous in the short term precisely because it's more plausible. Nobody's deploying superintelligence tomorrow, but 'AI that's good enough to replace your team' is already in pitch decks. The transformation might be less dramatic and more insidious than the superintelligence crowd imagines.",
  },
  [comparisonKey("tai", "singularity")]: {
    title: "Transformative AI vs The Singularity",
    body: "TAI is the Industrial Revolution comparison — massive, measurable, but ultimately comprehensible change. The Singularity is the 'event horizon' — change so profound that prediction becomes impossible from this side. You can model a post-TAI world: different jobs, different economics, different power structures. You can't model a post-Singularity world by definition. TAI timelines are generally shorter because the bar is lower: you don't need recursively self-improving superintelligence, just AI capable enough to reshape the economy. Most forecasters think we'll cross the TAI threshold well before anything resembling a singularity — if the singularity happens at all.",
  },
  [comparisonKey("hlmi", "asi")]: {
    title: "Human-Level AI vs Superintelligence",
    body: "HLMI is the median human. ASI is as far beyond humans as humans are beyond goldfish. The gap between these two is the most important variable in AI safety: if it takes decades to go from HLMI to ASI, we have time to figure out alignment. If it takes weeks (because a human-level AI can improve its own architecture), we're in Bostrom's 'treacherous turn' scenario. Grace et al. surveys show researchers expect HLMI by ~2047 but haven't converged on ASI timelines at all. The honest answer is that nobody knows how hard the jump from 'human-equivalent' to 'superhuman' actually is, because we've never built either.",
  },
  [comparisonKey("hlmi", "singularity")]: {
    title: "Human-Level AI vs The Singularity",
    body: "HLMI is a capability threshold — a machine that can do anything a median human can do. The Singularity is a process — a self-reinforcing cycle of intelligence improvement that makes the future unpredictable. HLMI might be necessary for a singularity (you probably need human-level reasoning to bootstrap beyond it), but it's not sufficient. The Singularity also requires the 'recursive' part: the AI improving itself, designing better AI, which designs even better AI. Some researchers think HLMI will be a tool we use, not an agent that bootstraps. In that world, you get HLMI without a singularity — a useful assistant, not an intelligence explosion.",
  },
  [comparisonKey("asi", "singularity")]: {
    title: "Superintelligence vs The Singularity",
    body: "These are often conflated but they're distinct concepts. Superintelligence is an entity — a mind vastly smarter than any human. The Singularity is an event — the moment technological change becomes irreversible and unpredictable. You could theoretically have superintelligence without a singularity (a contained, controlled ASI that doesn't trigger runaway change) or a singularity without a single superintelligent entity (a network effect of many narrow AIs creating emergent transformation). In practice, most scenarios where ASI exists do lead to singularity-like conditions, because it's hard to imagine something that much smarter than us choosing to maintain the status quo. But 'hard to imagine' is different from 'impossible.'",
  },
};
```

**Step 2: Commit**

```bash
git add src/components/SingularityInfo.tsx
git commit -m "feat: add pre-written comparison data for event type pairs"
```

---

### Task 2: Add ComparisonModal component

**Files:**
- Modify: `src/components/SingularityInfo.tsx` (add component after COMPARISONS data, before TypeCarousel)

**Step 1: Add the modal component**

Insert after the `COMPARISONS` record:

```tsx
function ComparisonModal({ onClose }: { onClose: () => void }) {
  const [leftId, setLeftId] = useState("agi");
  const [rightId, setRightId] = useState("tai");

  const key = comparisonKey(leftId, rightId);
  const comparison = COMPARISONS[key];
  const leftType = EVENT_TYPES.find((t) => t.id === leftId)!;
  const rightType = EVENT_TYPES.find((t) => t.id === rightId)!;

  // Lock body scroll
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent selecting the same type on both sides
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 max-sm:p-2"
      style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 max-sm:p-4"
        style={{
          background: "var(--bg-card-solid, #0a0a0f)",
          borderColor: "#ffffff15",
          boxShadow: "0 24px 80px #00000080",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-(--text-dim) hover:text-(--text) hover:bg-[#ffffff10] cursor-pointer transition-colors text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="font-mono text-[1.1rem] font-bold text-(--text) m-0 mb-5 pr-10">
          How Are These Different?
        </h3>

        {/* Dropdowns */}
        <div className="flex max-sm:flex-col gap-3 mb-5">
          <div className="flex-1">
            <select
              value={leftId}
              onChange={(e) => handleLeftChange(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 font-mono text-[0.85rem] cursor-pointer appearance-none"
              style={{
                background: `${leftType.color}10`,
                borderColor: `${leftType.color}30`,
                color: leftType.color,
              }}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center text-(--text-dim) font-mono text-[0.8rem] max-sm:py-0">
            vs
          </div>

          <div className="flex-1">
            <select
              value={rightId}
              onChange={(e) => handleRightChange(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 font-mono text-[0.85rem] cursor-pointer appearance-none"
              style={{
                background: `${rightType.color}10`,
                borderColor: `${rightType.color}30`,
                color: rightType.color,
              }}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison content */}
        {comparison && (
          <div className="rounded-lg border border-[#ffffff0a] p-5 max-sm:p-4" style={{ background: "#ffffff04" }}>
            <h4 className="font-mono text-[0.95rem] font-bold text-(--text) m-0 mb-3">
              {comparison.title}
            </h4>
            <p className="m-0 text-[0.85rem] text-(--text-muted) leading-relaxed">
              {comparison.body}
            </p>
          </div>
        )}

        {/* Color indicators */}
        <div className="flex justify-center gap-6 mt-5 text-[0.7rem] font-mono text-(--text-dim)">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: leftType.color }} />
            {leftType.label}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: rightType.color }} />
            {rightType.label}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add React import for useEffect if needed**

The file already imports `useState, useMemo, useRef, useCallback` from React. Add `useEffect` to the import on line 1 if it's not there. Also add `React` as a namespace import or change `React.useEffect` to just `useEffect`.

Update line 1:
```tsx
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
```

And in ComparisonModal, use `useEffect` instead of `React.useEffect`.

**Step 3: Commit**

```bash
git add src/components/SingularityInfo.tsx
git commit -m "feat: add ComparisonModal component with dropdowns and body scroll lock"
```

---

### Task 3: Wire up the "Compare These" button in TypeCarousel

**Files:**
- Modify: `src/components/SingularityInfo.tsx` — `TypeCarousel` component (line 257)

**Step 1: Add state and button**

In `TypeCarousel`, add state for the modal:
```tsx
const [compareOpen, setCompareOpen] = useState(false);
```

Add the button after the nav arrows `<div>` (after line 375, before the closing `</div>` of the card), between the nav arrows div and the closing `</section>`:

```tsx
{/* Compare button */}
<div className="flex justify-center mt-5">
  <button
    onClick={() => setCompareOpen(true)}
    className="px-4 py-2 rounded-full text-[0.8rem] font-mono font-medium cursor-pointer transition-all duration-200 border hover:scale-[1.02]"
    style={{
      background: `${active.color}10`,
      borderColor: `${active.color}30`,
      color: active.color,
    }}
  >
    Compare These →
  </button>
</div>

{compareOpen && <ComparisonModal onClose={() => setCompareOpen(false)} />}
```

**Step 2: Verify the build compiles**

Run: `bun run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/components/SingularityInfo.tsx
git commit -m "feat: wire up Compare These button to open comparison modal"
```

---

### Task 4: Test in browser and polish

**Step 1: Run dev server**

Run: `bun run dev`

**Step 2: Manual verification checklist**
- [ ] "Compare These" button appears below the TypeCarousel nav arrows
- [ ] Clicking it opens the full-screen modal
- [ ] Two dropdowns are visible and functional
- [ ] Changing dropdowns updates the comparison text
- [ ] Cannot select the same type in both dropdowns
- [ ] X button closes the modal
- [ ] Clicking backdrop closes the modal
- [ ] Escape key closes the modal
- [ ] Body scroll is locked while modal is open
- [ ] Mobile layout: dropdowns stack vertically
- [ ] Color indicators show correct colors for selected types

**Step 3: Final commit if any polish needed**

```bash
git add src/components/SingularityInfo.tsx
git commit -m "polish: comparison modal styling adjustments"
```
