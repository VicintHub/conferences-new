export type RoleKey = "vip" | "speaker" | "vendor" | "media";
export type AppStatus = "submitted" | "documents_checked" | "in_review" | "approved" | "declined";

export type TimelineStep = { key: string; title: string; at: string | null; note: string | null; state: "done" | "current" | "upcoming" };

export type Application = {
  id: number;
  role: RoleKey;
  role_label: string;
  heading: string;
  summary: string;
  status: AppStatus;
  status_label: string;
  requested_info: string | null;
  decision_note: string | null;
  timeline: TimelineStep[];
  documents: { id: number; name: string; size: number }[];
};

export type ApplicationList = { data: Application[]; meta: { roles: { key: RoleKey; label: string; blurb: string }[] } };
