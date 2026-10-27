import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Hotel } from "./types";

export function HotelImage({ hotel, className }: { hotel: Hotel; className?: string }) {
  return hotel.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- hotel photos can be admin-supplied URLs
    <img src={hotel.image} alt={`${hotel.name}`} className={cn("size-full object-cover", className)} />
  ) : (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 border border-dashed border-ink-300 bg-ink-50 text-ink-500",
        className,
      )}
    >
      <ImageIcon size={26} aria-hidden />
      <span className="text-[15px]">Photo coming soon</span>
    </div>
  );
}

export const kmLabel = (h: Hotel) => `${h.distance_km.toFixed(1)} km`;

export function Pill({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "cobalt" | "soft" }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold leading-none",
        tone === "light" && "bg-white text-ink-900",
        tone === "cobalt" && "bg-cobalt-600 text-white",
        tone === "soft" && "bg-cobalt-100 text-cobalt-800",
      )}
    >
      {children}
    </span>
  );
}
