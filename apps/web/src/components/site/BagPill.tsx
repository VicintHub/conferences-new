"use client";

import Link from "next/link";
import { useBag } from "@/features/shop/bag";

/** "Bag · 2" pill in the shop header (design 8a). */
export function BagPill() {
  const { count } = useBag();
  return (
    <Link
      href="/shop/checkout"
      className="flex items-center gap-2 rounded-full bg-white/10 px-[18px] py-2.5 text-[15px] font-semibold hover:bg-white/15"
    >
      Bag · {count}
    </Link>
  );
}
