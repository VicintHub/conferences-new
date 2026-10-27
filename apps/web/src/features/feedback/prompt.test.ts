import { beforeEach, describe, expect, it } from "vitest";
import type { ProgrammeDay, Session } from "@/features/app/types";
import { pendingFeedbackSession, readSkipped, rememberSkipped } from "./prompt";

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
    date: "2027-01-23",
    title: null,
    sessions: [
      s(1, "Arrival", "2027-01-23T07:00:00+01:00", "2027-01-23T09:00:00+01:00", "arrival"),
      s(2, "Royal Conference", "2027-01-23T09:00:00+01:00", "2027-01-23T13:00:00+01:00"),
      s(3, "Lunch", "2027-01-23T13:00:00+01:00", "2027-01-23T14:00:00+01:00", "meal"),
      s(4, "IYLC", "2027-01-23T14:00:00+01:00", "2027-01-23T20:00:00+01:00", "iylc"),
    ],
  },
];
const at = (iso: string) => Date.parse(iso);

beforeEach(() => localStorage.clear());

describe("pendingFeedbackSession", () => {
  it("waits 10 minutes after a session ends", () => {
    expect(pendingFeedbackSession(days, at("2027-01-23T13:09:00+01:00"), [], [])).toBeUndefined();
    expect(pendingFeedbackSession(days, at("2027-01-23T13:10:00+01:00"), [], [])?.title).toBe("Royal Conference");
  });
  it("never asks about meals or arrivals", () => {
    expect(pendingFeedbackSession(days, at("2027-01-23T14:20:00+01:00"), [2], [])).toBeUndefined();
    expect(pendingFeedbackSession(days, at("2027-01-23T09:30:00+01:00"), [], [])).toBeUndefined();
  });
  it("picks the most recent ended session and skips answered or skipped ones", () => {
    expect(pendingFeedbackSession(days, at("2027-01-23T20:30:00+01:00"), [], [])?.title).toBe("IYLC");
    expect(pendingFeedbackSession(days, at("2027-01-23T20:30:00+01:00"), [4], [])).toBeUndefined();
    expect(pendingFeedbackSession(days, at("2027-01-23T20:30:00+01:00"), [], [4])).toBeUndefined();
  });
  it("stops asking after three hours", () => {
    expect(pendingFeedbackSession(days, at("2027-01-23T16:30:00+01:00"), [], [])).toBeUndefined();
  });
  it("remembers skips on the device", () => {
    rememberSkipped(4);
    rememberSkipped(4);
    rememberSkipped(2);
    expect(readSkipped()).toEqual([4, 2]);
  });
});
