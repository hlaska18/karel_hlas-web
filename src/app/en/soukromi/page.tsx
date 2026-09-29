import type { Metadata } from "next";
import { OG_SPOLECNE } from "@/lib/sdileni";

import { Soukromi } from "@/components/Soukromi";

export const metadata: Metadata = {
  title: "What this site stores",
  description:
    "What the site stores about a visitor, who runs it and where it technically runs.",
  alternates: {
    canonical: "/en/soukromi",
    languages: { cs: "/soukromi", en: "/en/soukromi" },
  },
  openGraph: { ...OG_SPOLECNE, locale: "en_GB", title: "What this site stores – Karel Hlas", url: "/en/soukromi" },
};

export default function SoukromiPageEn() {
  return <Soukromi lang="en" />;
}
