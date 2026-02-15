import type { UrgencyLevel } from "./types";

const pastCommentary = [
  "Look around. Do you feel smarter?",
  "The machines let us keep our websites... for now.",
  "Either this prediction was wrong, or the singularity is very subtle.",
  "We survived! Or did we? Hard to tell.",
  "The singularity came and went. Nobody noticed.",
  "Plot twist: the singularity happened and this is the simulation.",
];

const imminentCommentary = [
  "This is fine. Everything is fine.",
  "Maybe start being nicer to your Roomba.",
  "Time to update your LinkedIn: 'Willing to serve our AI overlords.'",
  "Have you considered a career in not being replaced by robots?",
  "Any day now. Any. Day. Now.",
  "Quick, learn something a machine can't do. Good luck with that.",
];

const nearCommentary = [
  "Still time to learn to code... wait, never mind.",
  "Close enough to panic, far enough to procrastinate.",
  "You have roughly one existential crisis left before this happens.",
  "Better start stockpiling... actually, what do you even stockpile for this?",
  "The countdown continues. Your move, humanity.",
];

const farCommentary = [
  "Your job is safe. Probably. Unless this prediction is wrong. Which it might be.",
  "Plenty of time to worry about other existential threats first.",
  "Relax. You'll probably retire before the machines take over. Probably.",
  "Far enough away that we can still make jokes about it.",
  "Future generations' problem. Classic.",
  "The singularity is always 30 years away. Always.",
];

const philosophicalCommentary = [
  "Some ideas are too big for a calendar.",
  "You can't set a timer on an inevitability.",
  "The event horizon doesn't RSVP.",
  "Not all who predict give dates. Some just point at the abyss.",
  "No date. No deadline. Just the gathering hum of something approaching.",
  "Countdown to ∞. Please hold.",
];

const pools: Record<UrgencyLevel, string[]> = {
  past: pastCommentary,
  imminent: imminentCommentary,
  near: nearCommentary,
  far: farCommentary,
  philosophical: philosophicalCommentary,
};

export function getCommentary(urgency: UrgencyLevel, seed?: number): string {
  const pool = pools[urgency];
  // Use seed for deterministic selection (avoids hydration mismatch),
  // fall back to random if no seed provided.
  const index = seed != null ? Math.abs(seed) % pool.length : Math.floor(Math.random() * pool.length);
  return pool[index]!;
}
