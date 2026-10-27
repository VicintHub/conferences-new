import { ApiError, apiFetch } from "@/lib/api";
import type { PendingScan, Roster, ScanResult } from "./types";

const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: "/api/admin-backend", ...init });

export const sendScans = (items: PendingScan[]) =>
  call<{ data: ScanResult[] }>("scans/batch", { method: "POST", body: JSON.stringify({ items }) });
export const fetchRoster = () => call<{ data: Roster }>("scans/roster");
export const fetchMe = () => call<{ data: { role: string; areas: string[]; name: string } }>("me");

/** Network trouble (not a refusal from the server): the phone should fall back to its own list and queue the scan. */
export const isOffline = (e: unknown) =>
  e instanceof ApiError && (e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504);
