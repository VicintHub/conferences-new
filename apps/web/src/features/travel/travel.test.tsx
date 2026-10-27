import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDesktop } from "../../../vitest.setup";
import { HotelDetail } from "./HotelDetail";
import { HotelPage } from "./HotelPage";
import { directionsUrl, mapEmbedUrl, whatsappUrl } from "./links";
import { Travel } from "./Travel";
import { inBudget, type Hotel, type Travel as TravelData } from "./types";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const hotel = (slug: string, name: string, kobo: number, km: number, partner: boolean, over: Partial<Hotel> = {}): Hotel => ({
  slug,
  name,
  area: "Ojoo",
  lat: 7.45,
  lng: 3.91,
  price_kobo: kobo,
  distance_km: km,
  drive_minutes: 3,
  conference_rate: partner,
  rate_code: partner ? "JANCONF27" : null,
  image: null,
  amenities: ["Breakfast", "Wi-Fi", "Generator 24h", "Shuttle"],
  shuttle_note: partner ? "Shuttle to the venue every 30 minutes from 7 AM." : null,
  phone: "+2348080854818",
  whatsapp: "+2348080854818",
  ...over,
});
const data: TravelData = {
  venue: { name: "Leadership & Missions Conference Centre", address: "Olororo, Ojoo, Ibadan", lat: 7.461863, lng: 3.912484 },
  hotels: [
    hotel("olororo", "Olororo Guest Lodge", 1800000, 0.8, true),
    hotel("ojoo", "Ojoo Grand Hotel", 2500000, 2.4, true),
    hotel("moniya", "Moniya Suites", 1500000, 5.1, false),
    hotel("bodija", "Bodija Executive Inn", 3500000, 9.6, false),
  ],
  shuttles: [
    { id: 1, name: "Ojoo roundabout", schedule: "Every 20 min · 6:30 AM – 10 PM" },
    { id: 2, name: "Iwo Road interchange", schedule: "Every 45 min · 6 AM – 9 PM" },
  ],
};

beforeEach(() => {
  setDesktop(false);
  window.location.hash = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => json({ data })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Travel (phone)", () => {
  it("lists hotels with distance, price and the conference-rate tag", async () => {
    render(wrap(<Travel />));
    const first = await screen.findByRole("link", { name: /Olororo Guest Lodge/ });
    expect(first).toHaveAttribute("href", "/app/hotels/olororo");
    expect(within(first).getByText("0.8 km")).toBeInTheDocument();
    expect(within(first).getByText("Conference rate")).toBeInTheDocument();
    expect(within(first).getByText("₦18,000")).toBeInTheDocument();
    const moniya = screen.getByRole("link", { name: /Moniya Suites/ });
    expect(within(moniya).queryByText("Conference rate")).not.toBeInTheDocument();
    expect(within(moniya).getByText("Photo coming soon")).toBeInTheDocument();
  });

  it("filters by budget", async () => {
    render(wrap(<Travel />));
    await screen.findByRole("link", { name: /Olororo/ });
    const names = () =>
      screen
        .getAllByRole("link")
        .map((l) => l.textContent ?? "")
        .filter((t) => /Lodge|Hotel|Suites|Inn/.test(t));

    fireEvent.click(screen.getByRole("button", { name: "Under ₦20k" }));
    expect(names()).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /Ojoo Grand/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "₦20k–₦35k" }));
    expect(screen.getByRole("link", { name: /Bodija/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ojoo Grand/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Moniya/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Conference rate" }));
    expect(names()).toHaveLength(2);
  });

  it("shows directions and the shuttles under Getting there", async () => {
    render(wrap(<Travel />));
    await screen.findByRole("link", { name: /Olororo/ });
    fireEvent.click(screen.getByRole("radio", { name: "Getting there" }));

    expect(screen.getByTitle("Map of the venue")).toHaveAttribute("src", expect.stringContaining("openstreetmap.org"));
    expect(screen.getByText("Leadership & Missions Conference Centre")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=7.461863,3.912484",
    );
    expect(screen.getByText("Every 20 min · 6:30 AM – 10 PM")).toBeInTheDocument();
    expect(screen.getByText("Iwo Road interchange")).toBeInTheDocument();
  });

  it("opens on Getting there from the venue-map link", async () => {
    window.location.hash = "#getting-there";
    render(wrap(<Travel />));
    expect(await screen.findByRole("link", { name: "Directions" })).toBeInTheDocument();
  });

  it("explains a failed load", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "boom" }, 500)));
    render(wrap(<Travel />));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Travel (desktop)", () => {
  it("shows the list beside a map and opens a hotel in a drawer", async () => {
    setDesktop(true);
    render(wrap(<Travel />));

    expect(await screen.findByRole("heading", { name: "Hotels & travel" })).toBeInTheDocument();
    expect(screen.getByTitle("Map of the venue")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Olororo Guest Lodge/ }));
    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText("JANCONF27")).toBeInTheDocument();

    fireEvent.keyDown(drawer, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "See times" }));
    expect(await screen.findByText("Every 45 min · 6 AM – 9 PM")).toBeInTheDocument();
  });
});

describe("HotelDetail", () => {
  it("offers the conference code, a call and a WhatsApp booking message", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<HotelDetail hotel={data.hotels[0]!} backHref="/app/hotels" />);

    expect(screen.getByRole("heading", { name: "Olororo Guest Lodge" })).toBeInTheDocument();
    expect(screen.getByText("0.8 km from the venue · 3 min drive")).toBeInTheDocument();
    expect(screen.getByText("₦18,000")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Amenities" })).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+2348080854818");
    const wa = screen.getByRole("link", { name: "Book on WhatsApp" }).getAttribute("href")!;
    expect(wa).toContain("https://wa.me/2348080854818?text=");
    expect(decodeURIComponent(wa)).toContain("Olororo Guest Lodge");
    expect(decodeURIComponent(wa)).toContain("JANCONF27");

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("JANCONF27");
  });

  it("says when copying fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } });
    render(<HotelDetail hotel={data.hotels[0]!} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByText(/Couldn’t copy/)).toBeInTheDocument();
  });

  it("has no code for hotels without the conference rate, and no buttons without contact details", () => {
    render(<HotelDetail hotel={hotel("x", "Plain Inn", 1000000, 1, false, { phone: null, whatsapp: null })} />);
    expect(screen.queryByText("Quote this code")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Call" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Book on WhatsApp" })).not.toBeInTheDocument();
  });
});

describe("HotelPage", () => {
  it("finds a hotel by slug, or says it can't", async () => {
    const first = render(wrap(<HotelPage slug="ojoo" />));
    expect(await screen.findByRole("heading", { name: "Ojoo Grand Hotel" })).toBeInTheDocument();
    first.unmount();
    render(wrap(<HotelPage slug="nope" />));
    expect(await screen.findByText("We can’t find that hotel")).toBeInTheDocument();
  });
});

describe("hotels without rates yet", () => {
  const unpriced = (slug: string, name: string, km: number) =>
    hotel(slug, name, 0, km, false, { price_kobo: null, drive_minutes: null, rate_code: null, phone: null, whatsapp: null, amenities: [] });

  it("says to ask for the rate and drops the budget filters that can't apply", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({ data: { ...data, hotels: [unpriced("josiah", "Josiah Inn", 0.4), unpriced("classicus", "Classicus Inn", 0.9)] } }),
      ),
    );
    render(wrap(<Travel />));

    const card = await screen.findByRole("link", { name: /Josiah Inn/ });
    expect(within(card).getByText("Ask for rate")).toBeInTheDocument();
    expect(within(card).getByText("0.4 km")).toBeInTheDocument();
    expect(within(card).queryByText("per night")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Under ₦20k" })).not.toBeInTheDocument();
  });

  it("never counts an unknown rate as cheap", () => {
    const h = unpriced("a", "A", 1);
    expect(inBudget(h, "under20")).toBe(false);
    expect(inBudget(h, "mid")).toBe(false);
    expect(inBudget(h, "all")).toBe(true);
  });

  it("offers directions to the hotel, with no invented price, contact or amenities", () => {
    render(<HotelDetail hotel={unpriced("josiah", "Josiah Inn", 0.4)} />);
    expect(screen.getByText("Ask for rate")).toBeInTheDocument();
    expect(screen.getByText("0.4 km from the venue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=7.45,3.91",
    );
    expect(screen.queryByRole("link", { name: "Call" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Book on WhatsApp" })).not.toBeInTheDocument();
    expect(screen.queryByText("Quote this code")).not.toBeInTheDocument();
  });
});

describe("helpers", () => {
  it("draws budget boundaries inclusively at ₦35k and exclusively below ₦20k", () => {
    const h = (kobo: number) => hotel("a", "A", kobo, 1, false);
    expect(inBudget(h(1999900), "under20")).toBe(true);
    expect(inBudget(h(2000000), "under20")).toBe(false);
    expect(inBudget(h(2000000), "mid")).toBe(true);
    expect(inBudget(h(3500000), "mid")).toBe(true);
    expect(inBudget(h(3500100), "mid")).toBe(false);
    expect(inBudget(h(1), "all")).toBe(true);
  });

  it("builds map, directions and WhatsApp links", () => {
    expect(mapEmbedUrl({ lat: 7.4, lng: 3.9 })).toContain("marker=7.4,3.9");
    expect(directionsUrl({ lat: 7.4, lng: 3.9 })).toBe("https://www.google.com/maps/dir/?api=1&destination=7.4,3.9");
    expect(whatsappUrl("+234 808 085 4818", "Inn", null)).toBe(
      "https://wa.me/2348080854818?text=Hello%2C%20I'd%20like%20to%20book%20a%20room%20at%20Inn%20for%20Jan.%20Conf%202027.",
    );
  });
});
