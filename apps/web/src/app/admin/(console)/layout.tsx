import { AdminShell } from "@/features/admin/Shell";

export const metadata = { title: "Admin — Jan. Conf 2027", robots: { index: false } };

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
