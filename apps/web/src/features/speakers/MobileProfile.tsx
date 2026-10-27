"use client";

import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { SpeakerPhoto } from "./SpeakerPhoto";
import { groupTag, type Speaker } from "./types";

/** Photo-led profile for phones (design 6c). Desktop opens a drawer on the list instead. */
export function MobileProfile({ speaker }: { speaker: Speaker }) {
  const [expanded, setExpanded] = useState(false);
  const [hint, setHint] = useState("");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: speaker.name, text: speaker.role, url });
      else {
        await navigator.clipboard.writeText(url);
        setHint("Link copied");
      }
    } catch {
      // the share sheet was dismissed
    }
  };
  const [first, ...rest] = speaker.bio;

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-white md:hidden">
      <div className="relative h-[400px] flex-none">
        <SpeakerPhoto name={speaker.name} src={speaker.photo_mobile ?? speaker.photo} sizes="100vw" priority />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,20,40,.5),transparent_30%)]" />
        <div className="absolute inset-x-5 top-[58px] flex justify-between">
          <Link
            href="/speakers"
            aria-label="Back to speakers"
            className="flex size-10 items-center justify-center rounded-full bg-white/90 text-ink-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <button
            type="button"
            onClick={share}
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded-full bg-white/90 text-ink-900"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
      <div className="relative -mt-7 flex flex-1 flex-col gap-3 rounded-t-[28px] bg-white px-5 pt-[26px]">
        <span className="self-start rounded-full bg-brick-100 px-3 py-[5px] text-xs font-bold text-brick-700">
          {groupTag[speaker.group].replace(" speaker", "")}
        </span>
        <h1 className="text-[26px] font-bold leading-[1.1] text-ink-900">{speaker.name}</h1>
        <span className="text-sm leading-[1.4] text-ink-500">{speaker.role}</span>
        <h2 className="mt-1.5 text-base font-bold text-ink-900">About</h2>
        <div className="flex flex-col gap-3 text-sm leading-[1.6] text-ink-600">
          <p className={expanded || rest.length === 0 ? undefined : "line-clamp-4"}>{first}</p>
          {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}
          {rest.length > 0 && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="self-start font-bold text-cobalt-700">
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
        {hint && (
          <span role="status" className="text-sm font-semibold text-success-600">
            {hint}
          </span>
        )}
      </div>
      <div className="bg-white px-5 pb-10 pt-3">
        <Button href="/#schedule" size="lg" fullWidth>
          See sessions
        </Button>
      </div>
    </div>
  );
}
