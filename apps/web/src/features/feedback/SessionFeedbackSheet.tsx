"use client";

import { useState } from "react";
import { Button, Chip, Sheet } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { Session } from "@/features/app/types";
import { rememberSkipped } from "./prompt";
import { useSendSessionFeedback } from "./queries";
import { StarRating } from "./StarRating";

type Props = { session: Session | undefined; highlights: string[]; onClose: () => void };

/** "How was the …?" bottom sheet that pops up 10 minutes after a session ends (design 13c). */
export function SessionFeedbackSheet({ session, highlights, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const send = useSendSessionFeedback();

  const skip = () => {
    if (session) rememberSkipped(session.id);
    onClose();
  };

  return (
    <Sheet
      open={!!session}
      onOpenChange={(o) => !o && skip()}
      title={session ? `How was the ${session.title}?` : "Session feedback"}
      icon={
        session && (
          <span className="text-[13px] font-medium text-ink-400">
            Just ended{session.subtitle ? ` · ${session.subtitle.split(" · ")[0]}` : ""}
          </span>
        )
      }
    >
      {session && (
        <form
          className="mt-[18px] flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (rating === 0) return;
            send.mutate({ sessionId: session.id, rating, highlights: picked, comment }, { onSuccess: onClose });
          }}
        >
          <StarRating label="Rating" value={rating} onChange={setRating} className="justify-between" />
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-bold text-ink-900">What stood out?</span>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h) => (
                <Chip
                  key={h}
                  selected={picked.includes(h)}
                  onClick={() => setPicked((c) => (c.includes(h) ? c.filter((x) => x !== h) : [...c, h]))}
                >
                  {h}
                </Chip>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            aria-label="Anything we should improve?"
            placeholder="Anything we should improve? (optional)"
            className="min-h-[52px] resize-none rounded-2xl bg-ink-50 p-3.5 text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
          {send.error instanceof ApiError && (
            <p role="alert" className="text-sm text-brick-600">
              {send.error.message}
            </p>
          )}
          <Button type="submit" size="lg" fullWidth disabled={rating === 0 || send.isPending}>
            {send.isPending ? "Sending…" : "Send feedback"}
          </Button>
          <button type="button" onClick={skip} className="text-center text-sm font-semibold text-ink-400">
            Skip
          </button>
        </form>
      )}
    </Sheet>
  );
}
