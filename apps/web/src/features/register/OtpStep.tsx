"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { codeSchema } from "./schema";

type Props = {
  id: string;
  email: string;
  resendAfter: number;
  error?: string;
  onSubmit: (code: string) => void;
  onResend: () => Promise<void>;
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Six-box code entry shared by registration and sign-in. The emailed link is the alternative to typing the code. */
export function OtpStep({ id, email, resendAfter, error, onSubmit, onResend }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [localError, setLocalError] = useState<string>();
  const [seconds, setSeconds] = useState(resendAfter);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = useCallback(
    (code: string) => {
      const parsed = codeSchema.safeParse({ code });
      if (!parsed.success) return setLocalError(parsed.error.issues[0].message);
      setLocalError(undefined);
      onSubmit(code);
    },
    [onSubmit],
  );

  const set = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (v.length > 1) {
      // Paste, or the browser's one-time-code autofill, into the first box.
      const code = v.slice(0, 6);
      setDigits(code.split("").concat(Array(6).fill("")).slice(0, 6));
      refs.current[Math.min(code.length, 5)]?.focus();
      if (code.length === 6) submit(code);
      return;
    }
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (v && i === 5) submit(next.join(""));
  };

  const message = localError ?? error;

  return (
    <form
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(digits.join(""));
      }}
      className="flex flex-col gap-3.5"
    >
      <p className="text-[15px] leading-[1.45] text-ink-500">
        We emailed a code to <strong className="font-semibold text-ink-800">{email}</strong>. Enter it here, or tap the link in the email.
      </p>
      <div className="mt-1.5 grid grid-cols-6 gap-2 md:max-w-sm" role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            maxLength={i === 0 ? 6 : 1}
            autoFocus={i === 0}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            className={cn(
              "h-14 min-w-0 rounded-[10px] border bg-white text-center font-display text-[26px] font-semibold text-ink-900 outline-none",
              "focus:border-2 focus:border-cobalt-600",
              message ? "border-brick-600" : "border-ink-100",
            )}
          />
        ))}
      </div>
      {message && (
        <span role="alert" className="text-sm text-brick-600">
          {message}
        </span>
      )}
      {seconds > 0 ? (
        <span className="text-[13px] font-medium text-ink-400">Resend in {fmt(seconds)}</span>
      ) : (
        <button
          type="button"
          onClick={async () => {
            try {
              await onResend();
              setSeconds(60);
              setLocalError(undefined);
            } catch {
              setLocalError("Couldn’t resend the code. Try again.");
            }
          }}
          className="self-start text-[13px] font-semibold text-cobalt-700"
        >
          Resend code
        </button>
      )}
      <p className="text-[13px] text-ink-400">Can’t find it? Check your spam folder.</p>
    </form>
  );
}
