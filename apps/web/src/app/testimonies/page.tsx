import { Footer } from "@/components/landing/Footer";
import { MobileTopBar } from "@/components/site/MobileTopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PublicWall } from "@/features/testimonies/PublicWall";
import type { Feed } from "@/features/testimonies/types";
import { serverGet } from "@/lib/server/api";

export const metadata = { title: "Testimonies — Jan. Conf 2027", description: "What God did at IMLC." };
export const dynamic = "force-dynamic";

export default async function TestimoniesPage() {
  const initial = await serverGet<Feed>("/testimonies");
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <SiteHeader active="Testimonies" />
      <MobileTopBar title="Testimonies" />
      <PublicWall initial={initial} />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
