"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { LiveData } from "./types";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });

const POLL_MS = 30_000;

/** The stream and its watcher count, refreshed every 30 seconds while the tab is open. */
export function useLive() {
  return useQuery({ queryKey: ["live"], queryFn: async () => (await call<{ data: LiveData }>("live")).data, refetchInterval: POLL_MS });
}

/** Tells the server this person is watching, now and every 30s, but only while the player plays and the tab is visible. */
export function useHeartbeat(active: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!active) return;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      call<{ data: { viewers: number } }>("live/heartbeat", { method: "POST" })
        .then((r) => qc.setQueryData<LiveData>(["live"], (cur) => (cur ? { ...cur, viewers: r.data.viewers } : cur)))
        .catch(() => {});
    };
    beat();
    const id = setInterval(beat, POLL_MS);
    return () => clearInterval(id);
  }, [active, qc]);
}

export function useRemind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, on }: { sessionId: number; on: boolean }) =>
      call(`sessions/${sessionId}/remind`, { method: on ? "POST" : "DELETE" }),
    onSuccess: (_r, { sessionId, on }) =>
      qc.setQueryData<LiveData>(["live"], (cur) =>
        cur
          ? { ...cur, reminders: on ? [...new Set([...cur.reminders, sessionId])] : cur.reminders.filter((id) => id !== sessionId) }
          : cur,
      ),
  });
}
