"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { naira } from "@/lib/money";
import { hotelDirectionsUrl, whatsappUrl } from "./links";
import { HotelImage, kmLabel, Pill } from "./parts";
import type { Hotel } from "./types";

/** Hotel detail (design 11d): book direct with the conference code. Used as a page on phones and a drawer on desktop. */
export function HotelDetail({ hotel, backHref }: { hotel: Hotel; backHref?: string }) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hotel.rate_code ?? "");
      setCopied("yes");
    } catch {
      setCopied("no");
    }
  };

  return (
    <article className="flex min-h-full flex-col bg-white">
      <div className="relative h-[340px] flex-none bg-ink-50 lg:h-[300px]">
        <HotelImage hotel={hotel} className="rounded-none" />
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back to hotels"
            className="absolute left-5 top-[56px] flex size-11 items-center justify-center rounded-full bg-white shadow-md lg:hidden"
          >
            <ArrowLeft size={22} />
          </Link>
        )}
      </div>
      <div className="relative -mt-7 flex flex-1 flex-col gap-4 rounded-t-[28px] bg-white px-5 pb-32 pt-6">
        {hotel.conference_rate && (
          <span className="self-start">
            <Pill tone="soft">Conference rate</Pill>
          </span>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold leading-tight text-ink-900">{hotel.name}</h1>
            <p className="text-[15px] text-ink-500">
              {kmLabel(hotel)} from the venue{hotel.drive_minutes !== null ? ` · ${hotel.drive_minutes} min drive` : ""}
            </p>
          </div>
          <div className="flex flex-none flex-col items-end">
            {hotel.price_kobo === null ? (
              <span className="text-base font-bold text-ink-500">Ask for rate</span>
            ) : (
              <>
                <span className="text-2xl font-bold text-cobalt-700">{naira(hotel.price_kobo)}</span>
                <span className="text-[13px] text-ink-500">per night</span>
              </>
            )}
          </div>
        </div>

        <ul aria-label="Amenities" className={hotel.amenities.length ? "flex flex-wrap gap-2.5" : "hidden"}>
          {hotel.amenities.map((a) => (
            <li key={a} className="rounded-full bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-800">
              {a}
            </li>
          ))}
        </ul>

        {hotel.rate_code && (
          <div className="flex items-center justify-between rounded-[18px] border-[1.5px] border-dashed border-cobalt-300 px-5 py-4">
            <div className="flex flex-col">
              <span className="text-sm text-ink-500">Quote this code</span>
              <span className="font-display text-xl font-bold tracking-[0.04em] text-cobalt-900">{hotel.rate_code}</span>
            </div>
            <button type="button" onClick={copy} className="text-sm font-bold text-cobalt-700">
              {copied === "yes" ? "Copied ✓" : "Copy"}
            </button>
          </div>
        )}
        {copied === "no" && (
          <p role="alert" className="text-sm text-brick-600">
            Couldn’t copy. Select the code and copy it by hand.
          </p>
        )}
        {hotel.shuttle_note && <p className="text-[15px] leading-[1.5] text-ink-500">{hotel.shuttle_note}</p>}
      </div>

      <div className="sticky bottom-0 mt-auto flex gap-3 border-t border-ink-100 bg-white px-5 pb-6 pt-4">
        {hotel.phone && (
          <div className="flex-1">
            <Button size="lg" variant="outline" fullWidth href={`tel:${hotel.phone}`}>
              Call
            </Button>
          </div>
        )}
        <div className="flex-1">
          <Button size="lg" variant={hotel.whatsapp ? "outline" : "primary"} fullWidth href={hotelDirectionsUrl(hotel)}>
            Directions
          </Button>
        </div>
        {hotel.whatsapp && (
          <div className="flex-[1.4]">
            <Button size="lg" fullWidth href={whatsappUrl(hotel.whatsapp, hotel.name, hotel.rate_code)}>
              Book on WhatsApp
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
