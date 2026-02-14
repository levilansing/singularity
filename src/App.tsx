import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useParams, useNavigate, Navigate } from "react-router-dom";
import "./index.css";
import predictions from "./data/predictions.json";
import type { Prediction } from "./data/types";
import { getUrgencyLevel, slugify } from "./data/types";
import { Countdown } from "./components/Countdown";
import { PredictionCard } from "./components/PredictionCard";
import { BrowseAll } from "./components/BrowseAll";
import { Timeline } from "./components/Timeline";
import { SingularityInfo } from "./components/SingularityInfo";
import { Footer } from "./components/Footer";
import { StickyHeader } from "./components/StickyHeader";
import { ConceptBlurbs } from "./components/ConceptBlurbs";

const allPredictions = predictions as Prediction[];
const countdownPredictions = allPredictions.filter((p) => p.has_countdown);

const idMap = new Map<number, Prediction>();
for (const p of allPredictions) {
  idMap.set(p.id, p);
}

function pickRandom(): Prediction {
  return countdownPredictions[Math.floor(Math.random() * countdownPredictions.length)]!;
}

function PredictionPage() {
  const { id, "*": rest } = useParams();
  const navigate = useNavigate();

  const numericId = id ? parseInt(id, 10) : NaN;
  const prediction = !isNaN(numericId) ? idMap.get(numericId) : undefined;

  // If id doesn't match any prediction, redirect home
  useEffect(() => {
    if (id && !prediction) {
      navigate("/", { replace: true });
    }
  }, [id, prediction, navigate]);

  // If slug is missing or wrong, redirect to the canonical URL
  useEffect(() => {
    if (prediction) {
      const canonical = slugify(prediction);
      const current = id && rest ? `${id}/${rest}` : id;
      if (current !== canonical) {
        navigate(`/${canonical}`, { replace: true });
      }
    }
  }, [prediction, id, rest, navigate]);

  const [randomPick] = useState(() => pickRandom());
  const selected = prediction ?? (id ? undefined : randomPick);

  const urgency = selected ? getUrgencyLevel(selected.target_date, selected.has_countdown) : "far";

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

  if (!selected) return null;

  return (
    <>
      <StickyHeader prediction={selected} />
      <div className="max-w-[1100px] mx-auto px-6 pt-8 pb-4 max-sm:px-3 max-sm:pt-4 max-sm:pb-2">
        <header className="text-center mb-6">
          <h1 className="app-title font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 mb-1 tracking-tight">The Singularity is Coming</h1>
          <p className="text-(--text-muted) text-[0.95rem] m-0 italic">Tracking humanity's most confident guesses about its own obsolescence</p>
        </header>

        <Countdown prediction={selected} onRandom={handleRandom} />

        <section className="mb-16">
          <h2 className="font-mono text-[1.3rem] font-bold text-center m-0 mb-5 text-(--text)">Every Prediction, Visualized</h2>
          <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
        </section>

        <PredictionCard prediction={selected} />
        <ConceptBlurbs prediction={selected} />

        <SingularityInfo />
        <Footer />
      </div>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/browse" element={<BrowseAll predictions={allPredictions} />} />
      <Route path="/" element={<PredictionPage />} />
      <Route path="/:id/*" element={<PredictionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
