/**
 * Kreslené obrázky pro virtuální disk a plochu.
 *
 * Žádný soubor se nestahuje – všechno jsou vektory sestavené v kódu a vložené
 * jako `data:` URL. Web tím nenaroste o megabajty a prostředí funguje i na
 * školní síti, kde je půlka internetu zablokovaná. Motivy jsou schválně
 * vlastní, ne tapety z Windows: ty jsou chráněné a do výukového webu nepatří.
 */

/** Zabalí SVG do `data:` URL, kterou umí `<img>` i CSS `background-image`. */
export function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

const ram = (obsah: string, sirka = 1600, vyska = 900) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sirka} ${vyska}" width="${sirka}" height="${vyska}">${obsah}</svg>`;

/* ───────────────────── Tapety plochy ───────────────────── */

/** Výchozí tapeta: barevný závoj, ke kterému se hodí i světlý i tmavý motiv. */
const ZAVOJ = ram(`
  <defs>
    <radialGradient id="a" cx="28%" cy="32%" r="78%">
      <stop offset="0%" stop-color="#4aa8ff"/>
      <stop offset="45%" stop-color="#1f5fd0"/>
      <stop offset="100%" stop-color="#0a1f4d"/>
    </radialGradient>
    <linearGradient id="b" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#00e0c6" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#7a5cff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ff5ea8" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="m"><feGaussianBlur stdDeviation="70"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#a)"/>
  <g filter="url(#m)" opacity="0.9">
    <ellipse cx="1180" cy="270" rx="430" ry="300" fill="url(#b)"/>
    <ellipse cx="420" cy="700" rx="380" ry="260" fill="#00c2ff" opacity="0.4"/>
    <ellipse cx="900" cy="520" rx="300" ry="220" fill="#ffffff" opacity="0.12"/>
  </g>
`);

const HORY = ram(`
  <defs>
    <linearGradient id="o" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#12224a"/>
      <stop offset="55%" stop-color="#3f4d8a"/>
      <stop offset="100%" stop-color="#e39a6b"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#o)"/>
  <circle cx="1180" cy="600" r="90" fill="#ffd9a0" opacity="0.95"/>
  <path d="M0 900 L280 520 L470 700 L700 430 L980 760 L1180 600 L1420 780 L1600 640 L1600 900 Z" fill="#1b2647" opacity="0.9"/>
  <path d="M0 900 L240 690 L520 830 L820 640 L1100 860 L1380 720 L1600 850 L1600 900 Z" fill="#0e1730"/>
`);

const MRIZKA = ram(`
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#082f49"/>
    </linearGradient>
    <pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0 L0 0 0 80" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" fill="url(#p)"/>
  <circle cx="1250" cy="240" r="200" fill="#22d3ee" opacity="0.18"/>
  <circle cx="300" cy="720" r="260" fill="#a3e635" opacity="0.12"/>
`);

const PAPIR = ram(`
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f4ee"/>
      <stop offset="100%" stop-color="#d9dfe6"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#s)"/>
  <g fill="none" stroke="#98a6b8" stroke-opacity="0.5" stroke-width="2">
    <circle cx="800" cy="450" r="120"/><circle cx="800" cy="450" r="220"/>
    <circle cx="800" cy="450" r="320"/><circle cx="800" cy="450" r="420"/>
  </g>
`);

export interface Tapeta {
  id: string;
  nazev: string;
  url: string;
  /** Barva, kterou má dostat text na uzamykací obrazovce a přihlášení. */
  svetla: boolean;
}

export const TAPETY: Tapeta[] = [
  { id: "zavoj", nazev: "Závoj", url: svgUrl(ZAVOJ), svetla: false },
  { id: "hory", nazev: "Soumrak", url: svgUrl(HORY), svetla: false },
  { id: "mrizka", nazev: "Mřížka", url: svgUrl(MRIZKA), svetla: false },
  { id: "papir", nazev: "Papír", url: svgUrl(PAPIR), svetla: true },
];

export const vybranaTapeta = (id: string): Tapeta =>
  TAPETY.find((t) => t.id === id) ?? TAPETY[0];

/* ───────────────────── Obrázky na disku ───────────────────── */

/** „Fotka" z výletu – vektorová krajina, ale v Průzkumníku se chová jako JPG. */
export const FOTO_VYLET = svgUrl(
  ram(`
    <defs>
      <linearGradient id="n" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7cc7f0"/><stop offset="100%" stop-color="#dff1fb"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#n)"/>
    <circle cx="330" cy="200" r="70" fill="#fff6c9"/>
    <path d="M0 640 L300 380 L520 560 L760 330 L1080 640 Z" fill="#6b8f7a"/>
    <path d="M760 330 L840 400 L790 420 Z" fill="#ffffff"/>
    <path d="M900 660 L1180 420 L1600 700 L1600 900 L0 900 L0 640 Z" fill="#4d7a5c"/>
    <rect y="760" width="1600" height="140" fill="#3a6049"/>
    <g fill="#2c4a39"><circle cx="240" cy="760" r="48"/><circle cx="300" cy="790" r="36"/><circle cx="1380" cy="750" r="54"/></g>
  `),
);

/** Snímek obrazovky – schválně vypadá jako okno, ať je poznat podle náhledu. */
export const FOTO_SNIMEK = svgUrl(
  ram(
    `
    <rect width="1600" height="900" fill="#e9edf3"/>
    <rect x="120" y="110" width="1360" height="680" rx="18" fill="#ffffff" stroke="#c8d0dc" stroke-width="3"/>
    <rect x="120" y="110" width="1360" height="70" rx="18" fill="#f3f5f9"/>
    <g fill="#c2ccd9"><circle cx="1400" cy="145" r="12"/><circle cx="1350" cy="145" r="12"/><circle cx="1300" cy="145" r="12"/></g>
    <g fill="#dbe2ec"><rect x="170" y="230" width="620" height="24" rx="12"/><rect x="170" y="290" width="900" height="24" rx="12"/><rect x="170" y="350" width="740" height="24" rx="12"/><rect x="170" y="410" width="820" height="24" rx="12"/></g>
    <rect x="170" y="500" width="380" height="220" rx="14" fill="#bcd9f5"/>
  `,
  ),
);

/** Diagram do referátu – jednoduchý sloupcový graf. */
export const FOTO_GRAF = svgUrl(
  ram(
    `
    <rect width="1600" height="900" fill="#ffffff"/>
    <g stroke="#cbd5e1" stroke-width="3"><path d="M200 760 H1420"/><path d="M200 760 V160"/></g>
    <g fill="#2563eb">
      <rect x="280" y="560" width="130" height="200" rx="6"/>
      <rect x="480" y="440" width="130" height="320" rx="6"/>
      <rect x="680" y="330" width="130" height="430" rx="6"/>
      <rect x="880" y="250" width="130" height="510" rx="6"/>
      <rect x="1080" y="190" width="130" height="570" rx="6"/>
    </g>
  `,
  ),
);
