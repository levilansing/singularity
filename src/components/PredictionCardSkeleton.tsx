export function PredictionCardSkeleton() {
  return (
    <div className="bg-(--bg-card) border border-[#ffffff08] rounded-xl p-6 max-sm:p-4">
      {/* Predictor header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="shrink-0 size-14 rounded-full bg-[#ffffff08] animate-pulse" />
        <div className="h-5 w-40 rounded bg-[#ffffff08] animate-pulse" />
      </div>

      {/* Metadata stat block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 px-1">
        {["Predicted", "Target", "Type", "Confidence"].map((label) => (
          <div key={label}>
            <div className="text-[0.65rem] font-mono uppercase tracking-wider text-(--text-dim) mb-1 opacity-30">{label}</div>
            <div className="h-4 w-16 rounded bg-[#ffffff08] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Headline */}
      <div className="h-5 w-3/4 rounded bg-[#ffffff08] animate-pulse mb-3" />

      {/* Summary lines */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="h-3.5 w-full rounded bg-[#ffffff08] animate-pulse" />
        <div className="h-3.5 w-5/6 rounded bg-[#ffffff08] animate-pulse" />
        <div className="h-3.5 w-2/3 rounded bg-[#ffffff08] animate-pulse" />
      </div>

      {/* Source link placeholder */}
      <div className="h-3.5 w-20 rounded bg-[#ffffff08] animate-pulse" />
    </div>
  );
}
