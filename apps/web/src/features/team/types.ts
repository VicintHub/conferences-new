export type Role = "leader" | "member" | "spouse" | "aide";
export type Category = "delegate" | "international" | "minister";
export type Mode = "onsite" | "online";

export type TeamMember = {
  id: number;
  name: string;
  role: Role;
  role_label: string;
  title: string | null;
  category: Category | null;
  mode: Mode | null;
  status: "confirmed" | "invited";
  is_you: boolean;
  /** Contact details come back for the leader only. */
  email?: string;
  phone?: string | null;
  badge_collected: boolean;
};

export type Team = {
  id: number;
  name: string;
  kind: "church" | "minister";
  code: string;
  share_url: string;
  is_leader: boolean;
  members: TeamMember[];
  stats: { members: number; confirmed: number; invited: number; onsite: number; badges_collected: number };
  limits: { members: number; aides: number };
};

export type TeamResponse = {
  data: Team | null;
  meta: { can_create: boolean; is_minister: boolean; minister_verified: boolean; default_name: string };
};

export type NewMember = {
  full_name: string;
  email: string;
  phone?: string;
  category?: Category;
  mode: Mode;
  role?: "spouse" | "aide";
  title?: string;
};

export type ImportResult = { added: number; skipped: { row: number; name: string; reason: string }[] };

export const categoryName: Record<Category, string> = { delegate: "Delegate", minister: "Minister", international: "International" };
