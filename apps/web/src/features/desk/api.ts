"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DeskCard } from "./types";

const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: "/api/admin-backend", ...init });

export const lookup = (q: string) => call<{ data: DeskCard[] }>(`desk/lookup?q=${encodeURIComponent(q)}`);

export function useDeskSummary() {
  return useQuery({
    queryKey: ["desk", "summary"],
    queryFn: () => call<{ data: { printed_today: number; printed_total: number } }>("desk/summary"),
    refetchInterval: 60_000,
    retry: false,
  });
}

export function usePrintBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { registration_id: number; desk: string; reprint?: boolean; reason?: string }) =>
      call<{ data: DeskCard }>("desk/print", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["desk", "summary"] }),
  });
}
