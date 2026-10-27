"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export const EVENT_START = "2027-01-19T17:00:00+01:00";

export function remaining(target: number, now: number) {
  const s = Math.max(0, Math.floor((target - now) / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  target?: string;
  /** hero = boxed landing hero; card = compact app card on cobalt; panel = large desktop dashboard card. */
  variant?: "card" | "hero" | "panel";
};

export function Countdown({ target = EVENT_START, variant = "card" }: Props) {
  const end = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = now === null ? null : remaining(end, now);
  const hero = variant === "hero";
  const units = [
    [hero ? "Days" : "DAYS", t ? (hero ? pad(t.days) : String(t.days)) : "--"],
    [hero ? "Hours" : "HRS", t ? pad(t.hours) : "--"],
    [hero ? "Minutes" : "MIN", t ? pad(t.minutes) : "--"],
    [hero ? "Seconds" : "SEC", t ? pad(t.seconds) : "--"],
  ] as const;

  return (
    <div
      role="timer"
      aria-label="Countdown to the conference"
      className={cn(
        hero && "grid w-full grid-cols-4 gap-2 md:flex md:w-auto md:justify-center md:gap-3.5",
        variant === "card" && "flex items-end gap-[18px]",
        variant === "panel" && "flex gap-7",
      )}
    >
      {units.map(([label, value]) => (
        <div
          key={label}
          className={cn(
            "flex flex-col text-white",
            hero && "items-center gap-1 rounded-[10px] border border-white/20 bg-cobalt-950/40 py-3 md:w-[120px] md:py-[18px]",
          )}
        >
          <span
            className={cn(
              "font-display font-semibold tabular-nums",
              hero && "text-[30px] leading-none md:text-[52px]",
              variant === "card" && "text-[40px] leading-[0.95]",
              variant === "panel" && "text-[64px] leading-[0.9]",
            )}
          >
            {value}
          </span>
          <span
            className={cn(
              hero && "text-[11px] font-medium text-cobalt-200 md:text-xs",
              variant === "card" && "text-[9px] font-medium leading-[1.8] tracking-[0.1em] text-cobalt-300",
              variant === "panel" && "text-[10px] font-medium leading-[2] tracking-[0.12em] text-cobalt-300",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
