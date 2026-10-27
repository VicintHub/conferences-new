"use client";

import Link from "next/link";
import { useState } from "react";
import { Chip } from "@/components/ui";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { DesktopPanel } from "./DesktopPanel";
import { Preview, TypePill } from "./parts";
import type { PublicityItem, PublicityList } from "./types";
import { usePublicity } from "./usePublicity";

const typeKeys = ["flyer", "status", "video", "design", "logo"];

function Filters({
  types,
  value,
  onChange,
  desktop,
}: {
  types: Record<string, string>;
  value?: string;
  onChange: (t?: string) => void;
  desktop?: boolean;
}) {
  const opts: [string | undefined, string][] = [
    [undefined, "All"],
    ...typeKeys.filter((k) => types[k]).map((k): [string, string] => [k, types[k]]),
  ];
  return desktop ? (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
      {opts.map(([k, label]) => (
        <button
          key={k ?? "all"}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "rounded-full border-[1.5px] px-[18px] py-2.5 text-sm font-semibold",
            value === k ? "border-cobalt-900 bg-cobalt-900 text-cream-50" : "border-ink-200 text-ink-600",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  ) : (
    <div className="-mr-5 flex gap-2 overflow-x-auto pr-5">
      {opts.map(([k, label]) => (
        <div key={k ?? "all"} className="flex-none">
          <Chip selected={value === k} onClick={() => onChange(k)}>
            {label}
          </Chip>
        </div>
      ))}
    </div>
  );
}

function PhoneCard({ item, href }: { item: PublicityItem; href: string }) {
  return (
    <li>
      <Link href={href} className="flex flex-col gap-2">
        <div className="relative">
          <Preview item={item} sizes="45vw" className="rounded-[18px]" />
          <TypePill type={item.type} small />
          {item.new && (
            <span className="absolute right-2 top-2 rounded-full bg-brick-600 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>
          )}
        </div>
        <span className="text-sm font-bold leading-[1.25] text-ink-900">{item.title}</span>
        <span className="text-xs text-ink-400">{item.meta}</span>
      </Link>
    </li>
  );
}

function PhoneGrid({ items, hrefBase }: { items: PublicityItem[]; hrefBase: string }) {
  return (
    <ul className="grid grid-cols-2 content-start items-start gap-x-3 gap-y-4">
      {items.map((i) => (
        <PhoneCard key={i.slug} item={i} href={`${hrefBase}/${i.slug}`} />
      ))}
    </ul>
  );
}

/** Public library: grid + sticky selected-item panel on desktop (design 18a); 2-column grid linking to item pages on phones. */
export function PublicLibrary({ initial }: { initial: PublicityList | null }) {
  const [type, setType] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const q = usePublicity(type, initial);
  const isMd = useMediaQuery("(min-width: 768px)");
  const items = q.data?.data ?? [];
  const types = q.data?.meta.types ?? initial?.meta.types ?? {};
  const current = items.find((i) => i.slug === selected) ?? items[0];

  const body = q.isError ? (
    <ErrorNote onRetry={() => q.refetch()} />
  ) : q.isPending ? (
    <SkeletonBlock className="h-64" />
  ) : items.length === 0 ? (
    <p className="py-10 text-[15px] text-ink-400">Nothing here yet. Check back soon.</p>
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-4 px-5 pb-10 pt-4 md:hidden">
        <Filters types={types} value={type} onChange={setType} />
        {body ?? <PhoneGrid items={items} hrefBase="/publicity" />}
      </div>

      <div className="hidden items-start gap-9 px-14 pb-24 pt-14 md:grid md:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">HELP SPREAD THE WORD</span>
            <h1 className="font-display text-[80px] font-bold uppercase leading-[0.9] text-cobalt-900">Publicity kit</h1>
          </div>
          <Filters types={types} value={type} onChange={setType} desktop />
          {body ?? (
            <ul className="grid grid-cols-3 items-start gap-5">
              {items.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/publicity/${i.slug}`}
                    onClick={(e) => {
                      if (!isMd) return;
                      e.preventDefault();
                      setSelected(i.slug);
                    }}
                    aria-current={current?.slug === i.slug}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-[20px] bg-white p-2.5",
                      current?.slug === i.slug ? "border-2 border-cobalt-600" : "border border-ink-100",
                    )}
                  >
                    <div className="relative">
                      <Preview item={i} sizes="(min-width: 1280px) 260px, 25vw" className="rounded-[14px]" />
                      <TypePill type={i.type} />
                    </div>
                    <span className="flex flex-col gap-0.5 px-1.5 pb-1.5">
                      <span className="text-[15px] font-bold text-ink-900">{i.title}</span>
                      <span className="text-[13px] text-ink-400">{i.meta}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {current && <DesktopPanel key={current.slug} item={current} />}
      </div>
    </>
  );
}

/** In-app library (design 17a). */
export function AppLibrary() {
  const [type, setType] = useState<string>();
  const q = usePublicity(type);
  const items = q.data?.data ?? [];
  const newCount = q.data?.meta.new_count ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-3.5 px-5 pb-5 pt-[60px] lg:mx-auto lg:w-full lg:max-w-[640px] lg:pt-9">
      <div className="flex items-center gap-3">
        <Link href="/app/more" aria-label="Back" className="-ml-1 p-1 text-ink-900">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-ink-900">Publicity kit</h1>
      </div>
      <div className="flex items-center gap-3.5 rounded-[22px] bg-cobalt-900 p-4 text-cream-50">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[17px] font-bold leading-[1.2]">Help spread the word</span>
          <span className="text-[13px] leading-[1.4] text-cobalt-200">Official flyers, videos and captions, ready to post.</span>
        </div>
        {newCount > 0 && <span className="rounded-full bg-brick-600 px-2.5 py-[5px] text-xs font-bold">{newCount} new</span>}
      </div>
      <Filters
        types={q.data?.meta.types ?? { flyer: "Flyers", status: "Status", video: "Videos", design: "Designs", logo: "Logos" }}
        value={type}
        onChange={setType}
      />
      {q.isError ? (
        <ErrorNote onRetry={() => q.refetch()} />
      ) : q.isPending ? (
        <div className="grid grid-cols-2 gap-3" aria-busy="true">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-ink-400">Nothing here yet. Check back soon.</p>
      ) : (
        <PhoneGrid items={items} hrefBase="/app/publicity" />
      )}
    </div>
  );
}
