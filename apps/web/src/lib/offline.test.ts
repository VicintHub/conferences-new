import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  get: async (k: string) => store.get(k),
  set: async (k: string, v: unknown) => void store.set(k, v),
  del: async (k: string) => void store.delete(k),
}));

import { ApiError } from "./api";
import { clearOfflineData, withOfflineFallback } from "./offline";

beforeEach(() => store.clear());

describe("withOfflineFallback", () => {
  it("returns fresh data and saves a copy", async () => {
    const r = await withOfflineFallback("me", async () => ({ a: 1 }));
    expect(r).toEqual({ data: { a: 1 }, stale: false });
    expect(store.get("jc27:me")).toMatchObject({ data: { a: 1 } });
  });

  it("falls back to the saved copy when the network is down", async () => {
    await withOfflineFallback("me", async () => ({ a: 1 }));
    const r = await withOfflineFallback("me", async () => {
      throw new ApiError("offline", 0, "network");
    });
    expect(r).toEqual({ data: { a: 1 }, stale: true });
  });

  it("treats a 502 from the proxy as offline", async () => {
    await withOfflineFallback("me", async () => ({ a: 1 }));
    const r = await withOfflineFallback("me", async () => {
      throw new ApiError("bad gateway", 502);
    });
    expect(r.stale).toBe(true);
  });

  it("never masks real API errors with the cache", async () => {
    await withOfflineFallback("me", async () => ({ a: 1 }));
    await expect(
      withOfflineFallback("me", async () => {
        throw new ApiError("Unauthenticated.", 401);
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rethrows when offline and nothing was saved", async () => {
    await expect(
      withOfflineFallback("me", async () => {
        throw new ApiError("offline", 0);
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("clears personal data on sign-out", async () => {
    await withOfflineFallback("me", async () => ({ a: 1 }));
    await withOfflineFallback("programme", async () => [1]);
    localStorage.setItem("jc27.ticket", "x");
    await clearOfflineData();
    expect(store.size).toBe(0);
    expect(localStorage.getItem("jc27.ticket")).toBeNull();
  });
});
