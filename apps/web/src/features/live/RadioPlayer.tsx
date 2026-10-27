"use client";

import { Pause, Play, Share2, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { shareLink } from "@/lib/share";

type Props = {
  url: string | null;
  live: boolean;
  title: string;
  onPlayingChange?: (playing: boolean) => void;
};

const BARS = [12, 20, 28, 16, 34, 22, 30, 14, 26, 36, 18, 24, 32, 12, 28, 20, 34, 16, 22, 14];

/** Audio-only mode (design 11b): about 1 MB a minute, and it keeps playing with the screen off via the media session. */
export function RadioPlayer({ url, live, title, onPlayingChange }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    onPlayingChange?.(playing);
    return () => onPlayingChange?.(false);
  }, [playing, onPlayingChange]);

  // Lock-screen and headset controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Jan. Conf Radio",
      artwork: [{ src: "/images/miv-logo.png", sizes: "512x512", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("play", () => void audio.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.current?.pause());
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, [title]);

  const toggle = async () => {
    const el = audio.current;
    if (!el || !url) return;
    setFailed(false);
    if (el.paused) {
      try {
        if (!el.src) el.src = url;
        await el.play();
      } catch {
        setFailed(true);
      }
    } else el.pause();
  };

  const share = async () => {
    const r = await shareLink(`${window.location.origin}/app/live`, "Jan. Conf Radio");
    setNotice(r === "copied" ? "Link copied" : r === "failed" ? "Couldn’t share the link" : null);
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center text-white">
      <audio
        ref={audio}
        preload="none"
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
      />
      <div
        aria-hidden
        className={cn(
          "flex size-[230px] items-center justify-center rounded-full border border-white/15 bg-cobalt-800",
          "shadow-[0_0_0_18px_rgba(255,255,255,.04),0_0_0_40px_rgba(255,255,255,.025)]",
          playing && "motion-safe:animate-pulse",
        )}
      >
        <Image src="/images/miv-logo.png" alt="" width={150} height={150} className="size-[150px] object-contain" />
      </div>

      <span
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em]",
          live ? "bg-brick-600" : "bg-white/15",
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-white" />
        {live ? "ON AIR" : "OFF AIR"}
      </span>
      <h2 className="text-[28px] font-bold leading-tight">{title}</h2>
      <p className="-mt-3 text-[15px] text-cobalt-100">Jan. Conf Radio · uses about 1 MB a minute</p>

      <div aria-hidden className="flex h-10 items-center gap-1">
        {BARS.map((h, i) => (
          <span key={i} style={{ height: playing ? h : 6, transition: "height .4s ease" }} className="w-[3px] rounded-full bg-cobalt-300" />
        ))}
      </div>

      {!url && <p className="text-sm text-cobalt-100">Radio isn’t on air yet. It starts with the first session.</p>}
      {failed && (
        <p role="alert" className="text-sm text-brick-400">
          The radio stream isn’t loading. Check your connection and try again.
        </p>
      )}
      {notice && (
        <p role="status" className="text-xs text-cobalt-100">
          {notice}
        </p>
      )}

      <div className="mt-2 flex items-center gap-10">
        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          onClick={() => setMuted((m) => !m)}
          className="p-3 text-cream-50"
        >
          {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          disabled={!url}
          onClick={toggle}
          className="flex size-20 items-center justify-center rounded-full bg-cream-50 text-cobalt-900 disabled:opacity-40"
        >
          {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
        </button>
        <button type="button" aria-label="Share" onClick={share} className="p-3 text-cream-50">
          <Share2 size={24} />
        </button>
      </div>
    </div>
  );
}
