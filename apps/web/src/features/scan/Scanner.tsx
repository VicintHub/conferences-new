"use client";

import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Segmented, Sheet } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fetchMe } from "./api";
import { useScanEngine } from "./engine";
import { getDevice, setDevice } from "./store";
import { CHECKPOINTS, type Checkpoint, type ScanResult } from "./types";
import { useCamera } from "./useCamera";

const OK_MS = 1500;

/** Scanner PWA (designs 16b–16d): pick a checkpoint, scan continuously, work with no signal. */
export function Scanner() {
  const engine = useScanEngine();
  const [checkpoint, setCheckpoint] = useState<Checkpoint>("gate");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastCode, setLastCode] = useState<string>("");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [settings, setSettings] = useState(false);
  const [device, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [canOverride, setCanOverride] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    setDeviceName(getDevice());
    fetchMe()
      .then((m) => setCanOverride(m.data.areas.includes("override")))
      .catch(() => {});
  }, []);

  const handle = useCallback(
    async (code: string, override = false) => {
      if (busy.current) return;
      busy.current = true;
      setError(null);
      setLastCode(code);
      try {
        const r = await engine.submit(code, checkpoint, { override });
        setResult(r);
        navigator.vibrate?.(r.result === "ok" ? 60 : [120, 60, 120]);
      } catch {
        setError("Couldn’t record that scan. Check your connection and try again.");
      } finally {
        busy.current = false;
      }
    },
    [engine, checkpoint],
  );

  // A green result clears itself so the next person can be scanned; a red one waits for a decision.
  useEffect(() => {
    if (result?.result !== "ok") return;
    const t = setTimeout(() => setResult(null), OK_MS);
    return () => clearTimeout(t);
  }, [result]);

  const cameraOn = !result && !typing && !settings;
  const cam = useCamera({ active: cameraOn, onCode: (c) => void handle(c) });

  const status = !engine.online ? "Offline" : engine.hasRoster ? "Offline-ready" : "Online";
  const frame = "absolute size-[58px] border-white";

  if (result)
    return (
      <Outcome
        result={result}
        canOverride={canOverride && result.can_override}
        onNext={() => setResult(null)}
        onOverride={() => void handle(lastCode, true).then(() => undefined)}
      />
    );

  return (
    <main className="relative mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col gap-4 bg-cobalt-950 px-5 pb-6 pt-8 text-white">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => setSettings(true)} className="text-left" aria-label="Scanner settings">
          <h1 className="text-xl font-bold">Scanner</h1>
          {device && <p className="text-xs text-cobalt-300">{device}</p>}
        </button>
        <span role="status" className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-bold">
          <span aria-hidden className={cn("size-2 rounded-full", engine.online ? "bg-success-600" : "bg-warning-600")} />
          {status} · {engine.queued} queued
        </span>
      </header>

      <Segmented
        tone="dark"
        label="Checkpoint"
        options={CHECKPOINTS.map((c) => ({ value: c.value, label: c.label }))}
        value={checkpoint}
        onChange={setCheckpoint}
      />

      <section aria-label="Camera" className="relative flex flex-1 items-center justify-center">
        <video
          ref={cam.video}
          playsInline
          muted
          className={cn("absolute inset-0 size-full rounded-3xl object-cover opacity-60", cam.state !== "on" && "hidden")}
        />
        <div className="relative size-[250px]">
          <span aria-hidden className={cn(frame, "left-0 top-0 rounded-tl-3xl border-l-[5px] border-t-[5px]")} />
          <span aria-hidden className={cn(frame, "right-0 top-0 rounded-tr-3xl border-r-[5px] border-t-[5px]")} />
          <span aria-hidden className={cn(frame, "bottom-0 left-0 rounded-bl-3xl border-b-[5px] border-l-[5px]")} />
          <span aria-hidden className={cn(frame, "bottom-0 right-0 rounded-br-3xl border-b-[5px] border-r-[5px]")} />
          <span aria-hidden className="absolute inset-x-4 top-1/2 h-0.5 bg-brick-400 motion-safe:animate-pulse" />
        </div>
        <p className="absolute inset-x-0 bottom-6 text-center text-[15px] text-cobalt-100" role="status">
          {cam.state === "denied"
            ? "Camera access is blocked. Allow it in the browser settings, or type the code."
            : cam.state === "unavailable"
              ? "No camera found. Type the code instead."
              : checkpoint === "merch"
                ? "Point at a pickup QR"
                : "Point at a badge QR"}
        </p>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-brick-600/30 p-3 text-center text-sm">
          {error}
        </p>
      )}
      {engine.conflicts > 0 && (
        <p role="status" className="rounded-xl bg-warning-100 p-3 text-center text-sm font-semibold text-warning-600">
          {engine.conflicts} scan{engine.conflicts === 1 ? "" : "s"} changed after syncing. See the console’s Check-in page.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { k: "Scanned", v: engine.counts.scanned },
          { k: "Refused", v: engine.counts.refused },
          { k: "To sync", v: engine.queued },
        ].map((s) => (
          <div key={s.k} className="flex flex-col items-center rounded-2xl bg-white/10 py-4">
            <span className="text-[28px] font-bold leading-none">{s.v}</span>
            <span className="mt-1 text-xs text-cobalt-100">{s.k}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!cam.canTorch}
          aria-pressed={cam.torchOn}
          onClick={cam.toggleTorch}
          className={cn(
            "rounded-full py-4 text-lg font-bold disabled:opacity-40",
            cam.torchOn ? "bg-cream-50 text-cobalt-900" : "bg-white/10",
          )}
        >
          Torch
        </button>
        <button type="button" onClick={() => setTyping(true)} className="rounded-full bg-white/10 py-4 text-lg font-bold">
          Type code
        </button>
      </div>

      <Sheet open={typing} onOpenChange={setTyping} title="Type a code">
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            setTyping(false);
            void handle(typed).then(() => setTyped(""));
          }}
        >
          <input
            aria-label="Code"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value.toUpperCase())}
            placeholder={checkpoint === "merch" ? "MV-00012" : "JC27-DLG-48213"}
            className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 px-4 py-3 text-lg font-semibold tracking-[0.04em] text-ink-900 outline-none focus:border-cobalt-500 focus:shadow-[var(--ring)]"
          />
          <Button type="submit" size="lg" fullWidth disabled={!typed.trim()}>
            Check
          </Button>
        </form>
      </Sheet>

      <Sheet
        open={settings}
        onOpenChange={setSettings}
        title="This scanner"
        description="A name for this phone, shown on every scan it makes (for example “Meal point 2”)."
      >
        <div className="mt-4 flex flex-col gap-4">
          <input
            aria-label="Device name"
            value={device}
            maxLength={40}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Meal point 2"
            className="rounded-[var(--radius-input)] border-[1.5px] border-ink-200 px-4 py-3 text-lg text-ink-900 outline-none focus:border-cobalt-500 focus:shadow-[var(--ring)]"
          />
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              setDevice(device);
              setSettings(false);
            }}
          >
            Save
          </Button>
          <Button size="lg" variant="outline" fullWidth onClick={() => void engine.sync()}>
            Sync now ({engine.queued} waiting)
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

/** Full-screen green or red (designs 16c/16d). */
function Outcome({
  result,
  canOverride,
  onNext,
  onOverride,
}: {
  result: ScanResult;
  canOverride: boolean;
  onNext: () => void;
  onOverride: () => void;
}) {
  const ok = result.result === "ok";
  const title = ok ? `${result.label ?? "Checked in"} · OK` : (result.reason ?? "Refused");
  return (
    <main
      role="alert"
      aria-live="assertive"
      onClick={ok ? onNext : undefined}
      className={cn(
        "mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center text-white",
        ok ? "bg-success-600" : "bg-brick-700",
      )}
    >
      <span className="flex size-[120px] items-center justify-center rounded-full bg-white/25">
        {ok ? <Check size={64} strokeWidth={3.5} aria-hidden /> : <X size={64} strokeWidth={3.5} aria-hidden />}
      </span>
      <h1 className="text-[36px] font-bold leading-tight">{title}</h1>
      {result.attendee && <p className="text-[22px] font-bold">{result.attendee.name}</p>}
      {result.detail && <p className="whitespace-pre-line text-[17px] leading-relaxed text-white/85">{result.detail}</p>}
      {result.overridden && <p className="text-sm font-semibold text-white/80">Supervisor override</p>}
      {result.provisional && (
        <p className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">Decided offline, confirmed when it syncs</p>
      )}
      {ok && (
        <span aria-hidden className="mt-6 h-1 w-[200px] overflow-hidden rounded-full bg-white/30">
          <span className="block h-full origin-left animate-progress bg-white" />
        </span>
      )}
      {!ok && (
        <div className="mt-8 flex w-full flex-col gap-3">
          <button type="button" onClick={onNext} className="rounded-full bg-white py-4 text-lg font-bold text-brick-700">
            Scan next
          </button>
          {canOverride && (
            <button type="button" onClick={onOverride} className="rounded-full bg-white/20 py-4 text-lg font-bold">
              Supervisor override
            </button>
          )}
        </div>
      )}
    </main>
  );
}
