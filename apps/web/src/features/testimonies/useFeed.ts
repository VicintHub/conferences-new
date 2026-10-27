"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { fetchFeed, setAmen } from "./api";
import type { Feed, Testimony } from "./types";

export function useFeed(tag: string | undefined, initial?: Feed) {
  return useInfiniteQuery({
    queryKey: ["testimonies", tag ?? "all"],
    queryFn: ({ pageParam }) => fetchFeed({ tag, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta.next_cursor,
    initialData: initial && !tag ? { pages: [initial], pageParams: [null] } : undefined,
  });
}

/** Optimistic Amen: the count and heart update instantly and roll back if the request fails. */
export function useAmen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, on }: { id: number; on: boolean }) => setAmen(id, on),
    onMutate: async ({ id, on }) => {
      await qc.cancelQueries({ queryKey: ["testimonies"] });
      const snapshot = qc.getQueriesData<InfiniteData<Feed>>({ queryKey: ["testimonies"] });
      const patch = (t: Testimony): Testimony =>
        t.id === id && t.amened !== on ? { ...t, amened: on, amen_count: t.amen_count + (on ? 1 : -1) } : t;
      qc.setQueriesData<InfiniteData<Feed>>(
        { queryKey: ["testimonies"] },
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((p) => ({ ...p, data: p.data.map(patch), featured: p.featured ? patch(p.featured) : null })),
          },
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
  });
}
