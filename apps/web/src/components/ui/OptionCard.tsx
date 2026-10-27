import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: string;
  /** Round avatar tile on the left (registration category letter). */
  lead?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
};

/** Radio-style selectable card used in registration (category, attendance). */
export function OptionCard({ title, description, lead, selected, disabled, onSelect, children }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-3.5 rounded-[20px] bg-white p-[18px] text-left transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
        selected ? "border-2 border-cobalt-600" : "border-[1.5px] border-ink-100",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span className="flex w-full items-center gap-3.5">
        {lead && (
          <span className="flex size-11 flex-none items-center justify-center rounded-full bg-cobalt-50 font-display text-lg font-bold text-cobalt-700">
            {lead}
          </span>
        )}
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-semibold text-ink-900">{title}</span>
          {description && <span className="text-[13px] text-ink-400">{description}</span>}
        </span>
        <span
          aria-hidden
          className={cn(
            "box-border size-[22px] flex-none rounded-full",
            selected ? "border-[7px] border-cobalt-600" : "border-2 border-ink-200",
          )}
        />
      </span>
      {children}
    </button>
  );
}
