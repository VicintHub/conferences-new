import { apiFetch } from "@/lib/api";
import type { PublicityItem, PublicityList } from "./types";

const BASE = "/api/backend";

export const fetchPublicity = (type?: string) =>
  apiFetch<PublicityList>(`/publicity${type ? `?type=${encodeURIComponent(type)}` : ""}`, { base: BASE });
export const fetchPublicityItem = (slug: string) => apiFetch<{ data: PublicityItem }>(`/publicity/${slug}`, { base: BASE });

/** Fire-and-forget counter for the admin dashboard; never blocks or fails the user's action. */
export const track = (slug: string, event: "download" | "share") => {
  void fetch(`${BASE}/publicity/${slug}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
};
