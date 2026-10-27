export const COUNTRIES = [
  { iso: "NG", dial: "234", label: "NG +234" },
  { iso: "GH", dial: "233", label: "GH +233" },
  { iso: "KE", dial: "254", label: "KE +254" },
  { iso: "ZA", dial: "27", label: "ZA +27" },
  { iso: "GB", dial: "44", label: "GB +44" },
  { iso: "US", dial: "1", label: "US +1" },
] as const;

export type CountryIso = (typeof COUNTRIES)[number]["iso"];

/** Builds E.164 from a dial code and a national number typed with spaces or a leading trunk 0. */
export function toE164(iso: CountryIso, national: string): string {
  const dial = COUNTRIES.find((c) => c.iso === iso)!.dial;
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return `+${dial}${digits}`;
}

export const isE164 = (v: string) => /^\+[1-9]\d{7,14}$/.test(v);

/** "+2348034567821" → "+234 803 456 7821" (display only). */
export function formatPhone(e164: string): string {
  const c = COUNTRIES.find((x) => e164.startsWith(`+${x.dial}`));
  if (!c) return e164;
  const rest = e164.slice(c.dial.length + 1);
  return `+${c.dial} ${rest.replace(/^(\d{3})(\d{3})(\d+)$/, "$1 $2 $3")}`;
}

/**
 * Free-text phone (as typed into a one-field form) → E.164. "0803 456 7821" and "234803…" are taken as Nigerian;
 * anything starting with "+" is kept as given. Returns the cleaned input when it can't be made valid, so the caller can reject it.
 */
export function normalisePhone(raw: string): string {
  const v = raw.trim();
  const digits = v.replace(/\D/g, "");
  if (v.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return digits ? `+234${digits}` : "";
}
