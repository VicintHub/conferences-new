"use client";

import { useSyncExternalStore } from "react";
import type { BagLine } from "./types";

const KEY = "jc27.bag";
const listeners = new Set<() => void>();
let cache: BagLine[] | null = null;

function read(): BagLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? (parsed as BagLine[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: BagLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // private mode: the bag still works for this tab
  }
  listeners.forEach((l) => l());
}

// Other tabs: keep the bag in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

const EMPTY: BagLine[] = [];

export function useBag() {
  const lines = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotalKobo = lines.reduce((n, l) => n + l.unitPriceKobo * l.qty, 0);
  return { lines, count, subtotalKobo };
}

export const bag = {
  /** Adds a line, merging with an existing one for the same variant and never exceeding stock. */
  add(line: BagLine) {
    const lines = read();
    const existing = lines.find((l) => l.variantId === line.variantId);
    if (existing) {
      write(lines.map((l) => (l.variantId === line.variantId ? { ...l, qty: Math.min(l.qty + line.qty, Math.min(line.max, 10)) } : l)));
    } else {
      write([...lines, { ...line, qty: Math.min(line.qty, Math.min(line.max, 10)) }]);
    }
  },
  setQty(variantId: number, qty: number) {
    write(
      read()
        .map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(0, Math.min(qty, Math.min(l.max, 10))) } : l))
        .filter((l) => l.qty > 0),
    );
  },
  remove(variantId: number) {
    write(read().filter((l) => l.variantId !== variantId));
  },
  clear() {
    write([]);
  },
};
