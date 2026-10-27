import { About } from "@/components/landing/About";
import { Accommodation } from "@/components/landing/Accommodation";
import { Footer } from "@/components/landing/Footer";
import { Gallery } from "@/components/landing/Gallery";
import { Hero } from "@/components/landing/Hero";
import { Hosts } from "@/components/landing/Hosts";
import { Ministering } from "@/components/landing/Ministering";
import { Partner } from "@/components/landing/Partner";
import { Registration } from "@/components/landing/Registration";
import { Sessions } from "@/components/landing/Sessions";
import { Shop } from "@/components/landing/Shop";
import { Testimonies } from "@/components/landing/Testimonies";
import { Why } from "@/components/landing/Why";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Hosts />
      <Why />
      <Ministering />
      <Sessions />
      <Registration />
      <Accommodation />
      <Shop />
      <Gallery />
      <Testimonies />
      <Partner />
      <Footer />
    </main>
  );
}
