import { useState, useCallback, useEffect, useMemo } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import "./index.css";
import predictions from "./data/predictions.json";
import type { Prediction } from "./data/types";
import { getUrgencyLevel, slugify } from "./data/types";
import { Countdown } from "./components/Countdown";
import { PredictionCard } from "./components/PredictionCard";
import { PredictionPicker } from "./components/PredictionPicker";
import { Timeline } from "./components/Timeline";
import { SingularityInfo } from "./components/SingularityInfo";
import { Footer } from "./components/Footer";
import { StickyHeader } from "./components/StickyHeader";

const allPredictions = predictions as Prediction[];
const countdownPredictions = allPredictions.filter((p) => p.has_countdown);

const slugMap = new Map<string, Prediction>();
for (const p of allPredictions) {
  slugMap.set(slugify(p), p);
}

function pickRandom(): Prediction {
  return countdownPredictions[Math.floor(Math.random() * countdownPredictions.length)]!;
}

function PredictionPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // If on /, pick a random prediction (no URL change)
  // If on /:slug, resolve from slugMap
  const [randomPick] = useState(() => pickRandom());
  const selected = slug ? slugMap.get(slug) : randomPick;

  useEffect(() => {
    if (slug && !slugMap.has(slug)) {
      navigate("/", { replace: true });
    }
  }, [slug, navigate]);

  if (!selected) return null;

  const urgency = getUrgencyLevel(selected.target_date, selected.has_countdown);

  const handleSelect = useCallback((id: number) => {
    const found = allPredictions.find((p) => p.id === id);
    if (found) navigate(`/${slugify(found)}`);
  }, [navigate]);

  const handleRandom = useCallback(() => {
    navigate(`/${slugify(pickRandom())}`);
  }, [navigate]);

  useEffect(() => {
    document.body.className = `urgency-${urgency}`;
    return () => {
      document.body.className = "";
    };
  }, [urgency]);

  return (
    <>
      <StickyHeader prediction={selected} />
      <div className="max-w-[1100px] mx-auto px-6 pt-8 pb-4 max-sm:px-3 max-sm:pt-4 max-sm:pb-2">
        <header className="text-center mb-6">
          <h1 className="app-title font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 mb-1 tracking-tight">The Singularity Countdown</h1>
          <p className="text-(--text-muted) text-[0.95rem] m-0 italic">Tracking humanity's most confident guesses about its own obsolescence</p>
        </header>

        <PredictionPicker
          predictions={allPredictions}
          selectedId={selected.id}
          onSelect={handleSelect}
          onRandom={handleRandom}
        />

        <Countdown prediction={selected} />
        <PredictionCard prediction={selected} />

        <section className="mb-16">
          <h2 className="font-mono text-[1.3rem] font-bold text-center m-0 mb-1 text-(--text)">Every Prediction, Visualized</h2>
          <p className="text-center text-(--text-muted) text-[0.85rem] m-0 mb-4">Click any prediction to update the countdown</p>
          <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
        </section>

        <SingularityInfo />
        <Footer />
      </div>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PredictionPage />} />
      <Route path="/:slug" element={<PredictionPage />} />
    </Routes>
  );
}

export default App;
