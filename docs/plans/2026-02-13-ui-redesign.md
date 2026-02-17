# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the "When is the Singularity?" site with improved info card layout, section graphics, favicon/logo, always-visible content sections, and engagement features (share, wrong badge, scroll animations).

**Architecture:** Component-level changes to existing React SPA. New SVG assets generated via svgmaker (logo, section illustrations) and hand-coded (favicon, small icons). New utility components for share button and scroll animation wrapper. All styling via Tailwind + existing CSS custom properties.

**Tech Stack:** React 19, Tailwind CSS v4, svgmaker MCP tool, hand-coded SVGs, IntersectionObserver API, Clipboard API

---

### Task 1: Generate Logo and Section Artwork via svgmaker

**Files:**
- Create: `public/logo.svg` (generated via svgmaker)
- Create: `public/art/timeline-header.svg` (generated via svgmaker)
- Create: `public/art/singularity-info-header.svg` (generated via svgmaker)

**Step 1: Generate the logo**

Use svgmaker to generate: "Abstract starburst singularity mark, radiating asymmetric light rays emanating from a central bright point, purple (#8b5cf6) and white on transparent background, geometric and minimal, suitable as a website logo at 40px, hints at AI intelligence and cosmic energy, dark theme friendly"

Save to `public/logo.svg`, low quality, square aspect ratio, transparent background.

**Step 2: Generate timeline section illustration**

Use svgmaker to generate: "Playful cartoon robot looking into a glowing crystal ball showing a timeline, purple and warm tones, dark background friendly, whimsical illustrative style, transparent background, suitable for a sarcastic AI predictions website"

Save to `public/art/timeline-header.svg`, low quality, landscape aspect ratio, transparent background.

**Step 3: Generate singularity info section illustration**

Use svgmaker to generate: "Playful cartoon brain with circuit patterns having a lightbulb moment, sparks and stars around it, purple and cyan tones, dark background friendly, whimsical illustrative style, transparent background, humorous take on AI intelligence"

Save to `public/art/singularity-info-header.svg`, low quality, landscape aspect ratio, transparent background.

**Step 4: Commit**

```bash
git add public/logo.svg public/art/
git commit -m "art: generate logo and section artwork via svgmaker"
```

---

### Task 2: Create Favicon

**Files:**
- Create: `public/favicon.svg`
- Modify: `src/index.html:3-11` (add favicon link)

**Step 1: Create hand-coded favicon SVG**

Create `public/favicon.svg` - a simple abstract starburst in purple (#8b5cf6) on transparent background. 6-8 asymmetric rays radiating from center, one ray slightly larger to break symmetry. 32x32 viewBox.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <!-- Central glow -->
  <circle cx="16" cy="16" r="3" fill="#8b5cf6"/>
  <circle cx="16" cy="16" r="5" fill="#8b5cf6" opacity="0.3"/>
  <!-- Rays - asymmetric starburst -->
  <line x1="16" y1="16" x2="16" y2="2" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="28" y2="6" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="30" y2="16" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="26" y2="27" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="16" y2="30" stroke="#8b5cf6" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="4" y2="26" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="2" y2="14" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="16" x2="6" y2="4" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

**Step 2: Add favicon link to index.html**

In `src/index.html`, add after the theme-color meta tag (line 7):

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

**Step 3: Verify build copies favicon**

Run: `bun run build`
Expected: `dist/favicon.svg` exists (build.ts copies public/ to dist/)

**Step 4: Commit**

```bash
git add public/favicon.svg src/index.html
git commit -m "feat: add starburst favicon"
```

---

### Task 3: Restyle Header with Logo

**Files:**
- Modify: `src/App.tsx:80-83` (header section)
- Modify: `src/index.css:67-72` (app-title styles)

**Step 1: Update header in App.tsx**

Replace the header section (lines 80-83) with a logo + title layout:

```tsx
<header className="text-center mb-6">
  <div className="flex items-center justify-center gap-3 mb-1">
    <img src="/logo.svg" alt="" className="w-10 h-10 max-sm:w-8 max-sm:h-8" />
    <h1 className="app-title font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 tracking-tight">The Singularity is Coming</h1>
  </div>
  <p className="text-(--text-muted) text-[0.95rem] m-0 italic">Tracking humanity's most confident guesses about its own obsolescence</p>
</header>
```

**Step 2: Run dev server and visually verify**

Run: `bun run dev`
Check: Logo appears left of title, centered together.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add logo to header"
```

---

### Task 4: Redesign Prediction Info Card

**Files:**
- Modify: `src/components/PredictionCard.tsx` (full rewrite of component body)

**Step 1: Rewrite PredictionCard with stat-block metadata layout**

Replace the entire component body. Keep imports and interface. New layout:
- Avatar + name row at top
- 4-item metadata row below: Predicted (date made), Target (year for), Type (badge), Confidence (badge)
- Each metadata item: small muted label above the value
- Headline + summary below
- Source link at bottom

```tsx
export function PredictionCard({ prediction }: PredictionCardProps) {
  const predictionYear = prediction.prediction_date.length === 4
    ? prediction.prediction_date
    : new Date(prediction.prediction_date).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  const targetYear = prediction.predicted_year_best
    ? prediction.predicted_year_best.toString()
    : prediction.predicted_date_best
      ? new Date(prediction.predicted_date_best).getFullYear().toString()
      : "Undefined";

  const displayType = prediction.prediction_type.startsWith("AGI")
    ? "AGI"
    : prediction.prediction_type === "HLMI"
      ? "Human-level AI"
      : prediction.prediction_type;

  return (
    <div className="bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 mb-16 max-sm:p-4">
      {/* Predictor header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="shrink-0 size-14 rounded-full overflow-hidden">
          <PredictorAvatar
            name={prediction.predictor_name}
            headshotLocal={prediction.headshot_local}
          />
        </div>
        <h2 className="text-[1.1rem] font-semibold m-0 text-(--text)">{prediction.predictor_name}</h2>
      </div>

      {/* Metadata stat block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 px-1">
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Predicted</div>
          <div className="text-[0.85rem] text-(--text-muted) font-medium">{predictionYear}</div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Target</div>
          <div className="text-[0.85rem] text-(--text-muted) font-medium">{targetYear}</div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Type</div>
          <div className="flex items-center">
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-medium border ${getTypeBadge(prediction.prediction_type)}`}>{displayType}</span>
          </div>
        </div>
        <div>
          <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1">Confidence</div>
          <div className="flex items-center">
            {prediction.confidence_label ? (
              <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-medium border ${getConfidenceBadge(prediction.confidence_type)}`}>
                {prediction.confidence_label}
              </span>
            ) : (
              <span className="text-[0.8rem] text-(--text-dim)">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold m-0 mb-2 text-(--text) leading-snug">{prediction.headline}</h3>
      <p className="text-[0.85rem] text-(--text-muted) leading-relaxed m-0 mb-3">{prediction.tldr_summary}</p>

      {prediction.source_url && (
        <a
          href={prediction.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8rem] text-(--accent) font-medium"
        >
          {prediction.source_name || "Source"} →
        </a>
      )}
    </div>
  );
}
```

**Step 2: Run dev server and verify card layout**

Run: `bun run dev`
Check: 4-column stat block on desktop, 2-column on mobile. Labels are small and dim, values are readable.

**Step 3: Commit**

```bash
git add src/components/PredictionCard.tsx
git commit -m "feat: redesign prediction card with stat-block metadata layout"
```

---

### Task 5: Improve Section Headers and Add Artwork

**Files:**
- Modify: `src/App.tsx:87-93` (section headers in PredictionPage)
- Modify: `src/components/SingularityInfo.tsx:667-674` (main section header)

**Step 1: Add styled section headers with artwork in App.tsx**

Update the Timeline section (line 87-90) and add a styled header before PredictionCard:

For Timeline section, replace lines 87-90:
```tsx
<section className="mb-20">
  <div className="flex flex-col items-center mb-6">
    <img src="/art/timeline-header.svg" alt="" className="w-40 h-auto mb-4 max-sm:w-28 opacity-80" />
    <h2 className="app-title font-mono text-[1.5rem] font-bold text-center m-0 mb-2">Every Prediction, Visualized</h2>
    <p className="text-(--text-dim) text-[0.85rem] m-0 italic text-center">The scatter plot of humanity's guesses</p>
  </div>
  <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
</section>
```

Change spacing on PredictionCard (line 92) - already has mb-16, good.

Add section header before ConceptBlurbs - this will be done in the ConceptBlurbs component itself (Task 7).

**Step 2: Update SingularityInfo section header**

In `src/components/SingularityInfo.tsx`, replace lines 668-674:

```tsx
<section className="mb-16">
  <div className="flex flex-col items-center mb-6">
    <img src="/art/singularity-info-header.svg" alt="" className="w-44 h-auto mb-4 max-sm:w-32 opacity-80" />
    <h2 className="app-title font-mono text-[1.5rem] font-bold text-center m-0 mb-1">
      What Even Is the Singularity?
    </h2>
    <p className="text-center text-(--text-muted) text-[0.85rem] m-0 mb-5 italic">
      A semi-serious guide to humanity's favorite existential crisis
    </p>
  </div>
```

**Step 3: Add more vertical spacing between major sections**

In `src/App.tsx`, increase spacing: change PredictionCard wrapper to have `mb-20`, add spacer between sections. Ensure ConceptBlurbs section has `mb-20`.

**Step 4: Run dev server and verify**

Run: `bun run dev`
Check: Artwork appears above section headers, headers use gradient text, more breathing room between sections.

**Step 5: Commit**

```bash
git add src/App.tsx src/components/SingularityInfo.tsx
git commit -m "feat: improve section headers with artwork and spacing"
```

---

### Task 6: Remove Accordions from TypeCarousel (Tech Details + Fun Fact)

**Files:**
- Modify: `src/components/SingularityInfo.tsx:254-277` (remove Spoiler component)
- Modify: `src/components/SingularityInfo.tsx:340-357` (replace Spoiler usage with always-visible sections)

**Step 1: Create inline SVG icon components for section headers**

Add these small icon components at the top of SingularityInfo.tsx (after imports):

```tsx
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
```

**Step 2: Replace Spoiler usage with always-visible styled sections**

Remove the `Spoiler` component entirely (lines 254-277).

Replace the two Spoiler calls in TypeCarousel (lines 351-357) with:

```tsx
{/* Technical Details - always visible */}
<div className="mt-4 rounded-lg border border-[#ffffff0a] p-4" style={{ background: `${active.color}05` }}>
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: active.color }}><GearIcon /></span>
    <span className="font-mono text-[0.8rem] font-bold" style={{ color: active.color }}>Technical Details</span>
  </div>
  <p className="m-0 text-[0.8rem] text-(--text-muted) leading-relaxed">{active.techDetails}</p>
</div>

{/* Fun Fact - always visible */}
<div className="mt-3 rounded-lg border border-[#ffffff0a] p-4" style={{ background: `${active.color}05` }}>
  <div className="flex items-center gap-2 mb-2">
    <span style={{ color: active.color }}><SparkleIcon /></span>
    <span className="font-mono text-[0.8rem] font-bold" style={{ color: active.color }}>Fun Fact</span>
  </div>
  <p className="m-0 text-[0.8rem] text-(--text-muted) leading-relaxed">{active.funFact}</p>
</div>
```

**Step 3: Run dev server and verify**

Run: `bun run dev`
Check: Tech details and fun fact sections are always visible, with colored icons and subtle background tint.

**Step 4: Commit**

```bash
git add src/components/SingularityInfo.tsx
git commit -m "feat: replace accordions with always-visible styled sections"
```

---

### Task 7: Remove Accordion from ConceptBlurbs

**Files:**
- Modify: `src/components/ConceptBlurbs.tsx` (remove accordion, show all expanded)

**Step 1: Create a lightbulb icon for the section header**

Add at top of ConceptBlurbs.tsx:

```tsx
function LightbulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>
    </svg>
  );
}
```

**Step 2: Rewrite ConceptBlurbs to show all concepts expanded**

Remove `useState` import (no longer needed). Remove `expanded` state. Replace accordion with always-open cards:

```tsx
export function ConceptBlurbs({ prediction }: ConceptBlurbsProps) {
  const relevantConcepts = prediction.concept_keys
    .map((key) => CONCEPTS[key])
    .filter(Boolean);

  if (relevantConcepts.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="flex items-center justify-center gap-2 mb-4">
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
            <h4 className="text-[0.85rem] font-semibold text-(--text) m-0 mb-2">
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
```

**Step 3: Run dev server and verify**

Run: `bun run dev`
Check: All concepts shown expanded with lightbulb icon in section header.

**Step 4: Commit**

```bash
git add src/components/ConceptBlurbs.tsx
git commit -m "feat: show concept blurbs always expanded with section icon"
```

---

### Task 8: Add Share Button

**Files:**
- Create: `src/components/ShareButton.tsx`
- Modify: `src/components/PredictionCard.tsx` (add ShareButton)

**Step 1: Create ShareButton component**

```tsx
import { useState } from "react";
import type { Prediction } from "../data/types";

interface ShareButtonProps {
  prediction: Prediction;
}

export function ShareButton({ prediction }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const days = prediction.target_date
      ? Math.floor((new Date(prediction.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const message = days !== null
      ? days > 0
        ? `According to ${prediction.predictor_name}, we have ${days.toLocaleString()} days until ${prediction.prediction_type}. No pressure. 🤖`
        : `According to ${prediction.predictor_name}, ${prediction.prediction_type} was supposed to happen ${Math.abs(days).toLocaleString()} days ago. Awkward. 🤖`
      : `${prediction.predictor_name} thinks ${prediction.prediction_type} is coming... eventually. 🤖`;

    const url = window.location.href;
    const text = `${message}\n${url}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: try share API
      if (navigator.share) {
        navigator.share({ text: message, url });
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-[0.8rem] text-(--text-dim) hover:text-(--text-muted) cursor-pointer transition-colors font-mono flex items-center gap-1.5"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
```

**Step 2: Add ShareButton to PredictionCard**

In `src/components/PredictionCard.tsx`, import ShareButton and add it next to the source link at the bottom of the card. Wrap the source link and share button in a flex row:

```tsx
import { ShareButton } from "./ShareButton";
```

Replace the source link section at the bottom of the card with:

```tsx
<div className="flex items-center justify-between">
  {prediction.source_url ? (
    <a
      href={prediction.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[0.8rem] text-(--accent) font-medium"
    >
      {prediction.source_name || "Source"} →
    </a>
  ) : <span />}
  <ShareButton prediction={prediction} />
</div>
```

**Step 3: Run dev server and verify**

Run: `bun run dev`
Check: Share button appears bottom-right of card. Clicking copies text to clipboard, shows "Copied!" briefly.

**Step 4: Commit**

```bash
git add src/components/ShareButton.tsx src/components/PredictionCard.tsx
git commit -m "feat: add share button to prediction card"
```

---

### Task 9: Add "How Wrong Were They?" Badge for Past Predictions

**Files:**
- Modify: `src/components/PredictionCard.tsx` (add wrong badge for past predictions)

**Step 1: Add a wrong badge computation and display**

In PredictionCard, after the metadata stat block and before the headline, add a conditional badge for past predictions:

```tsx
{/* "How wrong were they?" badge for past predictions */}
{prediction.target_date && new Date(prediction.target_date).getTime() < Date.now() && (
  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#ff444410] border border-[#ff444420]">
    <span className="text-[1rem]">💀</span>
    <span className="text-[0.8rem] text-[#ff6666] font-mono">
      {(() => {
        const days = Math.floor((Date.now() - new Date(prediction.target_date!).getTime()) / (1000 * 60 * 60 * 24));
        if (days < 365) return `${days} days overdue — any minute now...`;
        const years = Math.floor(days / 365);
        return `${years} ${years === 1 ? "year" : "years"} overdue — still waiting...`;
      })()}
    </span>
  </div>
)}
```

Place this between the metadata stat block `</div>` and the `<h3>` headline.

**Step 2: Run dev server, navigate to a past prediction and verify**

Run: `bun run dev`
Navigate to a prediction with a past target_date. Check: red-tinted badge appears with sarcastic overdue message.

**Step 3: Commit**

```bash
git add src/components/PredictionCard.tsx
git commit -m "feat: add 'how wrong were they' badge for past predictions"
```

---

### Task 10: Add Scroll Fade-In Animations

**Files:**
- Create: `src/components/FadeInSection.tsx`
- Modify: `src/App.tsx` (wrap sections with FadeInSection)
- Modify: `src/index.css` (add fade-in animation CSS)

**Step 1: Add fade-in CSS to index.css**

Add at the end of the ANIMATIONS section in `src/index.css`:

```css
/* ── Scroll fade-in ── */
.fade-in-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Step 2: Create FadeInSection component**

```tsx
import { useEffect, useRef, useState } from "react";

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`fade-in-section ${isVisible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
```

**Step 3: Wrap major sections in App.tsx with FadeInSection**

Import FadeInSection in App.tsx:
```tsx
import { FadeInSection } from "./components/FadeInSection";
```

Wrap the Timeline section, PredictionCard, ConceptBlurbs, and SingularityInfo each in `<FadeInSection>`:

```tsx
<FadeInSection>
  <section className="mb-20">
    {/* Timeline content */}
  </section>
</FadeInSection>

<FadeInSection>
  <PredictionCard prediction={selected} />
</FadeInSection>

<FadeInSection>
  <ConceptBlurbs prediction={selected} />
</FadeInSection>

<FadeInSection>
  <SingularityInfo />
</FadeInSection>
```

**Step 4: Add reduced-motion support**

The existing `@media (prefers-reduced-motion: reduce)` rule in index.css already disables all animations, so this is covered.

**Step 5: Run dev server and verify**

Run: `bun run dev`
Check: Sections fade in as you scroll down. Smooth, no jank. No animation with prefers-reduced-motion.

**Step 6: Commit**

```bash
git add src/components/FadeInSection.tsx src/App.tsx src/index.css
git commit -m "feat: add scroll fade-in animations for sections"
```

---

### Task 11: Final Build Verification

**Step 1: Run production build**

Run: `bun run build`
Expected: Builds successfully, all assets in dist/

**Step 2: Verify all assets exist**

Check: `dist/favicon.svg`, `dist/logo.svg`, `dist/art/timeline-header.svg`, `dist/art/singularity-info-header.svg` all exist.

**Step 3: Run dev server for final visual check**

Run: `bun run dev`
Check all pages: favicon in browser tab, logo in header, section artwork, redesigned card, expanded sections, share button, past prediction badge, scroll animations.

**Step 4: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "chore: final build verification and tweaks"
```
