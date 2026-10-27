"use client";

import { useQuery } from "@tanstack/react-query";
import { venueStamp } from "@/lib/time";
import { admin } from "./api";
import { Card, Loading, PageHeader, Problem, StatCard, Table, Tag } from "./ui";

type Summary = {
  checkpoints: { key: string; label: string; ok: number; refused: number }[];
  meals: Record<string, number>;
  refusals: Record<string, number>;
  overrides: number;
  badges: { today: number; total: number; reprints: number };
  recent: {
    id: number;
    checkpoint: string;
    result: "ok" | "refused";
    reason: string | null;
    overridden: boolean;
    who: string;
    device: string | null;
    scanned_at: string;
  }[];
};

/** Check-in & meals: what the door, the meal points and the print desk have done today. */
export function CheckIn() {
  const q = useQuery({
    queryKey: ["admin", "checkin"],
    queryFn: async () => (await admin<{ data: Summary }>("checkin")).data,
    refetchInterval: 20_000,
  });

  if (q.isPending) return <Loading rows={4} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const meals = Object.entries(d.meals);
  const refusals = Object.entries(d.refusals);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Check-in & meals" eyebrow="Today, updated as phones sync" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {d.checkpoints.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={c.ok.toLocaleString("en-NG")}
            note={c.refused ? `${c.refused} refused` : "No refusals"}
            tone={c.refused ? "alert" : "muted"}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="text-lg font-bold text-ink-900">Badges</h2>
          <p className="text-[15px] text-ink-700">
            <strong className="font-display text-[32px] text-cobalt-900">{d.badges.today}</strong> printed today · {d.badges.total} in all
            {d.badges.reprints > 0 && ` · ${d.badges.reprints} reprints`}
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="text-lg font-bold text-ink-900">Meals served</h2>
          {meals.length === 0 ? (
            <p className="text-sm text-ink-500">None yet today.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {meals.map(([label, n]) => (
                <li key={label} className="flex justify-between text-[15px]">
                  <span>{label}</span>
                  <strong>{n.toLocaleString("en-NG")}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="text-lg font-bold text-ink-900">Refusals</h2>
          {refusals.length === 0 ? (
            <p className="text-sm text-ink-500">None today.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {refusals.map(([reason, n]) => (
                <li key={reason} className="flex justify-between gap-4 text-[15px]">
                  <span>{reason}</span>
                  <strong>{n}</strong>
                </li>
              ))}
            </ul>
          )}
          {d.overrides > 0 && (
            <p className="text-sm font-semibold text-warning-600">
              {d.overrides} supervisor override{d.overrides === 1 ? "" : "s"}
            </p>
          )}
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-ink-900">Latest scans</h2>
        <Table head={["Who", "Checkpoint", "Result", "Device", "Time"]} empty={d.recent.length === 0 ? "Nothing scanned yet." : undefined}>
          {d.recent.map((s) => (
            <tr key={s.id} className="border-t border-ink-50">
              <td className="px-5 py-3 font-bold text-ink-900">{s.who}</td>
              <td className="px-5 py-3 capitalize">{s.checkpoint}</td>
              <td className="px-5 py-3">
                {s.result === "ok" ? (
                  <Tag tone="success">{s.overridden ? "Override" : "OK"}</Tag>
                ) : (
                  <Tag tone="brick">{s.reason ?? "Refused"}</Tag>
                )}
              </td>
              <td className="px-5 py-3 text-ink-600">{s.device ?? "—"}</td>
              <td className="px-5 py-3 text-ink-600">{venueStamp(s.scanned_at)}</td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
