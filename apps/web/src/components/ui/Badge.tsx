import { cn } from "@/lib/cn";

type Tone = "cobalt" | "brick" | "success" | "warning" | "neutral" | "outlineDark";

const tones: Record<Tone, string> = {
  cobalt: "bg-cobalt-100 text-cobalt-800",
  brick: "bg-brick-100 text-brick-700",
  success: "bg-success-600 text-white",
  warning: "bg-warning-100 text-warning-600",
  neutral: "bg-ink-100 text-ink-600",
  outlineDark: "border border-white/30 text-white",
};

export function Badge({ tone = "cobalt", dot, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.08em]",
        tones[tone],
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
