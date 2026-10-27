import { Button } from "@/components/ui";
import { photo, REGISTER_HREF } from "@/content/landing";
import { H2, Photo, Section } from "./shared";

const p = "text-pretty text-[17px] leading-[1.7] text-ink-600";

export function Hosts() {
  return (
    <div className="bg-white">
      <Section className="py-16 md:py-[104px]">
        <div className="grid items-center gap-10 md:grid-cols-[5fr_6fr] md:gap-16">
          {/* The combined portrait is not in the handoff assets; two portraits side by side stand in until it is supplied. */}
          <div
            role="img"
            aria-label="Rev. Samson and Rev. Stella Ajetomobi"
            className="grid aspect-[4/5] min-w-0 grid-cols-2 overflow-hidden rounded-3xl"
          >
            {["lp-host-1", "lp-host-2"].map((n) => (
              <div key={n} className="relative">
                <Photo src={photo(n)} sizes="(min-width: 768px) 20vw, 50vw" />
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <H2>Meet the hosts</H2>
            <span className="eyebrow">The President &amp; vice-President</span>
            <h3 className="font-display text-[28px] font-bold uppercase leading-none text-ink-900 md:text-4xl">
              Rev. Samson &amp; Stella Ajetomobi
            </h3>
            <span aria-hidden className="h-[3px] w-12 bg-brick-600" />
            <p className={p}>
              Rev. Samson and Rev. Stella Ajetomobi are dedicated ministers of the Gospel and visionary leaders with a shared passion for
              advancing God’s Kingdom, developing leaders, and strengthening families. Rev. Samson is the President of The Men of Issachar
              Vision Incorporated (MIV), founded in 1989, and Overseer of the Redemption Faith Churches. A trained Agricultural Engineer and
              certified professional manager, he is a leadership developer, author, and seasoned minister with a mandate to reach the
              unreached and awaken the Church to her divine responsibilities.
            </p>
            <p className={p}>
              Rev. Stella Ajetomobi, Vice President of MIV, is a gifted teacher and prophetic minister with a passion for Christian
              character, discipleship, and missions. A former Food Technologist at the International Institute of Tropical Agriculture
              (IITA) with a Master’s degree in Personnel Psychology, she is an author and host of Back to Bethel Retreats, a ministry
              dedicated to strengthening ministers’ wives and female leaders. Together, they have devoted their lives to ministry,
              leadership development, and building godly homes, raising a generation committed to fulfilling God’s purpose
            </p>
            <div className="mt-2">
              <Button href={REGISTER_HREF} variant="outline" size="lg" display>
                Register Now
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
