"use client";

import { Button } from "@/components/ui";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { useTravel } from "./api";
import { HotelDetail } from "./HotelDetail";

/** /app/hotels/[slug]. Reads the same saved copy as the list, so it opens offline too. */
export function HotelPage({ slug }: { slug: string }) {
  const { travel, isError, refetch } = useTravel();

  if (isError && !travel)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => refetch()} />
      </div>
    );
  if (!travel) return <SkeletonBlock className="m-5 mt-[60px] h-96" />;

  const hotel = travel.hotels.find((h) => h.slug === slug);
  if (!hotel)
    return (
      <div className="flex flex-col items-center gap-4 px-8 pt-[120px] text-center">
        <h1 className="text-xl font-bold text-ink-900">We can’t find that hotel</h1>
        <Button href="/app/hotels" variant="outline">
          Back to hotels
        </Button>
      </div>
    );
  return (
    <div className="lg:mx-auto lg:w-full lg:max-w-[640px]">
      <HotelDetail hotel={hotel} backHref="/app/hotels" />
    </div>
  );
}
