export type AreaKey =
  | "registrants"
  | "approvals"
  | "teams"
  | "orders"
  | "broadcasts"
  | "testimonies"
  | "publicity"
  | "settings"
  | "staff"
  | "desk"
  | "scan"
  | "checkin"
  | "override";

export type Staff = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "registration" | "content" | "moderator" | "desk" | "supervisor";
  role_label: string;
  title: string;
  active: boolean;
  areas: AreaKey[];
};
export type AdminMe = { data: Staff; meta: { badges: { approvals: number; testimonies: number } } };

export type Overview = {
  days_to_opening: number;
  kpis: {
    registered: { value: number; today: number };
    onsite: { value: number; percent_of_cap: number };
    online: { value: number; today: number };
    awaiting_approval: { value: number; oldest_days: number | null };
  };
  series: { date: string; count: number }[];
  capacity: { taken: number; total: number; percent: number };
  categories: { key: string; label: string; count: number }[];
};

export type Paged<T> = { data: T[]; meta: { page: number; last_page: number; total: number } };

export type Registrant = {
  id: number;
  claim_code: string;
  name: string;
  email: string;
  phone: string | null;
  church: string | null;
  location: string | null;
  category: string;
  mode: string;
  status: string;
  needs_accommodation: boolean;
  minister_verified: boolean;
  registered_at: string;
};

export type TeamRow = {
  id: number;
  name: string;
  code: string;
  kind: string;
  leader: string;
  leader_email: string;
  members: number;
  confirmed: number;
};

export type OrderRow = {
  code: string;
  status: string;
  customer_name: string;
  customer_email: string;
  method: string;
  total_kobo: number;
  items: { name: string; variant_label: string | null; qty: number }[];
  paid_at: string | null;
  collected_at: string | null;
  created_at: string;
};

export type ApprovalItem = { key: string; kind: string; kind_label: string; name: string; subtitle: string; created_at: string };
export type ApprovalDetail = ApprovalItem & {
  heading: string;
  facts: { k: string; v: string }[];
  documents: { id: number; name: string; size: number; url: string }[];
  actions: ("approve" | "decline" | "check" | "review" | "request_info")[];
  requested_info: string | null;
  status: string;
  decision_note?: string | null;
};

export type BroadcastRow = {
  id: number;
  title: string;
  body: string;
  channels: string[];
  audience: string[];
  status: "scheduled" | "sending" | "sent" | "cancelled";
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  author: string | null;
  created_at: string;
};
export type BroadcastMeta = {
  channels: { key: string; label: string; available: boolean }[];
  audiences: { key: string; label: string }[];
};

export type ModTestimony = {
  id: number;
  type: "write" | "voice" | "video";
  body: string | null;
  author_name: string;
  display_name: string;
  label: string | null;
  tag: string | null;
  media_url: string | null;
  duration_seconds: number | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
};

export type PublicityRow = {
  id: number;
  slug: string;
  title: string;
  type: string;
  meta: string | null;
  preview: string | null;
  caption: string;
  status: "published" | "scheduled" | "draft";
  published_at: string | null;
  downloads: number;
  shares: number;
};
export type PublicityMeta = {
  downloads: number;
  shares: number;
  types: Record<string, string>;
  sizes: { key: string; label: string; dims: string }[];
};

export type Settings = {
  live: {
    is_live: boolean;
    title: string | null;
    video_url: string | null;
    radio_url: string | null;
    poster: string | null;
    video_kind: string | null;
  };
  replays: {
    id: number;
    title: string;
    recorded_on: string;
    duration_seconds: number;
    thumbnail: string | null;
    video_url: string | null;
    active: boolean;
  }[];
};
