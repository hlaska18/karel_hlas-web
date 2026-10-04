import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SkipLink } from "@/components/SkipLink";
import { SmoothScroll } from "@/components/SmoothScroll";
import { UpozorneniUlozeni } from "@/components/UpozorneniUlozeni";
import { SITE, SOCIALS } from "@/lib/content";

/* Nadpisy jedou na systémovém písmu (řada je v tailwind.config.ts). Na Macu
   a iPhonu se vykreslí přímo SF Pro, na Windows Segoe UI. Dřív se stahoval
   Space Grotesk – kromě 40 kB navíc je to jedno z písem, která dnes nejvíc
   prozrazují generovanou stránku, a jeho česká diakritika byla vlažná. */

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Materiály do výuky – Karel Hlas",
    template: "%s – Karel Hlas",
  },
  // Výčet témat jmenuje to, co má vlastní soubory ke stažení. Dřív tu stálo
  // „(Excel, Word, Python, Power BI)“ – jenže u prvních tří vede jen odkaz na
  // cizí cvičebnici, takže popisek sliboval prázdno.
  description:
    "Hotové materiály do hodin ke stažení a úpravě – pracovní listy, testy, plány hodin a metodika. Grafika a multimédia, umělá inteligence, internet a bezpečnost, digitální gramotnost, databáze. Vznikly v informatice, použitelné i v dalších předmětech. Připravuje Karel Hlas, učitel na SPŠ Tábor.",
  keywords: [
    "Karel Hlas",
    "učitel informatiky",
    "učitel angličtiny",
    "SPŠ Tábor",
    "technické lyceum",
    "studijní materiály",
    "výuka informatiky",
    "programování",
  ],
  authors: [{ name: "Karel Hlas", url: SITE.url }],
  creator: "Karel Hlas",
  applicationName: "Karel Hlas",
  alternates: {
    canonical: "/",
    languages: { cs: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title: "Materiály do výuky – Karel Hlas",
    // Na Facebooku je vidět jen začátek popisu, tak v něm jsou i simulátory –
    // na ty se ze sdílení kliká nejvíc a v obrázku náhledu nejsou.
    description:
      "Hotové materiály do hodin ke stažení a úpravě – pracovní listy, testy, plány hodin a metodika. K tomu simulátory Windows 11 a macOS a kurz SQL přímo v prohlížeči.",
    url: SITE.url,
    siteName: "Karel Hlas",
    locale: "cs_CZ",
    type: "website",
    // Obrázek generuje src/app/opengraph-image.tsx (next/og) – žádný statický soubor.
  },
  twitter: {
    card: "summary_large_image",
    title: "Materiály do výuky – Karel Hlas",
    description:
      "Hotové materiály do hodin ke stažení a úpravě. K tomu simulátory Windows 11 a macOS a kurz SQL přímo v prohlížeči.",
    // Obrázek generuje src/app/twitter-image.tsx (next/og).
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e2f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#101a16" },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.fullName,
  givenName: "Karel",
  familyName: "Hlas",
  jobTitle: "Učitel informatiky a angličtiny",
  url: SITE.url,
  image: `${SITE.url}${SITE.photo}`,
  email: `mailto:${SITE.email}`,
  telephone: SITE.phoneHref,
  knowsLanguage: ["cs", "en"],
  sameAs: SOCIALS.map((s) => s.href),
  worksFor: {
    "@type": "EducationalOrganization",
    name: "Střední průmyslová škola strojní a stavební, Tábor",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Komenského 1670",
      postalCode: "390 41",
      addressLocality: "Tábor",
      addressCountry: "CZ",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang="cs" je výchozí: na /en ho níž přepíše skript ještě před vykreslením.
    // Nastavit ho rovnou správně by šlo jen dvěma kořenovými layouty (route
    // groups). Vlastní 404 by pak v Nextu 16 potřebovala `global-not-found`,
    // který je pořád experimentální (`experimental.globalNotFound`) – na
    // ostrém webu ho nechceme. Zůstává tedy skript + `useEffect`
    // v LanguageProvider; v surovém HTML ze serveru je na /en pořád "cs" a
    // správně je až od chvíle, kdy běží JS (viz ZNAME-LIMITY.md). Kurz SQL
    // s `?z=en` si jazyk nastavuje sám podle toho, která podoba je vidět
    // (`ObalProgramu` v components/dbb/PodleSirky.tsx).
    <html lang="cs" suppressHydrationWarning>
      <body
        className="font-sans antialiased selection:bg-accent-700 selection:text-white"
      >
        {/* Dvě věci ještě před vykreslením: jazyk podle adresy (aby čtečka
            nečetla anglickou stránku česky) a html.js-reveal pro odhalovací
            sekce (jen když je IntersectionObserver), aby se neblikalo.
            Pojistka: když se do 2,5 s nepřihlásí `Reveal` (třída reveal-ok) –
            JS se na školní síti nenačetl nebo spadl –, skrývání se zruší
            a obsah je vidět bez animace (Codex 27. 9. 2026). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=location.pathname;document.documentElement.lang=(p==='/en'||p.indexOf('/en/')===0)?'en':'cs';var h=document.documentElement;if('IntersectionObserver' in window){h.classList.add('js-reveal');setTimeout(function(){if(!h.classList.contains('reveal-ok'))h.classList.remove('js-reveal')},2500)}}catch(e){}",
          }}
        />
        <SkipLink />
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <Analytics />
        <SmoothScroll />
        <UpozorneniUlozeni />
      </body>
    </html>
  );
}
