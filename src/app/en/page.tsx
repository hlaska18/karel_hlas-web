import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { getBankToolCounts } from "@/lib/materials";

export const metadata: Metadata = {
  title: { absolute: "Ready-made materials for CS lessons — Karel Hlas" },
  description:
    "Ready-made materials for Computer Science lessons, free to download and edit — worksheets, tests, lesson plans and teaching notes (Excel, Word, Python, Power BI). Curated by Karel Hlas, teacher at SPŠ Tábor.",
  alternates: {
    canonical: "/en",
    languages: { cs: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title: "Ready-made materials for CS lessons — Karel Hlas",
    description:
      "Ready-made materials for Computer Science lessons, free to download and edit — worksheets, tests, lesson plans and teaching notes (Excel, Word, Python, Power BI).",
    url: "/en",
    siteName: "Karel Hlas",
    locale: "en_US",
    type: "website",
    // Obrázek generuje src/app/en/opengraph-image.tsx (next/og).
  },
  twitter: {
    card: "summary_large_image",
    title: "Ready-made materials for CS lessons — Karel Hlas",
    description:
      "Ready-made materials for Computer Science lessons (Excel, Word, Python, Power BI).",
    // Obrázek generuje src/app/en/twitter-image.tsx (next/og).
  },
};

export default function HomeEn() {
  return <Site lang="en" toolCounts={getBankToolCounts()} />;
}
