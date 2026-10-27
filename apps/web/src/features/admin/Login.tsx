"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { AuthShell } from "@/features/auth/AuthShell";
import { OtpStep } from "@/features/register/OtpStep";
import { ApiError } from "@/lib/api";
import { requestStaffCode, verifyStaffCode } from "./api";

const FORM_ID = "staff-login";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Same emailed code as attendees, but for people on the staff list. */
export function AdminLogin() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [sent, setSent] = useState<number>();
  const [codeError, setCodeError] = useState<string>();
  const address = email.trim().toLowerCase();

  const send = useMutation({
    mutationFn: () => requestStaffCode(address),
    onSuccess: (r) => setSent(r.resend_after),
    onError: (e: ApiError) => setEmailError(e.status === 429 ? "Too many attempts. Please wait a while and try again." : e.message),
  });
  const verify = useMutation({
    mutationFn: (code: string) => verifyStaffCode(address, code),
    // Only ever go to a path inside the staff tools.
    onSuccess: () => router.push(next && /^\/(admin|desk|scan)(\/|$)/.test(next) ? next : "/admin"),
    onError: (e: ApiError) => setCodeError(e.message),
  });

  if (sent === undefined) {
    return (
      <AuthShell title="Staff sign in">
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!emailOk(address)) return setEmailError("Enter a valid email address");
            setEmailError(undefined);
            send.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-[15px] text-ink-500">Enter your staff email. If it’s on the list, we’ll send a code and a sign-in link.</p>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
          <Button type="submit" size="lg" fullWidth disabled={send.isPending}>
            {send.isPending ? "Sending…" : "Email me a code"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Check your email">
      <OtpStep
        id={FORM_ID}
        email={address}
        resendAfter={sent}
        error={codeError}
        onSubmit={(code) => {
          setCodeError(undefined);
          verify.mutate(code);
        }}
        onResend={async () => {
          await requestStaffCode(address);
        }}
      />
      <Button type="submit" form={FORM_ID} size="lg" fullWidth disabled={verify.isPending}>
        {verify.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <button type="button" onClick={() => setSent(undefined)} className="text-center text-sm font-semibold text-ink-500">
        Use a different email
      </button>
    </AuthShell>
  );
}
