# UI Redesign Design Doc

## 1. Prediction Info Card - Clean Metadata Layout

Replace inline metadata row with a 4-item stat block below the predictor name:
- **Predicted**: when the prediction was made
- **Target**: when the prediction is for (predicted_date_best or predicted_year_best)
- **Type**: prediction category (AGI, Singularity, etc.)
- **Confidence**: confidence label

Each item: small muted label above the value. Horizontal row, wraps on mobile.
Avatar + name stays at top. Headline + summary below with more spacing.

## 2. Section Headers + SVG Graphics

- Larger section headers with gradient text
- More vertical spacing between sections
- Generate playful illustrative SVGs via svgmaker (low quality) for:
  - Timeline section header
  - Singularity Info section header
- Generate small hand-coded SVG icons for:
  - "Technical Details" header icon (gear/circuit)
  - "Fun Fact" header icon (sparkle/party)
  - Concept blurbs section icon (lightbulb)

## 3. Favicon + Logo + Header Restyle

- **Favicon**: Hand-coded SVG starburst, abstract singularity/spark, purple accent (#8b5cf6). 32x32 and 16x16.
- **Logo**: Generated via svgmaker - abstract starburst/singularity mark, radiating asymmetric rays, purple accent. ~40px next to title.
- **Header**: Logo mark left of title, title slightly larger, subtitle stays.

## 4. Remove Accordions, Always Show Content

- **TypeCarousel**: Remove Spoiler component. Show Tech Details and Fun Fact always visible with SVG icons for each header and subtle background tint.
- **ConceptBlurbs**: Remove accordion toggle. All concepts expanded by default.

## 5. Engagement Enhancements

- **Share button**: "According to [Predictor], we have [X] days left" copy-to-clipboard
- **"How wrong were they?" badge**: For past predictions, show how far off they were
- **Scroll animations**: Subtle fade-in on scroll for sections (IntersectionObserver)

## Out of scope

- Prediction comparison mode
