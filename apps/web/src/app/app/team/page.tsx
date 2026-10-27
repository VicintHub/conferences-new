import { Suspense } from "react";
import { Team } from "@/features/team/Team";

export const metadata = { title: "My team — Jan. Conf 2027" };

export default function Page() {
  return (
    <Suspense>
      <Team />
    </Suspense>
  );
}
