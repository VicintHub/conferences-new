import { EVENT_START } from "@/components/ui";
import { venueDate } from "@/lib/time";
import type { ProgrammeDay, Session } from "./types";

export type Phase = "pre" | "live" | "post";

const allSessions = (days: ProgrammeDay[]) => days.flatMap((d) => d.sessions);

export function firstSession(days: ProgrammeDay[]): Session | undefined {
  return allSessions(days)[0];
}

/** Countdown target: the first programme item, falling back to the published start time. */
export const countdownTarget = (days: ProgrammeDay[]) => firstSession(days)?.starts_at ?? EVENT_START;

export function phaseAt(days: ProgrammeDay[], now: number): Phase {
  const sessions = allSessions(days);
  const start = sessions.length ? Date.parse(sessions[0].starts_at) : Date.parse(EVENT_START);
  const end = sessions.length ? Math.max(...sessions.map((s) => Date.parse(s.ends_at))) : Infinity;
  return now < start ? "pre" : now > end ? "post" : "live";
}

/** Today's day entry (venue calendar), if the conference is on today. */
export function todayEntry(days: ProgrammeDay[], now: number) {
  const key = venueDate(new Date(now).toISOString());
  const index = days.findIndex((d) => d.date === key);
  return index === -1 ? undefined : { day: days[index], index, total: days.length };
}

/** The session running now and the next one that hasn't started, across the whole programme. */
export function nowAndNext(days: ProgrammeDay[], now: number) {
  const sessions = allSessions(days);
  const current = sessions.find((s) => Date.parse(s.starts_at) <= now && now < Date.parse(s.ends_at));
  const next = sessions.find((s) => Date.parse(s.starts_at) > now && s.id !== current?.id && s.kind !== "meal");
  const meal = sessions.find(
    (s) => s.kind === "meal" && Date.parse(s.ends_at) > now && venueDate(s.starts_at) === venueDate(new Date(now).toISOString()),
  );
  return { current, next, meal };
}

export const progress = (s: Session, now: number) =>
  Math.min(100, Math.max(0, Math.round(((now - Date.parse(s.starts_at)) / (Date.parse(s.ends_at) - Date.parse(s.starts_at))) * 100)));

/** Tab to open on in the programme: today if the conference is on, otherwise the first day. */
export function defaultDay(days: ProgrammeDay[], now: number) {
  return todayEntry(days, now)?.day.date ?? days[0]?.date;
}

/** Calendar entry for the opening session (used by "Add to calendar"). */
export function icsFor(session: Session, claimUrl?: string): string {
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jan Conf 2027//EN",
    "BEGIN:VEVENT",
    `UID:session-${session.id}@janconf2027`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(session.starts_at)}`,
    `DTEND:${stamp(session.ends_at)}`,
    `SUMMARY:${session.title}`,
    `LOCATION:Leadership & Missions Conference Centre\\, Olororo\\, Ojoo\\, Ibadan`,
    ...(claimUrl ? [`URL:${claimUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
