import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    // Učitelské podsložky (metodika, řešení, testy) neindexovat, ať si je žáci
    // nevygooglí. Odkaz dál funguje, jen není ve vyhledávání.
    // Pozor, konvence jsou dvě: starší „_ucitel" a novější „Pro učitele" –
    // druhá se v URL objeví procentně zakódovaná, tak ji uvádíme obojím tvarem.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*_ucitel", "/*Pro učitele", "/*Pro%20u%C4%8Ditele"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
