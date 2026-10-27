import { Suspense } from "react";
import { MockPay } from "@/features/shop/MockPay";

export const metadata = { title: "Mock payment — Jan. Conf 2027", robots: { index: false } };

export default function MockPayPage() {
  return (
    <Suspense>
      <MockPay />
    </Suspense>
  );
}
