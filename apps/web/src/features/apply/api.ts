"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Application, ApplicationList, RoleKey } from "./types";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });

export const useApplications = () => useQuery({ queryKey: ["applications"], queryFn: () => call<ApplicationList>("me/applications") });

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, values, files }: { role: RoleKey; values: Record<string, string | number>; files: File[] }) => {
      const form = new FormData();
      form.set("role", role);
      for (const [k, v] of Object.entries(values)) if (String(v) !== "") form.set(k, String(v));
      files.forEach((f) => form.append("documents[]", f));
      return call<{ data: Application }>("me/applications", { method: "POST", body: form });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useUploadDocuments(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append("documents[]", f));
      return call<{ data: Application }>(`me/applications/${id}/documents`, { method: "POST", body: form });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}
