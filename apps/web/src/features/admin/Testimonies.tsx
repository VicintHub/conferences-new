"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui";
import { duration } from "@/features/live/types";
import { admin, json } from "./api";
import type { ModTestimony } from "./types";
import { Card, Loading, PageHeader, Pills, Problem, Tag } from "./ui";

type Status = "pending" | "approved" | "rejected";
type Meta = { counts: Partial<Record<Status, number>>; average_rating: number; responses: number };

const fmt = (t: ModTestimony) =>
  t.type === "write"
    ? "Written"
    : `${t.type === "video" ? "Video" : "Voice"}${t.duration_seconds ? ` · ${duration(t.duration_seconds)}` : ""}`;

/** Testimonies & feedback (design 15a): the moderation queue. */
export function Testimonies() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  const q = useQuery({
    queryKey: ["admin", "testimonies", status],
    queryFn: () => admin<{ data: ModTestimony[]; meta: Meta }>(`testimonies?status=${status}`),
    placeholderData: (p) => p,
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "publish" | "hide" | "feature" | "unfeature" }) =>
      admin(`testimonies/${id}`, json("POST", { action })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "testimonies"] });
      void qc.invalidateQueries({ queryKey: ["admin", "me"] }); // the sidebar count
    },
  });

  const meta = q.data?.meta;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Testimonies & feedback"
        actions={
          meta && meta.responses > 0 ? (
            <span className="text-sm font-bold text-ink-600">{`Avg. session rating ${meta.average_rating} · ${meta.responses.toLocaleString("en-NG")} responses`}</span>
          ) : undefined
        }
      />
      <Pills
        label="Show"
        value={status}
        onChange={setStatus}
        options={[
          { value: "pending", label: `To review ${meta?.counts.pending ?? 0}` },
          { value: "approved", label: `Published ${meta?.counts.approved ?? 0}` },
          { value: "rejected", label: `Hidden ${meta?.counts.rejected ?? 0}` },
        ]}
      />
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Problem error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.data.length === 0 ? (
        <Card className="p-10 text-center text-ink-500">
          {status === "pending" ? "Nothing to review. All caught up." : "Nothing here."}
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data.data.map((t) => (
            <li key={t.id}>
              <Card className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  {t.tag ? <Tag tone="brick">{t.tag}</Tag> : <span />}
                  <span className="text-sm text-ink-500">{fmt(t)}</span>
                </div>
                {t.media_url &&
                  (t.type === "video" ? (
                    <video src={t.media_url} controls preload="none" className="aspect-video w-full rounded-xl bg-black" />
                  ) : (
                    <audio src={t.media_url} controls preload="none" className="w-full" />
                  ))}
                <p className="flex-1 text-[15px] leading-[1.55] text-ink-900">
                  {t.body ?? <em className="text-ink-400">No written text</em>}
                </p>
                <p className="text-sm font-bold text-ink-900">
                  {t.display_name}
                  {t.author_name !== t.display_name && (
                    <span className="block text-xs font-normal text-ink-500">Really: {t.author_name}</span>
                  )}
                </p>
                <div className="flex gap-3">
                  {status !== "rejected" && (
                    <Button variant="outline" fullWidth disabled={act.isPending} onClick={() => act.mutate({ id: t.id, action: "hide" })}>
                      Hide
                    </Button>
                  )}
                  {status !== "approved" && (
                    <Button fullWidth disabled={act.isPending} onClick={() => act.mutate({ id: t.id, action: "publish" })}>
                      Publish
                    </Button>
                  )}
                  {status === "approved" && (
                    <Button
                      variant={t.featured ? "primary" : "outline"}
                      fullWidth
                      disabled={act.isPending}
                      onClick={() => act.mutate({ id: t.id, action: t.featured ? "unfeature" : "feature" })}
                    >
                      {t.featured ? "Featured ✓" : "Feature"}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
