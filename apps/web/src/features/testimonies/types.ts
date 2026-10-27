export type Testimony = {
  id: number;
  type: "write" | "voice" | "video";
  body: string | null;
  display_name: string;
  label: string | null;
  tags: string[];
  tag: string | null;
  amen_count: number;
  amened: boolean;
  featured: boolean;
  media_url: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
};

export type Feed = {
  data: Testimony[];
  featured: Testimony | null;
  meta: { next_cursor: string | null; tags: string[]; filters: string[] };
};

export const formatDuration = (s: number | null) => (s == null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
