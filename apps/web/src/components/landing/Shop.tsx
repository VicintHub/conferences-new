import Image from "next/image";
import Link from "next/link";
import { merch } from "@/content/landing";
import { H2, Section, SectionHead } from "./shared";

export function Shop() {
  return (
    <Section id="shop" className="pb-16 md:pb-24">
      <div className="flex flex-col gap-8">
        <SectionHead aside={<span className="text-[15px] font-medium text-ink-500">Pay online · collect at the venue</span>}>
          <H2>
            Shop the
            <br />
            conference merch
          </H2>
        </SectionHead>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {merch.map((m) => (
            <li key={m.t} className="flex flex-col gap-3.5">
              <Link href={m.href} className="relative block aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-white">
                <Image src={m.src} alt={m.t} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
              </Link>
              <div className="flex flex-col justify-between gap-0.5 md:flex-row md:items-baseline">
                <span className="font-display text-base font-bold uppercase text-cobalt-900 md:text-xl">{m.t}</span>
                <span className="text-[17px] font-semibold text-ink-800">{m.p}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
