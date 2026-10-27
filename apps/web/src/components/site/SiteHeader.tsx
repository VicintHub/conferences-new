import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { REGISTER_HREF } from "@/content/landing";
import { cn } from "@/lib/cn";
import { BagPill } from "./BagPill";

const links = [
  { label: "Home", href: "/" },
  { label: "Speakers", href: "/speakers" },
  { label: "Testimonies", href: "/testimonies" },
  { label: "Publicity kit", href: "/publicity" },
  { label: "Shop", href: "/shop" },
] as const;

/** Solid cobalt top bar for the inner public pages (desktop). Phones get each page's own compact header. */
export function SiteHeader({ active, bag }: { active: (typeof links)[number]["label"]; bag?: boolean }) {
  return (
    <header className="hidden items-center justify-between bg-cobalt-950 px-14 py-5 text-cream-50 md:flex">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/images/miv-logo.png" alt="MIV" width={44} height={44} className="size-11 object-contain" />
        <span className="font-display text-lg font-bold uppercase leading-[1.05]">
          Jan. Conf
          <br />
          2027
        </span>
      </Link>
      <nav aria-label="Main" className="flex gap-9 text-[15px]">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.label === active ? "page" : undefined}
            className={cn(l.label === active ? "font-bold text-cream-50" : "font-medium text-cobalt-100 hover:text-white")}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {bag ? (
        <BagPill />
      ) : (
        <Button href={REGISTER_HREF} variant="accent" display>
          Register now
        </Button>
      )}
    </header>
  );
}
