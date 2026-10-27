"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(`/${path}`, { base: BASE, ...init });

export type FeedbackState = { session_ids: number[]; survey_completed: boolean; prompt_delay_minutes: number; highlights: string[] };

export const useFeedbackState = (enabled = true) =>
  useQuery({
    queryKey: ["feedback", "mine"],
    queryFn: async () => (await call<{ data: FeedbackState }>("me/feedback")).data,
    enabled,
    retry: false,
  });

export function useSendSessionFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...body }: { sessionId: number; rating: number; highlights: string[]; comment: string }) =>
      call(`sessions/${sessionId}/feedback`, { method: "POST", body: JSON.stringify({ ...body, comment: body.comment || null }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback", "mine"] }),
  });
}

export type SurveyQuestion =
  | { id: string; type: "scale"; text: string; required: boolean; min: number; max: number; low: string; high: string }
  | { id: string; type: "ratings"; text: string; required: boolean; items: string[] }
  | { id: string; type: "multi"; text: string; required: boolean; options: string[] }
  | { id: string; type: "text"; text: string; required: boolean };

export type Survey = { title: string; questions: SurveyQuestion[]; completed: boolean };

export const useSurvey = () =>
  useQuery({ queryKey: ["survey"], queryFn: async () => (await call<{ data: Survey }>("survey")).data, retry: false });

export function useSubmitSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: Record<string, unknown>) => call("survey", { method: "POST", body: JSON.stringify({ answers }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["survey"] });
      qc.invalidateQueries({ queryKey: ["feedback", "mine"] });
    },
  });
}
