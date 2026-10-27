import { ministers } from "@/content/landing";
import { H2, Photo, Section, SectionHead } from "./shared";

export function Ministering() {
  return (
    <Section id="speakers" className="py-16 md:py-24">
      <div className="flex flex-col gap-10">
        <SectionHead aside={<span className="text-[15px] font-medium text-ink-500">More speakers announced soon</span>}>
          <H2>Ministering</H2>
        </SectionHead>
        <ul className="-mr-5 flex gap-3 overflow-x-auto pr-5 md:mr-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pr-0">
          {ministers.map((m) => (
            <li key={m.n} className="flex w-[200px] flex-none flex-col gap-2 md:w-auto md:gap-3.5">
              <div className="relative h-[240px] overflow-hidden rounded-[14px] md:aspect-[3/4] md:h-auto md:rounded-2xl">
                <Photo src={m.img} alt={m.n} sizes="(min-width: 768px) 25vw, 200px" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-base font-bold uppercase leading-[1.1] text-cobalt-900 md:text-xl">{m.n}</span>
                <span className="hidden text-sm text-ink-500 md:block">{m.r}</span>
              </div>
            </li>
          ))}
          {[1, 2].map((i) => (
            <li key={i} className="hidden flex-col gap-3.5 md:flex">
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl border-[1.5px] border-dashed border-cream-300 bg-cream-100">
                <span className="text-center font-display text-[28px] font-bold uppercase leading-none text-ink-300">
                  Coming
                  <br />
                  soon
                </span>
              </div>
              <span className="font-display text-xl font-bold uppercase text-ink-300">To be announced</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
