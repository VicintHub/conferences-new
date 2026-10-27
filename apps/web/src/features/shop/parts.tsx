"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useBag } from "./bag";
import { cn } from "@/lib/cn";

export function QtyStepper({
  value,
  onChange,
  max,
  size = "lg",
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  size?: "sm" | "lg";
}) {
  const limit = Math.min(max, 10);
  return (
    <div
      className={cn(
        "flex items-center rounded-full border-[1.5px] border-ink-100 bg-white",
        size === "lg" ? "h-[54px] gap-3.5 px-4 lg:h-14 lg:gap-[18px] lg:px-5" : "h-9 gap-2.5 px-3",
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="text-ink-400 disabled:opacity-40"
      >
        <Minus size={size === "lg" ? 18 : 14} />
      </button>
      <span
        aria-live="polite"
        className={cn("min-w-4 text-center font-bold text-ink-900", size === "lg" ? "text-base lg:text-[17px]" : "text-sm")}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        disabled={value >= limit}
        className="text-cobalt-700 disabled:opacity-40"
      >
        <Plus size={size === "lg" ? 18 : 14} />
      </button>
    </div>
  );
}

/** Product image filling its parent, or a dashed placeholder tile when the product has no photo yet. */
export function ProductImage({
  src,
  name,
  sizes,
  className,
  priority,
}: {
  src: string | null;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(
          "flex size-full flex-col items-center justify-center gap-2 rounded-[inherit] border-[1.5px] border-dashed border-cream-300 bg-cream-100 p-4 text-center",
          className,
        )}
      >
        <ShoppingBag size={28} className="text-ink-300" aria-hidden />
        <span className="text-sm font-medium leading-[1.3] text-ink-500">{name}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      priority={priority}
      // The merchandise photos show a front and a back side by side, so they are shown whole by default rather than cropped.
      className={cn(!className?.includes("object-") && "object-contain", className)}
    />
  );
}

/** Bag icon with a count badge, for phone headers. */
export function BagIconLink() {
  const { count } = useBag();
  return (
    <Link href="/shop/checkout" aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`} className="relative p-1 text-ink-900">
      <ShoppingBag size={24} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-brick-600 px-1 text-center text-[11px] font-bold leading-[18px] text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
