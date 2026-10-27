"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { fetchRoster, isOffline, sendScans } from "./api";
import { applyToRoster, decideLocally, logFrom } from "./decide";
import { getDevice, loadLog, loadQueue, loadRoster, saveLog, saveQueue, saveRoster } from "./store";
import type { Checkpoint, LogEntry, PendingScan, Roster, ScanResult } from "./types";

const BATCH = 50;
const ROSTER_EVERY_MS = 10 * 60_000;
const SYNC_EVERY_MS = 20_000;
const day = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(iso));
const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type Engine = {
  ready: boolean;
  online: boolean;
  hasRoster: boolean;
  queued: number;
  conflicts: number;
  counts: { scanned: number; refused: number };
  /** Decides and records one scan. Online it asks the server; with no signal it decides on the phone and queues it. */
  submit: (code: string, checkpoint: Checkpoint, opts?: { override?: boolean }) => Promise<ScanResult>;
  sync: () => Promise<void>;
};

/**
 * The scanner's brain: sends scans to the server when it can, and otherwise decides from the roster on the phone and
 * keeps the scan in a queue (in IndexedDB, so it survives a closed tab) until the connection is back.
 */
export function useScanEngine(): Engine {
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<PendingScan[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [conflicts, setConflicts] = useState(0);

  // Refs hold the latest values for callbacks that run outside React's render (timers, event handlers).
  const q = useRef(queue);
  const l = useRef(log);
  const r = useRef(roster);
  const syncing = useRef(false);
  const persist = (nq: PendingScan[], nl: LogEntry[], nr: Roster | null) => {
    q.current = nq;
    l.current = nl;
    r.current = nr;
    setQueue(nq);
    setLog(nl);
    setRoster(nr);
    void saveQueue(nq);
    void saveLog(nl);
    if (nr) void saveRoster(nr);
  };

  useEffect(() => {
    let alive = true;
    void Promise.all([loadQueue(), loadLog(), loadRoster()]).then(([a, b, c]) => {
      if (!alive) return;
      q.current = a;
      l.current = b;
      r.current = c;
      setQueue(a);
      setLog(b);
      setRoster(c);
      setReady(true);
    });
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      alive = false;
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const refreshRoster = useCallback(async () => {
    try {
      const fresh = (await fetchRoster()).data;
      // Keep scans that are still queued out of the fresh list's "available" state, so they can't be accepted twice.
      let merged = fresh;
      for (const p of q.current) merged = applyToRoster(merged, p, { result: "ok" } as ScanResult);
      r.current = merged;
      setRoster(merged);
      void saveRoster(merged);
    } catch {
      // offline or signed out: the copy on the phone keeps working
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncing.current || q.current.length === 0 || !navigator.onLine) return;
    syncing.current = true;
    try {
      while (q.current.length > 0) {
        const batch = q.current.slice(0, BATCH);
        const { data } = await sendScans(batch);
        const byId = new Map(data.map((d) => [d.client_uuid, d]));
        let clash = 0;
        const nl = l.current.map((e) => {
          const server = byId.get(e.client_uuid);
          if (!server) return e;
          if (e.provisional && e.result !== server.result) clash++;
          return { ...e, result: server.result, reason: server.reason, provisional: false };
        });
        setConflicts((c) => c + clash);
        persist(q.current.slice(batch.length), nl, r.current);
      }
      void refreshRoster();
    } catch (e) {
      // A refused batch (e.g. a bad scan) must not block the rest forever: drop it after telling the console it failed.
      if (e instanceof ApiError && e.status === 422) persist(q.current.slice(BATCH), l.current, r.current);
    } finally {
      syncing.current = false;
    }
  }, [refreshRoster]);

  useEffect(() => {
    if (!ready) return;
    if (online) {
      void refreshRoster();
      void sync();
    }
    const a = setInterval(() => navigator.onLine && void sync(), SYNC_EVERY_MS);
    const b = setInterval(() => navigator.onLine && void refreshRoster(), ROSTER_EVERY_MS);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [ready, online, sync, refreshRoster]);

  const submit = useCallback<Engine["submit"]>(
    async (code, checkpoint, opts) => {
      const scan: PendingScan = {
        client_uuid: uuid(),
        code: code.trim(),
        checkpoint,
        scanned_at: new Date().toISOString(),
        device: getDevice() || null,
        ...(opts?.override ? { override: true } : {}),
      };

      if (navigator.onLine) {
        try {
          // Anything queued goes first, so the server sees scans in the order they happened.
          await sync();
          if (q.current.length === 0) {
            const result = (await sendScans([scan])).data[0]!;
            persist(q.current, [...l.current, logFrom(scan, result, r.current)], r.current);
            return result;
          }
        } catch (e) {
          if (!isOffline(e)) throw e;
        }
      }

      const result = decideLocally(r.current, scan, l.current);
      const entry = logFrom(scan, result, r.current);
      // A refused scan is still sent later (the console counts refusals), but it changes nothing in the roster.
      persist([...q.current, scan], [...l.current, entry], r.current ? applyToRoster(r.current, scan, result) : null);
      return result;
    },
    [sync],
  );

  const today = day(new Date().toISOString());
  const todays = log.filter((e) => day(e.scanned_at) === today);

  return {
    ready,
    online,
    hasRoster: roster !== null,
    queued: queue.length,
    conflicts,
    counts: { scanned: todays.length, refused: todays.filter((e) => e.result === "refused").length },
    submit,
    sync,
  };
}
