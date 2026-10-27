import { del, get, set } from "idb-keyval";
import { ApiError } from "./api";

type Snapshot<T> = { data: T; savedAt: number };

const key = (k: string) => `jc27:${k}`;

/**
 * Network first; if the network is unreachable, fall back to the last copy saved on this device.
 * Real API errors (401, 422…) are never masked by the cache.
 */
export async function withOfflineFallback<T>(name: string, load: () => Promise<T>): Promise<{ data: T; stale: boolean }> {
  try {
    const data = await load();
    try {
      await set(key(name), { data, savedAt: Date.now() } satisfies Snapshot<T>);
    } catch {
      // storage can be unavailable (private mode); the app still works online
    }
    return { data, stale: false };
  } catch (e) {
    const offline = e instanceof ApiError && (e.status === 0 || e.status === 502);
    if (!offline) throw e;
    const saved = await get<Snapshot<T>>(key(name)).catch(() => undefined);
    if (saved) return { data: saved.data, stale: true };
    throw e;
  }
}

export async function saveSnapshot<T>(name: string, data: T) {
  await set(key(name), { data, savedAt: Date.now() } satisfies Snapshot<T>).catch(() => {});
}

/** Called on sign-out so a shared device doesn't keep the previous person's ticket. */
export async function clearOfflineData() {
  await Promise.all(["me", "programme", "travel"].map((n) => del(key(n)).catch(() => {})));
  try {
    localStorage.removeItem("jc27.ticket");
  } catch {
    // nothing to clear
  }
}
