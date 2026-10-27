"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ShareForm } from "./ShareForm";
import { SuccessCard } from "./SuccessCard";
import { FeaturedCard, FeedCard, WallCard } from "./TestimonyCard";
import type { Feed } from "./types";
import { useFeed } from "./useFeed";

/** Public testimonies: masonry wall + sticky share form on desktop (design 14a), feed + button on phones. */
export function PublicWall({ initial }: { initial: Feed | null }) {
  const [tag, setTag] = useState<string>();
  const [sent, setSent] = useState(false);
  const feed = useFeed(tag, initial ?? undefined);
  const filters = initial?.meta.filters ?? ["Healing", "Ministry", "IYLC", "Experience"];
  const pages = feed.data?.pages ?? [];
  const items = pages.flatMap((p) => p.data);
  const featured = pages[0]?.featured;

  const pills = (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter testimonies">
      {[undefined, ...filters].map((f) => (
        <button
          key={f ?? "all"}
          type="button"
          aria-pressed={tag === f}
          onClick={() => setTag(f)}
          className={cn(
            "rounded-full border-[1.5px] px-[18px] py-2.5 text-sm font-semibold",
            tag === f ? "border-cobalt-900 bg-cobalt-900 text-cream-50" : "border-ink-200 text-ink-600",
          )}
        >
          {f ?? "All"}
        </button>
      ))}
    </div>
  );

  const empty = !feed.isPending && items.length === 0 && !featured;

  return (
    <>
      {/* phones */}
      <div className="flex flex-col gap-3.5 px-5 pb-10 pt-4 md:hidden">
        <div className="-mr-5 flex gap-2 overflow-x-auto pr-5">
          {[undefined, ...filters].map((f) => (
            <div key={f ?? "all"} className="flex-none">
              <Chip selected={tag === f} onClick={() => setTag(f)}>
                {f ?? "All"}
              </Chip>
            </div>
          ))}
        </div>
        {featured && !tag && <FeaturedCard t={featured} className="h-[220px] flex-none" />}
        {items.map((t) => (
          <FeedCard key={t.id} t={t} />
        ))}
        {empty && <p className="py-10 text-center text-[15px] text-ink-400">No testimonies here yet.</p>}
        {feed.hasNextPage && (
          <button
            type="button"
            onClick={() => feed.fetchNextPage()}
            className="rounded-full border-[1.5px] border-ink-200 py-3 font-bold text-cobalt-800"
          >
            Load more
          </button>
        )}
        <Link
          href="/testimonies/share"
          className="mt-2 flex items-center justify-center rounded-full bg-cobalt-600 px-8 py-4 text-lg font-bold text-white"
        >
          Share your testimony
        </Link>
      </div>

      {/* desktop */}
      <div className="hidden items-start gap-10 px-14 pb-24 pt-16 md:grid md:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">WHAT GOD DID AT IMLC</span>
            <h1 className="font-display text-[88px] font-bold uppercase leading-[0.9] text-cobalt-900">Testimonies</h1>
          </div>
          {pills}
          {empty ? (
            <p className="py-10 text-[15px] text-ink-400">No testimonies here yet.</p>
          ) : (
            <div className="columns-2 gap-5">
              {items.map((t) => (
                <WallCard key={t.id} t={t} />
              ))}
            </div>
          )}
          {feed.hasNextPage && (
            <button
              type="button"
              onClick={() => feed.fetchNextPage()}
              className="self-start rounded-full border-[1.5px] border-ink-200 px-6 py-3 font-bold text-cobalt-800"
            >
              Load more
            </button>
          )}
        </div>
        <aside className="sticky top-6 flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-7 shadow-md">
          <h2 className="font-display text-2xl font-bold uppercase leading-[1.1] text-cobalt-900">Share your testimony</h2>
          {sent ? (
            <SuccessCard actionLabel="Share another" onAction={() => setSent(false)} />
          ) : (
            <ShareForm variant="panel" signedIn={false} onDone={() => setSent(true)} />
          )}
        </aside>
      </div>
    </>
  );
}
