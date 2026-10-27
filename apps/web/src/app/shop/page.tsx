import { Footer } from "@/components/landing/Footer";
import { MobileTopBar } from "@/components/site/MobileTopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Catalog } from "@/features/shop/Catalog";
import { BagIconLink } from "@/features/shop/parts";
import type { ShopList } from "@/features/shop/types";
import { serverGet } from "@/lib/server/api";

export const metadata = { title: "Shop — Jan. Conf 2027", description: "Conference merchandise. Pay online, collect at the venue." };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const list = await serverGet<ShopList>("/shop/products", 30);
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <SiteHeader active="Shop" bag />
      <MobileTopBar title="Shop" trailing={<BagIconLink />} />
      <Catalog list={list} />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
