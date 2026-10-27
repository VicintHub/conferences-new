"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Phone header for inner public pages: back arrow + page title, optional trailing action. */
export function MobileTopBar({ title, backHref = "/", trailing }: { title: string; backHref?: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 md:hidden">
      <div className="flex items-center gap-3">
        <Link href={backHref} aria-label="Back" className="-ml-1 p-1 text-ink-900">
          <ArrowLeft size={24} />
        </Link>
        <span className="text-xl font-bold text-ink-900">{title}</span>
      </div>
      {trailing}
    </div>
  );
}
