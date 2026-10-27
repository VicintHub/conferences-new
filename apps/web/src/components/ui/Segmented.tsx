"use client";

import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: React.ReactNode };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  /** solid = full-width tabs with a filled cobalt active pill (feed/feedback tabs). dark = on cobalt-950 (live player). */
  tone?: "soft" | "solid" | "dark";
};

/** Pill-track segmented control. */
export function Segmented<T extends string>({ options, value, onChange, label, tone = "soft" }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex w-full rounded-full p-1", tone === "solid" ? "bg-ink-50" : tone === "dark" ? "bg-white/10" : "bg-ink-100")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold leading-none transition-[background-color,box-shadow,color] duration-200",
              "focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
              tone === "dark"
                ? active
                  ? "bg-cream-50 font-bold text-cobalt-900"
                  : "font-bold text-cream-50/70"
                : tone === "solid"
                  ? active
                    ? "bg-cobalt-600 font-bold text-white"
                    : "font-bold text-ink-500"
                  : active
                    ? "bg-white text-cobalt-800 shadow-sm"
                    : "text-ink-500",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
