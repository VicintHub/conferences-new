"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { Badge, QR } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dayParts, shortName, venueDate } from "@/lib/time";
import { PickupList } from "@/features/shop/PickupList";
import { useMe } from "./queries";
import { categoryLabel, type Me } from "./types";
import { ErrorNote, SkeletonBlock } from "./ui";
import { useNow } from "./useNow";

const steps = ["Show this at any print desk", "Staff check your ID", "Your printed badge replaces this ticket"];

/** Claim ticket (design 4a): wallet-style, cobalt ground, works offline. */
function ClaimTicket({ me }: { me: Me }) {
  const meta = [
    { k: "NAME", v: shortName(me.attendee.full_name) },
    { k: "TYPE", v: categoryLabel[me.category] },
    { k: "MODE", v: me.mode === "onsite" ? "Onsite" : "Online" },
  ];
  return (
    <div className="flex flex-1 flex-col gap-[18px] bg-cobalt-900 px-5 pb-5 pt-[60px] lg:items-center lg:pt-12">
      <div className="flex items-center justify-between text-cream-50 lg:w-full lg:max-w-[420px]">
        <h1 className="text-[23px] font-bold leading-[1.15]">My pass</h1>
        <span className="text-xs font-medium text-cobalt-300">WORKS OFFLINE</span>
      </div>
      <div className="overflow-hidden rounded-[20px] bg-white shadow-xl lg:w-full lg:max-w-[420px]">
        <div className="flex items-center justify-between border-b-[1.5px] border-dashed border-cream-300 px-[22px] py-5">
          <div className="flex items-center gap-2.5">
            <Image src="/images/miv-logo.png" alt="" width={34} height={34} className="size-[34px] object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-bold text-cobalt-900">JAN. CONF 2027</span>
              <span className="text-[10px] font-medium text-ink-400">19–24 JAN · IBADAN</span>
            </div>
          </div>
          <Badge tone="warning">Claim ticket</Badge>
        </div>
        <div className="flex flex-col items-center gap-4 px-[22px] py-[26px]">
          <QR value={me.claim_code} size={220} label={`Claim ticket QR code ${me.claim_code}`} />
          <span className="text-lg font-semibold tracking-[0.06em] text-ink-900">{me.claim_code}</span>
        </div>
        <dl className="grid grid-cols-3 border-t border-cream-200">
          {meta.map((m) => (
            <div key={m.k} className="flex flex-col gap-0.5 border-r border-cream-200 px-4 py-3.5 last:border-r-0">
              <dt className="text-[10px] font-medium tracking-[0.08em] text-ink-400">{m.k}</dt>
              <dd className="text-sm font-semibold text-ink-900">{m.v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ol className="flex flex-col gap-3 px-1 pt-1 lg:w-full lg:max-w-[420px]">
        {steps.map((t, i) => (
          <li key={t} className="flex items-center gap-3 text-cream-50">
            <span className="flex size-[26px] flex-none items-center justify-center rounded-full border-[1.5px] border-white/30 font-display text-[13px] font-bold">
              {i + 1}
            </span>
            <span className="text-sm text-cobalt-100">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Active badge (design 4b), shown once the print desk has issued it. */
function ActiveBadge({ me, now }: { me: Me; now: number }) {
  const d = dayParts(venueDate(new Date(now).toISOString()));
  return (
    <div className="flex flex-1 flex-col gap-4 bg-white px-5 pb-5 pt-[60px] lg:mx-auto lg:w-full lg:max-w-[460px] lg:pt-12">
      <div className="flex items-center justify-between">
        <h1 className="text-[23px] font-bold leading-[1.15] text-cobalt-900">My badge</h1>
        <Badge tone="success" dot>
          Active
        </Badge>
      </div>
      <div className="relative flex flex-col gap-[18px] overflow-hidden rounded-[20px] bg-cobalt-800 p-[22px] text-cream-50 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brick-600" />
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cobalt-300">{categoryLabel[me.category]}</span>
            <span className="text-[25px] font-bold leading-[1.15]">{me.attendee.full_name}</span>
            {me.attendee.church && <span className="text-[13px] text-cobalt-200">{me.attendee.church}</span>}
          </div>
          <Image src="/images/miv-logo.png" alt="" width={48} height={48} className="size-12 object-contain" />
        </div>
        <div className="self-center rounded-2xl bg-white p-2.5">
          <QR value={me.claim_code} size={190} label={`Badge QR code ${me.claim_code}`} />
        </div>
        <span className="self-center text-xs font-medium text-cobalt-300">ONE CODE · GATE · HALL · MEAL · MERCH</span>
      </div>
      <h2 className="text-base font-bold uppercase text-ink-900">
        Today · {d.dow} {d.n}
      </h2>
      <ul className="grid grid-cols-2 gap-2.5">
        {me.access.map((a) => (
          <li key={a.key} className="flex items-center gap-2.5 rounded-[20px] border border-ink-100 bg-white p-3.5">
            <span
              className={cn(
                "flex size-[22px] items-center justify-center rounded-full",
                a.used ? "bg-ink-100 text-ink-400" : "bg-success-100 text-success-600",
              )}
            >
              <Check size={13} strokeWidth={3} />
            </span>
            <span className="text-sm font-semibold text-ink-800">{a.label}</span>
            <span className="sr-only">{a.used ? "used" : "available"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pass() {
  const { me, isPending, isError, refetch } = useMe();
  const now = useNow(60_000);

  if (isError && !me)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => refetch()} />
      </div>
    );
  if (isPending || !me || now === null) {
    return (
      <div className="flex flex-1 flex-col gap-4 bg-cobalt-900 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-8 w-40 bg-white/10" />
        <SkeletonBlock className="h-[420px] bg-white/10" />
      </div>
    );
  }
  return (
    <>
      {me.badge ? <ActiveBadge me={me} now={now} /> : <ClaimTicket me={me} />}
      <PickupList />
    </>
  );
}
