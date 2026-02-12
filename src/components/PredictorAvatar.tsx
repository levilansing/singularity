import { useState } from "react";

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

export function PredictorAvatar({ name, headshotLocal, size = "md" }: PredictorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = headshotLocal && !imgError;

  const sizeClass = `predictor-avatar-${size}`;

  if (hasImage) {
    return (
      <img
        src={headshotLocal!}
        alt={name}
        className={`predictor-avatar-img ${sizeClass}`}
        onError={() => setImgError(true)}
      />
    );
  }

  const hue = nameToHue(name);
  return (
    <div
      className={`predictor-avatar-initials ${sizeClass}`}
      style={{ backgroundColor: `hsl(${hue}, 40%, 30%)` }}
    >
      {nameToInitials(name)}
    </div>
  );
}
