"use client";

import { useState } from "react";
import { days, sessionsByDay } from "@/content/landing";
import { cn } from "@/lib/cn";
import { H2, Section } from "./shared";

export function Sessions() {
  const [day, setDay] = useState<(typeof days)[number]>("Wed 20");
  return (
    <Section id="schedule" className="pb-16 md:pb-24">
      <div className="flex flex-col gap-8">
        <H2>Session breakdown</H2>
        <div role="tablist" aria-label="Conference day" className="-mr-5 flex gap-1.5 overflow-x-auto pr-5 md:mr-0 md:gap-2 md:pr-0">
          {days.map((d) => (
            <button
              key={d}
              role="tab"
              type="button"
              aria-selected={d === day}
              onClick={() => setDay(d)}
              className={cn(
                "flex-none rounded-full border-[1.5px] px-3.5 py-[9px] text-[13px] font-semibold md:px-5 md:py-3 md:text-[15px]",
                d === day ? "border-cobalt-900 bg-cobalt-900 text-cream-50" : "border-ink-200 text-ink-600",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="overflow-hidden rounded-[14px] border border-ink-100 bg-white md:rounded-2xl">
          {sessionsByDay[day].map((s) => (
            <div
              key={s.time + s.t}
              className="flex flex-col gap-1 border-b border-ink-50 px-[18px] py-4 last:border-b-0 md:grid md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-8 md:py-[26px]"
            >
              <span className="font-display text-[15px] font-semibold text-brick-600 md:text-[28px]">{s.time}</span>
              <span className="font-display text-xl font-bold uppercase text-cobalt-900 md:text-[26px]">{s.t}</span>
              <span className="hidden text-sm font-medium text-ink-400 md:block">{s.where}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
