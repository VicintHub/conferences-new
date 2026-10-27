import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ProductView } from "@/features/shop/ProductView";
import type { ProductDetail } from "@/features/shop/types";
import { serverGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const p = (await serverGet<{ data: ProductDetail }>(`/shop/products/${(await params).slug}`, 30))?.data;
  return p
    ? { title: `${p.name} — Jan. Conf 2027`, openGraph: { title: p.name, images: p.image ? [p.image] : [] } }
    : { title: "Shop — Jan. Conf 2027" };
}

export default async function ProductPage({ params }: Params) {
  const res = await serverGet<{ data: ProductDetail }>(`/shop/products/${(await params).slug}`, 30);
  if (!res) notFound();
  return (
    <div className="min-h-[100svh] bg-white md:bg-cream-50">
      <div className="hidden md:block">
        <SiteHeader active="Shop" bag />
      </div>
      <ProductView product={res.data} />
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
