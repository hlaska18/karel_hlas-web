import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE, SOCIALS } from "@/lib/content";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Karel Hlas — Učitel informatiky a angličtiny",
    template: "%s — Karel Hlas",
  },
  description:
    "Osobní stránka Mgr. Karla Hlase, učitele informatiky a angličtiny na SPŠ Tábor. O mně, kontakt a časová osa výuky se studijními materiály.",
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
  alternates: { canonical: "/" },
  openGraph: {
    title: "Karel Hlas — Učitel informatiky a angličtiny",
    description:
      "Osobní stránka učitele informatiky a angličtiny na SPŠ Tábor — o mně, kontakt a časová osa výuky s materiály.",
    url: SITE.url,
    siteName: "Karel Hlas",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karel Hlas — Učitel informatiky a angličtiny",
    description:
      "Osobní stránka učitele informatiky a angličtiny na SPŠ Tábor.",
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
        className={`${inter.variable} ${display.variable} font-sans antialiased selection:bg-accent-500 selection:text-white`}
      >
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
      </body>
    </html>
  );
}
