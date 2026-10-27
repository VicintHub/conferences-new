"use client";

import { useState } from "react";
import { Checkbox, Chip, OptionCard, Switch } from "@/components/ui";
import { conferenceDays, type RegistrationDraft } from "./schema";
import type { Capacity } from "./api";

type Values = Pick<RegistrationDraft, "mode" | "days" | "needs_accommodation" | "consent">;

type Props = {
  id: string;
  defaults: Values;
  capacity: Capacity["data"]["onsite"] | undefined;
  capacityFailed: boolean;
  onSubmit: (v: Values) => void;
};

const nf = new Intl.NumberFormat("en-NG");

export function AttendanceStep({ id, defaults, capacity, capacityFailed, onSubmit }: Props) {
  const full = capacity?.full ?? false;
  const [mode, setMode] = useState<Values["mode"]>(full ? "online" : defaults.mode);
  const [days, setDays] = useState<string[]>(defaults.days);
  const [accom, setAccom] = useState(defaults.needs_accommodation);
  const [consent, setConsent] = useState(defaults.consent);
  const [error, setError] = useState<string>();
  const [consentError, setConsentError] = useState<string>();
  const effectiveMode = full ? "online" : mode;
  const pct = capacity ? Math.min(100, Math.round((capacity.taken / capacity.limit) * 100)) : 0;

  return (
    <form
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (days.length === 0) return setError("Pick at least one day");
        if (!consent) return setConsentError("Please agree to continue");
        onSubmit({ mode: effectiveMode, days, needs_accommodation: accom, consent: true });
      }}
      className="flex flex-col gap-3.5"
    >
      <div role="radiogroup" aria-label="How will you attend" className="flex flex-col gap-3.5">
        <OptionCard title="Onsite in Ibadan" selected={effectiveMode === "onsite"} disabled={full} onSelect={() => setMode("onsite")}>
          {capacity ? (
            <span className="flex flex-col gap-1.5">
              <span
                className="h-2 overflow-hidden rounded bg-ink-100"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Onsite places taken"
              >
                <span className="block h-full bg-cobalt-600" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-xs font-medium uppercase text-ink-500">
                {full
                  ? "Onsite places are full — join online"
                  : `${nf.format(capacity.taken)} / ${nf.format(capacity.limit)} onsite places taken`}
              </span>
            </span>
          ) : (
            <span className="text-xs font-medium text-ink-400">
              {capacityFailed ? "Couldn’t load availability. If onsite is full we’ll register you online." : "Checking availability…"}
            </span>
          )}
        </OptionCard>
        <OptionCard
          title="Online"
          description="Livestream + radio. Switch later."
          selected={effectiveMode === "online"}
          onSelect={() => setMode("online")}
        />
      </div>

      <span className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600 md:text-xs">Days you can come</span>
      <div className="flex flex-wrap gap-2">
        {conferenceDays.map((d) => (
          <Chip
            key={d.iso}
            selected={days.includes(d.iso)}
            onClick={() => {
              setError(undefined);
              setDays((cur) => (cur.includes(d.iso) ? cur.filter((x) => x !== d.iso) : [...cur, d.iso]));
            }}
          >
            {d.label}
          </Chip>
        ))}
      </div>
      {error && (
        <span role="alert" className="text-sm text-brick-600">
          {error}
        </span>
      )}

      <div className="mt-1.5">
        <Switch label="I need accommodation" checked={accom} onChange={setAccom} />
      </div>
      <div className="mt-2">
        <Checkbox
          label="I agree to the privacy notice and to receive conference messages."
          checked={consent}
          onChange={(v) => {
            setConsent(v);
            setConsentError(undefined);
          }}
          error={consentError}
        />
      </div>
    </form>
  );
}
