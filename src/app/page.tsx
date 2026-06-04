import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Curriculum } from "@/components/Curriculum";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { getFolderMaterials } from "@/lib/materials";

export default function Home() {
  const folderMaterials = getFolderMaterials();
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Contact />
        <Curriculum folderMaterials={folderMaterials} />
      </main>
      <Footer />
    </>
  );
}
