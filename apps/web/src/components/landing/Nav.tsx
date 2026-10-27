"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, Sheet } from "@/components/ui";
import { navLinks, REGISTER_HREF } from "@/content/landing";

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-10 flex items-center justify-between px-5 pb-0 pt-6 md:px-14">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/images/miv-logo.png" alt="MIV" width={48} height={48} className="size-10 object-contain md:size-12" priority />
        <span className="hidden font-display text-lg font-bold uppercase leading-[1.05] md:block">
          Jan. Conf
          <br />
          2027
        </span>
      </Link>
      <nav aria-label="Main" className="hidden gap-9 text-[15px] font-medium text-cobalt-100 lg:flex">
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-white">
            {l.label}
          </a>
        ))}
      </nav>
      <div className="hidden md:block">
        <Button href={REGISTER_HREF} variant="accent" display>
          Register Now
        </Button>
      </div>
      <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="md:hidden">
        <Menu size={26} strokeWidth={2} strokeLinecap="round" />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Menu">
        <nav aria-label="Mobile" className="mt-4 flex flex-col text-ink-900">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-ink-100 py-4 text-lg font-semibold">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-6">
          <Button href={REGISTER_HREF} variant="accent" size="lg" fullWidth>
            Register Now
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
