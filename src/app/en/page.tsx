import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { getBankItems } from "@/lib/materials";

export const metadata: Metadata = {
  title: { absolute: "Ready-made materials for CS lessons – Karel Hlas" },
  // The list names the topics that actually have files to download. It used to
  // read "(Excel, Word, Python, Power BI)" – but the first three only link to
  // someone else's workbook, so the description promised an empty shelf.
  description:
    "Ready-made materials for Computer Science lessons, free to download and edit – worksheets, tests, lesson plans and teaching notes. Graphics & multimedia, artificial intelligence, internet & online safety, digital literacy, databases. Curated by Karel Hlas, teacher at SPŠ Tábor.",
  alternates: {
    canonical: "/en",
    languages: { cs: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title: "Ready-made materials for CS lessons – Karel Hlas",
    description:
      "Ready-made materials for Computer Science lessons, free to download and edit – worksheets, tests, lesson plans and teaching notes. Graphics & multimedia, artificial intelligence, internet & online safety, digital literacy, databases.",
    url: "/en",
    siteName: "Karel Hlas",
    // Texty jsou důsledně britské (licence, organisation, colour, Maths),
    // takže en_GB, ne en_US.
    locale: "en_GB",
    type: "website",
    // Obrázek generuje src/app/en/opengraph-image.tsx (next/og).
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready-made materials for CS lessons – Karel Hlas",
    description:
      "Ready-made materials for Computer Science lessons – graphics & multimedia, artificial intelligence, internet & online safety, digital literacy, databases.",
    // Obrázek generuje src/app/en/twitter-image.tsx (next/og).
  },
};

export default function HomeEn() {
  return <Site lang="en" items={getBankItems()} />;
}
