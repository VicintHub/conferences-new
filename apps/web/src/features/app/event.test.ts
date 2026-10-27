import { describe, expect, it } from "vitest";
import { countdownTarget, defaultDay, icsFor, nowAndNext, phaseAt, progress, todayEntry } from "./event";
import type { ProgrammeDay, Session } from "./types";

const s = (id: number, title: string, start: string, end: string, kind = "plenary"): Session => ({
  id,
  title,
  subtitle: null,
  kind,
  starts_at: start,
  ends_at: end,
});

const days: ProgrammeDay[] = [
  {
    date: "2027-01-19",
    title: "Evening of Worship",
    sessions: [s(1, "Evening of Worship", "2027-01-19T17:00:00+01:00", "2027-01-19T20:00:00+01:00", "worship")],
  },
  {
    date: "2027-01-23",
    title: "Royal Conf. + IYLC",
    sessions: [
      s(2, "Royal Conference", "2027-01-23T09:00:00+01:00", "2027-01-23T13:00:00+01:00"),
      s(3, "Lunch", "2027-01-23T13:00:00+01:00", "2027-01-23T14:00:00+01:00", "meal"),
      s(4, "IYLC", "2027-01-23T14:00:00+01:00", "2027-01-23T20:00:00+01:00", "iylc"),
    ],
  },
];
const at = (iso: string) => Date.parse(iso);

describe("event phase", () => {
  it("is pre before the first session, live during, post after the last", () => {
    expect(phaseAt(days, at("2026-10-26T12:00:00+01:00"))).toBe("pre");
    expect(phaseAt(days, at("2027-01-21T12:00:00+01:00"))).toBe("live");
    expect(phaseAt(days, at("2027-01-24T00:00:00+01:00"))).toBe("post");
  });
  it("counts down to the first session", () => {
    expect(countdownTarget(days)).toBe("2027-01-19T17:00:00+01:00");
    expect(countdownTarget([])).toBe("2027-01-19T17:00:00+01:00");
  });
});

describe("now and next", () => {
  it("finds the running session, the next non-meal one, and today's meal", () => {
    const r = nowAndNext(days, at("2027-01-23T10:00:00+01:00"));
    expect(r.current?.title).toBe("Royal Conference");
    expect(r.next?.title).toBe("IYLC");
    expect(r.meal?.title).toBe("Lunch");
  });
  it("has no current session between items", () => {
    const r = nowAndNext(days, at("2027-01-23T08:00:00+01:00"));
    expect(r.current).toBeUndefined();
    expect(r.next?.title).toBe("Royal Conference");
  });
  it("reports progress through the session and clamps it", () => {
    expect(progress(days[1].sessions[0], at("2027-01-23T11:00:00+01:00"))).toBe(50);
    expect(progress(days[1].sessions[0], at("2027-01-23T20:00:00+01:00"))).toBe(100);
  });
});

describe("today and default day", () => {
  it("finds today's entry with its position", () => {
    expect(todayEntry(days, at("2027-01-23T10:00:00+01:00"))).toMatchObject({ index: 1, total: 2 });
    expect(todayEntry(days, at("2027-01-20T10:00:00+01:00"))).toBeUndefined();
  });
  it("opens on today during the conference, else the first day", () => {
    expect(defaultDay(days, at("2027-01-23T10:00:00+01:00"))).toBe("2027-01-23");
    expect(defaultDay(days, at("2026-10-26T10:00:00+01:00"))).toBe("2027-01-19");
  });
});

describe("calendar export", () => {
  it("writes a valid single-event ics in UTC", () => {
    const ics = icsFor(days[0].sessions[0]);
    expect(ics).toContain("DTSTART:20270119T160000Z");
    expect(ics).toContain("DTEND:20270119T190000Z");
    expect(ics).toContain("SUMMARY:Evening of Worship");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
  });
});
