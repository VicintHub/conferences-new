export type Me = {
  claim_code: string;
  category: "delegate" | "international" | "minister";
  mode: "onsite" | "online";
  days: string[];
  needs_accommodation: boolean;
  status: string;
  minister_verified: boolean;
  badge: { printed_at: string } | null;
  access: { key: string; label: string; used: boolean }[];
  attendee: { full_name: string; first_name: string; email: string; church: string | null };
};

export type Session = { id: number; title: string; subtitle: string | null; kind: string; starts_at: string; ends_at: string };
export type ProgrammeDay = { date: string; title: string | null; sessions: Session[] };

export const categoryLabel: Record<Me["category"], string> = {
  delegate: "Delegate",
  international: "International delegate",
  minister: "Minister",
};
