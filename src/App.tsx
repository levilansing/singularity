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
import { FadeInSection } from "./components/FadeInSection";

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
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src="/logo.svg" alt="" className="w-10 h-10 max-sm:w-8 max-sm:h-8" />
            <h1 className="app-title font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 tracking-tight">The Singularity is Coming</h1>
          </div>
          <p className="text-(--text-muted) text-[0.95rem] m-0 italic">Tracking humanity's most confident guesses about its own obsolescence</p>
        </header>

        <Countdown prediction={selected} onRandom={handleRandom} />

        <FadeInSection>
          <section className="mb-20">
            <div className="flex flex-col items-center mb-6">
              <img src="/art/timeline-header.svg" alt="" className="w-40 h-auto mb-4 max-sm:w-28 opacity-80" />
              <h2 className="app-title font-mono text-[1.5rem] font-bold text-center m-0 mb-2">Every Prediction, Visualized</h2>
              <p className="text-(--text-dim) text-[0.85rem] m-0 italic text-center">The scatter plot of humanity's guesses</p>
            </div>
            <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
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
