export type ProductSummary = {
  slug: string;
  name: string;
  category: "apparel" | "books";
  price_kobo: number;
  tag: string | null;
  image: string | null;
  in_stock: boolean;
};

export type Variant = { id: number; size: string | null; color: string | null; stock: number };

export type ProductDetail = ProductSummary & {
  description: string | null;
  images: string[];
  /** `image` is the gallery picture that shows this colour (the polo's white and navy photos). */
  colors: { name: string; hex: string; image?: number }[];
  sizes: string[];
  facts: { k: string; v: string }[];
  variants: Variant[];
};

export type ShopList = {
  data: ProductSummary[];
  meta: {
    categories: { key: string; label: string; count: number }[];
    total: number;
    fee: { percent: number; flat_kobo: number };
    methods: Record<string, string>;
  };
};

export type OrderStatus = "pending" | "paid" | "collected" | "refunded" | "failed" | "expired" | "refund_due";

export type Order = {
  code: string;
  status: OrderStatus;
  method: string;
  customer_name: string;
  subtotal_kobo: number;
  fee_kobo: number;
  total_kobo: number;
  paid_at: string | null;
  expires_at: string | null;
  pickup_code: string;
  pay_url: string | null;
  items: { name: string; variant_label: string | null; image: string | null; unit_price_kobo: number; qty: number }[];
};

export type BagLine = {
  variantId: number;
  slug: string;
  name: string;
  image: string | null;
  variantLabel: string | null;
  unitPriceKobo: number;
  qty: number;
  /** Stock when added; the server re-checks at checkout. */
  max: number;
};

/** Same rule as the server: percent of the subtotal plus a flat amount, rounded down to whole naira. */
export function estimateFee(subtotalKobo: number, fee: { percent: number; flat_kobo: number }): number {
  return Math.floor((Math.round((subtotalKobo * fee.percent) / 100) + fee.flat_kobo) / 100) * 100;
}
