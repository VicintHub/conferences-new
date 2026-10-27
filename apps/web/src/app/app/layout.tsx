import { AppShell } from "@/features/app/AppShell";

export const metadata = { title: "Jan. Conf 2027", robots: { index: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
