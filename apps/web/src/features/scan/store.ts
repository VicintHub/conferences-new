import { get, set } from "idb-keyval";
import type { LogEntry, PendingScan, Roster } from "./types";

/** Everything the scanner needs to keep working with no signal lives in IndexedDB on the phone. */
const k = (n: string) => `jc27:scan:${n}`;
export const MAX_LOG = 400;

async function read<T>(name: string, fallback: T): Promise<T> {
  try {
    return (await get<T>(k(name))) ?? fallback;
  } catch {
    return fallback;
  }
}
async function write(name: string, value: unknown) {
  try {
    await set(k(name), value);
  } catch {
    // Private mode or full storage: scanning still works online.
  }
}

export const loadQueue = () => read<PendingScan[]>("queue", []);
export const saveQueue = (q: PendingScan[]) => write("queue", q);
export const loadLog = () => read<LogEntry[]>("log", []);
export const saveLog = (l: LogEntry[]) => write("log", l.slice(-MAX_LOG));
export const loadRoster = () => read<Roster | null>("roster", null);
export const saveRoster = (r: Roster) => write("roster", r);

const DEVICE_KEY = "jc27.scan.device";
export const getDevice = (): string => {
  try {
    return localStorage.getItem(DEVICE_KEY) ?? "";
  } catch {
    return "";
  }
};
export const setDevice = (v: string) => {
  try {
    localStorage.setItem(DEVICE_KEY, v.trim());
  } catch {
    // not saved; the label simply resets next time
  }
};
