import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";

/** Header for screens opened from More: back arrow (or close) and a title. */
export function AppSubHeader({ title, backHref = "/app/more", close }: { title: string; backHref?: string; close?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-[60px] lg:pt-9">
      <Link href={backHref} aria-label={close ? "Close" : "Back"} className="-ml-1 p-1 text-ink-900">
        {close ? <X size={24} /> : <ArrowLeft size={24} />}
      </Link>
      <h1 className="text-xl font-bold text-ink-900">{title}</h1>
    </div>
  );
}
