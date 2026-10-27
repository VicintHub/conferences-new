"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, QR } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { naira } from "@/lib/money";
import { attachOrder, verifyOrder } from "./api";
import { bag } from "./bag";

const POLL_MS = 3000;
const GIVE_UP_AFTER_POLLS = 30; // ~90 seconds of "confirming", then offer a manual retry

/**
 * Where Paystack sends the customer back. It asks the API to verify with the provider (never trusting the URL),
 * keeps checking while the payment settles, then shows the pickup QR (designs 7d / 8d) or what went wrong.
 */
export function OrderView({ code }: { code: string }) {
  const router = useRouter();
  const k = useSearchParams().get("k");
  const polls = useRef(0);

  const order = useQuery({
    queryKey: ["order", code, k],
    queryFn: async () => {
      polls.current += 1;
      return (await verifyOrder(code, k)).data;
    },
    refetchInterval: (q) => (q.state.data?.status === "pending" && polls.current < GIVE_UP_AFTER_POLLS ? POLL_MS : false),
    retry: false,
  });
  const data = order.data;

  useEffect(() => {
    if (data?.status === "paid" || data?.status === "collected") bag.clear();
  }, [data?.status]);

  const attach = useMutation({
    mutationFn: () => attachOrder(code, k),
    onError: (e: ApiError) => {
      if (e.status === 401) router.push(`/login?next=${encodeURIComponent(`/shop/orders/${code}${k ? `?k=${k}` : ""}`)}`);
    },
  });
  const [retrying, setRetrying] = useState(false);

  let card: React.ReactNode;
  if (order.isError) {
    const missing = order.error instanceof ApiError && order.error.status === 404;
    card = (
      <Card
        tone="warn"
        icon={<AlertCircle size={30} className="text-white" />}
        title={missing ? "We can’t find that order" : "We couldn’t load your order"}
      >
        <p className="text-sm leading-[1.5] text-ink-500">
          {missing ? "Check the link in your receipt email, or start again from the shop." : "Please check your connection and try again."}
        </p>
        <Button size="lg" fullWidth onClick={() => order.refetch()}>
          Try again
        </Button>
        <Button size="lg" fullWidth variant="ghost" href="/shop">
          Back to shop
        </Button>
      </Card>
    );
  } else if (!data) {
    card = (
      <Card tone="wait" icon={<Loader2 size={30} className="animate-spin text-white" />} title="Confirming your payment…">
        <p role="status" className="text-sm leading-[1.5] text-ink-500">
          Hang on, this usually takes a few seconds.
        </p>
      </Card>
    );
  } else if (data.status === "paid" || data.status === "collected") {
    const first = data.customer_name.split(" ")[0];
    card = (
      <>
        <div className="flex flex-col items-center gap-3.5 text-center lg:items-start lg:text-left">
          <span className="flex size-[88px] items-center justify-center rounded-full bg-cobalt-50 lg:size-16 lg:bg-cobalt-600">
            <span className="flex size-[60px] items-center justify-center rounded-full bg-cobalt-600 lg:size-16">
              <Check size={30} strokeWidth={3} className="text-white" />
            </span>
          </span>
          <h1 className="text-2xl font-bold text-cobalt-700 lg:hidden">Thank you!</h1>
          <h1 className="hidden font-display text-[40px] font-bold uppercase leading-[0.95] text-cobalt-900 lg:block">
            Thank you, {first}
          </h1>
          <p className="text-sm leading-[1.5] text-ink-500 lg:text-[15px]">
            Order <strong className="text-ink-800">{data.code}</strong> is {data.status === "collected" ? "collected" : "paid"} (
            {naira(data.total_kobo)}). <span className="lg:hidden">Show this code at the merchandise desk to collect.</span>
            <span className="hidden lg:inline">A receipt is on its way to your email. Show the code at the merchandise desk.</span>
          </p>
          <ul className="w-full text-left text-sm text-ink-600">
            {data.items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3 border-b border-ink-50 py-1.5">
                <span>
                  {i.name}
                  {i.variant_label ? ` · ${i.variant_label}` : ""} ×{i.qty}
                </span>
                <span>{naira(i.unit_price_kobo * i.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-[14px] border border-ink-100 p-2.5 lg:rounded-2xl">
            <QR value={data.pickup_code} size={150} label={`Pickup code ${data.pickup_code}`} />
          </div>
          <span className="text-sm font-semibold tracking-[0.06em] text-ink-700">{data.pickup_code}</span>
        </div>
        <div className="col-span-full flex w-full flex-col gap-2.5 lg:flex-row">
          {attach.isSuccess ? (
            <Button size="lg" fullWidth href="/app/pass">
              On your pass ✓ View pass
            </Button>
          ) : (
            <Button size="lg" fullWidth disabled={attach.isPending} onClick={() => attach.mutate()}>
              {attach.isPending ? "Adding…" : "Add to my pass"}
            </Button>
          )}
          <div className="w-full lg:hidden">
            <Button size="lg" fullWidth variant="ghost" href="/shop">
              Back to shop
            </Button>
          </div>
          <div className="hidden w-full lg:block">
            <Button size="lg" fullWidth variant="outline" href="/shop">
              Keep shopping
            </Button>
          </div>
        </div>
      </>
    );
  } else if (data.status === "pending") {
    const stalled = polls.current >= GIVE_UP_AFTER_POLLS;
    card = (
      <Card
        tone="wait"
        icon={<Loader2 size={30} className={stalled ? "text-white" : "animate-spin text-white"} />}
        title={stalled ? "Still waiting for Paystack" : "Confirming your payment…"}
      >
        <p role="status" className="text-sm leading-[1.5] text-ink-500">
          {stalled
            ? "We haven’t heard back yet. If you finished paying, check again in a moment. Your items are held for a short while."
            : "If you haven’t finished paying, you can go back to the payment page."}
        </p>
        {data.pay_url && (
          <Button size="lg" fullWidth href={data.pay_url}>
            Continue to payment
          </Button>
        )}
        <Button
          size="lg"
          fullWidth
          variant="outline"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            polls.current = 0;
            await order.refetch();
            setRetrying(false);
          }}
        >
          Check again
        </Button>
      </Card>
    );
  } else if (data.status === "refund_due" || data.status === "refunded") {
    card = (
      <Card
        tone="warn"
        icon={<AlertCircle size={30} className="text-white" />}
        title={data.status === "refunded" ? "This order was refunded" : "We’ll refund you"}
      >
        <p className="text-sm leading-[1.5] text-ink-500">
          {data.status === "refunded"
            ? "The money is on its way back to you."
            : "Your payment arrived after the items were released and they have sold out. We’ll refund you in full and email you."}
        </p>
        <Button size="lg" fullWidth href="/shop">
          Back to shop
        </Button>
      </Card>
    );
  } else {
    // failed | expired
    card = (
      <Card
        tone="warn"
        icon={<AlertCircle size={30} className="text-white" />}
        title={data.status === "expired" ? "Your order timed out" : "Payment didn’t go through"}
      >
        <p className="text-sm leading-[1.5] text-ink-500">
          {data.status === "expired"
            ? "We hold items for a short time while you pay. Your bag is still here, so you can try again."
            : "You weren’t charged. Your bag is still here, so you can try again."}
        </p>
        <Button size="lg" fullWidth href="/shop/checkout">
          Try again
        </Button>
        <Button size="lg" fullWidth variant="ghost" href="/shop">
          Back to shop
        </Button>
      </Card>
    );
  }

  const paid = data?.status === "paid" || data?.status === "collected";
  return (
    <div className="relative flex min-h-[100svh] items-start justify-center overflow-hidden bg-ink-700 px-6 pt-[130px] lg:items-center lg:bg-cobalt-950 lg:pt-0">
      <div aria-hidden className="grid-motif pointer-events-none absolute inset-0 hidden lg:block" />
      <main
        className={
          paid
            ? "relative flex w-full max-w-[420px] flex-col items-center gap-3.5 rounded-[28px] bg-white px-6 pb-6 pt-8 shadow-xl lg:grid lg:max-w-[560px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8 lg:p-11"
            : "relative flex w-full max-w-[420px] flex-col items-center gap-3.5 rounded-[28px] bg-white px-6 pb-6 pt-8 text-center shadow-xl"
        }
      >
        {card}
      </main>
      <Link href="/" className="sr-only">
        Home
      </Link>
    </div>
  );
}

function Card({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: "wait" | "warn"; children: React.ReactNode }) {
  return (
    <>
      <span className={`flex size-[88px] items-center justify-center rounded-full ${tone === "wait" ? "bg-cobalt-50" : "bg-brick-100"}`}>
        <span className={`flex size-[60px] items-center justify-center rounded-full ${tone === "wait" ? "bg-cobalt-600" : "bg-brick-600"}`}>
          {icon}
        </span>
      </span>
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <div className="flex w-full flex-col gap-2.5">{children}</div>
    </>
  );
}
