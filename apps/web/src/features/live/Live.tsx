"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Segmented } from "@/components/ui";
import { nowAndNext, todayEntry } from "@/features/app/event";
import { useProgramme } from "@/features/app/queries";
import type { ProgrammeDay, Session } from "@/features/app/types";
import { useNow } from "@/features/app/useNow";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { cn } from "@/lib/cn";
import { shareLink } from "@/lib/share";
import { clock12, dayParts, venueDate } from "@/lib/time";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useHeartbeat, useLive, useRemind } from "./api";
import { NotesSheet } from "./NotesSheet";
import { RadioPlayer } from "./RadioPlayer";
import { DEFAULT_POSTER, duration, type LiveData, type Replay } from "./types";
import { VideoPlayer } from "./VideoPlayer";

type Mode = "video" | "radio";
const modes = [
  { value: "video", label: "Video" },
  { value: "radio", label: "Radio" },
] as const;

const dayLabel = (s: Session) => {
  const p = dayParts(venueDate(s.starts_at));
  return `${p.dow} ${p.n} ${p.month}`;
};
const place = (s: Session) => s.subtitle?.split(" · ")[0] ?? "";

/** Live & radio (designs 11a/11b on phones, 12a on desktop). */
export function Live() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const live = useLive();
  const { days } = useProgramme();
  const now = useNow();
  const remind = useRemind();

  const [mode, setMode] = useState<Mode>("video");
  const [replay, setReplay] = useState<Replay | null>(null);
  const [replayNote, setReplayNote] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [notes, setNotes] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  useHeartbeat(playing);
  const onPlaying = useCallback((p: boolean) => setPlaying(p), []);

  if (live.isError && !live.data)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => live.refetch()} />
      </div>
    );
  if (!live.data || now === null)
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="aspect-video" />
        <SkeletonBlock className="h-24" />
      </div>
    );

  const data = live.data;
  const { current, next } = nowAndNext(days, now);
  const headline = current ?? next;
  const title = replay?.title ?? data.title ?? headline?.title ?? "Jan. Conf Live";
  const sub = replay
    ? dayLabel({ starts_at: replay.recorded_on + "T12:00:00+01:00" } as Session)
    : headline
      ? `${dayLabel(headline)}${place(headline) ? ` · ${place(headline)}` : ""}`
      : "";
  const video = replay ? replay.video : data.is_live ? data.video : null;
  const poster = replay?.thumbnail ?? data.poster ?? DEFAULT_POSTER;

  const pickReplay = (r: Replay) => {
    if (!r.video) return setReplayNote("That recording isn’t published yet. Replays appear after each session.");
    setReplayNote(null);
    setReplay(r);
    setMode("video");
  };
  const share = async () => {
    const r = await shareLink(`${window.location.origin}/app/live`, `${title} · Jan. Conf Live`);
    setShareNote(r === "copied" ? "Link copied" : r === "failed" ? "Couldn’t share the link" : null);
  };

  const chip = replay ? (
    <Chip tone="neutral">REPLAY</Chip>
  ) : data.is_live ? (
    <Chip tone="live">LIVE</Chip>
  ) : (
    <Chip tone="neutral">OFF AIR</Chip>
  );
  const viewers = data.is_live && !replay && (
    <span className="rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white">
      {data.viewers.toLocaleString("en-NG")} watching
    </span>
  );
  const idle = (
    <>
      <p className="text-lg font-bold">We’re off air</p>
      <p className="text-sm text-cobalt-100">
        {next ? `Next: ${next.title}, ${dayLabel(next)} at ${clock12(next.starts_at)}` : "Back with the next session."}
      </p>
    </>
  );
  const player = (
    <div className="relative">
      <VideoPlayer video={video} poster={poster} idle={idle} onPlayingChange={onPlaying} className={desktop ? "rounded-[24px]" : ""} />
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
        {chip}
        {viewers}
      </div>
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-2.5">
      <ActionChip dark={desktop} onClick={() => setNotes(true)}>
        Notes
      </ActionChip>
      <ActionChip dark={desktop} onClick={share}>
        Share
      </ActionChip>
      {data.give_url && (
        <ActionChip dark={desktop} href={data.give_url}>
          Give
        </ActionChip>
      )}
    </div>
  );
  const notesSheet = (
    <NotesSheet
      open={notes}
      onOpenChange={setNotes}
      sessionKey={String((replay ? `replay-${replay.id}` : headline?.id) ?? "live")}
      title={title}
    />
  );
  const radio = (
    <RadioPlayer
      url={data.radio?.url ?? null}
      live={data.is_live}
      title={data.title ?? current?.title ?? "Jan. Conf Radio"}
      onPlayingChange={onPlaying}
    />
  );

  if (desktop) {
    const day: ProgrammeDay | undefined = todayEntry(days, now)?.day ?? days[0];
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-cobalt-950 text-white">
        <header className="flex items-center justify-between border-b border-white/10 px-12 py-5">
          <Link href="/app" className="flex items-center gap-3" aria-label="Back to the app">
            <Image src="/images/miv-logo.png" alt="" width={44} height={44} className="size-11 object-contain" />
            <span className="font-display text-xl font-bold leading-[0.95]">
              JAN. CONF
              <br />
              2027
            </span>
          </Link>
          <div className="w-[220px]">
            <Segmented tone="dark" label="Video or radio" options={[...modes]} value={mode} onChange={(m) => setMode(m)} />
          </div>
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-12 px-12 py-10">
          <div className="flex flex-col gap-6">
            {mode === "video" ? (
              player
            ) : (
              <div className="flex min-h-[460px] items-center justify-center rounded-[24px] bg-white/5 py-10">{radio}</div>
            )}
            <div className="flex items-end justify-between gap-6">
              <div>
                <h1 className="font-display text-[56px] font-bold uppercase leading-[0.95] text-cream-50">{title}</h1>
                <p className="mt-2 text-[15px] text-cobalt-100">
                  {headline
                    ? `${dayLabel(headline)}${place(headline) ? ` · ${place(headline)}` : ""} · ${clock12(headline.starts_at)} – ${clock12(headline.ends_at)}`
                    : sub}
                </p>
              </div>
              {actions}
            </div>
            {shareNote && (
              <p role="status" className="text-sm text-cobalt-100">
                {shareNote}
              </p>
            )}
          </div>
          <aside className="flex flex-col gap-8">
            <section aria-label="Today" className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">
                {day && todayEntry(days, now)
                  ? "Today"
                  : day
                    ? `${dayParts(day.date).dow} ${dayParts(day.date).n} ${dayParts(day.date).month}`
                    : "Today"}
              </h2>
              {day?.sessions.map((s) => {
                const isNow = current?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={cn("flex gap-4 rounded-2xl border px-4 py-3.5", isNow ? "border-white/20 bg-white/10" : "border-white/10")}
                  >
                    <span className={cn("w-[62px] flex-none text-[13px] font-bold", isNow ? "text-brick-400" : "text-cobalt-300")}>
                      {isNow ? "NOW" : clock12(s.starts_at)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">{s.title}</span>
                      <span className="text-[13px] text-cobalt-100">
                        {s.kind === "meal" ? "Stream on pause" : s.kind === "arrival" ? s.subtitle : `Until ${clock12(s.ends_at)}`}
                      </span>
                    </span>
                  </div>
                );
              })}
            </section>
            <Replays replays={data.replays} dark onPick={pickReplay} note={replayNote} />
          </aside>
        </div>
        {notesSheet}
      </div>
    );
  }

  if (mode === "radio") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-cobalt-950 px-6 pb-10 pt-[54px]">
        <div aria-hidden className="grid-motif pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-3">
          <button type="button" aria-label="Back to video" onClick={() => setMode("video")} className="-ml-1 p-1 text-cream-50">
            <ChevronDown size={26} />
          </button>
          <div className="mx-auto w-[220px]">
            <Segmented tone="dark" label="Video or radio" options={[...modes]} value={mode} onChange={(m) => setMode(m)} />
          </div>
          <span className="w-6" />
        </div>
        <div className="relative flex flex-1 items-center justify-center">{radio}</div>
      </div>
    );
  }

  const upNext = next;
  const reminding = upNext ? data.reminders.includes(upNext.id) : false;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-[60px]">
        <h1 className="text-[23px] font-bold text-cobalt-900">Live</h1>
        <div className="w-[210px]">
          <Segmented label="Video or radio" options={[...modes]} value={mode} onChange={(m) => setMode(m)} />
        </div>
      </div>
      {player}
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold leading-tight text-ink-900">{title}</h2>
          {sub && <p className="text-[15px] text-ink-500">{sub}</p>}
        </div>
        {actions}
        {shareNote && (
          <p role="status" className="-mt-3 text-sm text-ink-500">
            {shareNote}
          </p>
        )}
        {upNext && (
          <section aria-label="Up next" className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-ink-900">Up next</h2>
            <div className="flex items-center gap-4 rounded-[20px] bg-cobalt-50 p-3.5">
              <span className="flex size-[60px] flex-none flex-col items-center justify-center rounded-2xl bg-white">
                <span className="font-display text-xl font-bold leading-none text-cobalt-900">
                  {clock12(upNext.starts_at).replace(/ (AM|PM)$/, "")}
                </span>
                <span className="text-[11px] text-ink-500">{clock12(upNext.starts_at).slice(-2)}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-bold text-ink-900">{upNext.title}</span>
                <span className="text-[13px] text-ink-500">Until {clock12(upNext.ends_at)}</span>
              </span>
              <button
                type="button"
                aria-pressed={reminding}
                disabled={remind.isPending}
                onClick={() => remind.mutate({ sessionId: upNext.id, on: !reminding })}
                className="flex-none text-sm font-bold text-cobalt-700 disabled:opacity-50"
              >
                {reminding ? "Reminder set ✓" : "Remind me"}
              </button>
            </div>
            {remind.isError && (
              <p role="alert" className="text-sm text-brick-600">
                Couldn’t set the reminder. Try again.
              </p>
            )}
          </section>
        )}
        <Replays replays={data.replays} onPick={pickReplay} note={replayNote} />
      </div>
      {notesSheet}
    </div>
  );
}

function Chip({ tone, children }: { tone: "live" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.06em] text-white",
        tone === "live" ? "bg-brick-600" : "bg-black/55",
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-white" />
      {children}
    </span>
  );
}

function ActionChip({ children, dark, href, onClick }: { children: React.ReactNode; dark?: boolean; href?: string; onClick?: () => void }) {
  const cls = cn(
    "rounded-full border px-[18px] py-2.5 text-sm font-bold leading-none focus-visible:outline-none focus-visible:shadow-[var(--ring)]",
    dark ? "border-white/25 text-cream-50 hover:bg-white/10" : "border-ink-200 text-ink-900 hover:border-cobalt-600",
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function Replays({
  replays,
  dark,
  onPick,
  note,
}: {
  replays: LiveData["replays"];
  dark?: boolean;
  onPick: (r: Replay) => void;
  note: string | null;
}) {
  if (replays.length === 0) return null;
  return (
    <section aria-label="Replays" className="flex flex-col gap-3">
      <h2 className={cn("text-lg font-bold", dark ? "text-white" : "text-ink-900")}>Replays</h2>
      {note && (
        <p role="status" className={cn("text-sm", dark ? "text-cobalt-100" : "text-ink-500")}>
          {note}
        </p>
      )}
      <ul className="flex flex-col gap-3.5">
        {replays.map((r) => {
          const p = dayParts(r.recorded_on);
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="flex w-full items-center gap-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
              >
                <span
                  className={cn(
                    "relative flex-none overflow-hidden rounded-xl bg-cobalt-900",
                    dark ? "h-[56px] w-24" : "h-[72px] w-[108px]",
                  )}
                >
                  {r.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnails may be admin-supplied URLs
                    <img src={r.thumbnail} alt="" className="size-full object-cover" />
                  )}
                  <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {duration(r.duration_seconds)}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn("text-[15px] font-bold leading-snug", dark ? "text-white" : "text-ink-900")}>{r.title}</span>
                  <span className={cn("text-[13px]", dark ? "text-cobalt-100" : "text-ink-500")}>{`${p.dow} ${p.n} ${p.month}`}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
