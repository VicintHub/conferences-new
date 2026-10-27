export type VideoKind = "hls" | "file" | "embed";
export type Video = { kind: VideoKind; url: string };

export type Replay = {
  id: number;
  title: string;
  recorded_on: string;
  duration_seconds: number;
  thumbnail: string | null;
  /** Null until the recording has been published. */
  video: { kind: "hls" | "file"; url: string } | null;
};

export type LiveData = {
  is_live: boolean;
  title: string | null;
  poster: string | null;
  video: Video | null;
  radio: { url: string } | null;
  viewers: number;
  give_url: string | null;
  reminders: number[];
  replays: Replay[];
};

export const DEFAULT_POSTER = "/images/photos/lp-hero.webp";

/** 8048 → "2:14:08", 95 → "1:35". */
export function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}
