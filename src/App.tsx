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
import { SingularityInfo, TypeCarousel, PredictionDrift, ThreeCamps, ShouldIBeWorried } from "./components/SingularityInfo";
import { Footer } from "./components/Footer";
import { StickyHeader } from "./components/StickyHeader";
import { ConceptBlurbs } from "./components/ConceptBlurbs";
import { FadeInSection } from "./components/FadeInSection";
import { SectionHeader } from "./components/SectionHeader";

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
      <StickyHeader prediction={selected} onRandom={handleRandom} />
      <header className="text-center pt-14 mb-12 max-sm:pt-8 max-sm:mb-8">
        <h1 className="font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 tracking-tight text-center bg-linear-to-r from-[#e879a8] via-[#c084fc] to-[#67e8f9] bg-clip-text text-transparent">The Singularity is Coming</h1>
        <p className="text-[#c084fcaa] text-[0.95rem] m-0 italic text-center mt-1">Tracking humanity's most confident guesses about its own obsolescence</p>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 pb-4 max-sm:px-3 max-sm:pb-2">

        <div className="mb-10 max-sm:mb-6">
          <Countdown prediction={selected} onRandom={handleRandom} />
        </div>

        <div className="flex flex-col gap-16 max-sm:gap-10">
          <FadeInSection>
            <section>
              <SectionHeader title="Every Prediction, Visualized" />
              <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
            </section>
          </FadeInSection>

          <FadeInSection>
            <PredictionCard prediction={selected} />
            <ConceptBlurbs prediction={selected} />
          </FadeInSection>

          <FadeInSection>
            <SingularityInfo />
          </FadeInSection>

          <FadeInSection>
            <TypeCarousel />
          </FadeInSection>

          <FadeInSection>
            <PredictionDrift />
          </FadeInSection>

          <FadeInSection>
            <ThreeCamps />
          </FadeInSection>

          <FadeInSection>
            <ShouldIBeWorried />
          </FadeInSection>
        </div>
        <div className="pt-8" />
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
