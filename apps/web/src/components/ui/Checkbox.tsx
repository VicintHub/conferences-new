import { Check } from "lucide-react";
import { useId } from "react";

type Props = { label: React.ReactNode; checked: boolean; onChange: (checked: boolean) => void; error?: string };

export function Checkbox({ label, checked, onChange, error }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-[1.4] text-ink-700">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden
          className="mt-px flex size-[22px] flex-none items-center justify-center rounded-md border-[1.5px] border-ink-200 bg-white text-white transition-colors peer-checked:border-cobalt-600 peer-checked:bg-cobalt-600 peer-focus-visible:shadow-[var(--ring)]"
        >
          {checked && <Check size={14} strokeWidth={3} />}
        </span>
        <span>{label}</span>
      </label>
      {error && <span className="text-sm text-brick-600">{error}</span>}
    </div>
  );
}
