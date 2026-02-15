export function Footer() {
  return (
    <footer className="app-footer flex flex-col items-center justify-center text-center py-8 border-t border-[#ffffff08] text-(--text-dim) text-[0.8rem]">
      <p className="text-[0.7rem] max-w-[540px] mx-auto leading-relaxed">
        This site was researched and built by AI with human oversight — which is
        either a testament to how far we've come or a warning about how
        low the bar is. Prediction data sourced from published forecasts,
        surveys, and prediction markets. Accuracy of said predictions 100%
        not guaranteed, obviously, or we wouldn't be here.
      </p>
    </footer>
  );
}
