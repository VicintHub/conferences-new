import { cn } from "@/lib/cn";

/** Oswald page title with an optional small line above and actions on the right (design 15a). */
export function PageHeader({ title, eyebrow, actions }: { title: string; eyebrow?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm text-ink-500">{eyebrow}</p>}
        <h1 className="font-display text-[48px] font-bold uppercase leading-[1] text-cobalt-900">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-[20px] border border-ink-100 bg-white", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  note,
  tone = "muted",
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?: "good" | "muted" | "alert";
}) {
  return (
    <Card className="flex flex-col gap-1 px-5 py-4">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="font-display text-[44px] font-bold leading-none text-cobalt-900">{value}</span>
      {note && (
        <span
          className={cn(
            "text-[13px] font-semibold",
            tone === "good" ? "text-success-600" : tone === "alert" ? "text-brick-600" : "text-ink-500",
          )}
        >
          {note}
        </span>
      )}
    </Card>
  );
}

/** Filter pills: the selected one is filled cobalt-900, as in the approvals tabs. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border-[1.5px] px-4 py-2.5 text-sm font-bold leading-none focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
            value === o.value
              ? "border-cobalt-950 bg-cobalt-950 text-cream-50"
              : "border-ink-200 bg-white text-ink-600 hover:border-cobalt-600",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const tones = {
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  cobalt: "bg-cobalt-50 text-cobalt-800",
  brick: "bg-brick-100 text-brick-700",
  neutral: "bg-ink-100 text-ink-600",
};
export function Tag({ tone = "cobalt", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex flex-none items-center rounded-full px-2.5 py-1 text-xs font-bold leading-none", tones[tone])}>
      {children}
    </span>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="bg-ink-50 text-xs uppercase tracking-[0.08em] text-ink-500">
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-3.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[15px] text-ink-800">{children}</tbody>
      </table>
      {empty && <p className="px-5 py-10 text-center text-sm text-ink-400">{empty}</p>}
    </Card>
  );
}

export function Pager({ page, last, total, onPage }: { page: number; last: number; total: number; onPage: (p: number) => void }) {
  return (
    <nav aria-label="Pages" className="flex items-center justify-between text-sm text-ink-500">
      <span>{total.toLocaleString("en-NG")} total</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full border border-ink-200 px-4 py-2 font-bold text-ink-700 disabled:opacity-40"
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, last)}
        </span>
        <button
          type="button"
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
          className="rounded-full border border-ink-200 px-4 py-2 font-bold text-ink-700 disabled:opacity-40"
        >
          Next
        </button>
      </span>
    </nav>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-[320px] rounded-full border-[1.5px] border-ink-200 bg-white px-5 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-cobalt-500 focus:shadow-[var(--ring)]"
    />
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="h-16 animate-pulse rounded-2xl bg-ink-100" />
      ))}
    </div>
  );
}

export function Problem({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const forbidden = (error as { status?: number })?.status === 403;
  return (
    <div role="alert" className="rounded-2xl border border-brick-200 bg-brick-100 p-4 text-sm text-brick-800">
      {forbidden ? "Your role can’t open this page." : message}{" "}
      {onRetry && !forbidden && (
        <button type="button" onClick={onRetry} className="font-bold underline">
          Try again
        </button>
      )}
    </div>
  );
}

/** Initials in a soft circle, as in the approvals queue. */
export function Initials({ name, size = 40 }: { name: string; size?: number }) {
  const i = name
    .replace(/^(Pastor|Rev\.?|Dr\.?|Hon\.?|Deacon)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex flex-none items-center justify-center rounded-full bg-cobalt-100 font-display text-sm font-bold text-cobalt-800"
    >
      {i}
    </span>
  );
}
