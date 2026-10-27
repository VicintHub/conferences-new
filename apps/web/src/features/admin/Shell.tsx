"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/time";
import { admin, json, useAdminMe } from "./api";
import { Loading, Problem } from "./ui";
import type { AreaKey } from "./types";

type NavItem = { label: string; href: string; area?: AreaKey; badge?: "approvals" | "testimonies" };

/** Same order as the design's sidebar. Overview is open to everyone; the rest follow the person's role. */
export const NAV: NavItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Registrants", href: "/admin/registrants", area: "registrants" },
  { label: "Approvals", href: "/admin/approvals", area: "approvals", badge: "approvals" },
  { label: "Teams", href: "/admin/teams", area: "teams" },
  { label: "Broadcasts", href: "/admin/broadcasts", area: "broadcasts" },
  { label: "Testimonies", href: "/admin/testimonies", area: "testimonies", badge: "testimonies" },
  { label: "Publicity kit", href: "/admin/publicity", area: "publicity" },
  { label: "Store orders", href: "/admin/orders", area: "orders" },
  { label: "Check-in & meals", href: "/admin/checkin", area: "checkin" },
  { label: "Settings", href: "/admin/settings", area: "settings" },
];

const isActive = (href: string, path: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

/** Admin console frame (design 15a): dark sidebar with counts, the signed-in person, and the page. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useAdminMe();

  if (me.isPending) {
    return (
      <div className="p-10">
        <Loading />
      </div>
    );
  }
  if (me.isError) {
    return (
      <div className="p-10">
        <Problem error={me.error} onRetry={() => me.refetch()} />
      </div>
    );
  }

  const staff = me.data.data;
  const badges = me.data.meta.badges;
  const items = NAV.filter((n) => !n.area || staff.areas.includes(n.area));
  // A direct link to an area the role can't use gets a clear message rather than a blank page.
  const current = NAV.find((n) => n.href !== "/admin" && isActive(n.href, pathname));
  const blocked = current?.area && !staff.areas.includes(current.area);

  const signOut = async () => {
    await admin("auth/logout", json("POST")).catch(() => {});
    qc.clear();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-[100svh] bg-cream-50 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 bg-cobalt-950 px-4 py-6 text-cobalt-200 lg:sticky lg:top-0 lg:h-[100svh] lg:overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <Image src="/images/miv-logo.png" alt="" width={36} height={36} className="size-9 object-contain" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[17px] font-bold text-cream-50">JAN. CONF 2027</span>
            <span className="text-xs text-cobalt-300">Admin</span>
          </span>
        </Link>
        <nav aria-label="Console" className="flex flex-wrap gap-1 lg:flex-col">
          {items.map((n) => {
            const count = n.badge ? badges[n.badge] : 0;
            const active = isActive(n.href, pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold",
                  active ? "bg-white/10 text-cream-50" : "hover:bg-white/5",
                )}
              >
                {n.label}
                {count > 0 && (
                  <span className="rounded-full bg-brick-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${count} waiting`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {(staff.areas.includes("desk") || staff.areas.includes("scan")) && (
          <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
            <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-cobalt-300">Door tools</p>
            {staff.areas.includes("desk") && (
              <Link href="/desk" className="rounded-xl px-4 py-3 text-[15px] font-semibold hover:bg-white/5">
                Print desk
              </Link>
            )}
            {staff.areas.includes("scan") && (
              <Link href="/scan" className="rounded-xl px-4 py-3 text-[15px] font-semibold hover:bg-white/5">
                Scanner
              </Link>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 lg:mt-auto">
          <span className="flex size-10 flex-none items-center justify-center rounded-full bg-cobalt-600 font-display text-sm font-bold text-white">
            {initials(staff.name)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-bold text-cream-50">{staff.name}</span>
            <span className="truncate text-xs text-cobalt-300">{staff.title}</span>
          </span>
        </div>
        <button type="button" onClick={signOut} className="-mt-3 self-start px-3 text-xs font-semibold text-cobalt-300 hover:text-cream-50">
          Sign out
        </button>
      </aside>
      <main className="min-w-0 px-6 py-8 lg:px-10">
        {blocked ? <Problem error={Object.assign(new Error("forbidden"), { status: 403 })} /> : children}
      </main>
    </div>
  );
}
