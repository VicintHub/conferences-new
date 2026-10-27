"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { admin, qs } from "./api";
import { useDebounced } from "./Registrants";
import type { Paged, TeamRow } from "./types";
import { Loading, PageHeader, Pager, Problem, SearchField, Table, Tag } from "./ui";

export function Teams() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search);
  const q = useQuery({
    queryKey: ["admin", "teams", term, page],
    queryFn: () => admin<Paged<TeamRow>>(`teams${qs({ search: term, page })}`),
    placeholderData: (p) => p,
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Teams" />
      <SearchField
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search team name or code"
      />
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Problem error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <Table head={["Team", "Code", "Leader", "Members", "Confirmed"]} empty={q.data.data.length === 0 ? "No teams yet." : undefined}>
            {q.data.data.map((t) => (
              <tr key={t.id} className="border-t border-ink-50">
                <td className="px-5 py-3.5 font-bold text-ink-900">
                  {t.name} {t.kind === "minister" && <Tag>Minister’s team</Tag>}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold tracking-[0.04em]">{t.code}</td>
                <td className="px-5 py-3.5">
                  <span className="flex flex-col">
                    <span>{t.leader}</span>
                    <span className="text-xs text-ink-500">{t.leader_email}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5">{t.members}</td>
                <td className="px-5 py-3.5">{t.confirmed}</td>
              </tr>
            ))}
          </Table>
          <Pager page={q.data.meta.page} last={q.data.meta.last_page} total={q.data.meta.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
