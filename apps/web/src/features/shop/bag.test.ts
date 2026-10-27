import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BagLine } from "./types";

const line = (over: Partial<BagLine> = {}): BagLine => ({
  variantId: 1,
  slug: "polo",
  name: "Polo",
  image: null,
  variantLabel: "Size L",
  unitPriceKobo: 1250000,
  qty: 1,
  max: 5,
  ...over,
});

async function fresh() {
  vi.resetModules();
  return import("./bag");
}

beforeEach(() => localStorage.clear());

describe("bag", () => {
  it("adds lines, merges the same variant and totals them", async () => {
    const { bag, useBag } = await fresh();
    const { result } = renderHook(() => useBag());
    act(() => {
      bag.add(line());
      bag.add(line({ qty: 2 }));
      bag.add(line({ variantId: 2, name: "Hoodie", unitPriceKobo: 2500000 }));
    });
    expect(result.current.lines).toHaveLength(2);
    expect(result.current.lines[0].qty).toBe(3);
    expect(result.current.count).toBe(4);
    expect(result.current.subtotalKobo).toBe(3 * 1250000 + 2500000);
  });

  it("never exceeds stock or ten per line", async () => {
    const { bag, useBag } = await fresh();
    const { result } = renderHook(() => useBag());
    act(() => {
      bag.add(line({ qty: 4 }));
      bag.add(line({ qty: 4 }));
    });
    expect(result.current.lines[0].qty).toBe(5);
    act(() => bag.setQty(1, 99));
    expect(result.current.lines[0].qty).toBe(5);
    act(() => bag.add(line({ variantId: 3, max: 50, qty: 30 })));
    expect(result.current.lines.find((l) => l.variantId === 3)?.qty).toBe(10);
  });

  it("changes quantity, removes at zero, removes and clears", async () => {
    const { bag, useBag } = await fresh();
    const { result } = renderHook(() => useBag());
    act(() => {
      bag.add(line());
      bag.add(line({ variantId: 2 }));
      bag.setQty(1, 3);
    });
    expect(result.current.lines[0].qty).toBe(3);
    act(() => bag.setQty(1, 0));
    expect(result.current.lines.map((l) => l.variantId)).toEqual([2]);
    act(() => bag.remove(2));
    expect(result.current.count).toBe(0);
    act(() => {
      bag.add(line());
      bag.clear();
    });
    expect(result.current.lines).toEqual([]);
  });

  it("persists across reloads", async () => {
    const first = await fresh();
    first.bag.add(line({ qty: 2 }));
    const second = await fresh();
    const { result } = renderHook(() => second.useBag());
    expect(result.current.count).toBe(2);
  });

  it("survives corrupt storage", async () => {
    localStorage.setItem("jc27.bag", "{nope");
    const { useBag } = await fresh();
    const { result } = renderHook(() => useBag());
    expect(result.current.lines).toEqual([]);
  });
});
