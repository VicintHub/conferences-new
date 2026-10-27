import { cn } from "@/lib/cn";

type Props = { label: string; checked: boolean; onChange: (checked: boolean) => void };

/** Row card with a toggle (e.g. "I need accommodation"). */
export function Switch({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-[20px] border-[1.5px] border-ink-100 bg-white px-[18px] py-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
    >
      <span className="text-[15px] font-semibold text-ink-800">{label}</span>
      <span
        aria-hidden
        className={cn("relative h-7 w-12 flex-none rounded-full transition-colors duration-200", checked ? "bg-cobalt-600" : "bg-ink-200")}
      >
        <span
          className={cn(
            "absolute top-[3px] size-[22px] rounded-full bg-white shadow-xs transition-[left] duration-200",
            checked ? "left-[23px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}
