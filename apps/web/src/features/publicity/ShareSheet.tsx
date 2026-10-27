"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui";
import { PlatformIcon } from "./parts";
import { copyText, platforms, sharePlatform } from "./share";
import type { PublicityItem, PublicitySize } from "./types";

/** Share sheet (design 17c): the caption is copied as soon as it opens, then one tap per platform. */
export function ShareSheet({
  item,
  size,
  open,
  onOpenChange,
}: {
  item: PublicityItem;
  size: PublicitySize;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote("");
    void copyText(item.caption).then(setCopied);
  }, [open, item.caption]);

  const run = async (id: (typeof platforms)[number]["id"]) => {
    const msg = await sharePlatform(id, item, size);
    if (msg) setNote(msg);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Share ${item.title.toLowerCase()}`}
      description={copied ? "Caption copied" : "Pick where to share"}
    >
      <div className="mt-4 flex flex-col gap-[18px]">
        <div className="flex items-center gap-3">
          {item.preview && <Image src={item.preview} alt="" width={52} height={52} className="size-[52px] rounded-xl object-cover" />}
          <span className="text-sm text-ink-500">
            {item.title} · {size.label}
          </span>
        </div>
        <ul className="grid grid-cols-4 gap-x-2 gap-y-[18px]">
          {platforms.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => run(p.id)} className="flex w-full flex-col items-center gap-2">
                <span className="flex size-[58px] items-center justify-center rounded-[18px] bg-cobalt-50 text-cobalt-700">
                  <PlatformIcon path={p.path} />
                </span>
                <span className="text-center text-xs font-semibold leading-[1.2] text-ink-800">{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {note && (
          <p role="status" className="rounded-xl bg-cobalt-50 p-3 text-sm text-cobalt-800">
            {note}
          </p>
        )}
      </div>
    </Sheet>
  );
}
