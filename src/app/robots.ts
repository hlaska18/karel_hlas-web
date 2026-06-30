import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    // Učitelské podsložky (_ucitel: metodika, řešení, plány) neindexovat,
    // ať si je žáci nevygooglí. Odkaz dál funguje, jen není ve vyhledávání.
    rules: { userAgent: "*", allow: "/", disallow: ["/*_ucitel"] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
