"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { clearOfflineData, saveSnapshot, withOfflineFallback } from "@/lib/offline";
import type { Me, ProgrammeDay } from "./types";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });

export function useMe() {
  const router = useRouter();
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => withOfflineFallback("me", async () => (await call<{ data: Me }>("me")).data),
    retry: (count, e) => !(e instanceof ApiError && e.status === 401) && count < 1,
  });
  useEffect(() => {
    if (q.error instanceof ApiError && q.error.status === 401) {
      void clearOfflineData();
      router.replace("/login");
    }
  }, [q.error, router]);
  return { me: q.data?.data, stale: q.data?.stale ?? false, ...q };
}

export function useProgramme() {
  const q = useQuery({
    queryKey: ["programme"],
    queryFn: () => withOfflineFallback("programme", async () => (await call<{ data: ProgrammeDay[] }>("programme")).data),
  });
  return { days: q.data?.data ?? [], stale: q.data?.stale ?? false, ...q };
}

export function useChangeMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: Me["mode"]) => call<{ data: Me }>("me/registration", { method: "PATCH", body: JSON.stringify({ mode }) }),
    onSuccess: async (r) => {
      qc.setQueryData(["me"], { data: r.data, stale: false });
      await saveSnapshot("me", r.data);
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await call("auth/logout", { method: "POST" }).catch(() => {});
    await clearOfflineData();
    qc.clear();
    router.replace("/login");
  };
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}
