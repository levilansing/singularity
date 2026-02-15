export function CountdownSkeleton() {
  return (
    <div className="countdown-container text-center py-10 px-4 mb-12 rounded-xl bg-(--bg-card) border border-[#ffffff08] transition-all duration-500 max-sm:py-6 max-sm:px-3 urgency-far">
      {/* Prediction year line */}
      <div className="mb-8 flex justify-center">
        <div className="h-4 w-72 max-sm:w-48 rounded bg-[#ffffff08] animate-pulse" />
      </div>

      {/* Digit blocks */}
      <div className="flex flex-row justify-center items-start gap-1 mb-6 max-sm:gap-[0.1rem]">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="flex flex-col items-center min-w-14 max-sm:min-w-10">
            <div className="h-[clamp(2rem,6vw,4rem)] w-full rounded bg-[#ffffff08] animate-pulse" />
            <div className="text-[0.7rem] uppercase tracking-widest text-(--text-muted) mt-1.5 opacity-30">{label}</div>
          </div>
        ))}
      </div>

      {/* Commentary line */}
      <div className="h-16 mb-3 flex justify-center items-center">
        <div className="h-4 w-64 max-sm:w-44 rounded bg-[#ffffff08] animate-pulse" />
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4">
        <div className="h-4 w-16 rounded bg-[#ffffff08] animate-pulse" />
        <div className="h-4 w-36 rounded bg-[#ffffff08] animate-pulse" />
      </div>
    </div>
  );
}
