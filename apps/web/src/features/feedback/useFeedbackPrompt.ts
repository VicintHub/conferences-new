"use client";

import { useEffect, useState } from "react";
import { useMe, useProgramme } from "@/features/app/queries";
import { useNow } from "@/features/app/useNow";
import { pendingFeedbackSession, readSkipped } from "./prompt";
import { useFeedbackState } from "./queries";

/** Decides, once a minute, whether to show the session feedback sheet. Never while offline or before data has loaded. */
export function useFeedbackPrompt() {
  const { me, stale } = useMe();
  const { days } = useProgramme();
  const signedIn = !!me && !stale;
  const state = useFeedbackState(signedIn);
  const now = useNow(60_000);
  const [skipped, setSkipped] = useState<number[]>([]);
  useEffect(() => setSkipped(readSkipped()), []);

  const session =
    signedIn && state.data && now !== null
      ? pendingFeedbackSession(days, now, state.data.session_ids, skipped, state.data.prompt_delay_minutes)
      : undefined;
  return { session, highlights: state.data?.highlights ?? [], dismiss: () => session && setSkipped((s) => [...s, session.id]) };
}
