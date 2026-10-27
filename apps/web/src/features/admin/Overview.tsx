"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { admin } from "./api";
import type { Overview as OverviewData } from "./types";
import { Card, Loading, PageHeader, Problem, StatCard } from "./ui";

const SWATCH = ["bg-cobalt-600", "bg-cobalt-300", "bg-brick-600", "bg-brick-400", "bg-ink-300"];
const n = (v: number) => v.toLocaleString("en-NG");

/** Overview (design 15a): KPIs, 14-day registrations, onsite capacity and the category split. */
export function Overview({ canBroadcast = true, canExport = true }: { canBroadcast?: boolean; canExport?: boolean }) {
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: () => admin<{ data: OverviewData }>("overview") });

  if (q.isPending) return <Loading rows={4} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data.data;
  const max = Math.max(1, ...d.series.map((s) => s.count));
  const k = d.kpis;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`${d.days_to_opening} days to opening`}
        title="Overview"
        actions={
          <>
            {canExport && (
              <Button variant="outline" href="/api/admin-backend/registrants/export">
                Export
              </Button>
            )}
            {canBroadcast && <Button href="/admin/broadcasts">New broadcast</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Registered" value={n(k.registered.value)} note={`+${n(k.registered.today)} today`} tone="good" />
        <StatCard label="Onsite" value={n(k.onsite.value)} note={`${k.onsite.percent_of_cap}% of cap`} />
        <StatCard label="Online" value={n(k.online.value)} note={`+${n(k.online.today)} today`} tone="good" />
        <StatCard
          label="Awaiting approval"
          value={n(k.awaiting_approval.value)}
          note={
            k.awaiting_approval.oldest_days === null
              ? "Nothing waiting"
              : `Oldest ${k.awaiting_approval.oldest_days} ${k.awaiting_approval.oldest_days === 1 ? "day" : "days"}`
          }
          tone={k.awaiting_approval.value ? "alert" : "muted"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Registrations · last 14 days</h2>
            <span className="text-sm text-ink-500">Daily</span>
          </div>
          <ol aria-label="Registrations per day" className="mt-6 flex h-[200px] items-end gap-2">
            {d.series.map((s, i) => (
              <li key={s.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${s.date}: ${s.count}`}>
                <span
                  role="img"
                  aria-label={`${s.date}: ${s.count} registrations`}
                  style={{ height: `${Math.max(3, Math.round((s.count / max) * 100))}%` }}
                  className={cn("w-full rounded-t-lg", i === d.series.length - 1 ? "bg-brick-600" : "bg-cobalt-200")}
                />
                <span className="text-xs text-ink-500">{i + 1}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-bold text-ink-900">Onsite capacity</h2>
          <p className="flex items-baseline gap-3">
            <span className="font-display text-[56px] font-bold leading-none text-cobalt-900">{d.capacity.percent}%</span>
            <span className="text-sm text-ink-500">
              {n(d.capacity.taken)} of {n(d.capacity.total)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Onsite capacity used"
            aria-valuenow={d.capacity.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 overflow-hidden rounded-full bg-ink-100"
          >
            <div style={{ width: `${Math.min(100, d.capacity.percent)}%` }} className="h-full rounded-full bg-cobalt-600" />
          </div>
          <ul className="flex flex-col gap-3">
            {d.categories.map((c, i) => (
              <li key={c.key} className="flex items-center justify-between text-[15px]">
                <span className="flex items-center gap-3 text-ink-800">
                  <span aria-hidden className={cn("size-2.5 rounded-full", SWATCH[i % SWATCH.length])} />
                  {c.label}
                </span>
                <span className="font-bold text-ink-900">{n(c.count)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
