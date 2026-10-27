"use client";

import { Heart, Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/time";
import { Avatar } from "@/features/app/ui";
import { formatDuration, type Testimony } from "./types";

function TagPill({ tag, className }: { tag: string; className?: string }) {
  return <span className={cn("rounded-full bg-brick-100 font-bold text-brick-700", className)}>{tag}</span>;
}

function AmenButton({ t, onAmen }: { t: Testimony; onAmen?: (on: boolean) => void }) {
  const inner = (
    <>
      <Heart size={16} strokeWidth={2} className="text-brick-600" fill={t.amened ? "currentColor" : "none"} aria-hidden />
      {t.amen_count} Amen
    </>
  );
  return onAmen ? (
    <button
      type="button"
      aria-pressed={t.amened}
      aria-label={`${t.amened ? "Remove Amen" : "Say Amen"}, ${t.amen_count} so far`}
      onClick={() => onAmen(!t.amened)}
      className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-500"
    >
      {inner}
    </button>
  ) : (
    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-500">{inner}</span>
  );
}

/** Feed card used in the app (design 13a) and on phones. */
export function FeedCard({ t, onAmen }: { t: Testimony; onAmen?: (on: boolean) => void }) {
  return (
    <article className="flex flex-col gap-3 rounded-[20px] border border-ink-100 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <Avatar initials={initials(t.display_name)} size={38} />
        <div className="flex flex-1 flex-col gap-px">
          <span className="text-sm font-bold text-ink-900">{t.display_name}</span>
          {t.label && <span className="text-xs text-ink-400">{t.label}</span>}
        </div>
        {t.tag && <TagPill tag={t.tag} className="px-2.5 py-1 text-[11px]" />}
      </div>
      {t.body && <p className="text-sm leading-[1.55] text-ink-700">{t.body}</p>}
      {t.media_url && t.type !== "video" && (
        <audio controls src={t.media_url} className="w-full" aria-label={`Voice testimony from ${t.display_name}`} />
      )}
      {t.media_url && t.type === "video" && (
        <video
          controls
          playsInline
          src={t.media_url}
          poster={t.poster_url ?? undefined}
          className="w-full rounded-2xl"
          aria-label={`Video testimony from ${t.display_name}`}
        />
      )}
      <AmenButton t={t} onAmen={onAmen} />
    </article>
  );
}

/** Larger card for the desktop wall (design 14a). */
export function WallCard({ t }: { t: Testimony }) {
  return (
    <article className="mb-5 flex break-inside-avoid flex-col gap-3.5 rounded-[20px] border border-ink-100 bg-white p-6">
      {t.tag && <TagPill tag={t.tag} className="self-start px-2.5 py-1 text-xs" />}
      {t.body && <p className="text-pretty text-base leading-[1.6] text-ink-700">{t.body}</p>}
      {t.media_url && t.type !== "video" && (
        <audio controls src={t.media_url} className="w-full" aria-label={`Voice testimony from ${t.display_name}`} />
      )}
      {t.media_url && t.type === "video" && (
        <video
          controls
          playsInline
          src={t.media_url}
          poster={t.poster_url ?? undefined}
          className="w-full rounded-2xl"
          aria-label={`Video testimony from ${t.display_name}`}
        />
      )}
      <div className="flex items-center gap-3">
        <Avatar initials={initials(t.display_name)} size={38} />
        <div className="flex flex-1 flex-col gap-px">
          <span className="text-sm font-bold text-ink-900">{t.display_name}</span>
          {t.label && <span className="text-[13px] text-ink-400">{t.label}</span>}
        </div>
        <span className="text-[13px] font-semibold text-ink-400">{t.amen_count} Amen</span>
      </div>
    </article>
  );
}

/** The featured video that opens the feed. Plays inline when a file exists, otherwise shows the poster. */
export function FeaturedCard({ t, className }: { t: Testimony; className?: string }) {
  const meta = [t.display_name, t.label, formatDuration(t.duration_seconds)].filter(Boolean).join(" · ");
  return (
    <figure className={cn("relative overflow-hidden rounded-[22px] bg-cobalt-900", className)}>
      {t.media_url ? (
        <video
          controls
          playsInline
          src={t.media_url}
          poster={t.poster_url ?? undefined}
          className="size-full object-cover"
          aria-label={`Video testimony from ${t.display_name}`}
        />
      ) : (
        <>
          {t.poster_url && <Image src={t.poster_url} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,20,40,.92))]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[40%] flex size-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95"
          >
            <Play size={20} fill="var(--color-cobalt-900)" className="text-cobalt-900" />
          </span>
          <figcaption className="pointer-events-none absolute inset-x-4 bottom-3.5 flex flex-col gap-1 text-white">
            <span className="text-[17px] font-bold leading-[1.25]">{t.body}</span>
            <span className="text-xs font-medium text-cobalt-200">{meta}</span>
          </figcaption>
        </>
      )}
    </figure>
  );
}
