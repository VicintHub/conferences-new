import type { Venue } from "./types";

/** OpenStreetMap's keyless embed, centred on the venue with a pin. */
export function mapEmbedUrl({ lat, lng }: Pick<Venue, "lat" | "lng">): string {
  const dx = 0.03;
  const dy = 0.02;
  const bbox = [lng - dx, lat - dy, lng + dx, lat + dy].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

/** Turn-by-turn in whatever maps app the phone prefers. */
export const directionsUrl = ({ lat, lng }: Pick<Venue, "lat" | "lng">) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const venueLink = ({ lat, lng }: Pick<Venue, "lat" | "lng">) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export function whatsappUrl(number: string, hotel: string, code: string | null): string {
  const text = `Hello, I'd like to book a room at ${hotel} for Jan. Conf 2027${code ? ` (code ${code})` : ""}.`;
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Directions to a hotel from wherever the person is. */
export const hotelDirectionsUrl = (h: { name: string; lat: number | null; lng: number | null }) =>
  h.lat !== null && h.lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} Ibadan`)}`;
