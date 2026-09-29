import type { Metadata } from "next";
import { OG_SPOLECNE } from "@/lib/sdileni";

import { Soukromi } from "@/components/Soukromi";

export const metadata: Metadata = {
  title: "Co web ukládá",
  description:
    "Co web ukládá o návštěvníkovi, kdo ho provozuje a kde technicky běží. Krátce a bez právničiny.",
  // Bez vlastního canonical dědila stránka „/“ z layoutu – Googlu tak
  // říkala, že je kopií úvodu (ověřeno 29. 9. 2026).
  alternates: {
    canonical: "/soukromi",
    languages: { cs: "/soukromi", en: "/en/soukromi" },
  },
  openGraph: { ...OG_SPOLECNE, title: "Co web ukládá – Karel Hlas", url: "/soukromi" },
};

export default function SoukromiPage() {
  return <Soukromi lang="cs" />;
}
