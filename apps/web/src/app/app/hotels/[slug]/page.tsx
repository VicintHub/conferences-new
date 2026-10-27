import { HotelPage } from "@/features/travel/HotelPage";

export const metadata = { title: "Hotel — Jan. Conf 2027" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <HotelPage slug={(await params).slug} />;
}
