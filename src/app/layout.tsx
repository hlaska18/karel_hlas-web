import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SkipLink } from "@/components/SkipLink";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SITE, SOCIALS } from "@/lib/content";

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

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
    description:
      "Hotové materiály do hodin ke stažení a úpravě – pracovní listy, testy, plány hodin a metodika. Grafika a multimédia, umělá inteligence, internet a bezpečnost, digitální gramotnost, databáze.",
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
      "Hotové materiály do hodin ke stažení a úpravě – grafika a multimédia, umělá inteligence, internet a bezpečnost, digitální gramotnost, databáze.",
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
    { media: "(prefers-color-scheme: light)", color: "#f4f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#070a09" },
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
    // groups) – to jsem zkusil a Next 14 při nich neumí vlastní 404 pro neznámé
    // adresy, takže by web přišel o vlastní chybovou stránku. Zůstává tedy
    // skript + `useEffect` v LanguageProvider; v surovém HTML ze serveru je
    // pořád "cs", což je pro čtečky i vyhledávače v pořádku až od chvíle, kdy
    // běží JS. Až projekt přejde na Next 15, dá se to udělat pořádně.
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${display.variable} font-sans antialiased selection:bg-accent-500 selection:text-white`}
      >
        {/* Dvě věci ještě před vykreslením: jazyk podle adresy (aby čtečka
            nečetla anglickou stránku česky) a html.js-reveal pro odhalovací
            sekce (jen když je IntersectionObserver), aby se neblikalo. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=location.pathname;document.documentElement.lang=(p==='/en'||p.indexOf('/en/')===0)?'en':'cs';if('IntersectionObserver' in window)document.documentElement.classList.add('js-reveal')}catch(e){}",
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
      </body>
    </html>
  );
}
