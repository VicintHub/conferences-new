import { MobileTopBar } from "@/components/site/MobileTopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/landing/Footer";
import { SpeakersView } from "@/features/speakers/SpeakersView";
import type { Speaker } from "@/features/speakers/types";
import { serverGet } from "@/lib/server/api";

export const metadata = { title: "Speakers — Jan. Conf 2027", description: "Hosts and ministers at the 37th IMLC & IYLC." };
export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  const speakers = (await serverGet<{ data: Speaker[] }>("/speakers"))?.data ?? [];
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <SiteHeader active="Speakers" />
      <MobileTopBar title="Speakers" />
      <SpeakersView speakers={speakers} />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
