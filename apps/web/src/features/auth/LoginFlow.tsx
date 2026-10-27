"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { requestEmailCode, verifyCode } from "@/features/register/api";
import { OtpStep } from "@/features/register/OtpStep";
import { ApiError } from "@/lib/api";
import { saveTicket } from "@/lib/ticket";
import { AuthShell } from "./AuthShell";

const FORM_ID = "login-step";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function LoginFlow() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [sent, setSent] = useState<number>();
  const [codeError, setCodeError] = useState<string>();

  const send = useMutation({
    mutationFn: () => requestEmailCode(email.trim().toLowerCase()),
    onSuccess: (r) => setSent(r.resend_after),
    onError: (e: ApiError) => setEmailError(e.status === 429 ? "Too many attempts. Please wait a while and try again." : e.message),
  });

  const verify = useMutation({
    mutationFn: (code: string) => verifyCode(email.trim().toLowerCase(), code),
    onSuccess: (r) => {
      saveTicket({ claim_code: r.data.claim_code, first_name: r.data.attendee.first_name, category: r.data.category, mode: r.data.mode });
      router.push("/app");
    },
    onError: (e: ApiError) => setCodeError(e.message),
  });

  if (sent === undefined) {
    return (
      <AuthShell title="Sign in">
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!emailOk(email.trim())) return setEmailError("Enter a valid email address");
            setEmailError(undefined);
            send.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-[15px] text-ink-500">
            Enter the email you registered with. We’ll send a code and a sign-in link. No password needed.
          </p>
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
          <p className="text-center text-sm text-ink-500">
            New here?{" "}
            <a href="/register" className="font-semibold text-cobalt-700">
              Register free
            </a>
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Check your email">
      <OtpStep
        id={FORM_ID}
        email={email.trim().toLowerCase()}
        resendAfter={sent}
        error={codeError}
        onSubmit={(code) => {
          setCodeError(undefined);
          verify.mutate(code);
        }}
        onResend={async () => {
          await requestEmailCode(email.trim().toLowerCase());
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
