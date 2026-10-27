"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { ApiError, apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { naira } from "@/lib/money";
import { checkout, fetchProducts } from "./api";
import { bag, useBag } from "./bag";
import { QtyStepper } from "./parts";
import { estimateFee } from "./types";

const methods = [
  { key: "card", title: "Card", sub: "Visa, Mastercard, Verve" },
  { key: "bank_transfer", title: "Bank transfer", sub: "Paystack account" },
  { key: "ussd", title: "USSD", sub: "Any Nigerian bank" },
];
const FALLBACK_FEE = { percent: 0.7, flat_kobo: 10000 };
const LAST_ORDER_KEY = "jc27.lastOrder";

type Me = { data: { attendee: { full_name: string; email: string } } };

export function Checkout() {
  const { lines, subtotalKobo } = useBag();
  const [method, setMethod] = useState("card");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fee parameters come from the server so the estimate matches what the order will be priced at.
  const shop = useQuery({ queryKey: ["shop", "list"], queryFn: fetchProducts, staleTime: 5 * 60_000 });
  const fee = estimateFee(subtotalKobo, shop.data?.meta.fee ?? FALLBACK_FEE);
  const total = subtotalKobo + fee;

  // A signed-in attendee gets their details filled in. Guests simply type them; a 401 here is expected.
  useQuery({
    queryKey: ["shop", "prefill"],
    queryFn: async () => {
      try {
        const me = await apiFetch<Me>("/me", { base: "/api/backend" });
        setName((n) => n || me.data.attendee.full_name);
        setEmail((e) => e || me.data.attendee.email);
        return me;
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const pay = useMutation({
    mutationFn: () =>
      checkout({
        items: lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined },
        method,
      }),
    onSuccess: ({ data, meta }) => {
      try {
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ code: data.code, k: meta.access_token }));
      } catch {
        // the order link also arrives by email
      }
      // The bag is cleared once the payment is confirmed (order page), so a failed payment can retry.
      window.location.assign(meta.payment_url);
    },
    onError: (e: ApiError) => setErrors(e.status === 422 ? e.fieldErrors : { form: e.message }),
  });

  const submit = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next["customer.name"] = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next["customer.email"] = "Enter a valid email for your receipt";
    setErrors(next);
    if (Object.keys(next).length === 0) pay.mutate();
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-24 text-center">
        <h1 className="font-display text-4xl font-bold uppercase text-cobalt-900">Your bag is empty</h1>
        <p className="max-w-sm text-[15px] text-ink-500">Pick something from the shop and it will wait for you here.</p>
        <Button href="/shop" size="lg">
          Browse the shop
        </Button>
      </div>
    );
  }

  const lineErr = (i: number) => errors[`items.${i}.qty`] ?? errors[`items.${i}.variant_id`];

  const bagLines = (
    <ul className="flex flex-col gap-3.5">
      {lines.map((l, i) => (
        <li key={l.variantId} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3.5 rounded-[18px] border border-ink-100 bg-white p-2.5">
            <div className="relative size-[72px] flex-none overflow-hidden rounded-xl bg-cream-100">
              {l.image && <Image src={l.image} alt="" fill sizes="72px" className="object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[15px] font-bold leading-[1.2] text-ink-900">{l.name}</span>
              {l.variantLabel && <span className="text-[13px] text-ink-400">{l.variantLabel}</span>}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-bold text-cobalt-700">{naira(l.unitPriceKobo * l.qty)}</span>
                <QtyStepper size="sm" value={l.qty} max={l.max} onChange={(n) => bag.setQty(l.variantId, n)} />
              </div>
            </div>
            <button
              type="button"
              aria-label={`Remove ${l.name}`}
              onClick={() => bag.remove(l.variantId)}
              className="self-start p-1 text-ink-300 hover:text-brick-600"
            >
              <X size={16} />
            </button>
          </div>
          {lineErr(i) && (
            <span role="alert" className="px-1 text-sm text-brick-600">
              {l.name}: {lineErr(i)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  const details = (
    <section className="flex flex-col gap-4 rounded-[20px] border-ink-100 lg:border lg:bg-white lg:p-7">
      <h2 className="text-base font-bold text-ink-900 lg:text-lg">Your details</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors["customer.name"]}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+234 803 456 7821"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors["customer.phone"]}
        />
      </div>
      <Input
        label="Email for receipt"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors["customer.email"]}
      />
    </section>
  );

  const payWith = (
    <section className="flex flex-col gap-3 lg:gap-3.5 lg:rounded-[20px] lg:border lg:border-ink-100 lg:bg-white lg:p-7">
      <h2 className="text-base font-bold text-ink-900 lg:text-lg">Pay with</h2>
      <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3 lg:grid lg:grid-cols-3">
        {methods.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={method === m.key}
            onClick={() => setMethod(m.key)}
            className={cn(
              "flex items-center justify-between rounded-[18px] p-4 text-left lg:flex-col lg:items-start lg:gap-1.5 lg:rounded-2xl lg:p-[18px]",
              method === m.key ? "border-2 border-cobalt-600" : "border-[1.5px] border-ink-100",
            )}
          >
            <span className="flex flex-col gap-0.5 lg:order-2 lg:mt-1.5">
              <span className="text-[15px] font-bold text-ink-900">{m.title}</span>
              <span className="text-[13px] text-ink-400">{m.sub}</span>
            </span>
            <span
              aria-hidden
              className={cn(
                "box-border size-[22px] flex-none rounded-full lg:order-1",
                method === m.key ? "border-[7px] border-cobalt-600" : "border-2 border-ink-200",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );

  const totals = (
    <div className="flex flex-col gap-2 border-t border-dashed border-ink-200 pt-3">
      <div className="flex justify-between text-sm text-ink-500 lg:text-[15px]">
        <span>Subtotal</span>
        <span>{naira(subtotalKobo)}</span>
      </div>
      <div className="flex justify-between text-sm text-ink-500 lg:text-[15px]">
        <span>Payment fee</span>
        <span>{naira(fee)}</span>
      </div>
      <div className="flex justify-between text-[17px] font-bold text-ink-900 lg:text-xl">
        <span>Total</span>
        <span>{naira(total)}</span>
      </div>
    </div>
  );

  const pickup = (
    <div className="flex items-center gap-3 rounded-[18px] bg-cobalt-50 p-4">
      <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-white text-cobalt-700">
        <MapPin size={20} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-ink-900">Merchandise desk, venue</span>
        <span className="text-[13px] text-ink-500">Show your pickup QR, 19–24 Jan</span>
      </div>
    </div>
  );

  const payButton = (
    <>
      {errors.form && (
        <p role="alert" className="mb-3 text-center text-sm text-brick-600">
          {errors.form}
        </p>
      )}
      <Button size="lg" fullWidth disabled={pay.isPending} onClick={submit}>
        {pay.isPending ? "Taking you to payment…" : `Pay ${naira(total)}`}
      </Button>
    </>
  );

  return (
    <>
      {/* phones (7c) */}
      <div className="flex min-h-[100svh] flex-col bg-white lg:hidden">
        <div className="flex items-center gap-3 px-5 pb-3 pt-6">
          <Link href="/shop" aria-label="Back to shop" className="-ml-1 p-1 text-ink-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-ink-900">Checkout</h1>
        </div>
        <div className="flex flex-1 flex-col gap-3.5 px-5 pb-5 pt-2">
          {bagLines}
          {details}
          <h2 className="mt-1.5 text-base font-bold text-ink-900">Pickup</h2>
          {pickup}
          {payWith}
          {totals}
        </div>
        <div className="border-t border-ink-50 px-5 pb-10 pt-3">{payButton}</div>
      </div>

      {/* desktop (8c) */}
      <div className="hidden gap-10 px-14 pb-20 pt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-[56px] font-bold uppercase leading-[0.95] text-cobalt-900">Checkout</h1>
          {details}
          {payWith}
        </div>
        <aside
          className="flex flex-col gap-4 self-start rounded-[20px] border border-ink-100 bg-white p-7 shadow-md"
          aria-label="Order summary"
        >
          <h2 className="text-lg font-bold text-ink-900">Order summary</h2>
          {bagLines}
          <div className="rounded-[14px] bg-cobalt-50 p-3.5 text-sm font-medium leading-[1.4] text-cobalt-800">
            Collect at the merchandise desk at the venue with your pickup QR.
          </div>
          {totals}
          {payButton}
          <span className="text-center text-[13px] text-ink-400">Secured by Paystack</span>
        </aside>
      </div>
    </>
  );
}
