import type { Metadata } from "next";
import { sdileni } from "@/lib/sdileni";

import { Soukromi } from "@/components/Soukromi";

export const metadata: Metadata = {
  title: "What this site stores",
  description:
    "What the site stores about a visitor, who runs it and where it technically runs.",
  alternates: {
    canonical: "/en/soukromi",
    languages: { cs: "/soukromi", en: "/en/soukromi" },
  },
  ...sdileni({
    title: "What this site stores – Karel Hlas",
    description: "What the site stores about a visitor, who runs it and where it technically runs.",
    url: "/en/soukromi",
    locale: "en_GB",
  }),
};

export default function SoukromiPageEn() {
  return <Soukromi lang="en" />;
}
