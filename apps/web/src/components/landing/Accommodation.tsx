import { Button } from "@/components/ui";
import { photo, REGISTER_HREF } from "@/content/landing";
import { Photo, Section } from "./shared";

export function Accommodation() {
  return (
    <Section id="accommodation" className="pb-16 md:pb-24">
      <div className="grid overflow-hidden rounded-[20px] bg-cobalt-900 text-cream-50 md:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex flex-col gap-5 p-6 md:p-16">
          <h2 className="font-display text-[40px] font-bold uppercase leading-[0.92] md:text-[64px]">
            We have made
            <br />
            room for you
          </h2>
          <p className="max-w-[480px] text-[17px] leading-[1.6] text-cobalt-200">
            Vetted hotels and lodges near the venue, across different budgets. Rooms are limited, so plan early.
          </p>
          <div className="mt-1.5">
            <Button href={REGISTER_HREF} variant="onDark" size="lg" display>
              Register Now
            </Button>
          </div>
        </div>
        <div className="relative min-h-[240px] bg-cobalt-800">
          <Photo src={photo("lp-hotel")} sizes="(min-width: 768px) 460px, 100vw" />
        </div>
      </div>
    </Section>
  );
}
