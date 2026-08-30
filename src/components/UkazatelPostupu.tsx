/**
 * Ukazatel postupu stránkou — útlá zaoblená čára u pravého okraje.
 *
 * Vychází z nápadu, který se Karlovi líbil (pero Jheye Tompkinse na CodePenu),
 * ale je postavený jinak, protože ten původní řeší jinou úlohu: kreslí
 * scrollbar KOLEM ZAOBLENÝCH ROHŮ rolovací krabice uvnitř stránky. Tenhle web
 * roluje celý a okno prohlížeče žádné zaoblené rohy nemá, takže z té křivky
 * by zbyla rovná čára a celý půvab předlohy by zmizel.
 *
 * ŽÁDNÝ JAVASCRIPT. Pohyb dělá `animation-timeline: scroll()` — prohlížeč sám
 * váže postup animace na odrolování stránky. Kde to prohlížeč neumí (viz
 * `@supports` v globals.css), ukazatel se prostě nezobrazí; nic se nedotahuje
 * a nic se nerozbije. Původní pero kvůli témuž problému tahá GSAP, což by
 * kvůli ozdobě znamenalo desítky kilobajtů navíc.
 *
 * NATIVNÍ SCROLLBAR ZŮSTÁVÁ. Předloha ho schovává; u krabice v ukázce to
 * nevadí, u celé stránky je to zhoršení — někdo se podle něj orientuje a
 * někdo za něj tahá myší.
 *
 * Tečky nejsou ozdoba, jsou to odkazy na sekce. Bez toho by to byl jen pruh,
 * který nic neumí.
 */

import { t, type Lang } from "@/lib/content";

/** Sekce v pořadí, v jakém jdou na stránce. Musí sedět s kotvami v Site.tsx. */
const SEKCE = [
  { href: "#banka", klic: "bank" },
  { href: "#jinam", klic: "cross" },
  { href: "#ai-hub", klic: "aihub" },
  { href: "#about", klic: "about" },
  { href: "#contact", klic: "contact" },
] as const;

function popisek(klic: (typeof SEKCE)[number]["klic"], lang: Lang): string {
  const tr = t[lang];
  if (klic === "bank") return tr.nav.bank;
  if (klic === "cross") return tr.cross.kicker;
  if (klic === "aihub") return tr.aihub.kicker;
  if (klic === "about") return tr.nav.about;
  return tr.nav.contact;
}

export function UkazatelPostupu({ lang }: { lang: Lang }) {
  return (
    <div className="ukazatel" aria-hidden={false}>
      {/* Dráha i palec jsou tatáž čára. `pathLength="100"` ji normalizuje na
          sto dílků, takže se s délkou v pixelech nemusí nic dopočítávat —
          a odpadá tím celý ten kus JavaScriptu, který má předloha na měření. */}
      <svg className="ukazatel__cara" viewBox="0 0 8 100" preserveAspectRatio="none" focusable="false">
        <line
          className="ukazatel__draha"
          x1="4"
          y1="0"
          x2="4"
          y2="100"
          pathLength="100"
          strokeLinecap="round"
        />
        <line
          className="ukazatel__palec"
          x1="4"
          y1="0"
          x2="4"
          y2="100"
          pathLength="100"
          strokeLinecap="round"
        />
      </svg>

      <ul className="ukazatel__tecky">
        {SEKCE.map((s) => (
          <li key={s.href}>
            <a href={s.href} title={popisek(s.klic, lang)}>
              <span className="sr-only">{popisek(s.klic, lang)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
