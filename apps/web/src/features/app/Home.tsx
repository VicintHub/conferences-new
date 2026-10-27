"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge, Button, Countdown, QR } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { clock12, dayParts, greeting, initials, venueDate } from "@/lib/time";
import { countdownTarget, firstSession, icsFor, nowAndNext, phaseAt, progress, todayEntry } from "./event";
import { useChangeMode, useMe, useProgramme } from "./queries";
import { categoryLabel, type Me, type ProgrammeDay, type Session } from "./types";
import { Avatar, Chevron, ErrorNote, quickActions, quickTones, SkeletonBlock } from "./ui";
import { useNow } from "./useNow";

function QuickActions({ cols }: { cols: string }) {
  return (
    <div className={cn("grid gap-2.5 lg:gap-3", cols)}>
      {quickActions.map((q, i) => (
        <Link
          key={q.t}
          href={q.href}
          className="flex flex-col gap-[22px] rounded-2xl border border-ink-100 bg-white p-4 lg:gap-6 lg:p-[18px]"
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-[10px] font-display text-[15px] font-bold",
              quickTones[i].bg,
              quickTones[i].fg,
            )}
          >
            {q.i}
          </span>
          <span className="text-[15px] font-semibold leading-[1.2] text-ink-800">{q.t}</span>
        </Link>
      ))}
    </div>
  );
}

function ModeBadges({ me }: { me: Me }) {
  return (
    <div className="flex gap-1.5">
      <Badge tone="outlineDark">{categoryLabel[me.category]}</Badge>
      <Badge tone="success" dot>
        {me.mode === "onsite" ? "Onsite" : "Online"}
      </Badge>
    </div>
  );
}

function sessionWhen(s: Session) {
  const d = dayParts(venueDate(s.starts_at));
  return `${s.title} · ${d.dow} ${d.n} ${d.month}`;
}

/* ───────────── mobile ───────────── */

function MobilePre({ me, days }: { me: Me; days: ProgrammeDay[] }) {
  const first = firstSession(days);
  return (
    <div className="flex flex-col gap-4 px-5 pb-5 pt-[60px] lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-ink-400">{greeting()}</span>
          <span className="text-[21px] font-bold leading-[1.15] text-cobalt-900">{me.attendee.first_name}</span>
        </div>
        <Avatar initials={initials(me.attendee.full_name)} />
      </div>
      <div className="relative overflow-hidden rounded-[20px] bg-cobalt-900 p-[22px] text-cream-50">
        <Image
          src="/images/miv-logo.png"
          alt=""
          width={180}
          height={180}
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-[30px] w-[180px] opacity-10"
        />
        <div className="relative flex flex-col gap-4">
          <ModeBadges me={me} />
          <Countdown target={countdownTarget(days)} />
          {first && <span className="text-sm text-cobalt-200">to {sessionWhen(first)}</span>}
        </div>
      </div>
      <Link href="/app/pass" className="flex items-center gap-3.5 rounded-[22px] border border-ink-100 bg-white p-3.5 shadow-xs">
        <QR value={me.claim_code} size={56} label={`Claim ticket ${me.claim_code}`} />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-base font-semibold text-ink-900">Claim ticket</span>
          <span className="text-xs font-medium text-ink-400">{me.claim_code}</span>
        </span>
        <Chevron />
      </Link>
      <QuickActions cols="grid-cols-2" />
    </div>
  );
}

function MobileLive({ me, days, now }: { me: Me; days: ProgrammeDay[]; now: number }) {
  const today = todayEntry(days, now);
  const { current, next, meal } = nowAndNext(days, now);
  const d = today ? dayParts(today.day.date) : undefined;
  return (
    <div className="flex flex-col gap-3.5 px-5 pb-5 pt-[60px] lg:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-bold leading-[1.15] text-cobalt-900">{d ? `${d.long} ${d.n}` : greeting()}</h1>
        {today && (
          <span className="text-xs font-medium text-ink-400">
            DAY {today.index + 1} OF {today.total}
          </span>
        )}
      </div>
      {current ? (
        <div className="overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-sm">
          <div className="h-1 bg-brick-600" />
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-brick-600" />
              <span className="text-[11px] font-semibold tracking-[0.1em] text-brick-600">HAPPENING NOW</span>
            </div>
            <span className="text-[23px] font-bold leading-[1.15] text-cobalt-900">{current.title}</span>
            <span className="text-sm text-ink-500">
              {current.subtitle?.split(" · ")[0]} · {clock12(current.starts_at)} – {clock12(current.ends_at)}
            </span>
            <div
              className="h-1.5 overflow-hidden rounded-[3px] bg-ink-100"
              role="progressbar"
              aria-valuenow={progress(current, now)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Session progress"
            >
              <div className="h-full bg-cobalt-600" style={{ width: `${progress(current, now)}%` }} />
            </div>
            <div className="mt-1 flex gap-2">
              <Button href="/app/live" size="sm">
                Watch live
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-ink-100 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-400">NOTHING ON RIGHT NOW</span>
          <p className="mt-2 text-[15px] text-ink-600">
            {next ? `Next up: ${next.title} at ${clock12(next.starts_at)}.` : "That’s all for today."}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-ink-100 bg-white p-4">
          <span className="text-[11px] font-medium tracking-[0.08em] text-ink-400">
            {next ? `NEXT · ${clock12(next.starts_at)}`.toUpperCase() : "NEXT"}
          </span>
          <span className="text-base font-semibold leading-[1.2] text-ink-900">{next?.title ?? "Nothing more today"}</span>
          {next?.subtitle && <span className="text-[13px] text-ink-400">{next.subtitle.split(" · ").at(-1)}</span>}
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-ink-100 bg-white p-4">
          <span className="text-[11px] font-medium tracking-[0.08em] text-ink-400">{(meal?.title ?? "Meal").toUpperCase()}</span>
          <span className="text-base font-semibold leading-[1.2] text-ink-900">{meal ? clock12(meal.starts_at) : "—"}</span>
          <span className="text-[13px] text-success-600">Show badge at meal point</span>
        </div>
      </div>
      <Link href="/app/pass" className="flex items-center justify-between rounded-[22px] bg-cobalt-900 px-5 py-[18px] text-cream-50">
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-lg font-bold uppercase">My badge</span>
          <span className="text-[13px] text-cobalt-200">Gate · hall · meal · merch</span>
        </span>
        <span className="rounded-lg bg-white p-1">
          <QR value={me.claim_code} size={44} label="Badge QR code" />
        </span>
      </Link>
    </div>
  );
}

function MobilePost({ me }: { me: Me }) {
  return (
    <div className="flex flex-col gap-4 px-5 pb-5 pt-[60px] lg:hidden">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ink-400">Thank you, {me.attendee.first_name}</span>
        <h1 className="text-[23px] font-bold leading-[1.15] text-cobalt-900">The 37th IMLC &amp; IYLC has ended</h1>
      </div>
      <div className="rounded-[20px] bg-cobalt-900 p-[22px] text-cream-50">
        <p className="text-[15px] leading-[1.5] text-cobalt-100">We’re grateful you were part of it. Share what God did in your life.</p>
        <div className="mt-4">
          <Button href="/app/testimonies" variant="onDark" size="sm">
            Share a testimony
          </Button>
        </div>
      </div>
      <QuickActions cols="grid-cols-2" />
    </div>
  );
}

/* ───────────── desktop (design 3e) ───────────── */

function DesktopHome({ me, days, now }: { me: Me; days: ProgrammeDay[]; now: number }) {
  const phase = phaseAt(days, now);
  const first = firstSession(days);
  const { current } = nowAndNext(days, now);
  const change = useChangeMode();
  const target = me.mode === "onsite" ? "online" : "onsite";

  const addToCalendar = () => {
    if (!first) return;
    const url = URL.createObjectURL(new Blob([icsFor(first)], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "jan-conf-2027.ics" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hidden gap-6 px-10 py-9 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:content-start">
      <div className="col-span-2 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] text-ink-400">{greeting()}</span>
          <span className="font-display text-[40px] font-bold uppercase leading-none text-cobalt-900">{me.attendee.first_name}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" size="sm" disabled={change.isPending} onClick={() => change.mutate(target)}>
            {change.isPending ? "Switching…" : `Switch to ${target}`}
          </Button>
          {change.error instanceof ApiError && (
            <span role="alert" className="text-xs text-brick-600">
              {change.error.status === 409 ? "Onsite places are full." : change.error.message}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-end justify-between overflow-hidden rounded-[20px] bg-cobalt-900 p-8 text-cream-50">
        <Image
          src="/images/miv-logo.png"
          alt=""
          width={280}
          height={280}
          aria-hidden
          className="pointer-events-none absolute -right-[60px] -top-[60px] w-[280px] opacity-[0.08]"
        />
        {phase === "live" && current ? (
          <div className="relative flex flex-col gap-3.5">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-cobalt-300">HAPPENING NOW</span>
            <span className="font-display text-[44px] font-bold uppercase leading-none">{current.title}</span>
            <span className="text-[15px] text-cobalt-200">
              {clock12(current.starts_at)} – {clock12(current.ends_at)} · {current.subtitle?.split(" · ")[0]}
            </span>
          </div>
        ) : (
          <div className="relative flex flex-col gap-3.5">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-cobalt-300">
              {first ? sessionWhen(first).toUpperCase() : "JAN. CONF 2027"}
            </span>
            <Countdown variant="panel" target={countdownTarget(days)} />
          </div>
        )}
        <div className="relative flex gap-2">
          {phase === "live" ? (
            <Button href="/app/live" variant="onDark" size="sm">
              Watch live
            </Button>
          ) : (
            <Button variant="onDark" size="sm" onClick={addToCalendar}>
              Add to calendar
            </Button>
          )}
        </div>
      </div>

      <Link
        href="/app/pass"
        className="row-span-2 flex flex-col items-center gap-3.5 rounded-[20px] border border-ink-100 bg-white p-6 text-center"
      >
        <span className="self-start text-[11px] font-semibold tracking-[0.1em] text-ink-400">{me.badge ? "BADGE" : "CLAIM TICKET"}</span>
        <QR value={me.claim_code} size={200} label={`${me.badge ? "Badge" : "Claim ticket"} ${me.claim_code}`} />
        <span className="font-display text-2xl font-bold text-cobalt-900">{me.claim_code}</span>
        <span className="text-sm leading-[1.4] text-ink-500">
          {me.badge ? "One code for gate, hall, meals and merch." : "Show this at the print desk to collect your badge."}
        </span>
      </Link>

      <QuickActions cols="grid-cols-4" />

      <div className="flex flex-col gap-3 rounded-[20px] border border-ink-100 bg-white px-6 py-5">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-xl font-bold uppercase text-cobalt-900">The week</span>
          <Link href="/app/programme" className="text-sm font-semibold text-cobalt-700">
            Full programme →
          </Link>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {days.map((d) => {
            const p = dayParts(d.date);
            return (
              <div key={d.date} className="flex flex-col gap-1 rounded-[10px] bg-cream-50 p-3">
                <span className="text-[10px] font-medium text-brick-600">
                  {p.dow.toUpperCase()} {p.n}
                </span>
                <span className="text-[13px] font-semibold leading-[1.25] text-ink-800">{d.title ?? d.sessions[0]?.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const { me, isPending, isError, refetch } = useMe();
  const { days } = useProgramme();
  const now = useNow();

  if (isError && !me)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => refetch()} />
      </div>
    );
  if (isPending || !me || now === null) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px] lg:px-10 lg:pt-9" aria-busy="true">
        <SkeletonBlock className="h-12 w-48" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-20" />
      </div>
    );
  }

  const phase = phaseAt(days, now);
  return (
    <>
      {phase === "live" ? (
        <MobileLive me={me} days={days} now={now} />
      ) : phase === "post" ? (
        <MobilePost me={me} />
      ) : (
        <MobilePre me={me} days={days} />
      )}
      <DesktopHome me={me} days={days} now={now} />
    </>
  );
}
