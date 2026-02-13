export interface Concept {
  key: string;
  label: string;
  blurb: string;
  learnMoreUrl?: string;
}

export const CONCEPTS: Record<string, Concept> = {
  "intelligence-explosion": {
    key: "intelligence-explosion",
    label: "Intelligence Explosion",
    blurb: "I.J. Good's 1965 hypothesis: build one AI smarter than us, and it builds a smarter one, which builds a smarter one, until the whole thing goes recursive and we're irrelevant. Good called it \"the last invention man need ever make,\" which is either inspiring or terrifying depending on whether you like having a job.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/Intelligence_explosion",
  },
  "hard-takeoff": {
    key: "hard-takeoff",
    label: "Hard Takeoff",
    blurb: "The theory that the jump from human-level to superintelligent AI happens in minutes to days, not years. Transistors run at GHz, neurons at ~100 Hz, so once AI crosses the threshold, we might not even have time to tweet about it. Yudkowsky's favorite nightmare scenario.",
  },
  "soft-takeoff": {
    key: "soft-takeoff",
    label: "Soft Takeoff",
    blurb: "The more optimistic view: AI gets smarter gradually over years or decades, giving humanity time to adapt, regulate, and argue about it on social media. Historically technology has preferred this mode, which is why soft-takeoff believers still sleep at night.",
  },
  "event-horizon": {
    key: "event-horizon",
    label: "Event Horizon (Vinge)",
    blurb: "Vernor Vinge's 1993 framing: the singularity is a point beyond which prediction is impossible, like trying to see past a black hole. Any forecast about what comes after is meaningless by definition, which makes it the most epistemically honest singularity concept and also the least useful for countdown timers.",
    learnMoreUrl: "https://edoras.sdsu.edu/~vinge/misc/singularity.html",
  },
  "accelerating-change": {
    key: "accelerating-change",
    label: "Accelerating Change",
    blurb: "Kurzweil's thesis: technology follows exponential curves, and the singularity is simply the predictable endpoint. He's been saying 2029 for AGI since 1999 and is now somehow in the conservative camp. The man deserves credit for consistency if nothing else.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/Accelerating_change",
  },
  "economic-singularity": {
    key: "economic-singularity",
    label: "Economic Singularity",
    blurb: "The idea that AI makes most humans economically irrelevant before we even hit AGI. You don't need superintelligence to automate away most jobs, just boring competent AI that works 24/7 without complaining. William Nordhaus tracks this via GDP growth rates approaching infinity.",
  },
  "sharp-left-turn": {
    key: "sharp-left-turn",
    label: "Sharp Left Turn",
    blurb: "MIRI's concept: an AI rapidly generalizes capabilities to new domains in a sudden discontinuity. Think AI trained on chess suddenly applying strategic reasoning to everything else. The concern is that alignment breaks down at exactly this transition, right when you need it most.",
  },
  "biological-anchors": {
    key: "biological-anchors",
    label: "Biological Anchors",
    blurb: "Ajeya Cotra's methodology: count every neuron evolution used to produce human brains, calculate the total compute bill, then extrapolate when we'll match that artificially. It's either rigorous quantitative reasoning or the most elaborate anchoring bias in forecasting history. Currently points to ~2040.",
    learnMoreUrl: "https://www.lesswrong.com/posts/KrJfoZzpSDpnrv9va/draft-report-on-ai-timelines",
  },
  "scaling-hypothesis": {
    key: "scaling-hypothesis",
    label: "Scaling Hypothesis",
    blurb: "The bet that making models bigger (more parameters, more compute, more data) eventually produces AGI. GPT-4 to GPT-5 as a ladder to godhood. The AAAI 2025 survey found 76% of researchers skeptical this alone gets us there. The remaining 24% work at frontier labs.",
  },
  "prediction-markets": {
    key: "prediction-markets",
    label: "Prediction Markets",
    blurb: "Platforms like Metaculus, Kalshi, and Polymarket where people bet real money on AI timelines, supposedly aggregating information more efficiently than expert surveys. Current Metaculus consensus for weak AGI: October 2027. Either the wisdom of crowds or a self-selected cohort of very online rationalists.",
  },
  "turing-test": {
    key: "turing-test",
    label: "Turing Test",
    blurb: "Alan Turing's 1950 proposal: if a human can't tell an AI apart from another human in conversation, it's intelligent. Most researchers have quietly retired this as meaningful because current LLMs arguably pass it while clearly not being AGI. Kurzweil still uses it as his AGI definition, which is either visionary or outdated.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/Turing_test",
  },
  "recursive-self-improvement": {
    key: "recursive-self-improvement",
    label: "Recursive Self-Improvement",
    blurb: "The specific mechanism behind the intelligence explosion: AI improves its own code, which lets it improve faster, which accelerates further improvement. The chain reaction that turns AGI into ASI. The open question nobody can answer: do diminishing returns kick in, or does it actually go exponential?",
  },
  "superintelligence": {
    key: "superintelligence",
    label: "Superintelligence (ASI)",
    blurb: "Nick Bostrom's definition: an intellect that greatly exceeds human cognitive performance in virtually all domains. Not just faster or more knowledgeable but qualitatively more capable. Distinct from AGI the way a jet is distinct from a horse. The thing everyone is either racing toward or desperately trying to prevent.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/Superintelligence",
  },
  "agi": {
    key: "agi",
    label: "Artificial General Intelligence (AGI)",
    blurb: "AI that can perform any intellectual task a human can: reasoning, learning, creativity, social interaction. As opposed to narrow AI that only does one thing well. The definitional goalposts keep shifting as narrow AI gets better, and some labs have adopted conveniently self-serving definitions.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/Artificial_general_intelligence",
  },
  "survey-drift": {
    key: "survey-drift",
    label: "Expert Timeline Drift",
    blurb: "The uncomfortable pattern: expert surveys keep moving AGI closer. The 2016 Grace survey said 2061. The 2023 repeat said 2047, a 13-year jump in one survey cycle. Metaculus went from \"50 years away\" to \"7 years away\" between 2020 and 2026. Either AI is genuinely accelerating or experts keep getting surprised.",
  },
  "industry-academia-divergence": {
    key: "industry-academia-divergence",
    label: "Industry vs. Academia Gap",
    blurb: "Industry leaders (Altman, Amodei, Musk) cluster around 2026-2030. Academic researchers give medians of 2040-2060. The gap is explained by: industry having better information, industry having financial incentives to hype, academics being conservative, or — most likely — all three at once.",
  },
  "transformative-ai": {
    key: "transformative-ai",
    label: "Transformative AI",
    blurb: "A pragmatic definition that sidesteps the AGI debate entirely: AI that transforms the economy and world as much as the Industrial Revolution did. You don't need to define consciousness or understanding, just measure whether civilization looks fundamentally different. Open Philanthropy uses this framework to allocate hundreds of millions in safety funding.",
  },
  "alignment": {
    key: "alignment",
    label: "AI Alignment",
    blurb: "The problem of making sure superintelligent AI actually does what we want. Sounds simple, turns out to be possibly the hardest technical problem ever posed. The concern: an AI optimizing for the wrong goal with superhuman capability is an existential threat. The field exists because \"just tell it to be nice\" doesn't scale.",
    learnMoreUrl: "https://en.wikipedia.org/wiki/AI_alignment",
  },
};
