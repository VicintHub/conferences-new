"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ImportResult, NewMember, Team, TeamMember, TeamResponse } from "./types";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });
const post = (body?: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body ?? {}) });

export type Kind = "church" | "minister";

export function useTeam(kind: Kind) {
  return useQuery({ queryKey: ["team", kind], queryFn: () => call<TeamResponse>(`me/teams/${kind}`) });
}

/** Mutations on a team refresh it; the server stays the source of truth for counts and statuses. */
function useTeamMutation<V, R = unknown>(kind: Kind, fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["team", kind] }) });
}

export const useCreateTeam = (kind: Kind) =>
  useTeamMutation(kind, (name: string) => call<{ data: Team }>(`me/teams/${kind}`, post({ name })));
export const useRenameTeam = (kind: Kind) =>
  useTeamMutation(kind, (name: string) => call<{ data: Team }>(`me/teams/${kind}`, { method: "PATCH", body: JSON.stringify({ name }) }));
export const useAddMember = (kind: Kind) =>
  useTeamMutation(kind, (m: NewMember) => call<{ data: TeamMember }>(`me/teams/${kind}/members`, post(m)));
export const useImportMembers = () =>
  useTeamMutation("church", (members: NewMember[]) => call<{ data: ImportResult }>("me/teams/church/members/import", post({ members })));
export const useRemoveMember = (kind: Kind) =>
  useTeamMutation(kind, (id: number) => call(`me/teams/${kind}/members/${id}`, { method: "DELETE" }));
export const useResendInvite = (kind: Kind) =>
  useMutation({ mutationFn: (id: number) => call(`me/teams/${kind}/members/${id}/resend`, post()) });
export const useLeaveTeam = () => useTeamMutation("church", () => call("me/teams/church/membership", { method: "DELETE" }));

export const previewTeam = (code: string) =>
  call<{ data: { name: string; code: string; leader: string; members: number } }>(`teams/${code}`);
export const useJoinTeam = () => useTeamMutation("church", (code: string) => call<{ data: Team }>(`teams/${code}/join`, post()));
