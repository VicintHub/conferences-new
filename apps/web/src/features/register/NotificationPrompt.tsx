"use client";

import { Bell, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { isIosSafari, isStandalone, requestNotifications, useInstallPrompt } from "@/lib/pwa";

const perks = ["Your ticket, always on hand", "Daily programme each morning", "Alert when the stream starts"];
const installSteps = [
  { n: "1", t: "Opens like an app", s: "One tap from your home screen" },
  { n: "2", t: "Works on weak signal", s: "Your pass loads offline at the gate" },
  { n: "3", t: "Alerts that matter", s: "Reminders and live updates only" },
];

const PREF_KEY = "jc27.notifications";
const remember = (v: string) => {
  try {
    localStorage.setItem(PREF_KEY, v);
  } catch {
    // preference is best-effort
  }
};

/**
 * Shown right after registration. Permission is only requested from the button (user gesture).
 * iOS Safari can't prompt for install, so it gets the add-to-home-screen card (2f) instead of the sheet (2e).
 */
export function NotificationPrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const install = useInstallPrompt();
  const [iosCard] = useState(() => isIosSafari() && !isStandalone());

  const enable = async () => {
    if (install.canPrompt) await install.prompt();
    const result = await requestNotifications();
    remember(result);
    onClose();
  };
  const later = () => {
    remember("dismissed");
    onClose();
  };

  if (iosCard) {
    return (
      <Sheet
        open={open}
        onOpenChange={(o) => !o && later()}
        title="Add to your home screen"
        description="Jan. Conf 2027 works best as an app."
      >
        <div className="mt-5 flex flex-col gap-[18px]">
          <div className="-mx-6 -mt-2 flex items-center gap-4 bg-cobalt-900 px-6 py-6 text-cream-50">
            <span className="flex size-16 flex-none items-center justify-center rounded-[22px] bg-white">
              <Image src="/images/miv-logo.png" alt="" width={52} height={52} className="size-[52px] object-contain" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-[22px] font-bold">JAN. CONF 2027</span>
              <span className="text-[13px] text-cobalt-200">Add to your home screen</span>
            </span>
          </div>
          {installSteps.map((s) => (
            <div key={s.n} className="flex items-start gap-3.5">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-cobalt-50 font-display text-sm font-bold text-cobalt-700">
                {s.n}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-ink-900">{s.t}</span>
                <span className="text-[13px] text-ink-400">{s.s}</span>
              </span>
            </div>
          ))}
          <p className="rounded-xl bg-cobalt-50 p-3 text-sm text-cobalt-800">
            Tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong>. Open the app from there to allow
            alerts.
          </p>
          <Button size="lg" fullWidth onClick={later}>
            Got it
          </Button>
          <button type="button" onClick={later} className="text-center text-sm font-semibold text-ink-400">
            Maybe later
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && later()}
      title="Stay in the loop"
      description="Reminders, programme changes and when the stream goes live."
      icon={
        <span className="flex size-14 items-center justify-center rounded-[22px] bg-cobalt-50 text-cobalt-700">
          <Bell size={28} strokeWidth={2} />
        </span>
      }
    >
      <ul className="mt-4 flex flex-col gap-2.5">
        {perks.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
            <Check size={18} strokeWidth={2.5} className="text-brick-600" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-3">
        <Button size="lg" fullWidth onClick={enable}>
          Turn on notifications
        </Button>
        <button type="button" onClick={later} className="text-center text-sm font-semibold text-ink-400">
          Not now
        </button>
      </div>
    </Sheet>
  );
}
