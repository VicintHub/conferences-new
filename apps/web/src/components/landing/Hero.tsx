import { Button, Countdown } from "@/components/ui";
import { photo, REGISTER_HREF } from "@/content/landing";
import { Nav } from "./Nav";
import { Photo } from "./shared";

export function Hero() {
  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cobalt-950 text-cream-50 md:h-[760px] md:min-h-0">
      <div className="absolute inset-0 opacity-50">
        <Photo src={photo("lp-hero")} sizes="100vw" priority className="hidden md:block" />
        <Photo src={photo("lp-hero-m")} sizes="100vw" priority className="md:hidden" />
      </div>
      <div aria-hidden className="grid-motif pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,20,40,.6)_0%,rgba(0,20,40,.15)_40%,rgba(0,20,40,.97)_85%)] md:bg-[linear-gradient(180deg,rgba(0,20,40,.55)_0%,rgba(0,20,40,.2)_40%,rgba(0,20,40,.95)_100%)]"
      />
      <Nav />
      <div className="relative mt-auto flex flex-col items-center gap-[18px] px-5 pb-11 text-center md:gap-[26px] md:px-14 md:pb-16">
        <span className="text-xs font-semibold tracking-[0.3em] text-cobalt-200 md:text-sm">SEE YOU ON</span>
        <h1 className="font-display text-[64px] font-bold uppercase leading-[0.88] tracking-[-0.02em] md:text-[128px] md:leading-[0.86] md:tracking-normal">
          19th – 24th
          <br />
          Jan, 2027
        </h1>
        <p className="text-sm text-cobalt-100 md:text-lg">
          <span className="md:hidden">37th IMLC &amp; IYLC · Ojoo, Ibadan</span>
          <span className="hidden md:inline">
            37th IMLC &amp; IYLC · Leadership &amp; Missions Conference Centre, Olororo, Ojoo, Ibadan
          </span>
        </p>
        <div className="w-full md:mt-1.5 md:w-auto">
          <Countdown variant="hero" />
        </div>
        <div className="w-full md:hidden">
          <Button href={REGISTER_HREF} variant="accent" size="lg" fullWidth>
            Register Now
          </Button>
        </div>
      </div>
      <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-brick-600" />
    </div>
  );
}
