import type { Metadata } from "next";
import { OG_CONTENT, OG_SIZE } from "@/lib/ogCard";

/**
 * Náhled podstránky pro Facebook (Open Graph) i X/Twitter.
 *
 * Když stránka nastaví vlastní `openGraph` nebo `twitter`, Next nadřazený
 * objekt z layoutu celý přepíše – i s obrázkem, názvem webu a jazykem.
 * /windows a /macos tak na Facebooku neměly obrázek, /sql ukazoval náhled
 * i adresu homepage a na X měly všechny podstránky titulek homepage
 * (ověřeno 28.–29. 9. 2026). Stránka proto skládá obojí najednou tady.
 */
export function sdileni(o: {
  title: string;
  description: string;
  url: string;
  locale?: "cs_CZ" | "en_GB";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const obrazek = { ...OG_SIZE, alt: OG_CONTENT.cs.alt };
  return {
    openGraph: {
      siteName: "Karel Hlas",
      locale: o.locale ?? "cs_CZ",
      type: "website",
      images: [{ url: "/opengraph-image", ...obrazek }],
      title: o.title,
      description: o.description,
      url: o.url,
    },
    twitter: {
      card: "summary_large_image",
      images: [{ url: "/twitter-image", ...obrazek }],
      title: o.title,
      description: o.description,
    },
  };
}
