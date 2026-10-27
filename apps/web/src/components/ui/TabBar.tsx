import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabKey = "home" | "prog" | "pass" | "live" | "more";

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const tabs: { key: TabKey; label: string; href: string; icon: React.ReactNode }[] = [
  {
    key: "home",
    label: "Home",
    href: "/app",
    icon: (
      <Svg>
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </Svg>
    ),
  },
  {
    key: "prog",
    label: "Programme",
    href: "/app/programme",
    icon: (
      <Svg>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18M8 2v4M16 2v4" />
      </Svg>
    ),
  },
  {
    key: "pass",
    label: "Pass",
    href: "/app/pass",
    icon: (
      <Svg>
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="16" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="16" width="5" height="5" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" />
      </Svg>
    ),
  },
  {
    key: "live",
    label: "Live",
    href: "/app/live",
    icon: (
      <Svg>
        <circle cx="12" cy="12" r="2" />
        <path d="M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2" />
      </Svg>
    ),
  },
  {
    key: "more",
    label: "More",
    href: "/app/more",
    icon: (
      <Svg>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </Svg>
    ),
  },
];

/** Mobile bottom tab bar: 5 columns, 11px labels, 30px bottom safe area. */
export function TabBar({ active }: { active: TabKey }) {
  return (
    <nav aria-label="Primary" className="grid grid-cols-5 border-t border-ink-100 bg-white px-2 pb-[30px] pt-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-1 py-1.5 text-[11px] font-semibold",
            t.key === active ? "text-cobalt-600" : "text-ink-300",
          )}
        >
          {t.icon}
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
