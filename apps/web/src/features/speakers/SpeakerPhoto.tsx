import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/time";

/** Speaker portrait filling its parent; falls back to an initials tile when no photo has been supplied. */
export function SpeakerPhoto({
  name,
  src,
  sizes,
  className,
  priority,
}: {
  name: string;
  src: string | null;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn("flex size-full items-center justify-center bg-cobalt-50 font-display text-5xl font-bold text-cobalt-700", className)}
      >
        {initials(name)}
      </div>
    );
  }
  return <Image src={src} alt={name} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
}
