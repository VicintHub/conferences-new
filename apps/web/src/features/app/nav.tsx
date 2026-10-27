import { tabs } from "@/components/ui";

export const sidebarItems = [
  { label: "Home", href: "/app", match: (p: string) => p === "/app" },
  { label: "Programme", href: "/app/programme", match: (p: string) => p.startsWith("/app/programme") },
  { label: "My pass", href: "/app/pass", match: (p: string) => p.startsWith("/app/pass") },
  { label: "Live", href: "/app/live", match: (p: string) => p.startsWith("/app/live") },
  { label: "Attending card", href: "/app/attending-card", match: (p: string) => p.startsWith("/app/attending-card") },
  { label: "My team", href: "/app/team", match: (p: string) => p.startsWith("/app/team") },
  { label: "Store", href: "/shop", match: (p: string) => p.startsWith("/shop") },
  { label: "Hotels & travel", href: "/app/hotels", match: (p: string) => p.startsWith("/app/hotels") },
];

/** Which bottom tab is active. Anything that lives under "More" (team, hotels, …) highlights More. */
export function activeTab(pathname: string): (typeof tabs)[number]["key"] {
  if (pathname === "/app") return "home";
  if (pathname.startsWith("/app/programme")) return "prog";
  if (pathname.startsWith("/app/pass")) return "pass";
  if (pathname.startsWith("/app/live")) return "live";
  return "more";
}
