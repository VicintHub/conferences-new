"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { naira } from "@/lib/money";
import { ProductImage } from "./parts";
import type { ProductSummary, ShopList } from "./types";

function SearchBox({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={cn("flex items-center gap-2.5 rounded-full px-4", className)}>
      <Search size={18} className="flex-none text-ink-400" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search merchandise"
        aria-label="Search merchandise"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
      />
    </label>
  );
}

function Tag({ tag }: { tag: string }) {
  return <span className="absolute left-3 top-3 rounded-full bg-brick-600 px-3 py-1 text-xs font-bold text-white">{tag}</span>;
}

function SoldOut() {
  return (
    <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-1 text-center text-xs font-bold text-ink-700">Sold out</span>
  );
}

/** Product grid: 2 columns on phones (design 7a), sidebar + 3 columns on desktop (8a). */
export function Catalog({ list }: { list: ShopList | null }) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const products = list?.data ?? [];
    const q = query.trim().toLowerCase();
    return products.filter((p) => (category === "all" || p.category === category) && (!q || p.name.toLowerCase().includes(q)));
  }, [list, category, query]);
  const categories = [{ key: "all", label: "All", count: list?.meta.total ?? 0 }, ...(list?.meta.categories ?? [])];
  const labelOf = (p: ProductSummary) => list?.meta.categories.find((c) => c.key === p.category)?.label ?? "";

  const empty = (
    <p className="col-span-full py-12 text-center text-[15px] text-ink-400">
      {list ? "No products match your search." : "The shop is unavailable right now. Please try again shortly."}
    </p>
  );

  return (
    <>
      {/* phones */}
      <div className="flex flex-col gap-4 px-5 pb-10 pt-4 md:hidden">
        <SearchBox value={query} onChange={setQuery} className="h-[46px] bg-ink-50" />
        <div className="-mr-5 flex gap-2 overflow-x-auto pr-5">
          {categories.map((c) => (
            <div key={c.key} className="flex-none">
              <Chip selected={category === c.key} onClick={() => setCategory(c.key)}>
                {c.label}
              </Chip>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-2 content-start gap-x-3 gap-y-4">
          {visible.length === 0
            ? empty
            : visible.map((p) => (
                <li key={p.slug}>
                  <Link href={`/shop/${p.slug}`} className="flex flex-col gap-2">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-100 bg-white">
                      <ProductImage src={p.image} name={p.name} sizes="45vw" />
                      {p.tag && <Tag tag={p.tag} />}
                      {!p.in_stock && <SoldOut />}
                    </div>
                    <span className="text-sm font-bold leading-[1.25] text-ink-900">{p.name}</span>
                    <span className="text-[15px] font-bold text-cobalt-700">{naira(p.price_kobo)}</span>
                  </Link>
                </li>
              ))}
        </ul>
      </div>

      {/* desktop */}
      <div className="hidden md:block">
        <div className="flex items-end justify-between px-14 pb-8 pt-14">
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow">PAY ONLINE · COLLECT AT THE VENUE</span>
            <h1 className="font-display text-[88px] font-bold uppercase leading-[0.9] text-cobalt-900">Shop</h1>
          </div>
          <SearchBox value={query} onChange={setQuery} className="h-[50px] w-[340px] border border-ink-100 bg-white" />
        </div>
        <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-10 px-14 pb-24">
          <nav aria-label="Categories" className="flex flex-col gap-1">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={category === c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  "flex items-center justify-between rounded-[10px] px-4 py-3 text-left text-[15px] font-semibold",
                  category === c.key ? "bg-cobalt-50 text-cobalt-800" : "text-ink-600 hover:bg-white",
                )}
              >
                {c.label}
                <span className={category === c.key ? "text-cobalt-600" : "text-ink-400"}>{c.count}</span>
              </button>
            ))}
          </nav>
          <ul className="grid grid-cols-3 content-start gap-x-4 gap-y-7">
            {visible.length === 0
              ? empty
              : visible.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/shop/${p.slug}`} className="flex flex-col gap-3.5">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-white">
                        <ProductImage src={p.image} name={p.name} sizes="(min-width: 1280px) 300px, 28vw" />
                        {p.tag && <Tag tag={p.tag} />}
                        {!p.in_stock && <SoldOut />}
                      </div>
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-[17px] font-bold leading-[1.25] text-ink-900">{p.name}</span>
                        <span className="whitespace-nowrap text-[17px] font-bold text-cobalt-700">{naira(p.price_kobo)}</span>
                      </span>
                      <span className="-mt-2 text-[15px] text-ink-400">{labelOf(p)}</span>
                    </Link>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </>
  );
}
