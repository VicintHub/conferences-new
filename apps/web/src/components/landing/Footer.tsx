import Image from "next/image";
import { contact } from "@/content/landing";
import { REGISTER_HREF } from "@/content/landing";

const label = "text-[11px] font-semibold tracking-[0.12em] text-cobalt-400";

export function Footer() {
  return (
    <footer className="bg-cobalt-950 px-5 py-12 text-cobalt-200 md:p-14">
      <div className="mx-auto grid max-w-[1168px] gap-10 md:grid-cols-[2fr_1fr_2fr] md:gap-12">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <Image src="/images/miv-logo.png" alt="MIV" width={56} height={56} className="size-14 object-contain" />
            <span className="font-display text-lg font-bold uppercase leading-[1.1] text-cream-50">
              The Men of
              <br />
              Issachar Vision Inc.
            </span>
          </div>
          <span className="text-sm">© 2027 International Ministers &amp; Leadership Conference.</span>
        </div>
        <nav aria-label="Quick links" className="flex flex-col gap-2.5 text-[15px] font-medium">
          <span className={label}>QUICK LINKS</span>
          <a href="#about">About</a>
          <a href="#speakers">Speakers</a>
          <a href="#schedule">Schedule</a>
          <a href={REGISTER_HREF}>Register</a>
        </nav>
        <address className="flex flex-col gap-2.5 text-[15px] not-italic leading-[1.5]">
          <span className={label}>CONTACT</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
          <span>{contact.address}</span>
        </address>
      </div>
    </footer>
  );
}
