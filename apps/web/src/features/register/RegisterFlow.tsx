"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { saveTicket } from "@/lib/ticket";
import { AboutStep } from "./AboutStep";
import { AttendanceStep } from "./AttendanceStep";
import { CategoryStep } from "./CategoryStep";
import { Confirmation } from "./Confirmation";
import { Frame } from "./Frame";
import { OtpStep } from "./OtpStep";
import { fetchCapacity, requestEmailCode, startRegistration, verifyCode } from "./api";
import { categories, initialDraft, toPayload, type RegistrationDraft, type RegistrationResult } from "./schema";

const titles = ["I’m registering as", "About you", "How will you attend?", "Enter the code"];
const FORM_ID = "register-step";

export function RegisterFlow() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<RegistrationDraft>(initialDraft);
  const [resendAfter, setResendAfter] = useState(60);
  const [otpError, setOtpError] = useState<string>();
  const [result, setResult] = useState<RegistrationResult>();

  const capacity = useQuery({ queryKey: ["capacity"], queryFn: fetchCapacity, enabled: step >= 3, refetchInterval: 30_000 });
  const email = draft.email.trim().toLowerCase();

  // Creates the pending registration and emails the code + link.
  const sendCode = useMutation({
    mutationFn: () => startRegistration(toPayload(draft)),
    onSuccess: (r) => {
      setResendAfter(r.resend_after);
      setStep(4);
    },
  });

  const register = useMutation({
    mutationFn: (code: string) => verifyCode(email, code),
    onSuccess: (r) => {
      saveTicket({ claim_code: r.data.claim_code, first_name: r.data.attendee.first_name, category: r.data.category, mode: r.data.mode });
      setResult(r);
    },
    onError: (e: ApiError) => setOtpError(e.message),
  });

  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const onSubmitOtp = useCallback(
    (code: string) => {
      setOtpError(undefined);
      register.mutate(code);
    },
    [register],
  );

  if (result) return <Confirmation result={result} />;

  const categoryLabel = categories.find((c) => c.value === draft.category)?.title ?? "";
  const busy = sendCode.isPending || register.isPending;
  const nextLabel =
    step === 4 ? (register.isPending ? "Registering…" : "Finish registration") : sendCode.isPending ? "Sending code…" : "Continue";

  return (
    <Frame
      step={step}
      title={titles[step - 1]}
      categoryLabel={categoryLabel}
      onBack={back}
      footer={
        <>
          {sendCode.isError && (
            <p role="alert" className="mb-3 text-center text-sm text-brick-600">
              {sendCode.error instanceof ApiError && sendCode.error.status === 422
                ? Object.values(sendCode.error.fieldErrors)[0]
                : sendCode.error instanceof ApiError && sendCode.error.status === 429
                  ? "Too many attempts. Please wait a while and try again."
                  : sendCode.error.message}
            </p>
          )}
          <Button type="submit" form={FORM_ID} size="lg" fullWidth disabled={busy}>
            {nextLabel}
          </Button>
        </>
      }
    >
      {step === 1 && (
        <CategoryStep
          id={FORM_ID}
          value={draft.category}
          onChange={(category) => setDraft((d) => ({ ...d, category }))}
          onSubmit={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <AboutStep
          id={FORM_ID}
          defaults={draft}
          onSubmit={(v) => {
            setDraft((d) => ({ ...d, ...v }));
            setStep(3);
          }}
        />
      )}
      {step === 3 && (
        <AttendanceStep
          id={FORM_ID}
          defaults={draft}
          capacity={capacity.data?.data.onsite}
          capacityFailed={capacity.isError}
          onSubmit={(v) => {
            setDraft((d) => ({ ...d, ...v }));
            sendCode.mutate();
          }}
        />
      )}
      {step === 4 && (
        <OtpStep
          id={FORM_ID}
          email={email}
          resendAfter={resendAfter}
          error={otpError}
          onSubmit={onSubmitOtp}
          onResend={async () => {
            await requestEmailCode(email);
          }}
        />
      )}
    </Frame>
  );
}
