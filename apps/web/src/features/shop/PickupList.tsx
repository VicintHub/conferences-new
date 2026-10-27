"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { QR } from "@/components/ui";
import { fetchMyOrders } from "./api";

/** Paid merchandise orders on the attendee's pass, each with its pickup QR. Hidden when there are none or offline. */
export function PickupList() {
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: async () => (await fetchMyOrders()).data, retry: false });
  const paid = (data ?? []).filter((o) => o.status === "paid");
  if (paid.length === 0) return null;
  return (
    <section aria-label="Merchandise pickup" className="bg-cobalt-900 px-5 pb-8 pt-2 text-white">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-cobalt-100">Merch pickup</h2>
      <ul className="flex flex-col gap-3">
        {paid.map((o) => (
          <li key={o.code} className="flex items-center gap-4 rounded-2xl bg-white p-3 text-ink-900">
            <QR value={o.pickup_code} size={72} label={`Pickup code ${o.pickup_code}`} />
            <div className="flex min-w-0 flex-col">
              <Link href={`/shop/orders/${o.code}`} className="font-bold text-cobalt-700">
                {o.code}
              </Link>
              <span className="truncate text-sm text-ink-500">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</span>
              <span className="text-xs text-ink-400">Show at the merchandise desk</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
