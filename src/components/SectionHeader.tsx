interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-16 h-px bg-linear-to-r from-transparent via-[#c084fc] to-transparent mb-6 shadow-[0_0_12px_#c084fc66]" />
      <h2 className="app-title font-mono text-[1.5rem] font-bold text-center m-0 mb-1 bg-linear-to-r from-[#e879a8] via-[#c084fc] to-[#67e8f9] bg-clip-text text-transparent">
        {title}
      </h2>
      {subtitle && (
        <p className="text-center text-(--text-muted) text-[0.85rem] m-0 italic">
          {subtitle}
        </p>
      )}
    </div>
  );
}
