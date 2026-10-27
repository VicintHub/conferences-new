"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShareForm } from "./ShareForm";
import { SuccessCard } from "./SuccessCard";

/** In-app "Share your testimony" (design 13b) with the success card (13e). */
export function AppShare() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[560px]">
      <div className="flex items-center justify-between px-5 pt-[60px] lg:pt-9">
        <Link href="/app/testimonies" aria-label="Close" className="p-1 text-ink-900">
          <X size={24} />
        </Link>
        <h1 className="text-[17px] font-bold text-ink-900">Share your testimony</h1>
        <span className="w-8" />
      </div>
      <div className="flex-1 overflow-auto px-5 py-[22px] pb-10">
        <ShareForm variant="full" signedIn onDone={() => setDone(true)} />
      </div>
      {done && <SuccessCard overlay actionLabel="Back to testimonies" onAction={() => router.replace("/app/testimonies")} />}
    </div>
  );
}
