import { MobileTopBar } from "@/components/site/MobileTopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PublicShare } from "@/features/testimonies/PublicShare";

export const metadata = { title: "Share your testimony — Jan. Conf 2027" };

export default function SharePage() {
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <SiteHeader active="Testimonies" />
      <MobileTopBar title="Share your testimony" backHref="/testimonies" />
      <PublicShare />
    </div>
  );
}
