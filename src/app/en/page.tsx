import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { getFolderMaterials } from "@/lib/materials";

export const metadata: Metadata = {
  title: { absolute: "Karel Hlas — Computer Science & English Teacher" },
  description:
    "Personal website of Mgr. Karel Hlas, teacher of Computer Science and English at SPŠ Tábor (Czechia). About me, contact, and a timeline of lessons with study materials.",
  alternates: {
    canonical: "/en",
    languages: { cs: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title: "Karel Hlas — Computer Science & English Teacher",
    description:
      "Personal website of a Computer Science & English teacher at SPŠ Tábor — about me, contact and a timeline of lessons with materials.",
    url: "/en",
    siteName: "Karel Hlas",
    locale: "en_US",
    type: "website",
  },
};

export default function HomeEn() {
  return <Site lang="en" folderMaterials={getFolderMaterials()} />;
}
