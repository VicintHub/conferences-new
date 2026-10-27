import { apiFetch } from "@/lib/api";
import type { Feed } from "./types";

const BASE = "/api/backend";

export const fetchFeed = ({ tag, cursor }: { tag?: string; cursor?: string | null }) => {
  const q = new URLSearchParams();
  if (tag) q.set("tag", tag);
  if (cursor) q.set("cursor", cursor);
  return apiFetch<Feed>(`/testimonies${q.size ? `?${q}` : ""}`, { base: BASE });
};

export const submitTestimony = (form: FormData) =>
  apiFetch<{ data: { id: number; status: string } }>("/testimonies", { method: "POST", body: form, base: BASE });

export const setAmen = (id: number, on: boolean) =>
  apiFetch<{ data: { amen_count: number; amened: boolean } }>(`/testimonies/${id}/amen`, { method: on ? "PUT" : "DELETE", base: BASE });
