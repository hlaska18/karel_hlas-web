import type { Metadata } from "next";
import { OG_CONTENT, OG_SIZE } from "@/lib/ogCard";

/**
 * Společná část náhledu pro Facebook a spol. (Open Graph) pro podstránky.
 * Když stránka nastaví vlastní `openGraph`, Next nadřazený objekt celý
 * přepíše – i s obrázkem, názvem webu a jazykem. /windows a /macos tak
 * na Facebooku neměly žádný obrázek a /sql ukazoval náhled i adresu
 * homepage (ověřeno 29. 9. 2026). Stránka proto k vlastnímu titulku,
 * popisu a adrese přidá tohle.
 */
export const OG_SPOLECNE = {
  siteName: "Karel Hlas",
  locale: "cs_CZ",
  type: "website",
  images: [{ url: "/opengraph-image", ...OG_SIZE, alt: OG_CONTENT.cs.alt }],
} satisfies Metadata["openGraph"];
