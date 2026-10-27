import { Footer } from "@/components/landing/Footer";
import { MobileTopBar } from "@/components/site/MobileTopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PublicLibrary } from "@/features/publicity/Library";
import type { PublicityList } from "@/features/publicity/types";
import { serverGet } from "@/lib/server/api";

export const metadata = {
  title: "Publicity kit — Jan. Conf 2027",
  description: "Official flyers, videos and captions to help spread the word.",
};
export const dynamic = "force-dynamic";

export default async function PublicityPage() {
  const initial = await serverGet<PublicityList>("/publicity");
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <SiteHeader active="Publicity kit" />
      <MobileTopBar title="Publicity kit" />
      <PublicLibrary initial={initial} />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
