import type { Checkpoint, LogEntry, PendingScan, Roster, ScanResult } from "./types";

const TZ = "Africa/Lagos";
const ordinal = (n: number) =>
  `${n}${[11, 12, 13].includes(n % 100) ? "th" : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th")}`;
const time = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
const day = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const LABEL: Record<Checkpoint, string> = { gate: "Gate", hall: "Hall", meal: "Meal", merch: "Merchandise" };
const category = (c: string) => (c === "international" ? "International" : c[0]!.toUpperCase() + c.slice(1));

const refuse = (scan: PendingScan, reason: string, extra: Partial<ScanResult> = {}): ScanResult => ({
  client_uuid: scan.client_uuid,
  result: "refused",
  reason,
  label: null,
  detail: null,
  checkpoint: scan.checkpoint,
  overridden: false,
  attendee: null,
  can_override: false,
  provisional: true,
  ...extra,
});

/** The meal window a moment falls in, with the same few minutes of grace the server allows. */
export function mealWindow(roster: Roster, at: string) {
  const t = Date.parse(at);
  const grace = roster.grace_minutes * 60_000;
  return roster.meals.find((m) => Date.parse(m.starts_at) - grace <= t && t <= Date.parse(m.ends_at) + grace);
}

/**
 * Decides a scan with no signal, using the roster and the phone's own history. It applies the same rules as the
 * server, so the answer at the door is almost always the same; the server remains the authority when the scan syncs.
 * Overrides are never available offline: they need a supervisor's sign-in on the server.
 */
export function decideLocally(roster: Roster | null, scan: PendingScan, log: LogEntry[]): ScanResult {
  if (!roster) return refuse(scan, "No list on this phone yet. Connect once to load it.");
  const code = scan.code.trim().toUpperCase();
  const today = day(scan.scanned_at);

  if (scan.checkpoint === "merch") {
    if (!/^MV-\d+$/.test(code)) return refuse(scan, roster.people[code] ? "Scan the pickup QR from the order" : "Unknown code");
    const order = roster.orders[code];
    if (!order) return refuse(scan, "Unknown order");
    if (order.s === "collected") return refuse(scan, "Already collected", { label: "Merchandise", detail: order.n });
    return {
      client_uuid: scan.client_uuid,
      result: "ok",
      reason: null,
      label: "Merchandise",
      detail: order.n,
      checkpoint: "merch",
      overridden: false,
      attendee: null,
      can_override: false,
      provisional: true,
    };
  }

  if (/^MV-\d+$/.test(code)) return refuse(scan, "That’s a merchandise pickup code");
  const person = roster.people[code];
  if (!person) return refuse(scan, "Not on the onsite list");
  const attendee = { name: person.n, category: person.c, mode: "onsite" };
  const ok = (label: string, detail: string): ScanResult => ({
    client_uuid: scan.client_uuid,
    result: "ok",
    reason: null,
    label,
    detail,
    checkpoint: scan.checkpoint,
    overridden: false,
    attendee,
    can_override: false,
    provisional: true,
  });

  if (scan.checkpoint !== "meal") {
    const again = log.some((l) => l.code === code && l.checkpoint === scan.checkpoint && l.result === "ok" && day(l.scanned_at) === today);
    return ok(LABEL[scan.checkpoint], `${category(person.c)}${again ? " · Back in" : ""}`);
  }

  const window = mealWindow(roster, scan.scanned_at);
  if (!window) return refuse(scan, "No meal service right now", { attendee });
  const key = `meal:${window.id}`;
  const mine = log.find((l) => l.code === code && l.checkpoint === "meal" && l.window === key && l.result === "ok");
  if (mine || roster.served[key]?.includes(code)) {
    const where = mine?.device ?? "a meal point";
    return refuse(scan, "Already served", {
      attendee,
      label: window.title,
      detail: `${window.title} collected at ${where}\n${mine ? `${time(mine.scanned_at)} today` : "earlier today"}`,
    });
  }
  const nth = log.filter((l) => l.code === code && l.checkpoint === "meal" && l.result === "ok" && day(l.scanned_at) === today).length + 1;
  return ok(window.title, `${category(person.c)} · ${ordinal(nth)} meal today`);
}

/** Remembers a local acceptance in the roster copy, so the next scan of the same thing is refused too. */
export function applyToRoster(roster: Roster, scan: PendingScan, result: ScanResult): Roster {
  if (result.result !== "ok") return roster;
  const code = scan.code.trim().toUpperCase();
  if (scan.checkpoint === "merch" && roster.orders[code])
    return { ...roster, orders: { ...roster.orders, [code]: { ...roster.orders[code]!, s: "collected" } } };
  if (scan.checkpoint === "meal") {
    const w = mealWindow(roster, scan.scanned_at);
    if (w) return { ...roster, served: { ...roster.served, [`meal:${w.id}`]: [...(roster.served[`meal:${w.id}`] ?? []), code] } };
  }
  return roster;
}

export const logFrom = (scan: PendingScan, r: ScanResult, roster: Roster | null): LogEntry => ({
  client_uuid: scan.client_uuid,
  code: scan.code.trim().toUpperCase(),
  checkpoint: scan.checkpoint,
  scanned_at: scan.scanned_at,
  result: r.result,
  reason: r.reason,
  label: r.label,
  device: scan.device,
  name: r.attendee?.name ?? null,
  provisional: !!r.provisional,
  window:
    scan.checkpoint === "meal" && roster
      ? (() => {
          const w = mealWindow(roster, scan.scanned_at);
          return w ? `meal:${w.id}` : null;
        })()
      : null,
});
