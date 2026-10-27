import { Button } from "@/components/ui";
import { PARTNER_HREF } from "@/content/landing";
import { Section } from "./shared";

export function Partner() {
  return (
    <Section className="pb-16 md:pb-24">
      <div className="flex flex-col justify-between gap-8 rounded-[20px] bg-brick-700 px-6 py-10 text-cream-50 md:flex-row md:items-center md:gap-10 md:px-16 md:py-14">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display text-[36px] font-bold uppercase leading-[0.95] md:text-[52px]">Want to partner with us?</h2>
          <p className="text-[17px] text-brick-100">Support the conference and the work of the Men of Issachar Vision.</p>
        </div>
        <div className="flex-none">
          <Button href={PARTNER_HREF} variant="onDark" size="lg" display>
            PARTNER
          </Button>
        </div>
      </div>
    </Section>
  );
}
