/** Everything on the programme is shown in venue time (Ibadan), whatever the device's timezone. */
export const VENUE_TZ = "Africa/Lagos";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: VENUE_TZ, ...opts });

export function venueDate(iso: string): string {
  const p = Object.fromEntries(
    fmt({ year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/** "9:00", "AM" */
export function clock(iso: string): { time: string; ap: "AM" | "PM" } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: VENUE_TZ, hour: "numeric", minute: "2-digit", hour12: true })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { time: `${p.hour}:${p.minute}`, ap: p.dayPeriod as "AM" | "PM" };
}

export const clock12 = (iso: string) => {
  const c = clock(iso);
  return `${c.time} ${c.ap}`;
};

/** "Tue" and 19 for a YYYY-MM-DD day key (the key is a calendar date, not an instant). */
export function dayParts(day: string): { dow: string; n: number; long: string; month: string } {
  const d = new Date(`${day}T12:00:00+01:00`);
  return {
    dow: fmt({ weekday: "short" }).format(d),
    n: Number(fmt({ day: "numeric" }).format(d)),
    long: fmt({ weekday: "long" }).format(d),
    month: fmt({ month: "short" }).format(d),
  };
}

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** "Adebayo Ogunleye" → "Adebayo O." */
export function shortName(name: string) {
  const [first, second] = name.split(/\s+/).filter(Boolean);
  return second ? `${first} ${second[0]!.toUpperCase()}.` : (first ?? "");
}

/** "12 Nov, 4:20 PM" in venue time. */
export function venueStamp(iso: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: VENUE_TZ, day: "numeric", month: "short" }).format(d);
  return `${day}, ${clock12(iso)}`;
}
