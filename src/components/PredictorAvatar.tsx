import { useState, useEffect } from "react";
import { getHeadshot, subscribeHeadshot } from "./headshotCache";

interface PredictorAvatarProps {
  name: string;
  headshotLocal?: string | null;
  size?: "sm" | "md" | "lg";
}

function nameToInitials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-14 text-[1.1rem]",
  lg: "size-20 text-2xl",
} as const;

export function PredictorAvatar({ name, headshotLocal, size = "md" }: PredictorAvatarProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(() =>
    headshotLocal ? getHeadshot(headshotLocal) : "error"
  );

  useEffect(() => {
    if (!headshotLocal) {
      setStatus("error");
      return;
    }
    // Check current cache status (may have resolved since initial render)
    const current = getHeadshot(headshotLocal);
    setStatus(current);
    if (current !== "loading") return;

    // Subscribe to updates while loading
    return subscribeHeadshot(headshotLocal, () => {
      setStatus(getHeadshot(headshotLocal));
    });
  }, [headshotLocal]);

  if (status === "loaded" && headshotLocal) {
    return (
      <img
        src={headshotLocal}
        alt={name}
        className={`rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  const hue = nameToHue(name);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: `hsl(${hue}, 40%, 30%)` }}
    >
      {nameToInitials(name)}
    </div>
  );
}
