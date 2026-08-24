import Navbar from "@/components/navigation/Navbar";
import Hero from "@/components/hero/Hero";
import About from "@/components/sections/About";
import Domains from "@/components/sections/Domains";
import WhatWeDo from "@/components/sections/WhatWeDo";
import Experience from "@/components/sections/Experience";
import Culture from "@/components/sections/Culture";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Domains />
      <WhatWeDo />
      <Experience />
      <Culture />
      <FinalCTA />
      <Footer />
    </main>
  );
}
