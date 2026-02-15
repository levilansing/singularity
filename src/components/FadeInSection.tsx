import { useEffect, useRef, useState } from "react";

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  // SSR: start visible so content appears in pre-rendered HTML
  const [isVisible, setIsVisible] = useState(() => typeof window === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // After hydration, reset visibility and let IntersectionObserver handle it
    setIsVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`fade-in-section duration-500 py-8 max-sm:py-5 ${isVisible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
