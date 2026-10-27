"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ErrorNote, SkeletonBlock } from "@/features/app/ui";
import { CaptionBox, Preview, SizePicker } from "./parts";
import { downloadSize } from "./share";
import { ShareSheet } from "./ShareSheet";
import { usePublicityItem } from "./usePublicity";

/** One item: pick a size, copy the caption, download or share (design 17b). Used in the app and on public phones. */
export function ItemView({ slug, backHref, topPadding = "pt-[60px]" }: { slug: string; backHref: string; topPadding?: string }) {
  const q = usePublicityItem(slug);
  const [sizeKey, setSizeKey] = useState<string>();
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const item = q.data;
  const size = item?.sizes.find((s) => s.key === sizeKey) ?? item?.sizes[0];

  return (
    <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[520px]">
      <div className={`flex items-center justify-between px-5 pb-3 ${topPadding} lg:pt-9`}>
        <Link href={backHref} aria-label="Back" className="p-1 text-ink-900">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-[17px] font-bold text-ink-900">{item?.title ?? ""}</h1>
        <span className="w-8" />
      </div>
      {q.isError ? (
        <div className="px-5">
          <ErrorNote onRetry={() => q.refetch()} />
        </div>
      ) : !item || !size ? (
        <div className="flex flex-col gap-4 px-5" aria-busy="true">
          <SkeletonBlock className="h-[330px]" />
          <SkeletonBlock className="h-20" />
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-4 overflow-auto px-5 pb-5 pt-1">
            <Preview
              item={item}
              contain
              sizes="(min-width: 1024px) 520px, 100vw"
              className="h-[330px] flex-none rounded-[22px] bg-cream-100"
            />
            <SizePicker sizes={item.sizes} value={size.key} onChange={setSizeKey} />
            <CaptionBox caption={item.caption} />
          </div>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 border-t border-ink-50 px-5 pb-10 pt-3 lg:pb-6">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await downloadSize(item, size).finally(() => setBusy(false));
              }}
            >
              Download
            </Button>
            <Button size="lg" fullWidth onClick={() => setSheet(true)}>
              Share
            </Button>
          </div>
          <ShareSheet item={item} size={size} open={sheet} onOpenChange={setSheet} />
        </>
      )}
    </div>
  );
}
