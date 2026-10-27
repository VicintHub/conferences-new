"use client";

import { ChevronLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Stepper } from "@/components/ui";
import { cn } from "@/lib/cn";

const rail = [
  { t: "Category", s: "Delegate" },
  { t: "About you", s: "Name, phone, church" },
  { t: "Attendance", s: "Onsite or online" },
  { t: "Verify", s: "Code by SMS" },
];

/** Desktop side rail (2g). */
function Rail({ step, categoryLabel }: { step: number; categoryLabel: string }) {
  return (
    <aside className="relative hidden flex-col gap-10 overflow-hidden bg-cobalt-900 p-10 text-cream-50 md:flex">
      <Image
        src="/images/miv-logo.png"
        alt=""
        width={360}
        height={360}
        aria-hidden
        className="pointer-events-none absolute -bottom-[90px] -right-[90px] size-[360px] object-contain opacity-[0.09]"
      />
      <Link href="/" className="flex items-center gap-3">
        <Image src="/images/miv-logo.png" alt="MIV" width={40} height={40} className="size-10 object-contain" />
        <span className="font-display text-lg font-bold uppercase">Jan. Conf 2027</span>
      </Link>
      <ol className="flex flex-col">
        {rail.map((r, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={r.t} className="flex gap-4" aria-current={current ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-[1.5px] font-display text-sm font-bold",
                    done && "border-success-600 bg-success-600 text-white",
                    current && "border-cream-50 bg-cream-50 text-cobalt-900",
                    !done && !current && "border-white/30 text-cobalt-300",
                  )}
                >
                  {done ? "✓" : n}
                </span>
                {i < rail.length - 1 && <span aria-hidden className="h-11 w-[1.5px] bg-white/15" />}
              </div>
              <div className="flex flex-col gap-0.5 pt-[5px]">
                <span className={cn("text-base font-semibold", n <= step ? "text-cream-50" : "text-cobalt-300")}>{r.t}</span>
                <span className="text-[13px] text-cobalt-300">{done && n === 1 ? categoryLabel : r.s}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-auto text-xs font-medium tracking-[0.08em] text-cobalt-300">FREE · TAKES ABOUT 2 MINUTES</p>
    </aside>
  );
}

type Props = {
  step: number;
  categoryLabel: string;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function Frame({ step, categoryLabel, title, onBack, children, footer }: Props) {
  return (
    <div className="min-h-[100svh] bg-white md:grid md:grid-cols-[420px_minmax(0,1fr)] md:bg-cream-50">
      <Rail step={step} categoryLabel={categoryLabel} />
      <div className="flex min-h-[100svh] flex-col">
        <header className="flex flex-col gap-3.5 px-5 pt-6 md:hidden">
          <div className="flex items-center justify-between">
            {step === 1 ? (
              <Link href="/" aria-label="Close" className="-ml-1 p-1 text-ink-800">
                <X size={24} />
              </Link>
            ) : (
              <button type="button" aria-label="Back" onClick={onBack} className="-ml-1 p-1 text-ink-800">
                <ChevronLeft size={24} />
              </button>
            )}
            <span className="text-xs font-medium text-ink-400">{step} OF 4</span>
          </div>
          <Stepper step={step} />
        </header>
        <main className="flex flex-1 flex-col gap-4 px-5 py-7 md:max-w-[620px] md:gap-[22px] md:px-20 md:py-14">
          <span className="eyebrow hidden md:block">Step {step} of 4</span>
          <h1 className="text-[26px] font-bold leading-[1.15] text-cobalt-900 md:font-display md:text-[44px] md:uppercase md:leading-none">
            {title}
          </h1>
          {children}
        </main>
        <footer className="px-5 pb-10 pt-3 md:max-w-[620px] md:px-20 md:pb-14">
          <div className="flex items-center justify-between gap-4">
            {step > 1 ? (
              <div className="hidden md:block">
                <button type="button" onClick={onBack} className="rounded-full px-5 py-3 font-bold text-cobalt-800 hover:bg-cobalt-50">
                  Back
                </button>
              </div>
            ) : (
              <span className="hidden md:block" />
            )}
            <div className="w-full md:w-auto">{footer}</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
