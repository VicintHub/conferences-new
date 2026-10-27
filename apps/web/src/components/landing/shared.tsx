import Image from "next/image";
import { cn } from "@/lib/cn";

/** Oswald section heading: 40px on mobile, 64–72px on desktop. */
export function H2({
  children,
  tone = "cobalt",
  size = "lg",
}: {
  children: React.ReactNode;
  tone?: "cobalt" | "cream";
  size?: "lg" | "md";
}) {
  return (
    <h2
      className={cn(
        "font-display font-bold uppercase leading-[0.92] tracking-[-0.01em]",
        size === "lg" ? "text-[40px] md:text-[64px] lg:text-[72px]" : "text-[40px] md:text-[56px]",
        tone === "cobalt" ? "text-cobalt-900" : "text-cream-50",
      )}
    >
      {children}
    </h2>
  );
}

export function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-6 px-5 md:px-14", className)}>
      <div className="mx-auto max-w-[1168px]">{children}</div>
    </section>
  );
}

export function SectionHead({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      {children}
      {aside}
    </div>
  );
}

/** Photo that fills its (relatively positioned) parent. */
export function Photo({
  src,
  alt = "",
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
}

export function PlayButton({ size = 64 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95"
    >
      <svg width={size * 0.375} height={size * 0.375} viewBox="0 0 24 24" fill="var(--color-cobalt-900)">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}
