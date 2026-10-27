"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { categoryLabel } from "@/features/app/types";
import { formatPhone } from "@/lib/phone";
import { admin, qs } from "./api";
import type { Paged, Registrant } from "./types";
import { Initials, Loading, PageHeader, Pager, Pills, Problem, SearchField, Table, Tag } from "./ui";

type Cat = "all" | "delegate" | "minister" | "international";
type Mode = "all" | "onsite" | "online";

/** A debounced copy of a value, so searching doesn't call the API on every keystroke. */
export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function Registrants() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Cat>("all");
  const [mode, setMode] = useState<Mode>("all");
  const [page, setPage] = useState(1);
  const term = useDebounced(search);
  const filters = { search: term, category, mode };
  const q = useQuery({
    queryKey: ["admin", "registrants", filters, page],
    queryFn: () => admin<Paged<Registrant>>(`registrants${qs({ ...filters, page })}`),
    placeholderData: (p) => p,
  });

  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Registrants"
        actions={
          <Button variant="outline" href={`/api/admin-backend/registrants/export${qs(filters)}`}>
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-4">
        <SearchField value={search} onChange={change(setSearch)} placeholder="Search name, email, church or code" />
        <Pills
          label="Category"
          value={category}
          onChange={change(setCategory)}
          options={[
            { value: "all", label: "All" },
            { value: "delegate", label: "Delegates" },
            { value: "minister", label: "Ministers" },
            { value: "international", label: "International" },
          ]}
        />
        <Pills
          label="Mode"
          value={mode}
          onChange={change(setMode)}
          options={[
            { value: "all", label: "Any mode" },
            { value: "onsite", label: "Onsite" },
            { value: "online", label: "Online" },
          ]}
        />
      </div>

      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Problem error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Table
            head={["Name", "Contact", "Category", "Mode", "Status", "Code"]}
            empty={q.data.data.length === 0 ? "No registrants match." : undefined}
          >
            {q.data.data.map((r) => (
              <tr key={r.id} className="border-t border-ink-50">
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-3">
                    <Initials name={r.name} size={36} />
                    <span className="flex flex-col">
                      <span className="font-bold text-ink-900">{r.name}</span>
                      <span className="text-xs text-ink-500">{r.church ?? "—"}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex flex-col">
                    <span>{r.email}</span>
                    <span className="text-xs text-ink-500">{r.phone ? formatPhone(r.phone) : "—"}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {categoryLabel[r.category as keyof typeof categoryLabel] ?? r.category}
                  {r.category === "minister" && (
                    <span className="ml-2">
                      {r.minister_verified ? <Tag tone="success">Verified</Tag> : <Tag tone="warning">Unverified</Tag>}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 capitalize">{r.mode}</td>
                <td className="px-5 py-3.5">
                  {r.status === "confirmed" ? <Tag tone="success">Confirmed</Tag> : <Tag tone="warning">Unconfirmed</Tag>}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold tracking-[0.04em] text-ink-600">{r.claim_code}</td>
              </tr>
            ))}
          </Table>
          <Pager page={q.data.meta.page} last={q.data.meta.last_page} total={q.data.meta.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
