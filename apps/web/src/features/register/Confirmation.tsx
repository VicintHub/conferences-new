"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { QR } from "@/components/ui";
import { NotificationPrompt } from "./NotificationPrompt";
import type { RegistrationResult } from "./schema";

const categoryLabel = { delegate: "Delegate", international: "International delegate", minister: "Minister" } as const;

export function Confirmation({ result }: { result: RegistrationResult }) {
  const returning = result.meta.existing_account;
  const { data, meta } = result;
  const [promptOpen, setPromptOpen] = useState(true);

  return (
    <div className="flex min-h-[100svh] flex-col items-center bg-cobalt-900 px-6 pt-[72px] text-center text-cream-50">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-3.5">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-600">
          <Check size={32} strokeWidth={2.5} className="text-white" />
        </span>
        <h1 className="text-[30px] font-bold leading-[1.15]">
          {returning ? "Welcome back" : "You’re in"}, {data.attendee.first_name}
        </h1>
        <p className="text-[15px] text-cobalt-200">
          {returning ? "You’re signed in. Here’s your claim ticket." : "Claim ticket sent to your email"}
        </p>
        {meta.downgraded_to_online && (
          <p role="status" className="rounded-xl bg-white/10 px-4 py-3 text-sm text-cream-50">
            Onsite places filled up just before you finished, so you’re registered to attend online. We’ll tell you if onsite places open
            up.
          </p>
        )}
        <div className="mt-2.5 flex w-full items-center gap-4 rounded-[22px] bg-white p-5 text-left text-ink-900">
          <QR value={data.claim_code} size={88} label={`Claim ticket ${data.claim_code}`} />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium tracking-[0.08em] text-ink-400">CLAIM TICKET</span>
            <span className="font-display text-[22px] font-bold text-cobalt-900">{data.claim_code}</span>
            <span className="text-[13px] text-ink-500">
              {categoryLabel[data.category as keyof typeof categoryLabel] ?? data.category} · {data.mode === "onsite" ? "Onsite" : "Online"}
            </span>
          </div>
        </div>
      </div>
      {!returning && <NotificationPrompt open={promptOpen} onClose={() => setPromptOpen(false)} />}
    </div>
  );
}
