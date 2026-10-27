import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { photo, regOptions, REGISTER_HREF } from "@/content/landing";
import { H2, Photo, Section } from "./shared";

export function Registration() {
  return (
    <Section id="register" className="pb-16 md:pb-24">
      <div className="grid overflow-hidden rounded-[20px] border border-ink-100 bg-white md:grid-cols-2">
        <div className="relative min-h-[240px] md:min-h-[460px]">
          <Photo src={photo("lp-reg")} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="flex flex-col gap-[22px] p-6 md:p-14">
          <H2 size="md">
            Registration
            <br />
            is free
          </H2>
          <ul className="flex flex-col gap-3">
            {regOptions.map((r) => (
              <li key={r} className="flex items-center gap-3 text-[17px] font-medium text-ink-800">
                <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-cobalt-50">
                  <Check size={14} strokeWidth={3} className="text-cobalt-700" />
                </span>
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button href={REGISTER_HREF} size="lg" display>
              Register Now
            </Button>
            <Button href={REGISTER_HREF} variant="outline" size="lg" display>
              Register Now
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
