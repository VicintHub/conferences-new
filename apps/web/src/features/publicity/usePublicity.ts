"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublicity, fetchPublicityItem } from "./api";
import type { PublicityList } from "./types";

export const usePublicity = (type: string | undefined, initial?: PublicityList | null) =>
  useQuery({
    queryKey: ["publicity", type ?? "all"],
    queryFn: () => fetchPublicity(type),
    initialData: !type && initial ? initial : undefined,
  });

export const usePublicityItem = (slug: string) =>
  useQuery({ queryKey: ["publicity", "item", slug], queryFn: async () => (await fetchPublicityItem(slug)).data });
