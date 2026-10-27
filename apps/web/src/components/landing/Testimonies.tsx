import Image from "next/image";
import Link from "next/link";
import { photo, testimonies } from "@/content/landing";
import { H2, Photo, PlayButton, Section } from "./shared";

export function Testimonies() {
  return (
    <Section id="testimonies" className="pb-16 md:pb-24">
      <div className="flex flex-col gap-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">What God did at IMLC</span>
            <H2>Testimonies</H2>
          </div>
          <Link href="/app/testimonies" className="text-[15px] font-bold text-cobalt-700 hover:text-brick-600">
            Share yours in the app →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-[5fr_7fr]">
          <div className="relative min-h-[360px] overflow-hidden rounded-[20px] bg-cobalt-900 md:min-h-[460px]">
            <Photo src={photo("lp-about-1")} sizes="(min-width: 768px) 40vw, 100vw" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,20,40,.95))]"
            />
            <PlayButton size={72} />
            <div className="pointer-events-none absolute inset-x-7 bottom-7 flex flex-col gap-2 text-cream-50">
              <span className="font-display text-[26px] font-bold uppercase leading-[1.1]">“I came weary. I left commissioned.”</span>
              <span className="text-sm font-medium text-cobalt-200">Pastor Femi A. · Abeokuta · 2:40</span>
            </div>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {testimonies.map((t) => (
              <li key={t.n} className="flex flex-col gap-[18px] rounded-[20px] border border-ink-100 bg-white p-7">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-brick-600)" aria-hidden>
                  <path d="M10 7H6a3 3 0 0 0-3 3v4h5v-4H5.5A1.5 1.5 0 0 1 7 8.5V7zm10 0h-4a3 3 0 0 0-3 3v4h5v-4h-2.5A1.5 1.5 0 0 1 17 8.5V7z" />
                </svg>
                <p className="flex-1 text-pretty text-base leading-[1.6] text-ink-700">{t.q}</p>
                <div className="flex items-center gap-3">
                  <Image src={t.av} alt="" width={40} height={40} className="size-10 rounded-full bg-cobalt-100 object-cover" />
                  <div className="flex flex-col gap-px">
                    <span className="text-[15px] font-bold text-ink-900">{t.n}</span>
                    <span className="text-[13px] text-ink-400">{t.w}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
