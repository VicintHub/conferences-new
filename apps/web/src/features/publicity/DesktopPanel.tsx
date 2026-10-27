"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { CaptionBox, PlatformIcon, Preview, SizePicker } from "./parts";
import { downloadAll, quickPlatforms, sharePlatform } from "./share";
import type { PublicityItem } from "./types";

/** Sticky selected-item panel on the desktop library (design 18a). */
export function DesktopPanel({ item }: { item: PublicityItem }) {
  const [sizeKey, setSizeKey] = useState<string>();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const size = item.sizes.find((s) => s.key === sizeKey) ?? item.sizes[0];

  return (
    <aside
      className="sticky top-6 flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-md"
      aria-label={`${item.title} options`}
    >
      <Preview item={item} contain sizes="400px" className="h-[300px] rounded-2xl bg-cream-100" />
      <h2 className="font-display text-[22px] font-bold uppercase leading-[1.1] text-cobalt-900">{item.title}</h2>
      <SizePicker sizes={item.sizes} value={size.key} onChange={setSizeKey} compact />
      <CaptionBox caption={item.caption} compact />
      <div className="flex justify-between">
        {quickPlatforms.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            aria-label={`Share on ${p.label}`}
            onClick={async () => setNote((await sharePlatform(p.id, item, size)) ?? "")}
            className="flex size-12 items-center justify-center rounded-[14px] bg-cobalt-50 text-cobalt-700 hover:bg-cobalt-100"
          >
            <PlatformIcon path={p.path} size={22} />
          </button>
        ))}
      </div>
      {note && (
        <p role="status" className="rounded-xl bg-cobalt-50 p-3 text-sm text-cobalt-800">
          {note}
        </p>
      )}
      <Button
        size="lg"
        fullWidth
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await downloadAll(item).finally(() => setBusy(false));
        }}
      >
        {busy ? "Downloading…" : item.sizes.length > 1 ? "Download all sizes" : "Download"}
      </Button>
    </aside>
  );
}
