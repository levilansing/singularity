import { useEffect, type RefObject } from "react";

export function useCountdownDom(
  targetDate: string | null,
  containerRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!targetDate) return;
    const el = containerRef.current;
    if (!el) return;

    const units: Record<string, Element | null> = {};
    for (const u of ["years", "days", "hours", "minutes", "seconds"]) {
      units[u] = el.querySelector(`[data-unit="${u}"]`);
    }
    const negSign = el.querySelector("[data-neg]") as HTMLElement | null;

    function tick() {
      const diff = new Date(targetDate!).getTime() - Date.now();
      const abs = Math.abs(diff);
      const sign = diff < 0 ? -1 : 1;

      const seconds = Math.floor(abs / 1000) % 60;
      const minutes = Math.floor(abs / 60000) % 60;
      const hours = Math.floor(abs / 3600000) % 24;
      const totalDays = Math.floor(abs / 86400000);
      const years = totalDays >= 365 ? Math.floor(totalDays / 365) : 0;
      const days = totalDays - years * 365;

      if (units.years) units.years.textContent = String(years);
      if (units.days) units.days.textContent = String(days);
      if (units.hours) units.hours.textContent = String(hours).padStart(2, "0");
      if (units.minutes) units.minutes.textContent = String(minutes).padStart(2, "0");
      if (units.seconds) units.seconds.textContent = String(seconds).padStart(2, "0");
      if (negSign) negSign.style.display = sign < 0 ? "" : "none";
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
}

export interface TimeSnapshot {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function computeInitialTime(targetDate: string): TimeSnapshot {
  const diff = new Date(targetDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;

  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / 60000) % 60;
  const hours = Math.floor(abs / 3600000) % 24;
  const totalDays = Math.floor(abs / 86400000);
  const years = totalDays >= 365 ? Math.floor(totalDays / 365) : 0;
  const days = totalDays - years * 365;

  return {
    years: years * sign,
    days: days * sign,
    hours,
    minutes,
    seconds,
  };
}
