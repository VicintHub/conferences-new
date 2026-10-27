"use client";

import { QueryClient, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { withOfflineFallback } from "@/lib/offline";
import type { Travel } from "./types";

const load = () => withOfflineFallback("travel", async () => (await apiFetch<{ data: Travel }>("/travel", { base: "/api/backend" })).data);

/** Hotels and shuttles change rarely and matter most when data is poor, so a copy is kept on the phone. */
export function useTravel() {
  const q = useQuery({ queryKey: ["travel"], queryFn: load, staleTime: 5 * 60_000 });
  return { travel: q.data?.data, stale: q.data?.stale ?? false, ...q };
}

/** Called once signed in and online so the copy exists before it is needed. */
export const prefetchTravel = (qc: QueryClient) => qc.prefetchQuery({ queryKey: ["travel"], queryFn: load, staleTime: 5 * 60_000 });
