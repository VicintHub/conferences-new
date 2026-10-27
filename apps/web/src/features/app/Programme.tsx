"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { clock, dayParts } from "@/lib/time";
import { defaultDay } from "./event";
import { useProgramme } from "./queries";
import type { Session } from "./types";
import { ErrorNote, PageHeading, SkeletonBlock } from "./ui";
import { useNow } from "./useNow";

/** Left-edge colour by session kind (design 3c): plenary brick, IYLC cobalt, everything else neutral. */
const edge: Record<string, string> = { plenary: "border-l-brick-600", worship: "border-l-brick-600", iylc: "border-l-cobalt-600" };

function Row({ s, live }: { s: Session; live: boolean }) {
  const t = clock(s.starts_at);
  return (
    <li className="flex gap-3.5">
      <div className="flex w-[54px] flex-none flex-col items-end pt-4">
        <span className="font-display text-[15px] font-semibold text-ink-800">{t.time}</span>
        <span className="text-[10px] font-medium text-ink-400">{t.ap}</span>
      </div>
      <div
        className={cn(
          "mb-2.5 flex flex-1 flex-col gap-1.5 rounded-2xl border border-l-[3px] border-ink-100 bg-white p-4",
          edge[s.kind] ?? "border-l-ink-200",
          live && "shadow-md",
        )}
      >
        <span className="flex items-center gap-2 text-base font-semibold leading-[1.25] text-ink-900">
          {s.title}
          {live && (
            <span className="rounded-full bg-brick-100 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-brick-700">NOW</span>
          )}
        </span>
        {s.subtitle && <span className="text-[13px] text-ink-400">{s.subtitle}</span>}
      </div>
    </li>
  );
}

export function Programme() {
  const { days, isPending, isError, refetch } = useProgramme();
  const now = useNow();
  const [picked, setPicked] = useState<string>();
  const selected = picked ?? (now !== null ? defaultDay(days, now) : undefined);
  const day = days.find((d) => d.date === selected);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[720px]">
      <div className="flex flex-col gap-4 border-b border-ink-100 bg-white px-5 pt-[60px] lg:border-0 lg:bg-transparent lg:pt-9">
        <PageHeading>Programme</PageHeading>
        <div role="tablist" aria-label="Conference day" className="flex gap-1.5 pb-3.5">
          {days.map((d) => {
            const p = dayParts(d.date);
            const active = d.date === selected;
            return (
              <button
                key={d.date}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setPicked(d.date)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-[22px] py-2",
                  active ? "bg-cobalt-900 text-cream-50" : "text-ink-600",
                )}
              >
                <span className="text-[10px] font-medium uppercase opacity-80">{p.dow}</span>
                <span className="font-display text-xl font-bold">{p.n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel" className="flex-1 overflow-auto p-5">
        {isError && !days.length ? (
          <ErrorNote onRetry={() => refetch()} />
        ) : isPending || !day ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-20" />
            ))}
          </div>
        ) : day.sessions.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-ink-400">Nothing scheduled for this day yet.</p>
        ) : (
          <ul>
            {day.sessions.map((s) => (
              <Row key={s.id} s={s} live={now !== null && Date.parse(s.starts_at) <= now && now < Date.parse(s.ends_at)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
