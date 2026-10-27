export type DeskCard = {
  registration_id: number;
  claim_code: string;
  name: string;
  church: string | null;
  category: "delegate" | "international" | "minister";
  mode: "onsite" | "online";
  days: string[];
  team_code: string | null;
  phone_last4: string | null;
  valid: boolean;
  status: string;
  badge_printed_at: string | null;
};

export const categoryName: Record<DeskCard["category"], string> = {
  delegate: "Delegate",
  international: "International delegate",
  minister: "Minister",
};

/** "19–24" from the dates a person registered for. */
export function dayRange(days: string[]): string {
  const n = days.map((d) => Number(d.slice(8, 10))).sort((a, b) => a - b);
  if (n.length === 0) return "—";
  return n.length === 1 ? String(n[0]) : `${n[0]}–${n[n.length - 1]}`;
}
