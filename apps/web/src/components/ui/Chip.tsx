import { cn } from "@/lib/cn";

type Props = {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

/** Pill toggle (day chips, filters). */
export function Chip({ selected = false, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border-[1.5px] px-[18px] py-[11px] text-[15px] font-semibold leading-none transition-colors duration-[120ms]",
        "focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
        selected ? "border-cobalt-600 bg-cobalt-600 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-cobalt-600",
      )}
    >
      {children}
    </button>
  );
}
