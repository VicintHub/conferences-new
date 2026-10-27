import { why } from "@/content/landing";
import { H2, Section } from "./shared";

export function Why() {
  return (
    <div className="bg-cobalt-900 text-cream-50">
      <Section className="py-16 md:py-24">
        <div className="flex flex-col gap-11">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <H2 tone="cream" size="md">
              Get ready for a
              <br />
              <span className="text-brick-400">rich</span> experience
            </H2>
            <span className="text-[13px] font-medium tracking-[0.1em] text-cobalt-300">WHY YOU SHOULD JOIN</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {why.map((w) => (
              <article
                key={w.n}
                className="relative flex min-h-[260px] flex-col gap-4 overflow-hidden rounded-2xl border border-white/15 bg-cobalt-800 px-7 py-8 md:min-h-[300px]"
              >
                <span
                  aria-hidden
                  className="absolute -right-1.5 -top-[30px] font-display text-[200px] font-bold leading-none text-white/[0.06]"
                >
                  {w.n}
                </span>
                <span className="font-display text-[22px] font-bold text-brick-400">{w.n}</span>
                <h3 className="mt-auto font-display text-[30px] font-bold uppercase leading-none">{w.t}</h3>
                <p className="text-[15px] leading-[1.55] text-cobalt-200">{w.s}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
