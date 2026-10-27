"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip, Sheet } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SpeakerPhoto } from "./SpeakerPhoto";
import { groupTag, type Speaker } from "./types";

type Filter = "all" | "host" | "imlc_2026";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "host", label: "Hosts" },
  { value: "imlc_2026", label: "IMLC 2026" },
];

function DesktopCard({ s, onOpen, shadow }: { s: Speaker; onOpen: () => void; shadow?: boolean }) {
  return (
    <li className={cn("flex flex-col gap-3.5 rounded-[20px] border border-ink-100 bg-white p-3", shadow && "shadow-sm")}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px]">
        <SpeakerPhoto name={s.name} src={s.photo} sizes="(min-width: 1280px) 280px, 25vw" />
      </div>
      <div className="flex min-h-16 flex-col gap-1 px-1.5">
        <span className="font-display text-xl font-bold uppercase leading-[1.1] text-cobalt-900">{s.name}</span>
        <span className="text-sm leading-[1.4] text-ink-500">{s.role}</span>
      </div>
      <Link
        href={`/speakers/${s.slug}`}
        onClick={(e) => {
          e.preventDefault();
          onOpen();
        }}
        className="mx-1.5 mb-1.5 mt-0.5 flex items-center justify-between rounded-full bg-cobalt-50 px-4 py-3 text-sm font-bold text-cobalt-800 hover:bg-cobalt-100"
      >
        Learn more <ArrowRight size={16} aria-hidden />
      </Link>
    </li>
  );
}

function ProfileDrawer({ speaker, onClose }: { speaker: Speaker | undefined; onClose: () => void }) {
  return (
    <Sheet open={!!speaker} onOpenChange={(o) => !o && onClose()} side="right" title={speaker?.name ?? "Speaker profile"}>
      {speaker && (
        <div className="flex flex-col gap-[22px] px-12 pb-14 pt-20">
          <div className="flex items-end gap-6">
            <div className="relative h-60 w-[200px] flex-none overflow-hidden rounded-2xl">
              <SpeakerPhoto name={speaker.name} src={speaker.photo} sizes="200px" />
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-brick-600">{groupTag[speaker.group]}</span>
              <h2 className="font-display text-[40px] font-bold uppercase leading-[0.95] text-cobalt-900">{speaker.name}</h2>
              <span className="text-[15px] leading-[1.4] text-ink-500">{speaker.role}</span>
            </div>
          </div>
          <span aria-hidden className="h-[3px] w-12 bg-brick-600" />
          {speaker.bio.map((p, i) => (
            <p key={i} className="text-pretty text-base leading-[1.7] text-ink-600">
              {p}
            </p>
          ))}
          <div className="mt-2 flex flex-col gap-2.5 rounded-2xl bg-cream-50 p-5">
            <span className="font-display text-lg font-bold uppercase text-cobalt-900">Ministering at</span>
            <span className="text-[15px] text-ink-600">Sessions will be published with the programme.</span>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function SpeakersView({ speakers, initialSlug }: { speakers: Speaker[]; initialSlug?: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | undefined>(initialSlug);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  // The drawer is portalled out of the desktop-only wrapper, so gate it explicitly: phones use the profile page.
  const isMd = useMediaQuery("(min-width: 768px)");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return speakers.filter(
      (s) => (filter === "all" || s.group === filter) && (!q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)),
    );
  }, [speakers, filter, query]);
  const hosts = visible.filter((s) => s.group === "host");
  const past = visible.filter((s) => s.group === "imlc_2026");
  const open = (slug: string) => {
    setSelected(slug);
    window.history.replaceState(null, "", `/speakers/${slug}`);
  };
  const close = () => {
    setSelected(undefined);
    window.history.replaceState(null, "", "/speakers");
  };

  return (
    <>
      {/* ───── phone (design 6b) ───── */}
      <div className="flex flex-col gap-4 px-5 pb-10 pt-4 md:hidden">
        <div className="flex items-center justify-between">
          {searching ? (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search speakers"
              aria-label="Search speakers"
              className="mr-3 min-w-0 flex-1 rounded-full bg-ink-50 px-4 py-2.5 text-[15px] outline-none"
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label={searching ? "Close search" : "Search speakers"}
            onClick={() => {
              setSearching((v) => !v);
              setQuery("");
            }}
            className="p-1 text-ink-900"
          >
            {searching ? <X size={22} /> : <Search size={22} />}
          </button>
        </div>
        <div className="-mr-5 flex gap-2 overflow-x-auto pr-5">
          {filters.map((f) => (
            <div key={f.value} className="flex-none">
              <Chip selected={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </Chip>
            </div>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-ink-400">No speakers match.</p>
        ) : (
          <ul className="grid grid-cols-2 content-start gap-3.5">
            {visible.map((s) => (
              <li key={s.slug}>
                <Link href={`/speakers/${s.slug}`} className="flex flex-col gap-2">
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <SpeakerPhoto name={s.name} src={s.photo_mobile ?? s.photo} sizes="45vw" />
                  </div>
                  <span className="text-[15px] font-bold leading-[1.2] text-ink-900">{s.name}</span>
                  <span className="text-xs leading-[1.3] text-ink-400">{s.short_role}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ───── desktop (design 6a) ───── */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between gap-10 px-14 pb-10 pt-[72px]">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">37TH IMLC &amp; IYLC</span>
            <h1 className="font-display text-[96px] font-bold uppercase leading-[0.9] text-cobalt-900">Speakers</h1>
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter speakers">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border-[1.5px] px-5 py-[11px] text-[15px] font-semibold",
                  filter === f.value ? "border-cobalt-900 bg-cobalt-900 text-cream-50" : "border-ink-200 text-ink-600",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {hosts.length > 0 && (
          <section className="flex flex-col gap-5 px-14 pb-8">
            <h2 className="font-display text-[22px] font-bold uppercase text-cobalt-900">Hosts</h2>
            <ul className="grid grid-cols-4 gap-5">
              {hosts.map((s) => (
                <DesktopCard key={s.slug} s={s} shadow onOpen={() => open(s.slug)} />
              ))}
              {filter !== "imlc_2026" && !query && (
                <li className="col-span-2 flex flex-col justify-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-ink-200 p-10">
                  <span className="font-display text-[32px] font-bold uppercase leading-none text-ink-300">
                    More speakers
                    <br />
                    to be announced
                  </span>
                  <span className="text-[15px] text-ink-400">Turn on notifications in the app to hear first.</span>
                </li>
              )}
            </ul>
          </section>
        )}
        {past.length > 0 && (
          <section className="flex flex-col gap-5 px-14 pb-24 pt-8">
            <h2 className="font-display text-[22px] font-bold uppercase text-cobalt-900">Ministered at IMLC 2026</h2>
            <ul className="grid grid-cols-4 gap-5">
              {past.map((s) => (
                <DesktopCard key={s.slug} s={s} onOpen={() => open(s.slug)} />
              ))}
            </ul>
          </section>
        )}
        {visible.length === 0 && <p className="px-14 pb-24 text-center text-[15px] text-ink-400">No speakers match.</p>}
        <ProfileDrawer speaker={isMd ? speakers.find((s) => s.slug === selected) : undefined} onClose={close} />
      </div>
    </>
  );
}
