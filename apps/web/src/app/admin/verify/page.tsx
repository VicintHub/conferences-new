import { Suspense } from "react";
import { AdminVerifyLink } from "@/features/admin/VerifyLink";

export const metadata = { title: "Signing you in — Jan. Conf 2027", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <AdminVerifyLink />
    </Suspense>
  );
}
