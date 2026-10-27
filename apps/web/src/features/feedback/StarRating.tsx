"use client";

import { cn } from "@/lib/cn";

const STAR = "M12 2.5 14.9 8.6l6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z";

type Props = { label: string; value: number; onChange?: (v: number) => void; size?: number; className?: string };

/** Five-star rating (session feedback and survey). Read-only when no onChange is given. */
export function StarRating({ label, value, onChange, size = 48, className }: Props) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className="focus-visible:outline-none focus-visible:shadow-[var(--ring)] rounded-md"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= value ? "var(--color-warning-600)" : "transparent"}
            stroke="var(--color-warning-600)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d={STAR} />
          </svg>
        </button>
      ))}
    </div>
  );
}
