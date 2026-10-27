"use client";

import { ArrowLeft, Bus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Segmented, Sheet } from "@/components/ui";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { cn } from "@/lib/cn";
import { naira } from "@/lib/money";
import { shareLink } from "@/lib/share";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useTravel } from "./api";
import { HotelDetail } from "./HotelDetail";
import { directionsUrl, mapEmbedUrl, venueLink } from "./links";
import { HotelImage, kmLabel, Pill } from "./parts";
import { budgets, hasRates, inBudget, type Budget, type Hotel, type Shuttle, type Venue } from "./types";

type Tab = "hotels" | "getting-there";

/** Hotels & travel: budget filters and cards (11c), getting there with shuttles (11e), and list-beside-map on desktop (12b). */
export function Travel() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { travel, isError, refetch } = useTravel();
  const [budget, setBudget] = useState<Budget>("all");
  const [tab, setTab] = useState<Tab>("hotels");
  const [open, setOpen] = useState<Hotel | null>(null);
  const [shuttlesOpen, setShuttlesOpen] = useState(false);

  // "Venue map" in More links here with #getting-there.
  useEffect(() => {
    if (window.location.hash === "#getting-there") setTab("getting-there");
  }, []);

  if (isError && !travel)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => refetch()} />
      </div>
    );
  if (!travel)
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
      </div>
    );

  const hotels = travel.hotels.filter((h) => inBudget(h, budget));
  // Until hotels have rates there is nothing to filter by, so the chips stay out of the way.
  const filters = hasRates(travel.hotels) ? <BudgetChips value={budget} onChange={setBudget} /> : null;
  const list = (cols: 1 | 2) => (
    <ul className={cn("grid gap-5", cols === 2 ? "grid-cols-2 gap-x-5" : "grid-cols-1")}>
      {hotels.map((h) => (
        <li key={h.slug}>
          <HotelCard hotel={h} desktop={cols === 2} onOpen={desktop ? () => setOpen(h) : undefined} />
        </li>
      ))}
      {hotels.length === 0 && (
        <li className="col-span-full py-10 text-center text-sm text-ink-400">No hotels in that range. Try another filter.</li>
      )}
    </ul>
  );

  if (desktop) {
    return (
      <div className="grid min-h-full grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-5 px-12 pb-12 pt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brick-600">We have made room for you</p>
            <h1 className="font-display text-[64px] font-bold uppercase leading-[0.95] text-cobalt-900">Hotels &amp; travel</h1>
          </div>
          {filters}
          {list(2)}
        </div>
        <div className="relative min-h-[600px] border-l border-dashed border-ink-300 bg-ink-100">
          <iframe title="Map of the venue" src={mapEmbedUrl(travel.venue)} loading="lazy" className="absolute inset-0 size-full border-0" />
          <div className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-4 rounded-[20px] bg-white px-6 py-5 shadow-lg">
            <div className="flex flex-col">
              <span className="font-bold text-ink-900">Conference shuttles</span>
              <span className="text-sm text-ink-500">Ojoo, Iwo Road &amp; partner hotels</span>
            </div>
            <button type="button" onClick={() => setShuttlesOpen(true)} className="text-sm font-bold text-cobalt-700">
              See times
            </button>
          </div>
        </div>
        <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)} side="right" title={open?.name ?? "Hotel"}>
          {open && <HotelDetail hotel={open} />}
        </Sheet>
        <Sheet open={shuttlesOpen} onOpenChange={setShuttlesOpen} side="right" title="Conference shuttles">
          <div className="flex flex-col gap-4 p-8">
            <h2 className="font-display text-[32px] font-bold uppercase text-cobalt-900">Conference shuttles</h2>
            <ShuttleList shuttles={travel.shuttles} />
          </div>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-[60px]">
        <div className="flex items-center gap-3">
          <Link href="/app/more" aria-label="Back" className="-ml-1 p-1 text-ink-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-ink-900">Hotels &amp; travel</h1>
        </div>
        <button type="button" onClick={() => setTab("getting-there")} className="text-sm font-bold text-cobalt-700">
          Map
        </button>
      </div>
      <div className="px-5">
        <Segmented
          tone="solid"
          label="Hotels or getting there"
          value={tab}
          onChange={setTab}
          options={[
            { value: "hotels", label: "Hotels" },
            { value: "getting-there", label: "Getting there" },
          ]}
        />
      </div>
      {tab === "hotels" ? (
        <>
          {filters && <div className="mt-4 overflow-x-auto px-5">{filters}</div>}
          <div className="px-5 pb-8 pt-4">{list(1)}</div>
        </>
      ) : (
        <GettingThere venue={travel.venue} shuttles={travel.shuttles} />
      )}
    </div>
  );
}

function BudgetChips({ value, onChange }: { value: Budget; onChange: (b: Budget) => void }) {
  return (
    <div role="group" aria-label="Budget" className="flex gap-2">
      {budgets.map((b) => (
        <button
          key={b.key}
          type="button"
          aria-pressed={value === b.key}
          onClick={() => onChange(b.key)}
          className={cn(
            "flex-none rounded-full border-[1.5px] px-4 py-2.5 text-sm font-bold leading-none focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
            value === b.key ? "border-cobalt-950 bg-cobalt-950 text-cream-50" : "border-ink-200 bg-white text-ink-600",
          )}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

function HotelCard({ hotel, desktop, onOpen }: { hotel: Hotel; desktop: boolean; onOpen?: () => void }) {
  const body = (
    <>
      <div className={cn("relative overflow-hidden", desktop ? "h-[170px] rounded-2xl" : "h-[170px] rounded-[20px]")}>
        <HotelImage hotel={hotel} className={desktop ? "rounded-2xl" : "rounded-[20px]"} />
        <span className="absolute left-3 top-3">
          <Pill>{kmLabel(hotel)}</Pill>
        </span>
        {hotel.conference_rate && (
          <span className="absolute right-3 top-3">
            <Pill tone="cobalt">Conference rate</Pill>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-bold text-ink-900">{hotel.name}</span>
          <span className="text-sm text-ink-500">{hotel.area}</span>
        </div>
        <div className="flex flex-none flex-col items-end">
          <span className={cn("font-bold", hotel.price_kobo === null ? "text-sm text-ink-500" : "text-[17px] text-cobalt-700")}>
            {hotel.price_kobo === null ? "Ask for rate" : naira(hotel.price_kobo)}
          </span>
          {!desktop && hotel.price_kobo !== null && <span className="text-xs text-ink-500">per night</span>}
        </div>
      </div>
    </>
  );
  const frame = desktop ? "rounded-[24px] border border-ink-100 bg-white p-2.5 pb-4 [&>div:last-child]:px-2" : "";
  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={cn("block w-full text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]", frame)}
    >
      {body}
    </button>
  ) : (
    <Link href={`/app/hotels/${hotel.slug}`} className={cn("block", frame)}>
      {body}
    </Link>
  );
}

function ShuttleList({ shuttles }: { shuttles: Shuttle[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {shuttles.map((s) => (
        <li key={s.id} className="flex items-center gap-4 rounded-[18px] border border-ink-100 bg-white px-4 py-4">
          <span className="flex size-12 flex-none items-center justify-center rounded-xl bg-cobalt-50 text-cobalt-700">
            <Bus size={24} aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-bold text-ink-900">{s.name}</span>
            <span className="text-[13px] text-ink-500">{s.schedule}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Getting there (design 11e): map, directions, and the conference shuttles. */
function GettingThere({ venue, shuttles }: { venue: Venue; shuttles: Shuttle[] }) {
  const [note, setNote] = useState<string | null>(null);
  const share = async () => {
    const r = await shareLink(venueLink(venue), venue.name);
    setNote(r === "copied" ? "Link copied" : r === "failed" ? "Couldn’t share the location" : null);
  };
  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-ink-100">
        <iframe title="Map of the venue" src={mapEmbedUrl(venue)} loading="lazy" className="absolute inset-0 size-full border-0" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-ink-900">{venue.name}</h2>
        <p className="text-[15px] text-ink-500">{venue.address}</p>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Button size="lg" fullWidth href={directionsUrl(venue)}>
            Directions
          </Button>
        </div>
        <div className="flex-1">
          <Button size="lg" variant="outline" fullWidth onClick={share}>
            Share location
          </Button>
        </div>
      </div>
      {note && (
        <p role="status" className="text-sm text-ink-500">
          {note}
        </p>
      )}
      <h2 className="mt-2 text-lg font-bold text-ink-900">Conference shuttles</h2>
      <ShuttleList shuttles={shuttles} />
    </div>
  );
}
