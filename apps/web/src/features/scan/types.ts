export type Checkpoint = "gate" | "hall" | "meal" | "merch";
export const CHECKPOINTS: { value: Checkpoint; label: string }[] = [
  { value: "gate", label: "Gate" },
  { value: "hall", label: "Hall" },
  { value: "meal", label: "Meal" },
  { value: "merch", label: "Merch" },
];

/** A scan waiting to be sent. Its uuid makes sending it twice harmless. */
export type PendingScan = {
  client_uuid: string;
  code: string;
  checkpoint: Checkpoint;
  scanned_at: string;
  device: string | null;
  override?: boolean;
};

export type ScanResult = {
  client_uuid: string;
  result: "ok" | "refused";
  reason: string | null;
  label: string | null;
  detail: string | null;
  checkpoint: Checkpoint;
  overridden: boolean;
  duplicate?: boolean;
  attendee: { name: string; category: string; mode: string } | null;
  can_override: boolean;
  /** Decided on the phone with no signal; the server confirms when the scan syncs. */
  provisional?: boolean;
};

export type Roster = {
  generated_at: string;
  people: Record<string, { n: string; c: string }>;
  orders: Record<string, { n: string; s: string }>;
  meals: { id: number; title: string; starts_at: string; ends_at: string }[];
  served: Record<string, string[]>;
  grace_minutes: number;
};

/** One line of the phone's own history, kept so the counts and "already served" answers work offline. */
export type LogEntry = {
  client_uuid: string;
  code: string;
  checkpoint: Checkpoint;
  scanned_at: string;
  result: "ok" | "refused";
  reason: string | null;
  label: string | null;
  device: string | null;
  name: string | null;
  provisional: boolean;
  window?: string | null;
};
