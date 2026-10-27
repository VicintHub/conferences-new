"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { AuthShell } from "@/features/auth/AuthShell";
import { ApiError } from "@/lib/api";
import { verifyStaffLink } from "./api";

/** The emailed link. The token is only spent by this POST, so mail scanners that open links can't use it up. */
export function AdminVerifyLink() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!email || !token) return setError("This sign-in link is incomplete.");
    verifyStaffLink(email, token)
      .then(() => router.replace("/admin"))
      .catch((e: ApiError) => setError(e.status === 422 ? "This link has expired or was already used." : e.message));
  }, [email, token, router]);

  return (
    <AuthShell title={error ? "We couldn’t sign you in" : "Signing you in…"}>
      {error ? (
        <>
          <p role="alert" className="text-[15px] text-brick-600">
            {error}
          </p>
          <Button href="/admin/login" size="lg" fullWidth>
            Get a new code
          </Button>
        </>
      ) : (
        <p role="status" className="text-[15px] text-ink-500">
          One moment.
        </p>
      )}
    </AuthShell>
  );
}
