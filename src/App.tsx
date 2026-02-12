import { useState, useCallback, useEffect } from "react";
import "./index.css";
import predictions from "./data/predictions.json";
import type { Prediction } from "./data/types";
import { getUrgencyLevel } from "./data/types";
import { Countdown } from "./components/Countdown";
import { PredictionCard } from "./components/PredictionCard";
import { PredictionPicker } from "./components/PredictionPicker";
import { Timeline } from "./components/Timeline";
import { SingularityInfo } from "./components/SingularityInfo";
import { Footer } from "./components/Footer";
import { StickyHeader } from "./components/StickyHeader";

const allPredictions = predictions as Prediction[];
const countdownPredictions = allPredictions.filter((p) => p.has_countdown);

function pickRandom(): Prediction {
  return countdownPredictions[Math.floor(Math.random() * countdownPredictions.length)]!;
}

export function App() {
  const [selected, setSelected] = useState<Prediction>(() => pickRandom());
  const urgency = getUrgencyLevel(selected.target_date, selected.has_countdown);

  const handleSelect = useCallback((id: number) => {
    const found = allPredictions.find((p) => p.id === id);
    if (found) setSelected(found);
  }, []);

  const handleRandom = useCallback(() => {
    setSelected(pickRandom());
  }, []);

  // Apply urgency class to body for full-page effects
  useEffect(() => {
    document.body.className = `urgency-${urgency}`;
    return () => {
      document.body.className = "";
    };
  }, [urgency]);

  return (
    <>
      <StickyHeader prediction={selected} />
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">The Singularity Countdown</h1>
          <p className="app-subtitle">Tracking humanity's most confident guesses about its own obsolescence</p>
        </header>

        <PredictionPicker
          predictions={allPredictions}
          selectedId={selected.id}
          onSelect={handleSelect}
          onRandom={handleRandom}
        />

        <Countdown prediction={selected} />
        <PredictionCard prediction={selected} />

        <section className="timeline-section">
          <h2 className="section-title">Every Prediction, Visualized</h2>
          <p className="section-subtitle">Click any prediction to update the countdown</p>
          <Timeline predictions={allPredictions} selectedId={selected.id} onSelect={handleSelect} />
        </section>

        <SingularityInfo />
        <Footer />
      </div>
    </>
  );
}

export default App;
