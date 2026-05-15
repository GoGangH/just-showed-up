"use client";

import { useEffect, useState } from "react";

function formatRemaining(targetIso: string | null, fallback: string, prefix: string, suffix: string) {
  if (!targetIso) return fallback;

  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return fallback;

  const totalHours = Math.max(0, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60)));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const duration =
    days === 0 ? `${hours}시간` : hours === 0 ? `${days}일` : `${days}일 ${hours}시간`;

  return `${prefix}${duration}${suffix}`;
}

export function RemainingTime({
  fallback,
  initialLabel,
  prefix = "",
  suffix = "",
  targetIso,
}: {
  fallback: string;
  initialLabel: string;
  prefix?: string;
  suffix?: string;
  targetIso: string | null;
}) {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    const update = () => setLabel(formatRemaining(targetIso, fallback, prefix, suffix));

    update();
    const interval = window.setInterval(update, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [fallback, prefix, suffix, targetIso]);

  return <>{label}</>;
}
