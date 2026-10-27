"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { AdminMe } from "./types";

const BASE = "/api/admin-backend";

/** Calls the admin API through the console's own proxy (its cookie, its allow-list). */
export const admin = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });
export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Query string from only the filters that have a value. */
export function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && v !== "all") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Signed-in staff member and the sidebar counts. A rejected token sends them back to sign in. */
export function useAdminMe() {
  const router = useRouter();
  const q = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => admin<AdminMe>("me"),
    retry: (n, e) => !(e instanceof ApiError && e.status === 401) && n < 1,
    refetchInterval: 60_000,
  });
  useEffect(() => {
    if (q.error instanceof ApiError && q.error.status === 401) router.replace("/admin/login");
  }, [q.error, router]);
  return q;
}

export const requestStaffCode = (email: string) => admin<{ resend_after: number }>("auth/otp", json("POST", { email }));

// These two go through Next route handlers that keep the token in an httpOnly cookie.
export const verifyStaffCode = (email: string, code: string) =>
  apiFetch<{ data: unknown }>("/api/admin/verify", { base: "", ...json("POST", { email, code }) });
export const verifyStaffLink = (email: string, token: string) =>
  apiFetch<{ data: unknown }>("/api/admin/verify-link", { base: "", ...json("POST", { email, token }) });
