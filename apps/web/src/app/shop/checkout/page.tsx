import { SiteHeader } from "@/components/site/SiteHeader";
import { Checkout } from "@/features/shop/Checkout";

export const metadata = { title: "Checkout — Jan. Conf 2027", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="flex min-h-[100svh] flex-col bg-white lg:bg-cream-50">
      <div className="hidden lg:block">
        <SiteHeader active="Shop" bag />
      </div>
      <Checkout />
    </div>
  );
}
