import { ImageResponse } from "next/og";
import { SITE, type Lang } from "@/lib/content";
import { markDataUri } from "@/lib/mark";

/**
 * Sdílená vizuální šablona pro OG/Twitter kartu (1200×630), generovaná přes
 * next/og (Satori) – žádný headless prohlížeč, žádný statický obrázek k ruční
 * aktualizaci. Používá jen flexbox + inline styly (limity Satori).
 */
export const OG_SIZE = { width: 1200, height: 630 };

/** MIME typ generovaného obrázku – sdílený všemi OG/Twitter routami. */
export const OG_CONTENT_TYPE = "image/png";

/**
 * Texty OG/Twitter karty pro oba jazyky. Sdílené mezi opengraph-image
 * a twitter-image (dřív byly čtyři byte-shodné soubory).
 */
export const OG_CONTENT: Record<Lang, { alt: string; headline: string; sub: string }> = {
  cs: {
    alt: "Materiály pro výuku informatiky – Karel Hlas",
    headline: "Hotové materiály do hodin informatiky",
    sub: "Pracovní listy, testy, metodika a plány hodin – zdarma ke stažení",
  },
  en: {
    alt: "Ready-made materials for CS lessons – Karel Hlas",
    headline: "Ready-made materials for CS lessons",
    sub: "Worksheets, tests, teaching notes and lesson plans – free to download",
  },
};

/** Vygeneruje ImageResponse pro OG/Twitter kartu v daném jazyce. */
export function ogImageResponse(lang: Lang) {
  const c = OG_CONTENT[lang];
  return new ImageResponse(
    ogCard({ headline: c.headline, sub: c.sub, byline: SITE.name, domain: SITE.domain }),
    { ...OG_SIZE },
  );
}

const TOOLS = ["Excel", "Word", "Python", "Power BI"];

export function ogCard(opts: { headline: string; sub: string; byline: string; domain: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: "#070a09",
        backgroundImage:
          "radial-gradient(circle at 12% 10%, rgba(20,178,139,0.35), transparent 55%), " +
          "radial-gradient(circle at 88% 85%, rgba(20,178,139,0.22), transparent 55%)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundImage: "linear-gradient(135deg, #14b28b, #0b9273)",
          }}
        >
          {/* Značka jako <img> s data URI – Satori vlastní <svg> tahy nevykreslí. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={markDataUri({ size: 56, background: null, color: "#ffffff", glyphRatio: 0.58 })}
            alt=""
            width={56}
            height={56}
          />
        </div>
        <div style={{ display: "flex", color: "#a8f0da", fontSize: 28, fontWeight: 600 }}>
          {opts.byline}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 990 }}>
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-1px",
          }}
        >
          {opts.headline}
        </div>
        <div style={{ display: "flex", color: "#d4d4d8", fontSize: 30, fontWeight: 400 }}>
          {opts.sub}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14 }}>
          {TOOLS.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "10px 24px",
                borderRadius: 9999,
                backgroundColor: "rgba(20,178,139,0.15)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(20,178,139,0.4)",
                color: "#6fe3c2",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", color: "#71717a", fontSize: 22 }}>{opts.domain}</div>
      </div>
    </div>
  );
}
