"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Video } from "./types";

type Props = {
  video: Video | null;
  poster: string;
  /** Shown over the poster when there is nothing to play. */
  idle?: React.ReactNode;
  onPlayingChange?: (playing: boolean) => void;
  className?: string;
};

/**
 * Plays whatever the API says the stream is: HLS (hls.js outside Safari), a plain video file, or a YouTube/Vimeo
 * embed. Playback starts on a tap, as phones require, so it never surprises anyone with sound or data use.
 */
export function VideoPlayer({ video, poster, idle, onPlayingChange, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const key = video ? `${video.kind}:${video.url}` : "none";

  // A new source (a replay, or the stream going live) starts from the poster again.
  useEffect(() => {
    setStarted(false);
    setFailed(false);
  }, [key]);

  useEffect(() => {
    onPlayingChange?.(started && !failed);
    return () => onPlayingChange?.(false);
  }, [started, failed, onPlayingChange]);

  useEffect(() => {
    const el = ref.current;
    if (!started || !video || video.kind === "embed" || !el) return;
    let hls: { destroy(): void } | undefined;
    let cancelled = false;

    if (video.kind === "hls" && !el.canPlayType("application/vnd.apple.mpegurl")) {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setFailed(true);
        const h = new Hls({ lowLatencyMode: true });
        h.on(Hls.Events.ERROR, (_e, data) => data.fatal && setFailed(true));
        h.loadSource(video.url);
        h.attachMedia(el);
        hls = h;
        void el.play().catch(() => {});
      });
    } else {
      el.src = video.url;
      void el.play().catch(() => {});
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [started, video]);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-cobalt-950", className)}>
      {started && video?.kind === "embed" ? (
        <iframe
          title="Live stream"
          src={video.url}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : started && video ? (
        <video
          ref={ref}
          controls
          playsInline
          poster={poster}
          className="absolute inset-0 size-full bg-black object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- poster can be any admin-supplied URL
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      )}

      {!started && video && (
        <button
          type="button"
          aria-label="Play"
          onClick={() => setStarted(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/20 focus-visible:outline-none focus-visible:shadow-[var(--ring)]"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-cream-50/95 text-cobalt-900 shadow-lg">
            <Play size={28} fill="currentColor" aria-hidden />
          </span>
        </button>
      )}
      {!video && idle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-cobalt-950/70 px-6 text-center text-white">
          {idle}
        </div>
      )}
      {failed && (
        <p role="alert" className="absolute inset-x-0 bottom-0 bg-brick-600 px-4 py-2 text-center text-sm font-semibold text-white">
          The stream isn’t loading. Check your connection, or switch to Radio to use less data.
        </p>
      )}
    </div>
  );
}
