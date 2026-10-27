import { notFound } from "next/navigation";
import { KitchenSink } from "./KitchenSink";

export const metadata = { title: "Kitchen sink", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SHOW_KITCHEN_SINK !== "1") notFound();
  return <KitchenSink />;
}
