import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/landing/Footer";
import { MobileProfile } from "@/features/speakers/MobileProfile";
import { SpeakersView } from "@/features/speakers/SpeakersView";
import type { Speaker } from "@/features/speakers/types";
import { serverGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const speaker = (await serverGet<{ data: Speaker }>(`/speakers/${(await params).slug}`))?.data;
  return speaker ? { title: `${speaker.name} — Jan. Conf 2027`, description: speaker.role } : { title: "Speaker — Jan. Conf 2027" };
}

/** Phones get the photo-led profile; desktop shows the list with this speaker's drawer already open. */
export default async function SpeakerPage({ params }: Params) {
  const { slug } = await params;
  const [one, all] = await Promise.all([serverGet<{ data: Speaker }>(`/speakers/${slug}`), serverGet<{ data: Speaker[] }>("/speakers")]);
  if (!one) notFound();
  return (
    <>
      <MobileProfile speaker={one.data} />
      <div className="hidden min-h-[100svh] bg-cream-50 md:block">
        <SiteHeader active="Speakers" />
        <SpeakersView speakers={all?.data ?? [one.data]} initialSlug={slug} />
        <Footer />
      </div>
    </>
  );
}
