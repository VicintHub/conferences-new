import { cn } from "@/lib/cn";

/** Segmented progress bar for multi-step flows (registration). */
export function Stepper({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-label={`Step ${step} of ${total}`}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-1 rounded-full", i < step ? "bg-cobalt-600" : "bg-ink-100")} />
      ))}
    </div>
  );
}
