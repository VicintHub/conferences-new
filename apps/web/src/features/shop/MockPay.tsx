"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { completeMockPayment } from "./api";

/**
 * Stand-in for Paystack's hosted payment page, used while PAYMENT_DRIVER=fake. It reports the outcome to the API,
 * which settles the order through the same signed-webhook path as the real provider, then returns to the shop.
 */
export function MockPay() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? "";
  const callback = params.get("callback") ?? "";
  // Only ever return to this site: a crafted ?callback= must not become an open redirect.
  const safeCallback = callback.startsWith(typeof window === "undefined" ? "/" : window.location.origin) ? callback : "/shop";

  const finish = useMutation({
    mutationFn: (outcome: "success" | "failed" | "abandoned") => completeMockPayment(reference, outcome),
    onSuccess: () => window.location.assign(safeCallback),
  });

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-ink-50 px-5">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-7 shadow-lg">
        <span className="self-start rounded-full bg-warning-100 px-3 py-1 text-xs font-bold tracking-[0.06em] text-warning-600">
          TEST MODE · NOT REAL MONEY
        </span>
        <h1 className="text-2xl font-bold text-ink-900">Mock Paystack checkout</h1>
        <p className="text-sm leading-[1.5] text-ink-500">
          This page stands in for Paystack while the shop runs against the mock gateway. Pick what the customer does.
        </p>
        <p className="break-all rounded-xl bg-ink-50 p-3 text-xs text-ink-500">Reference: {reference || "missing"}</p>
        {finish.error instanceof ApiError && (
          <p role="alert" className="text-sm text-brick-600">
            {finish.error.status === 404 ? "The mock gateway isn’t enabled on this server." : finish.error.message}
          </p>
        )}
        <Button size="lg" fullWidth disabled={!reference || finish.isPending} onClick={() => finish.mutate("success")}>
          Pay (simulate success)
        </Button>
        <Button size="lg" fullWidth variant="outline" disabled={!reference || finish.isPending} onClick={() => finish.mutate("failed")}>
          Decline the card
        </Button>
        <Button size="lg" fullWidth variant="ghost" disabled={!reference || finish.isPending} onClick={() => finish.mutate("abandoned")}>
          Cancel
        </Button>
      </div>
    </main>
  );
}
