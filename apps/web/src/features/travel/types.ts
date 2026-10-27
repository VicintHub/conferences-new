export type Hotel = {
  slug: string;
  name: string;
  area: string;
  lat: number | null;
  lng: number | null;
  /** Null until the committee has the hotel's rate. */
  price_kobo: number | null;
  distance_km: number;
  drive_minutes: number | null;
  conference_rate: boolean;
  /** Only present on hotels where the conference rate applies. */
  rate_code: string | null;
  image: string | null;
  amenities: string[];
  shuttle_note: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type Shuttle = { id: number; name: string; schedule: string };
export type Venue = { name: string; address: string; lat: number; lng: number };
export type Travel = { venue: Venue; hotels: Hotel[]; shuttles: Shuttle[] };

export type Budget = "all" | "under20" | "mid" | "conference";

export const budgets: { key: Budget; label: string }[] = [
  { key: "all", label: "All" },
  { key: "under20", label: "Under ₦20k" },
  { key: "mid", label: "₦20k–₦35k" },
  { key: "conference", label: "Conference rate" },
];

const NAIRA_20K = 2_000_000;
const NAIRA_35K = 3_500_000;

/** The budget filters only mean something once rates are known. */
export const hasRates = (hotels: Hotel[]) => hotels.some((h) => h.price_kobo !== null);

export function inBudget(h: Hotel, b: Budget): boolean {
  if (b === "under20" || b === "mid") {
    if (h.price_kobo === null) return false; // an unknown rate is not "under ₦20k"
  }
  switch (b) {
    case "under20":
      return h.price_kobo! < NAIRA_20K;
    case "mid":
      return h.price_kobo! >= NAIRA_20K && h.price_kobo! <= NAIRA_35K;
    case "conference":
      return h.conference_rate;
    default:
      return true;
  }
}
