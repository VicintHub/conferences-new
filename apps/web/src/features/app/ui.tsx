import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export const quickTones = [
  { bg: "bg-cobalt-50", fg: "text-cobalt-700" },
  { bg: "bg-brick-100", fg: "text-brick-700" },
  { bg: "bg-cream-100", fg: "text-ink-700" },
  { bg: "bg-success-100", fg: "text-success-600" },
];

export const quickActions = [
  { i: "A", t: "I will be attending card", href: "/app/attending-card" },
  { i: "B", t: "Programme booklet", href: "/app/booklet" },
  { i: "H", t: "Hotels & travel", href: "/app/hotels" },
  { i: "S", t: "Store", href: "/shop" },
];

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex flex-none items-center justify-center rounded-full bg-cobalt-100 font-display text-base font-bold text-cobalt-800"
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Chevron({ className }: { className?: string }) {
  return <ChevronRight size={20} strokeWidth={2} className={cn("text-ink-300", className)} aria-hidden />;
}

export function PageHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-[23px] font-bold leading-[1.15] text-cobalt-900">{children}</h1>
      {aside}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-ink-100", className)} />;
}

export function ErrorNote({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-brick-200 bg-brick-100 p-4 text-sm text-brick-800">
      We couldn’t load this.{" "}
      <button type="button" onClick={onRetry} className="font-semibold underline">
        Try again
      </button>
    </div>
  );
}
