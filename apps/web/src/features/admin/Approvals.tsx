"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { admin, json } from "./api";
import type { AdminMe, ApprovalDetail, ApprovalItem } from "./types";
import { Card, Initials, Loading, PageHeader, Problem, Pills, Tag } from "./ui";

type Tab = string;

const ago = (iso: string) => {
  const h = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** Approvals (design 15a): the queue on the left, the selected item's details and decision on the right. */
export function Approvals() {
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin", "approvals", tab],
    queryFn: () =>
      admin<{ data: ApprovalItem[]; meta: { counts: Record<string, number> } }>(`approvals${tab === "all" ? "" : `?kind=${tab}`}`),
    placeholderData: (p) => p,
  });
  const counts = list.data?.meta.counts ?? {};
  const items = list.data?.data ?? [];
  const current = items.find((i) => i.key === selected) ?? items[0];

  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: `All ${counts.all ?? 0}` },
    ...(["minister", "speaker", "vip", "vendor", "media"] as const)
      .filter((k) => counts[k] || tab === k)
      .map((k) => ({
        value: k,
        label: `${k === "vip" ? "VIP" : k[0]!.toUpperCase() + k.slice(1)}${k === "minister" ? "s" : ""} ${counts[k] ?? 0}`,
      })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Approvals"
        actions={<Pills label="Filter queue" value={tab} onChange={(t) => (setTab(t), setSelected(null))} options={tabs} />}
      />
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <Problem error={list.error} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-ink-500">Nothing is waiting for approval.</Card>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <ul aria-label="Queue">
              {items.map((i) => (
                <li key={i.key} className="border-b border-ink-50 last:border-0">
                  <button
                    type="button"
                    aria-current={current?.key === i.key}
                    onClick={() => setSelected(i.key)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-4 text-left",
                      current?.key === i.key ? "bg-cobalt-50" : "hover:bg-cream-50",
                    )}
                  >
                    <Initials name={i.name} size={44} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-bold text-ink-900">{i.name}</span>
                      <span className="truncate text-sm text-ink-500">{i.subtitle}</span>
                    </span>
                    <Tag>{i.kind_label}</Tag>
                    <span className="w-8 text-right text-sm text-ink-500">{ago(i.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {current && <Detail key={current.key} item={current} />}
        </div>
      )}
    </div>
  );
}

function Detail({ item }: { item: ApprovalItem }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "approval", item.key],
    queryFn: async () => (await admin<{ data: ApprovalDetail }>(`approvals/${item.key}`)).data,
  });
  const [note, setNote] = useState("");
  const [info, setInfo] = useState("");
  const [asking, setAsking] = useState(false);
  const [deciding, setDeciding] = useState<"decline" | null>(null);

  const act = useMutation({
    mutationFn: (body: { action: string; note?: string; info?: string }) =>
      admin<{ meta: { badges: AdminMe["meta"]["badges"] } }>(`approvals/${item.key}`, json("POST", body)),
    onSuccess: (r) => {
      qc.setQueryData<AdminMe>(["admin", "me"], (cur) => (cur ? { ...cur, meta: { badges: r.meta.badges } } : cur));
      void qc.invalidateQueries({ queryKey: ["admin", "approvals"] });
      void qc.invalidateQueries({ queryKey: ["admin", "approval", item.key] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      setAsking(false);
      setDeciding(null);
      setInfo("");
      setNote("");
    },
  });

  if (q.isPending) return <Loading rows={2} />;
  if (q.isError) return <Problem error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const has = (a: ApprovalDetail["actions"][number]) => d.actions.includes(a);
  const error = act.error instanceof ApiError ? act.error.message : null;

  return (
    <Card className="flex flex-col gap-4 p-6">
      <span className="self-start">
        <Tag>{d.heading}</Tag>
      </span>
      <h2 className="text-2xl font-bold text-ink-900">{d.name}</h2>
      <dl>
        {d.facts.map((f) => (
          <div key={f.k} className="flex justify-between gap-6 border-b border-ink-50 py-3 text-[15px]">
            <dt className="flex-none text-ink-500">{f.k}</dt>
            <dd className="break-words text-right font-semibold text-ink-900">{f.v}</dd>
          </div>
        ))}
      </dl>
      {d.documents.map((doc) => (
        <a
          key={doc.id}
          href={`/api/admin-backend${doc.url.replace(/^\/admin/, "")}`}
          className="rounded-xl bg-ink-50 px-4 py-3 text-sm font-bold text-cobalt-700"
        >
          {doc.name}
        </a>
      ))}
      {d.requested_info && (
        <p className="rounded-xl bg-warning-100 p-3 text-sm text-warning-600">
          <strong>Asked of the applicant:</strong> {d.requested_info}
        </p>
      )}
      {d.status !== "pending" && d.actions.length === 0 && (
        <Tag tone={d.status === "approved" ? "success" : "brick"}>{d.status === "approved" ? "Approved" : "Declined"}</Tag>
      )}

      {(asking || deciding) && (
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-600">
          {asking ? "What do you need from them?" : "Note to the applicant (optional)"}
          <textarea
            value={asking ? info : note}
            onChange={(e) => (asking ? setInfo(e.target.value) : setNote(e.target.value))}
            rows={3}
            className="resize-none rounded-[var(--radius-input)] border-[1.5px] border-ink-200 p-3 text-[15px] font-normal normal-case tracking-normal text-ink-900 outline-none focus:border-cobalt-500 focus:shadow-[var(--ring)]"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-brick-600">
          {error}
        </p>
      )}

      {d.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {has("check") && d.status === "submitted" && (
            <Button variant="outline" disabled={act.isPending} onClick={() => act.mutate({ action: "check" })}>
              Mark documents checked
            </Button>
          )}
          {has("review") && d.status !== "in_review" && (
            <Button variant="outline" disabled={act.isPending} onClick={() => act.mutate({ action: "review" })}>
              Start review
            </Button>
          )}
          {has("request_info") &&
            (asking ? (
              <Button disabled={act.isPending || info.trim().length < 3} onClick={() => act.mutate({ action: "request_info", info })}>
                Send request
              </Button>
            ) : (
              <Button variant="outline" onClick={() => (setAsking(true), setDeciding(null))}>
                Ask for more
              </Button>
            ))}
          <div className="flex flex-1 justify-end gap-3">
            {deciding === "decline" ? (
              <Button variant="accent" disabled={act.isPending} onClick={() => act.mutate({ action: "decline", note })}>
                Confirm decline
              </Button>
            ) : (
              <Button variant="outline" disabled={act.isPending} onClick={() => (setDeciding("decline"), setAsking(false))}>
                Decline
              </Button>
            )}
            <Button disabled={act.isPending} onClick={() => act.mutate({ action: "approve", note })}>
              Approve
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
