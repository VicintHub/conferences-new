"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Segmented } from "@/components/ui";
import { AppSubHeader } from "@/features/app/AppSubHeader";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { SurveyFlow } from "@/features/feedback/SurveyFlow";
import { FeaturedCard, FeedCard } from "./TestimonyCard";
import { useAmen, useFeed } from "./useFeed";

type Tab = "testimonies" | "feedback";

function Feed() {
  const feed = useFeed(undefined);
  const amen = useAmen();

  if (feed.isPending) {
    return (
      <div className="flex flex-col gap-3.5" aria-busy="true">
        <SkeletonBlock className="h-[220px]" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>
    );
  }
  if (feed.isError) return <ErrorNote onRetry={() => feed.refetch()} />;

  const featured = feed.data.pages[0]?.featured;
  const items = feed.data.pages.flatMap((p) => p.data);
  if (!featured && items.length === 0) {
    return <p className="py-12 text-center text-[15px] text-ink-400">No testimonies yet. Be the first to share what God did.</p>;
  }
  return (
    <div className="flex flex-col gap-3.5">
      {featured && <FeaturedCard t={featured} className="h-[220px] flex-none" />}
      {items.map((t) => (
        <FeedCard key={t.id} t={t} onAmen={(on) => amen.mutate({ id: t.id, on })} />
      ))}
      {feed.hasNextPage && (
        <Button variant="outline" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
          {feed.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

/** In-app Testimonies / Feedback (designs 13a and 13d). */
export function AppTestimonies() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("tab") === "feedback" ? "feedback" : "testimonies");

  return (
    <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[560px]">
      <AppSubHeader title="Testimonies" />
      <div className="px-5 pb-1">
        <Segmented
          tone="solid"
          label="Testimonies or feedback"
          value={tab}
          onChange={setTab}
          options={[
            { value: "testimonies", label: "Testimonies" },
            { value: "feedback", label: "Feedback" },
          ]}
        />
      </div>
      <div className="flex-1 overflow-auto px-5 pb-5 pt-4">{tab === "testimonies" ? <Feed /> : <SurveyFlow />}</div>
      {tab === "testimonies" && (
        <div className="px-5 pb-3 pt-2.5">
          <Link
            href="/app/testimonies/share"
            className="flex w-full items-center justify-center rounded-full bg-cobalt-600 px-8 py-4 text-lg font-bold text-white hover:brightness-110"
          >
            Share your testimony
          </Link>
        </div>
      )}
    </div>
  );
}
