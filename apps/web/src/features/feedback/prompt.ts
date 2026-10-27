import type { ProgrammeDay, Session } from "@/features/app/types";

const SKIP_KEY = "jc27.feedback.skipped";

/** Meals and arrivals aren't worth rating. */
const ratable = (s: Session) => s.kind !== "meal" && s.kind !== "arrival";

/**
 * The session to ask about: the most recent ratable one that ended at least `delayMin` minutes ago
 * (and not more than `windowHours` ago, so people aren't nagged about yesterday), unless already answered or skipped.
 */
export function pendingFeedbackSession(
  days: ProgrammeDay[],
  now: number,
  answered: number[],
  skipped: number[],
  delayMin = 10,
  windowHours = 3,
): Session | undefined {
  const done = new Set([...answered, ...skipped]);
  return days
    .flatMap((d) => d.sessions)
    .filter((s) => ratable(s) && !done.has(s.id))
    .filter((s) => {
      const end = Date.parse(s.ends_at);
      return now >= end + delayMin * 60_000 && now <= end + windowHours * 3_600_000;
    })
    .sort((a, b) => Date.parse(b.ends_at) - Date.parse(a.ends_at))[0];
}

export function readSkipped(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SKIP_KEY) ?? "[]") as number[];
  } catch {
    return [];
  }
}

export function rememberSkipped(id: number) {
  try {
    localStorage.setItem(SKIP_KEY, JSON.stringify([...new Set([...readSkipped(), id])]));
  } catch {
    // best effort: worst case the prompt shows again
  }
}
