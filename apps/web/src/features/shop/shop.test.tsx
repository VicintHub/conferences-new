import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Catalog } from "./Catalog";
import { MockPay } from "./MockPay";
import { OrderView } from "./OrderView";
import { ProductView } from "./ProductView";
import { bag } from "./bag";
import type { Order, ProductDetail, ShopList } from "./types";

let search = "k=tok";
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const wrap = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

const list: ShopList = {
  data: [
    { slug: "conference-tee", name: "Conference T-shirt", category: "apparel", price_kobo: 800000, tag: null, image: null, in_stock: true },
    { slug: "psalm-book", name: "Psalm Book", category: "books", price_kobo: 300000, tag: null, image: null, in_stock: true },
  ],
  meta: {
    categories: [
      { key: "apparel", label: "Apparel", count: 1 },
      { key: "books", label: "Books", count: 1 },
    ],
    total: 2,
    fee: { percent: 0.7, flat_kobo: 10000 },
    methods: { card: "Card" },
  },
};

const product: ProductDetail = {
  slug: "conference-tee",
  name: "Conference T-shirt",
  category: "apparel",
  price_kobo: 800000,
  tag: null,
  image: null,
  in_stock: true,
  description: "Soft cotton.",
  images: [],
  colors: [],
  sizes: ["M", "L"],
  facts: [],
  variants: [
    { id: 1, size: "M", color: null, stock: 0 },
    { id: 2, size: "L", color: null, stock: 4 },
  ],
};

const order = (over: Partial<Order> = {}): Order => ({
  code: "MV-00012",
  status: "paid",
  method: "card",
  customer_name: "Ada Obi",
  subtotal_kobo: 800000,
  fee_kobo: 15600,
  total_kobo: 815600,
  paid_at: null,
  expires_at: null,
  pickup_code: "MV-00012",
  pay_url: null,
  items: [{ name: "Conference T-shirt", variant_label: "Size L", image: null, unit_price_kobo: 800000, qty: 1 }],
  ...over,
});

const stored = (): { variantId: number; qty: number }[] => JSON.parse(localStorage.getItem("jc27.bag") ?? "[]");

beforeEach(() => {
  localStorage.clear();
  bag.clear();
  push.mockReset();
  search = "k=tok";
});
afterEach(() => vi.unstubAllGlobals());

describe("Catalog", () => {
  it("filters by category and search", () => {
    render(wrap(<Catalog list={list} />));
    expect(screen.getAllByText("Conference T-shirt").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Psalm Book").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: /Books/ })[0]);
    expect(screen.queryAllByText("Conference T-shirt")).toHaveLength(0);
    expect(screen.getAllByText("Psalm Book").length).toBeGreaterThan(0);
  });

  it("says so when the API is unreachable", () => {
    render(wrap(<Catalog list={null} />));
    expect(screen.getAllByText(/shop is unavailable/i).length).toBeGreaterThan(0);
  });
});

describe("ProductView", () => {
  it("adds the chosen in-stock size to the bag", () => {
    render(wrap(<ProductView product={product} />));
    fireEvent.click(screen.getAllByRole("button", { name: /^L$/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /add to bag/i })[0]);
    expect(stored()).toMatchObject([{ variantId: 2, qty: 1 }]);
  });
});

describe("OrderView", () => {
  it("shows the pickup code once paid and clears the bag", async () => {
    bag.add({ variantId: 2, slug: "x", name: "x", image: null, variantLabel: null, unitPriceKobo: 1, qty: 1, max: 5 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ data: order() })));
    render(wrap(<OrderView code="MV-00012" />));
    expect(await screen.findByText(/Order/)).toBeTruthy();
    expect(screen.getAllByText("MV-00012").length).toBeGreaterThan(0);
    await waitFor(() => expect(stored()).toHaveLength(0));
  });

  it("offers a way back to payment while pending", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ data: order({ status: "pending", pay_url: "https://pay.test/x" }) })));
    render(wrap(<OrderView code="MV-00012" />));
    expect(await screen.findByRole("link", { name: /continue to payment/i })).toBeTruthy();
  });

  it("lets the customer try again when payment failed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ data: order({ status: "failed" }) })));
    render(wrap(<OrderView code="MV-00012" />));
    expect(await screen.findByText(/didn’t go through/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Try again" }).getAttribute("href")).toBe("/shop/checkout");
  });

  it("handles an unknown order", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "nope" }, 404)));
    render(wrap(<OrderView code="MV-99999" />));
    expect(await screen.findByText(/can’t find that order/i)).toBeTruthy();
  });
});

describe("MockPay", () => {
  it("reports the outcome to the API", async () => {
    search = "reference=ref_1&callback=" + encodeURIComponent("/shop/orders/MV-1");
    const f = vi.fn().mockResolvedValue(json({ data: { outcome: "failed" } }));
    vi.stubGlobal("fetch", f);
    render(wrap(<MockPay />));
    fireEvent.click(screen.getByRole("button", { name: /decline/i }));
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(f.mock.calls[0][0]).toContain("/shop/payments/mock/ref_1/complete");
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ outcome: "failed" });
  });

  it("explains when the mock gateway is off", async () => {
    search = "reference=ref_1&callback=/shop";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "Not found" }, 404)));
    render(wrap(<MockPay />));
    fireEvent.click(screen.getByRole("button", { name: /simulate success/i }));
    expect(await screen.findByText(/isn’t enabled/i)).toBeTruthy();
  });
});

describe("ProductView colours with their own photo", () => {
  it("shows the navy photo when navy is chosen", () => {
    const polo: ProductDetail = {
      ...product,
      name: "Revival Polo",
      images: ["/images/merch/revival-polo-white.jpg", "/images/merch/revival-polo-navy.jpg"],
      colors: [
        { name: "White", hex: "#ffffff", image: 0 },
        { name: "Navy", hex: "#0b2a5b", image: 1 },
      ],
      variants: [
        { id: 1, size: "L", color: "White", stock: 5 },
        { id: 2, size: "L", color: "Navy", stock: 5 },
      ],
      sizes: ["L"],
    };
    const { container } = render(wrap(<ProductView product={polo} />));
    expect(container.querySelector("img")?.getAttribute("src")).toContain("revival-polo-white");
    fireEvent.click(screen.getAllByRole("button", { name: "Navy" })[0]!);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("revival-polo-navy");
  });
});
