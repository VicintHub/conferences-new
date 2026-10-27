"use client";

import { WifiOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchTravel } from "@/features/travel/api";
import { TabBar } from "@/components/ui";
import { SessionFeedbackSheet } from "@/features/feedback/SessionFeedbackSheet";
import { useFeedbackPrompt } from "@/features/feedback/useFeedbackPrompt";
import { categoryLabel } from "./types";
import { activeTab, sidebarItems } from "./nav";
import { useMe, useOnline } from "./queries";
import { cn } from "@/lib/cn";
import { initials, shortName } from "@/lib/time";

/** Mobile: content + bottom tab bar. ≥1024px: 240px sidebar mirroring the tabs (design 3e). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const online = useOnline();
  const { me, stale } = useMe();
  const prompt = useFeedbackPrompt();
  const qc = useQueryClient();

  // Once signed in and online, visit the core screens so the service worker has them for offline start-up.
  const signedIn = !!me && !stale;
  useEffect(() => {
    if (!signedIn || !navigator.onLine) return;
    for (const path of ["/app", "/app/programme", "/app/pass", "/app/more", "/app/hotels"]) {
      fetch(path, { headers: { Accept: "text/html" } }).catch(() => {});
    }
    // Hotels and shuttles matter most when data is poor, so keep a copy on the phone.
    void prefetchTravel(qc).catch(() => {});
  }, [signedIn, qc]);

  return (
    <div className="min-h-[100svh] bg-white lg:grid lg:h-[100svh] lg:grid-cols-[240px_minmax(0,1fr)] lg:bg-cream-50">
      <aside className="hidden flex-col gap-7 border-r border-ink-100 bg-white px-4 py-6 lg:flex">
        <Link href="/app" className="flex items-center gap-2.5 px-2">
          <Image src="/images/miv-logo.png" alt="MIV" width={36} height={36} className="size-9 object-contain" />
          <span className="font-display text-[17px] font-bold text-cobalt-900">JAN. CONF 2027</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-col gap-0.5">
          {sidebarItems.map((n) => {
            const active = n.match(pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-[15px] font-semibold",
                  active ? "bg-cobalt-50 text-cobalt-800" : "text-ink-600 hover:bg-ink-50",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        {me && (
          <Link href="/app/more" className="mt-auto flex items-center gap-2.5 rounded-[10px] bg-cream-100 p-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-cobalt-100 font-display text-sm font-bold text-cobalt-800">
              {initials(me.attendee.full_name)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ink-900">{shortName(me.attendee.full_name)}</span>
              <span className="text-xs text-ink-400">
                {categoryLabel[me.category]} · {me.mode === "onsite" ? "Onsite" : "Online"}
              </span>
            </span>
          </Link>
        )}
      </aside>

      <div className="flex min-h-[100svh] min-w-0 flex-col lg:h-[100svh] lg:min-h-0">
        {(!online || stale) && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-warning-100 px-4 py-2 text-[13px] font-semibold text-warning-600"
          >
            <WifiOff size={14} />
            {online ? "Can’t reach the server. Showing what’s saved on this phone." : "You’re offline. Your pass and programme still work."}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">{children}</div>
        {/* Full-screen flows (sharing a testimony, a single publicity item) hide the tab bar, as in the designs. */}
        {!pathname.endsWith("/share") && !/^\/app\/(publicity|hotels)\/[^/]+$/.test(pathname) && (
          <div className="lg:hidden">
            <TabBar active={activeTab(pathname)} />
          </div>
        )}
        <SessionFeedbackSheet session={prompt.session} highlights={prompt.highlights} onClose={prompt.dismiss} />
      </div>
    </div>
  );
}
