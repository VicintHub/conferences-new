"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = { active: boolean; onCode: (code: string) => void };

/**
 * Opens the back camera and reads QR codes from it, about eight times a second. jsQR works in every browser (the
 * built-in BarcodeDetector doesn't on iPhones). The same code is ignored for a few seconds so one badge isn't scanned twice.
 */
export function useCamera({ active, onCode }: Options) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "on" | "denied" | "unavailable">("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const handler = useRef(onCode);
  const last = useRef({ code: "", at: 0 });
  useEffect(() => {
    handler.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!active) return;
    if (!navigator.mediaDevices?.getUserMedia) return setState("unavailable");
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    setState("starting");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        const caps = s.getVideoTracks()[0]?.getCapabilities?.() as { torch?: boolean } | undefined;
        setCanTorch(!!caps?.torch);
        const el = video.current;
        if (!el) return;
        el.srcObject = s;
        void el.play().catch(() => {});
        setState("on");

        const tick = () => {
          if (cancelled) return;
          if (el.readyState >= 2 && ctx && el.videoWidth > 0) {
            const scale = Math.min(1, 640 / el.videoWidth);
            canvas.width = Math.round(el.videoWidth * scale);
            canvas.height = Math.round(el.videoHeight * scale);
            ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
            const hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, {
              inversionAttempts: "dontInvert",
            });
            const now = Date.now();
            if (hit?.data && (hit.data !== last.current.code || now - last.current.at > 3000)) {
              last.current = { code: hit.data, at: now };
              handler.current(hit.data);
            }
          }
          timer = setTimeout(tick, 125);
        };
        tick();
      })
      .catch(
        (e: DOMException) => !cancelled && setState(e.name === "NotAllowedError" || e.name === "SecurityError" ? "denied" : "unavailable"),
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setState("idle");
      setTorchOn(false);
    };
  }, [active]);

  const toggleTorch = useCallback(async () => {
    const track = stream.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((t) => !t);
    } catch {
      // not every phone lets the page control the light
    }
  }, [torchOn]);

  return { video, state, canTorch, torchOn, toggleTorch };
}
