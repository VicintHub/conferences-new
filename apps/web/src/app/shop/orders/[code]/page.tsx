import { Suspense } from "react";
import { OrderView } from "@/features/shop/OrderView";

export const metadata = { title: "Your order — Jan. Conf 2027", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense>
      <OrderView code={(await params).code} />
    </Suspense>
  );
}
