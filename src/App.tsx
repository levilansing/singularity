import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Routes, Route, useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import "./index.css";
import predictions from "./data/predictions-slim.json";
import type { PredictionSlim } from "./data/types";
import { getUrgencyLevel, slugify } from "./data/types";
import { usePredictionDetail } from "./hooks/usePredictionDetail";
import { Countdown } from "./components/Countdown";
import { PredictionCard } from "./components/PredictionCard";
import { Timeline } from "./components/Timeline";
import { SingularityInfo, TypeCarousel, PredictionDrift, ThreeCamps, ShouldIBeWorried } from "./components/SingularityInfo";
import { Footer } from "./components/Footer";
import { StickyHeader } from "./components/StickyHeader";
import { FadeInSection } from "./components/FadeInSection";
import { SectionHeader } from "./components/SectionHeader";
import { CountdownSkeleton } from "./components/CountdownSkeleton";
import { PredictionCardSkeleton } from "./components/PredictionCardSkeleton";

const BrowseAll = lazy(() => import("./components/lazy").then(m => ({ default: m.BrowseAll })));
const ConceptBlurbs = lazy(() => import("./components/lazy").then(m => ({ default: m.ConceptBlurbs })));

const allPredictions = predictions as PredictionSlim[];
const countdownPredictions = allPredictions.filter((p) => p.predicted_year_best !== null);

const idMap = new Map<number, PredictionSlim>();
for (const p of allPredictions) {
  idMap.set(p.id, p);
}

function pickRandom(): PredictionSlim {
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

  // On home route (no id param), start with null and pick random after mount.
  // This lets SSR pre-render the page shell with skeletons for prediction-specific content.
  // On prediction routes (id param present), use the prediction directly.
  const [randomPick, setRandomPick] = useState<PredictionSlim | null>(
    id ? null : (typeof window === "undefined" ? null : pickRandom())
  );

  useEffect(() => {
    if (!id && !randomPick) {
      setRandomPick(pickRandom());
    }
  }, [id, randomPick]);

  const selected: PredictionSlim | null = prediction ?? (id ? null : randomPick);

  const { detail } = usePredictionDetail(selected?.id ?? null);

  const urgency = selected ? getUrgencyLevel(selected.target_date, selected.predicted_year_best !== null) : "far";

  const handleSelect = useCallback((id: number) => {
    const found = allPredictions.find((p) => p.id === id);
    if (found) {
      skipNextScrollRef.current = true;
      navigate(`/${slugify(found)}`);
    }
  }, [navigate]);

  const handleRandom = useCallback(() => {
    skipNextScrollRef.current = true;
    navigate(`/${slugify(pickRandom())}`);
  }, [navigate]);

  useEffect(() => {
    document.body.className = `urgency-${urgency}`;
    return () => {
      document.body.className = "";
    };
  }, [urgency]);

  // For invalid id routes, render nothing while the redirect effect fires
  if (id && !prediction) return null;

  return (
    <>
      {selected && <StickyHeader prediction={selected} onRandom={handleRandom} />}
      <header className="text-center pt-14 mb-12 max-sm:pt-8 max-sm:mb-8">
        <h1 className="animated-gradient-text font-mono text-[clamp(1.8rem,5vw,3rem)] font-bold m-0 tracking-tight text-center">The Singularity<br className="sm:hidden" /> is Coming</h1>
        <p className="text-[#c084fcaa] text-[0.95rem] m-0 italic text-center mt-1">Tracking humanity's most confident<br className="sm:hidden" /> guesses about its own obsolescence</p>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 pb-4 max-sm:px-3 max-sm:pb-2">

        <div className="mb-10 max-sm:mb-6">
          {selected ? (
            <Countdown prediction={selected} onRandom={handleRandom} />
          ) : (
            <CountdownSkeleton />
          )}
        </div>

        <div className="flex flex-col gap-16 max-sm:gap-10">
          <FadeInSection>
            <section>
              <SectionHeader title="Every Prediction, Visualized" />
              <Timeline predictions={allPredictions} selectedId={selected?.id ?? -1} onSelect={handleSelect} />
            </section>
          </FadeInSection>

          <FadeInSection className="-mt-16 max-sm:-mt-6">
            {selected ? (
              <>
                <PredictionCard prediction={selected} detail={detail} onRandom={handleRandom} />
                <Suspense fallback={null}>
                  <ConceptBlurbs conceptKeys={detail?.concept_keys} />
                </Suspense>
              </>
            ) : (
              <PredictionCardSkeleton />
            )}
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

/** Ref shared between ScrollToTop and PredictionPage to suppress scroll on timeline nav */
const skipNextScrollRef = { current: false };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/browse" element={
          <Suspense fallback={<div className="max-w-[1100px] mx-auto px-6 pt-8 pb-16 max-sm:px-3 max-sm:pt-4" />}>
            <BrowseAll predictions={allPredictions} />
          </Suspense>
        } />
        <Route path="/" element={<PredictionPage />} />
        <Route path="/:id/*" element={<PredictionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
