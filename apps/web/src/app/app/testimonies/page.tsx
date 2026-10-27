import { Suspense } from "react";
import { AppTestimonies } from "@/features/testimonies/AppTestimonies";

export const metadata = { title: "Testimonies — Jan. Conf 2027" };

export default function Page() {
  return (
    <Suspense>
      <AppTestimonies />
    </Suspense>
  );
}
