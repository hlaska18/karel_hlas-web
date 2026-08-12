import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/Providers";
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
  description:
    "Hotové materiály do hodin ke stažení a úpravě – pracovní listy, testy, plány hodin a metodika (Excel, Word, Python, Power BI). Vznikly v informatice, použitelné i v dalších předmětech. Připravuje Karel Hlas, učitel na SPŠ Tábor.",
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
      "Hotové materiály do hodin ke stažení a úpravě – pracovní listy, testy, plány hodin a metodika (Excel, Word, Python, Power BI).",
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
      "Hotové materiály do hodin ke stažení a úpravě (Excel, Word, Python, Power BI).",
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
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${display.variable} font-sans antialiased selection:bg-accent-500 selection:text-white`}
      >
        {/* Před vykreslením označíme html.js-reveal (jen když je IntersectionObserver),
            aby se odhalovací sekce skryly hned a odhalily až při scrollu (bez blikání). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if('IntersectionObserver' in window)document.documentElement.classList.add('js-reveal')}catch(e){}",
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Přeskočit na obsah
        </a>
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
