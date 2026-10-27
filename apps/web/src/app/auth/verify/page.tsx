import { Suspense } from "react";
import { VerifyLink } from "@/features/auth/VerifyLink";

export const metadata = { title: "Signing you in — Jan. Conf 2027", robots: { index: false } };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyLink />
    </Suspense>
  );
}
