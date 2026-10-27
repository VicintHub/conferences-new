"use client";

import { Copy, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { copyText } from "./share";
import type { PublicityItem, PublicitySize } from "./types";

export function PlatformIcon({ path, size = 26 }: { path: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

/** Preview image (or logo/poster) at the item's own aspect ratio. `contain` shows the whole artwork, as in the item view. */
export function Preview({
  item,
  className,
  contain: containProp,
  sizes,
}: {
  item: PublicityItem;
  className?: string;
  contain?: boolean;
  sizes: string;
}) {
  // Logos are never cropped.
  const contain = containProp || item.type === "logo";
  return (
    <div
      className={cn("relative overflow-hidden", item.type === "logo" ? "bg-white" : "bg-cobalt-50", className)}
      style={containProp ? undefined : { aspectRatio: item.ratio }}
    >
      {item.preview && (
        <Image
          src={item.preview}
          alt={item.title}
          fill
          sizes={sizes}
          className={cn(contain ? "object-contain" : "object-cover", item.type === "logo" && "p-3")}
        />
      )}
      {item.is_video && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95"
        >
          <Play size={16} fill="var(--color-cobalt-900)" className="text-cobalt-900" />
        </span>
      )}
    </div>
  );
}

const typeLabel: Record<PublicityItem["type"], string> = {
  flyer: "Flyer",
  video: "Video",
  status: "Status",
  design: "Design",
  logo: "Logo",
};
export const TypePill = ({ type, small }: { type: PublicityItem["type"]; small?: boolean }) => (
  <span
    className={cn(
      "absolute left-2 top-2 rounded-full bg-white/95 font-bold text-ink-900",
      small ? "px-[9px] py-1 text-[11px]" : "left-2.5 top-2.5 px-2.5 py-1 text-xs",
    )}
  >
    {typeLabel[type]}
  </span>
);

/** Rectangle drawn in the proportions of each size (design 17b). */
const shape: Record<string, { w: number; h: number }> = { square: { w: 22, h: 22 }, status: { w: 14, h: 24 }, print: { w: 18, h: 24 } };

export function SizePicker({
  sizes,
  value,
  onChange,
  compact,
}: {
  sizes: PublicitySize[];
  value: string;
  onChange: (key: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Size"
      className={cn("grid gap-2", sizes.length === 1 ? "grid-cols-1" : sizes.length === 2 ? "grid-cols-2" : "grid-cols-3")}
    >
      {sizes.map((s) => {
        const on = s.key === value;
        const sh = shape[s.key] ?? { w: 22, h: 16 };
        return (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s.key)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl",
              compact ? "gap-1 py-2.5" : "py-3",
              on ? "border-2 border-cobalt-600 bg-cobalt-50" : "border border-ink-100 bg-white",
            )}
          >
            {!compact && (
              <span
                aria-hidden
                className={cn("rounded-[3px] border-2", on ? "border-cobalt-700" : "border-ink-300")}
                style={{ width: sh.w, height: sh.h }}
              />
            )}
            <span className="text-[13px] font-bold text-ink-900">{s.label}</span>
            <span className="text-[11px] text-ink-400">{s.dims}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CaptionBox({ caption, compact }: { caption: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    setCopied(await copyText(caption));
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={cn("flex flex-col bg-ink-50", compact ? "gap-0 rounded-[14px] p-3.5" : "gap-2.5 rounded-[20px] p-4")}>
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-bold text-ink-900">Caption</span>
          <button type="button" onClick={copy} className="flex items-center gap-1.5 text-[13px] font-bold text-cobalt-700">
            <Copy size={15} aria-hidden />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <p className={cn("text-ink-700", compact ? "text-sm leading-[1.5]" : "text-sm leading-[1.55]")}>
        {caption}
        {compact && (
          <>
            {" "}
            <button type="button" onClick={copy} className="font-bold text-cobalt-700">
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
