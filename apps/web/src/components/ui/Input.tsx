import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  prefix?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "prefix">;

export function Input({ label, hint, error, required, prefix, id, ...rest }: Props) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
          {label}
          {required && <span className="text-brick-600"> *</span>}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-input)] border-[1.5px] bg-white px-3 transition-[border-color,box-shadow] duration-[120ms]",
          "focus-within:border-cobalt-500 focus-within:shadow-[var(--ring)]",
          error ? "border-brick-600" : "border-ink-200",
        )}
      >
        {prefix && <span className="flex text-ink-400">{prefix}</span>}
        <input
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${fieldId}-msg` : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink-900 outline-none placeholder:text-ink-300"
          {...rest}
        />
      </div>
      {(hint || error) && (
        <span id={`${fieldId}-msg`} className={cn("text-sm", error ? "text-brick-600" : "text-ink-400")}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
