import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  // Bez `lastModified`: dřív tu bylo `new Date()`, takže každé sestavení
  // hlásilo změnu všech stránek. Google takové datum po čase přestane brát
  // vážně; pravdivé datum se tu nezjistí levně, tak radši žádné (Codex 29. 9.).
  return [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { cs: SITE.url, en: `${SITE.url}/en` } },
    },
    {
      url: `${SITE.url}/en`,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: { languages: { cs: SITE.url, en: `${SITE.url}/en` } },
    },
    {
      // Kurz SQL je vlastní stránka, ne kotva na jednostránkovém webu –
      // v sitemapě dosud chyběl, takže o něm vyhledávače nevěděly.
      url: `${SITE.url}/sql`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Virtuální Windows 11 – samostatná stránka pro hodiny informatiky.
      url: `${SITE.url}/windows`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Virtuální macOS. Dokud tu nebyl, nevedl na něj jediný odkaz na celém
      // webu ani v sitemapě – prostředí existovalo, ale nedalo se k němu dostat.
      url: `${SITE.url}/macos`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
