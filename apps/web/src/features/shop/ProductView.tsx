"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { naira } from "@/lib/money";
import { bag } from "./bag";
import { BagIconLink, ProductImage, QtyStepper } from "./parts";
import type { ProductDetail } from "./types";

const catLabel: Record<string, string> = { apparel: "Apparel", books: "Books" };

/** One product (designs 7b mobile, 8b desktop): gallery, size, colour, stock, quantity, add to bag. */
export function ProductView({ product }: { product: ProductDetail }) {
  const { sizes, colors, variants } = product;
  const defaultSize = sizes.includes("L") ? "L" : sizes[0];
  const [size, setSize] = useState<string | undefined>(defaultSize);
  const [color, setColor] = useState<string | undefined>(colors[0]?.name);
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(0);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => variants.find((v) => (v.size ?? undefined) === size && (v.color ?? undefined) === color),
    [variants, size, color],
  );
  const stock = variant?.stock ?? 0;
  const sizeAvailable = (s: string) => variants.some((v) => v.size === s && (v.color ?? undefined) === color && v.stock > 0);
  const images = product.images.length ? product.images : [null];
  const label = [size && `Size ${size}`, color].filter(Boolean).join(" · ") || null;

  const add = () => {
    if (!variant || stock < 1) return;
    bag.add({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variantLabel: label,
      unitPriceKobo: product.price_kobo,
      qty,
      max: stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const sizePicker = sizes.length > 0 && (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[15px] font-bold text-ink-900">Size</legend>
      <div className="flex gap-2">
        {sizes.map((s) => {
          const ok = sizeAvailable(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              disabled={!ok}
              onClick={() => {
                setSize(s);
                setQty(1);
              }}
              className={cn(
                "flex h-11 w-[52px] items-center justify-center rounded-xl border-[1.5px] text-sm font-bold lg:h-12 lg:w-[60px] lg:text-[15px]",
                size === s ? "border-cobalt-600 bg-cobalt-600 text-white" : "border-ink-200 bg-white text-ink-700",
                !ok && "cursor-not-allowed opacity-40 line-through",
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  const colourPicker = colors.length > 0 && (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[15px] font-bold text-ink-900">Colour{color ? ` · ${color}` : ""}</legend>
      <div className="flex gap-2.5">
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            aria-label={c.name}
            aria-pressed={color === c.name}
            onClick={() => {
              setColor(c.name);
              if (c.image !== undefined) setImage(c.image);
              setQty(1);
            }}
            style={{ background: c.hex }}
            className={cn(
              "size-[34px] rounded-full border-[1.5px] border-ink-200 lg:size-9",
              color === c.name && "border-transparent ring-2 ring-cobalt-600 ring-offset-[3px] ring-offset-white lg:ring-offset-cream-50",
            )}
          />
        ))}
      </div>
    </fieldset>
  );

  const stockLine =
    stock > 0 ? (
      <p className="flex items-center gap-2 text-[13px] font-medium text-success-600">
        <span aria-hidden className="size-2 rounded-full bg-success-600" />
        In stock{stock <= 50 ? ` · ${stock} left${size ? ` in ${size}` : ""}` : ""}
      </p>
    ) : (
      <p className="flex items-center gap-2 text-[13px] font-medium text-brick-600">
        <span aria-hidden className="size-2 rounded-full bg-brick-600" />
        Sold out{size ? ` in ${size}` : ""}
      </p>
    );

  const buy = (
    <div className="flex items-center gap-3">
      <QtyStepper value={qty} onChange={setQty} max={Math.max(stock, 1)} />
      <div className="flex-1">
        <Button size="lg" fullWidth disabled={stock < 1} onClick={add}>
          {added ? "Added to bag ✓" : "Add to bag"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* phones (7b) */}
      <div className="flex min-h-[100svh] flex-col bg-white lg:hidden md:hidden">
        <div className="relative h-[380px] flex-none bg-cream-100">
          <ProductImage src={images[image]} name={product.name} sizes="100vw" priority className="object-contain" />
          <div className="absolute inset-x-5 top-[58px] flex">
            <Link
              href="/shop"
              aria-label="Back to shop"
              className="flex size-10 items-center justify-center rounded-full bg-white text-ink-900 shadow-xs"
            >
              <ArrowLeft size={20} />
            </Link>
            <span className="ml-auto flex size-10 items-center justify-center rounded-full bg-white shadow-xs">
              <BagIconLink />
            </span>
          </div>
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === image}
                  onClick={() => setImage(i)}
                  className={cn("h-1.5 rounded-[3px]", i === image ? "w-5 bg-cobalt-600" : "w-1.5 bg-ink-200")}
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative -mt-6 flex flex-1 flex-col gap-4 rounded-t-[28px] bg-white px-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold leading-[1.15] text-ink-900">{product.name}</h1>
              <span className="text-sm text-ink-400">{catLabel[product.category]} · Collect at the venue</span>
            </div>
            <span className="whitespace-nowrap text-[22px] font-bold text-cobalt-700">{naira(product.price_kobo)}</span>
          </div>
          {sizePicker}
          {colourPicker}
          {stockLine}
        </div>
        <div className="border-t border-ink-50 bg-white px-5 pb-10 pt-3">{buy}</div>
      </div>

      {/* tablet / desktop (8b) */}
      <div className="hidden gap-14 px-14 pb-20 pt-12 md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col gap-3">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === image}
                onClick={() => setImage(i)}
                className={cn(
                  "relative size-[88px] overflow-hidden rounded-[14px] bg-white",
                  i === image ? "border-2 border-cobalt-600" : "border border-ink-100",
                )}
              >
                <ProductImage src={src} name={`${product.name} photo ${i + 1}`} sizes="88px" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white">
            <ProductImage
              src={images[image]}
              name={product.name}
              sizes="(min-width: 1280px) 640px, 55vw"
              priority
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col gap-[22px] pt-3">
          <nav aria-label="Breadcrumb" className="text-sm font-medium text-ink-400">
            <Link href="/shop" className="hover:text-cobalt-700">
              Shop
            </Link>{" "}
            / {catLabel[product.category]}
          </nav>
          <h1 className="font-display text-[52px] font-bold uppercase leading-[0.95] text-cobalt-900">{product.name}</h1>
          <span className="text-[30px] font-bold text-cobalt-700">{naira(product.price_kobo)}</span>
          {sizePicker}
          {colourPicker}
          {stockLine}
          <div className="mt-1.5">{buy}</div>
          {added && (
            <Link href="/shop/checkout" className="text-sm font-bold text-cobalt-700">
              View bag →
            </Link>
          )}
          <dl className="border-t border-ink-100">
            {product.facts.map((f) => (
              <div key={f.k} className="flex justify-between border-b border-ink-100 py-4 text-[15px]">
                <dt className="font-medium text-ink-700">{f.k}</dt>
                <dd className="text-ink-500">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
