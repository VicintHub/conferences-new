import { Button } from "@/components/ui";
import { galleryPhotos, reels, REGISTER_HREF } from "@/content/landing";
import { H2, Photo, PlayButton, Section, SectionHead } from "./shared";

export function Gallery() {
  return (
    <Section id="gallery" className="pb-16 md:pb-24">
      <div className="flex flex-col gap-10">
        <SectionHead aside={<span className="text-[15px] font-medium text-ink-500">Moments from past editions</span>}>
          <H2>Gallery</H2>
        </SectionHead>
        <div className="flex flex-col gap-3.5">
          <span className="eyebrow">Photos</span>
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4">
            {galleryPhotos.map((src, i) => (
              <div key={i} className="relative min-w-0 overflow-hidden rounded-2xl">
                <Photo src={src} alt={`Conference photo ${i + 1}`} sizes="(min-width: 768px) 25vw, 50vw" />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-center">
            <Button href={REGISTER_HREF} variant="outline" display>
              Register Now
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3.5">
          <span className="eyebrow">Video highlights</span>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {reels.map((r) => (
              <li key={r.t} className="relative aspect-[9/16] min-w-0 overflow-hidden rounded-[18px] bg-cobalt-900 md:rounded-2xl">
                <Photo src={r.src} sizes="(min-width: 768px) 25vw, 50vw" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(0,20,40,.9))]"
                />
                <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                  {r.d}
                </span>
                <PlayButton />
                <span className="pointer-events-none absolute inset-x-4 bottom-4 font-display text-xl font-bold uppercase leading-[1.05] text-cream-50">
                  <span className="sr-only">Video: </span>
                  {r.t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
