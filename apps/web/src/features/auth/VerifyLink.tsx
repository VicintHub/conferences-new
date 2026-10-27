"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Confirmation } from "@/features/register/Confirmation";
import { verifyLink } from "@/features/register/api";
import type { RegistrationResult } from "@/features/register/schema";
import { ApiError } from "@/lib/api";
import { saveTicket } from "@/lib/ticket";
import { AuthShell } from "./AuthShell";

/**
 * Landing page for the emailed link. The token is only spent by this POST (never by the GET), so
 * mail scanners that pre-fetch links can't consume it.
 */
export function VerifyLink() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [state, setState] = useState<
    { status: "verifying" } | { status: "error"; message: string } | { status: "done"; result: RegistrationResult }
  >({ status: "verifying" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // Strict Mode runs effects twice; the link is single-use.
    started.current = true;
    if (!email || !token) return setState({ status: "error", message: "This sign-in link is incomplete." });
    verifyLink(email, token)
      .then((result) => {
        saveTicket({
          claim_code: result.data.claim_code,
          first_name: result.data.attendee.first_name,
          category: result.data.category,
          mode: result.data.mode,
        });
        setState({ status: "done", result });
      })
      .catch((e: ApiError) =>
        setState({ status: "error", message: e.status === 422 ? "This link has expired or was already used." : e.message }),
      );
  }, [email, token]);

  if (state.status === "done") return <Confirmation result={state.result} />;

  return (
    <AuthShell title={state.status === "verifying" ? "Signing you in…" : "We couldn’t sign you in"}>
      {state.status === "verifying" ? (
        <p role="status" className="text-[15px] text-ink-500">
          One moment.
        </p>
      ) : (
        <>
          <p role="alert" className="text-[15px] text-brick-600">
            {state.message}
          </p>
          <Button href="/login" size="lg" fullWidth>
            Get a new code
          </Button>
        </>
      )}
    </AuthShell>
  );
}
