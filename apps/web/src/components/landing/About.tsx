import Image from "next/image";
import { photo } from "@/content/landing";
import { H2, Photo, Section } from "./shared";

export function About() {
  return (
    <Section id="about" className="py-16 md:py-[104px]">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-[22px]">
          <H2>
            The biggest
            <br />
            conference
            <br />
            <span className="text-brick-600">of the year</span>
          </H2>
          <p className="max-w-[500px] text-lg leading-[1.6] text-ink-600">
            MIV organizes interdenominational leadership conferences for Christian leaders in all spheres of influence including government
            executives, captains of industries, religious leaders, traditional rulers, and emerging leaders to equip them for kingdom-minded
            leadership
          </p>
          <div className="mt-1.5 flex items-center gap-3.5">
            <div className="flex flex-none">
              {["lp-host-1", "lp-about-1", "lp-host-2"].map((p) => (
                <Image
                  key={p}
                  src={photo(p)}
                  alt=""
                  width={44}
                  height={44}
                  className="-mr-3 size-11 flex-none rounded-full border-[3px] border-cream-50 bg-cobalt-100 object-cover"
                />
              ))}
            </div>
            <span className="ml-3.5 text-[15px] font-medium leading-[1.4] text-ink-700">
              A conference trusted by 2,000+ attendees yearly—your turn to be part of it.
            </span>
          </div>
        </div>
        <div className="grid h-[320px] min-w-0 grid-cols-2 gap-3.5 md:h-[460px]">
          <div className="relative h-full overflow-hidden rounded-2xl">
            <Photo src={photo("lp-about-1")} sizes="(min-width: 768px) 25vw, 50vw" />
          </div>
          <div className="relative mt-12 h-[calc(100%-48px)] overflow-hidden rounded-2xl">
            <Photo src={photo("lp-about-2")} sizes="(min-width: 768px) 25vw, 50vw" />
          </div>
        </div>
      </div>
    </Section>
  );
}
