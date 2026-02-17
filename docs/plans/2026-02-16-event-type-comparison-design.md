# Event Type Comparison Modal

## Summary

Add a comparison feature to the TypeCarousel ("5 Things We're Actually Tracking") section. A "Compare These" button opens a full-screen overlay modal where users pick two event types from dropdowns and see a pre-written explanation of the key differences.

## Trigger

"Compare These" button below the TypeCarousel navigation arrows, styled with urgency-themed colors.

## Modal Structure

Full-screen overlay with dark semi-transparent backdrop. Centered card (max-width ~800px):

1. **Header**: "How Are These Different?" + X close button
2. **Selectors**: Two styled dropdowns side by side, listing the 5 event types (AGI, Transformative AI, HLMI, Superintelligence, The Singularity). Prevents selecting the same type in both. Defaults to first two types.
3. **Comparison content**: Pre-written prose for the selected pair in the site's sarcastic/fun tone.
4. **Visual indicators**: Color dots matching each event type's theme color.

## Interactions

- Close via X button, backdrop click, or Escape key
- Body scroll locked while open
- Dropdown changes instantly swap comparison text
- Fade-in/out animation

## Data

`COMPARISONS` record keyed by sorted pair IDs (e.g. `"agi|asi"`). 10 entries total (C(5,2)). Stored in `SingularityInfo.tsx` alongside `EVENT_TYPES`.

## Mobile

Dropdowns stack vertically. Modal takes full width with padding.

## Files Modified

- `src/components/SingularityInfo.tsx` — add ComparisonModal component, COMPARISONS data, and trigger button
