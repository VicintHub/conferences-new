import { Suspense } from "react";
import { AdminLogin } from "@/features/admin/Login";

export const metadata = { title: "Staff sign in — Jan. Conf 2027", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
