"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Segmented, Sheet } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useChangeMode, useMe, useSignOut } from "./queries";
import { Chevron, ErrorNote, PageHeading, SkeletonBlock } from "./ui";

type Item = { i: string; t: string; href?: string; value?: string; onClick?: () => void };

function Group({ items }: { items: Item[] }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white">
      {items.map((m) => {
        const inner = (
          <>
            <span className="flex size-8 flex-none items-center justify-center rounded-[9px] bg-cobalt-50 font-display text-[13px] font-bold text-cobalt-700">
              {m.i}
            </span>
            <span className="flex-1 text-base font-medium text-ink-900">{m.t}</span>
            {m.value && <span className="text-[13px] text-ink-400">{m.value}</span>}
            <Chevron className="size-[18px]" />
          </>
        );
        const cls = "flex w-full items-center gap-3.5 border-b border-ink-50 px-4 py-3.5 text-left last:border-b-0";
        return m.href ? (
          <Link key={m.t} href={m.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={m.t} type="button" onClick={m.onClick} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export function More() {
  const { me, isPending, isError, refetch } = useMe();
  const change = useChangeMode();
  const signOut = useSignOut();
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [notifications, setNotifications] = useState("");

  useEffect(() => {
    setNotifications(typeof Notification === "undefined" ? "Unavailable" : Notification.permission === "granted" ? "On" : "Off");
  }, []);

  if (isError && !me)
    return (
      <div className="p-5 pt-[60px]">
        <ErrorNote onRetry={() => refetch()} />
      </div>
    );
  if (isPending || !me) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-[60px]" aria-busy="true">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-48" />
      </div>
    );
  }

  const mode = me.mode === "onsite" ? "Onsite" : "Online";
  return (
    <div className="flex flex-col gap-[18px] px-5 pb-5 pt-[60px] lg:mx-auto lg:w-full lg:max-w-[560px] lg:pt-9">
      <PageHeading>More</PageHeading>
      <Group
        items={[
          { i: "T", t: "My team", href: "/app/team" },
          { i: "V", t: "Apply: VIP, speaker, vendor, media", href: "/app/apply" },
          { i: "A", t: "Attending card", href: "/app/attending-card" },
          { i: "B", t: "Programme booklet", href: "/app/booklet", value: "PDF" },
        ]}
      />
      <Group
        items={[
          { i: "T", t: "Testimonies & feedback", href: "/app/testimonies" },
          { i: "P", t: "Publicity kit", href: "/app/publicity" },
          { i: "H", t: "Hotels & travel", href: "/app/hotels" },
          { i: "S", t: "Store", href: "/shop" },
          { i: "M", t: "Venue map", href: "/app/hotels#getting-there" },
        ]}
      />
      <Group
        items={[
          { i: "O", t: "Attendance", value: mode, onClick: () => setAttendanceOpen(true) },
          { i: "N", t: "Notifications", value: notifications },
          { i: "?", t: "Help", href: "/app/help" },
        ]}
      />
      <button type="button" onClick={signOut} className="self-center py-2 text-sm font-semibold text-ink-500">
        Sign out
      </button>

      <Sheet
        open={attendanceOpen}
        onOpenChange={setAttendanceOpen}
        title="How are you attending?"
        description="You can switch any time while places last."
      >
        <div className="mt-5 flex flex-col gap-4">
          <Segmented
            label="Attendance"
            value={me.mode}
            onChange={(m) => change.mutate(m)}
            options={[
              { value: "onsite", label: "Onsite in Ibadan" },
              { value: "online", label: "Online" },
            ]}
          />
          {change.error instanceof ApiError && (
            <p role="alert" className="text-sm text-brick-600">
              {change.error.status === 409 ? "Onsite places are full, so you’ll stay online." : change.error.message}
            </p>
          )}
          <Button fullWidth variant="outline" onClick={() => setAttendanceOpen(false)}>
            Done
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
