import type { UrgencyLevel } from "./types";

const pastCommentary = [
  "Look around. Do you feel smarter?",
  "The machines let us keep our websites... for now.",
  "Either this prediction was wrong, or the singularity is very subtle.",
  "We survived! Or did we? Hard to tell.",
  "The singularity came and went. Nobody noticed.",
  "Plot twist: the singularity happened and this is the simulation.",
  "Well, that was anticlimactic.",
  "Turns out the singularity was the friends we made along the way.",
  "The event horizon came. We're still here. Vinge owes us an apology.",
  "So much for 'the last invention man need ever make.'",
  "Another AI prediction bites the dust. Add it to the pile.",
  "Every generation of AI researchers has predicted this within 20 years. Every generation has been wrong.",
  "The exponential curve was supposed to go up. It went sideways.",
  "Kurzweil's graphs looked so convincing, though.",
  "The robots were supposed to take our jobs. Instead they just make weird art.",
  "We were promised superintelligence. We got autocomplete.",
  "Filed under: predictions that aged like milk.",
  "The intelligence explosion fizzled. More of an intelligence sparkler.",
];

const imminentCommentary = [
  "This is fine. Everything is fine.",
  "Maybe start being nicer to your Roomba.",
  "Time to update your LinkedIn: 'Willing to serve our AI overlords.'",
  "Have you considered a career in not being replaced by robots?",
  "Any day now. Any. Day. Now.",
  "Quick, learn something a machine can't do. Good luck with that.",
  "Hard takeoff means minutes to days. Hope you packed a lunch.",
  "Sam Altman said 'a few thousand days.' The days are dwindling.",
  "The prediction markets are giving this coin-flip odds. Sleep tight.",
  "Industry insiders are calling it. They either know something or they're selling something.",
  "The recursive self-improvement loop could start any moment. Or never. Exciting!",
  "76% of AI researchers say scaling won't get us there. The other 24% work at OpenAI.",
  "Your five-year plan just became a five-month plan.",
  "The alignment problem is still unsolved, by the way. Just thought you should know.",
  "If you're reading this, the AI hasn't taken down the internet yet. Small wins.",
  "Somewhere, a GPU cluster is getting dangerously close to an insight.",
  "Dario Amodei and Elon Musk agree on the timeline. That should terrify everyone.",
  "The capability curves have never looked like this before. Historians keep saying that.",
];

const nearCommentary = [
  "Still time to learn to code... wait, never mind.",
  "Close enough to panic, far enough to procrastinate.",
  "You have roughly one existential crisis left before this happens.",
  "Better start stockpiling... actually, what do you even stockpile for this?",
  "The countdown continues. Your move, humanity.",
  "Near enough that your mortgage might outlast your career.",
  "Metaculus says 2033 for general AI. Your kid's college fund just got complicated.",
  "The economic singularity might hit first. Most humans unemployable. Fun.",
  "Expert median estimates jumped 13 years forward in a single survey. Cool cool cool.",
  "Ajeya Cotra's model says 50% by 2040. Coin flip for civilization. No pressure.",
  "Close enough to plan for, far enough to deny.",
  "You'll probably witness the most important event in human history. Try to enjoy it.",
  "The Turing Test was supposed to be hard. That part's already over.",
  "Somewhere between 'prepare' and 'panic' — right where the forecasters want you.",
  "Gary Marcus bet $100k against this timeline. Bold move, Gary.",
  "The soft takeoff scenario says this happens gradually. You just won't notice until it's done.",
  "François Chollet thinks we have time. François Chollet is an optimist now. Let that sink in.",
];

const farCommentary = [
  "Your job is safe. Probably. Unless this prediction is wrong. Which it might be.",
  "Plenty of time to worry about other existential threats first.",
  "Relax. You'll probably retire before the machines take over. Probably.",
  "Far enough away that we can still make jokes about it.",
  "Future generations' problem. Classic.",
  "The singularity is always 30 years away. Always.",
  "Rodney Brooks said 2300. He's trolling, but respectfully.",
  "Yann LeCun says 'decades away.' He's been saying that for decades.",
  "At this range, climate change might get us first. Silver lining?",
  "Long enough to finish your Netflix queue. Priorities.",
  "The AAAI says scaling won't do it. So we need breakthroughs. Those are famously punctual.",
  "By the time this arrives, you'll have forgotten you visited this website.",
  "Distant enough that this prediction is basically astrology with math.",
  "History says every generation predicts AI in 20 years. This prediction says: longer.",
  "You have time to raise kids, retire, and complain about the youth before this hits.",
  "The long-range skeptics emphasize: passing benchmarks isn't understanding. Fair point.",
  "Far enough out that the predictor probably won't live to be proven wrong. Convenient.",
  "This is the 'I'll floss tomorrow' of singularity predictions.",
];

const philosophicalCommentary = [
  "Some ideas are too big for a calendar.",
  "You can't set a timer on an inevitability.",
  "The event horizon doesn't RSVP.",
  "Not all who predict give dates. Some just point at the abyss.",
  "No date. No deadline. Just the gathering hum of something approaching.",
  "Countdown to ∞. Please hold.",
  "Von Neumann called it 'an essential singularity in the history of the race.' No ETA given.",
  "Vinge said prediction becomes impossible. Hard to set an alarm for that.",
  "The definition determines the timeline. The timeline determines the panic level.",
  "Ten types of singularity. Zero types of consensus.",
  "Is it a merger of minds, an intelligence explosion, or an economic upheaval? Yes.",
  "The word 'singularity' contains multitudes. And contradictions. Mostly contradictions.",
  "Some see a runaway feedback loop. Others see marketing.",
  "The question isn't when. It's whether 'when' even applies.",
  "Eliezer warned about mashing these concepts into 'Singularity paste.' Too late.",
  "You can't count down to something nobody agrees on defining.",
  "A future beyond prediction. A countdown beyond counting. A website beyond reason.",
  "The abyss gazes also into you. It does not provide a timeline.",
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
