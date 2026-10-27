"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { naira } from "@/lib/money";
import { venueStamp } from "@/lib/time";
import { admin, json, qs } from "./api";
import { useDebounced } from "./Registrants";
import type { OrderRow, Paged } from "./types";
import { Loading, PageHeader, Pager, Pills, Problem, SearchField, Table, Tag } from "./ui";

type Filter = "all" | "paid" | "collected" | "pending" | "refund_due";
const TONE: Record<string, "success" | "warning" | "neutral" | "brick" | "cobalt"> = {
  paid: "cobalt",
  collected: "success",
  pending: "warning",
  failed: "brick",
  expired: "neutral",
  refund_due: "brick",
  refunded: "neutral",
};

/** Store orders: what's been paid, handed over, or waiting on a refund. */
export function Orders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search);
  const q = useQuery({
    queryKey: ["admin", "orders", status, term, page],
    queryFn: () => admin<Paged<OrderRow>>(`orders${qs({ status, search: term, page })}`),
    placeholderData: (p) => p,
  });

  const mark = useMutation({
    mutationFn: ({ code, to }: { code: string; to: "collected" | "refunded" }) => admin(`orders/${code}`, json("PATCH", { status: to })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Store orders" />
      <div className="flex flex-wrap items-center gap-4">
        <SearchField
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search code, name or email"
        />
        <Pills
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "paid", label: "To collect" },
            { value: "collected", label: "Collected" },
            { value: "pending", label: "Pending" },
            { value: "refund_due", label: "Refund due" },
          ]}
        />
      </div>
      {mark.error instanceof ApiError && (
        <p role="alert" className="text-sm text-brick-600">
          {mark.error.message}
        </p>
      )}
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Problem error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Table
            head={["Order", "Customer", "Items", "Total", "Status", ""]}
            empty={q.data.data.length === 0 ? "No orders match." : undefined}
          >
            {q.data.data.map((o) => (
              <tr key={o.code} className="border-t border-ink-50 align-top">
                <td className="px-5 py-3.5">
                  <span className="flex flex-col">
                    <span className="font-bold text-ink-900">{o.code}</span>
                    <span className="text-xs text-ink-500">{venueStamp(o.created_at)}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex flex-col">
                    <span>{o.customer_name}</span>
                    <span className="text-xs text-ink-500">{o.customer_email}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm">
                  {o.items.map((i, n) => (
                    <div key={n}>
                      {i.name}
                      {i.variant_label ? ` · ${i.variant_label}` : ""} ×{i.qty}
                    </div>
                  ))}
                </td>
                <td className="px-5 py-3.5 font-bold">{naira(o.total_kobo)}</td>
                <td className="px-5 py-3.5">
                  <Tag tone={TONE[o.status] ?? "neutral"}>{o.status.replace("_", " ")}</Tag>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {o.status === "paid" && (
                    <Button size="sm" disabled={mark.isPending} onClick={() => mark.mutate({ code: o.code, to: "collected" })}>
                      Mark collected
                    </Button>
                  )}
                  {o.status === "refund_due" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mark.isPending}
                      onClick={() => mark.mutate({ code: o.code, to: "refunded" })}
                    >
                      Mark refunded
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={q.data.meta.page} last={q.data.meta.last_page} total={q.data.meta.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
