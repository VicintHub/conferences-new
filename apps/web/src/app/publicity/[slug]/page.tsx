import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ItemView } from "@/features/publicity/ItemView";
import type { PublicityItem } from "@/features/publicity/types";
import { serverGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Link previews (WhatsApp, Facebook, X) use this title, caption and image when someone shares an item. */
export async function generateMetadata({ params }: Params) {
  const item = (await serverGet<{ data: PublicityItem }>(`/publicity/${(await params).slug}`))?.data;
  if (!item) return { title: "Publicity kit — Jan. Conf 2027" };
  return {
    title: `${item.title} — Jan. Conf 2027`,
    description: item.caption,
    openGraph: { title: item.title, description: item.caption, images: item.preview ? [item.preview] : [] },
    twitter: { card: "summary_large_image", title: item.title, description: item.caption },
  };
}

export default async function PublicityItemPage({ params }: Params) {
  const { slug } = await params;
  const item = await serverGet<{ data: PublicityItem }>(`/publicity/${slug}`);
  if (!item) notFound();
  return (
    <div className="flex min-h-[100svh] flex-col bg-white">
      <SiteHeader active="Publicity kit" />
      <ItemView slug={slug} backHref="/publicity" topPadding="pt-6" />
    </div>
  );
}
