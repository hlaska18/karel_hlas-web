import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { cs: SITE.url, en: `${SITE.url}/en` } },
    },
    {
      url: `${SITE.url}/en`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: { languages: { cs: SITE.url, en: `${SITE.url}/en` } },
    },
    {
      // Kurz SQL je vlastní stránka, ne kotva na jednostránkovém webu –
      // v sitemapě dosud chyběl, takže o něm vyhledávače nevěděly.
      url: `${SITE.url}/sql`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
