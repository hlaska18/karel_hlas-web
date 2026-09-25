"use client";

/**
 * Celé ikony aplikací pro Dock, Finder a mřížku Aplikací.
 *
 * Dřív byla každá ikona malý symbol uprostřed barevného čtverce. Tak vypadá
 * obecné téma pro desktop, ne Mac – na Macu je ikona CELÝ obrázek: Finder
 * je obličej přes celou plochu, Terminál černá obrazovka v rámečku, Koš
 * drátěný koš bez podkladu (Karlovy návrhy 24. 9. 2026).
 *
 * Všechno je vlastní kresba, ne obrázky Applu – ty sem nepatří a prostředí
 * se kvůli Docku nemá stahovat o megabajt navíc. Kreslí se v mřížce 64 × 64,
 * zaoblení „squircle“ je 22 % strany jako dřív.
 *
 * Přechody potřebují `id`. Stejná ikona je na obrazovce několikrát (Dock,
 * Finder, schované okno) a stejná `id` by se odkazovala na první výskyt –
 * a když ten leží ve skrytém okně, Chrome přechod nevykreslí vůbec. Proto
 * má každý výskyt vlastní `id` z `useId`, bez dvojteček, které `url(#…)`
 * nesnese.
 */

import { useId, type CSSProperties } from "react";

type Vlastnosti = { className?: string; style?: CSSProperties };

function useIdIkony(): (nazev: string) => string {
  const zaklad = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (nazev) => `mi${zaklad}${nazev}`;
}

/** Tvar ikony – čtverec se zaoblením 22 % strany. */
const SQUIRCLE = { x: 0, y: 0, width: 64, height: 64, rx: 14 };

/** Jemný odlesk přes horní polovinu, jaký mají ikony v Docku. */
function Odlesk({ id }: { id: (n: string) => string }) {
  return (
    <>
      <defs>
        <linearGradient id={id("odlesk")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect {...SQUIRCLE} fill={`url(#${id("odlesk")})`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#000000" strokeOpacity="0.12" />
    </>
  );
}

/**
 * Finder: celý čtverec modrý, vpravo světlý profil hlavy s nosem vybíhajícím
 * doleva, obě oči a úsměv tmavé. Podle skutečné ikony z macOS 26/27 – první
 * verze měla barvy obráceně (světlá půlka vlevo), rada 24. 9. 2026 to
 * porovnala se systémovou ikonou.
 */
export function IkonaFinder({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("pod")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35c6ff" />
          <stop offset="1" stopColor="#1683ee" />
        </linearGradient>
        <linearGradient id={id("profil")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dcefff" />
        </linearGradient>
      </defs>
      <rect {...SQUIRCLE} fill={`url(#${id("pod")})`} />
      {/* Profil: temeno, zadní strana hlavy, brada, ústa, nos a čelo. */}
      <path
        d="M31 7 C36 5 50 5 53.5 9 C55.5 11.5 55.5 16 55.5 20 L55.5 52 C55.5 56.5 53 59 48.5 59 L36 59 C33 59 31.5 57.5 31.5 55 L31.5 44 C31.5 41.5 30.5 40.5 28 40 L26 39.6 C24.3 39.2 24 38 24.7 36.5 L28.5 26 C29.8 22 30 17 30 12 C30 9.5 30.3 7.6 31 7 Z"
        fill={`url(#${id("profil")})`}
        stroke="#ffffff"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <rect x="15.6" y="19.5" width="2.8" height="7.5" rx="1.4" fill="#1c1c20" />
      <rect x="42" y="19.5" width="2.8" height="7.5" rx="1.4" fill="#1c1c20" />
      <path
        d="M13.5 41.8 C22 52 42 52.5 51.5 41.5"
        fill="none"
        stroke="#1c1c20"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Odlesk id={id} />
    </svg>
  );
}

/** Nastavení systému: kovové ozubené kolo přes celou ikonu. */
export function IkonaNastaveni({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  const zuby = 12;
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("pod")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f4f6" />
          <stop offset="1" stopColor="#b7bcc5" />
        </linearGradient>
        <linearGradient id={id("kolo")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a9099" />
          <stop offset="1" stopColor="#4c5159" />
        </linearGradient>
        <radialGradient id={id("stred")} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="1" stopColor="#c9ced6" />
        </radialGradient>
      </defs>
      <rect {...SQUIRCLE} fill={`url(#${id("pod")})`} />
      <g fill={`url(#${id("kolo")})`}>
        {Array.from({ length: zuby }).map((_, i) => (
          <rect
            key={i}
            x="28.6"
            y="6.5"
            width="6.8"
            height="9"
            rx="1.6"
            transform={`rotate(${(360 / zuby) * i} 32 32)`}
          />
        ))}
        <circle cx="32" cy="32" r="21" />
      </g>
      <circle cx="32" cy="32" r="15.5" fill={`url(#${id("stred")})`} />
      <circle cx="32" cy="32" r="10.5" fill="#6c727b" />
      <circle cx="32" cy="32" r="4.6" fill="#e9ecf0" />
      <Odlesk id={id} />
    </svg>
  );
}

/** Terminál: černá obrazovka s výzvou >_ v šedém rámečku. */
export function IkonaTerminal({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("ram")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9dbe0" />
          <stop offset="1" stopColor="#8e9199" />
        </linearGradient>
        <linearGradient id={id("obrazovka")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a2e" />
          <stop offset="1" stopColor="#0b0b0d" />
        </linearGradient>
      </defs>
      <rect {...SQUIRCLE} fill={`url(#${id("ram")})`} />
      <rect x="5" y="6" width="54" height="52" rx="9" fill={`url(#${id("obrazovka")})`} />
      <path
        d="M15 21 L23.5 27.5 L15 34"
        fill="none"
        stroke="#f4f4f5"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 35.5 H38" stroke="#f4f4f5" strokeWidth="3.4" strokeLinecap="round" />
      <Odlesk id={id} />
    </svg>
  );
}

/**
 * TextEdit: popsaný list papíru a plnicí pero přes něj. Aplikace se v kódu
 * dál jmenuje `poznamky` – na Macu ale obyčejné .txt otevírá TextEdit,
 * Poznámky jsou jiný program, který si texty ukládá sám (rada 25. 9. 2026).
 */
export function IkonaPoznamky({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={id("tvar")}>
          <rect {...SQUIRCLE} />
        </clipPath>
        <linearGradient id={id("pozadi")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f5f7" />
          <stop offset="1" stopColor="#d9dce2" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id("tvar")})`}>
        <rect x="0" y="0" width="64" height="64" fill={`url(#${id("pozadi")})`} />
        <rect x="13" y="8" width="38" height="48" rx="2" fill="#ffffff" stroke="#c9ccd3" strokeWidth="1" />
        {[16, 22, 28, 34, 40].map((y) => (
          <rect key={y} x="18" y={y} width={y === 40 ? 16 : 28} height="1.6" rx="0.8" fill="#b8bcc5" />
        ))}
        {/* Pero šikmo přes list: tělo, kovový úchyt a hrot. */}
        <g transform="rotate(-38 40 42)">
          <rect x="37" y="18" width="7" height="26" rx="2" fill="#2b2d33" />
          <rect x="37" y="40" width="7" height="3" fill="#c9a44a" />
          <path d="M37 43 H44 L40.5 52 Z" fill="#d8b75c" />
        </g>
      </g>
      <Odlesk id={id} />
    </svg>
  );
}

/**
 * Aplikace (dřív Launchpad): mřížka barevných dlaždic. V macOS 26 se
 * přehledu všech aplikací říká Aplikace a v Docku má tuhle ikonu.
 */
export function IkonaAplikace({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  const barvy = [
    ["#ffb347", "#f5872f"],
    ["#ff7a9c", "#e0456e"],
    ["#5fd3a8", "#2fae83"],
    ["#c79bff", "#9a5cf0"],
    ["#6fb6ff", "#2e84f0"],
    ["#ffd65c", "#f2b21f"],
    ["#8be08f", "#45b852"],
    ["#ff8f7a", "#ea5a43"],
    ["#b4bac4", "#858c98"],
  ];
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("pod")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfbfd" />
          <stop offset="1" stopColor="#dde1e8" />
        </linearGradient>
        {barvy.map(([a, b], i) => (
          <linearGradient key={i} id={id(`d${i}`)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
      </defs>
      <rect {...SQUIRCLE} fill={`url(#${id("pod")})`} />
      {barvy.map((_, i) => (
        <rect
          key={i}
          x={10 + (i % 3) * 16}
          y={10 + Math.floor(i / 3) * 16}
          width="12"
          height="12"
          rx="3.4"
          fill={`url(#${id(`d${i}`)})`}
        />
      ))}
      <Odlesk id={id} />
    </svg>
  );
}

/** Stažené: modrá složka se šipkou dolů. Bez podkladu, jako složky v Docku. */
export function IkonaStazene({ className, style }: Vlastnosti) {
  const id = useIdIkony();
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("celo")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ed2f8" />
          <stop offset="1" stopColor="#3f97df" />
        </linearGradient>
      </defs>
      <path
        d="M4 17a3 3 0 0 1 3-3h16.5a3 3 0 0 1 2.3 1.1L29 19h28a3 3 0 0 1 3 3v5H4z"
        fill="#4a9cde"
      />
      <rect x="4" y="23" width="56" height="33" rx="4.5" fill={`url(#${id("celo")})`} />
      <rect x="4.5" y="23.5" width="55" height="32" rx="4" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
      <path
        d="M32 29.5 V45 M25 38.5 L32 45.5 L39 38.5"
        fill="none"
        stroke="#1d6bb3"
        strokeOpacity="0.85"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Koš: drátěný koš bez podkladu. Plný má nahoře zmačkané papíry. */
export function IkonaKos({ className, style, plny }: Vlastnosti & { plny?: boolean }) {
  const id = useIdIkony();
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={id("telo")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfe2e7" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#cfd3da" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {plny && (
        <g>
          <path d="M17 13 C20 6 28 5 31 10 C34 4 44 5 46 12 C49 12 50 15 48 17 H16 C14 16 15 13 17 13 Z" fill="#f7f7f5" stroke="#b9bcc2" strokeWidth="0.8" />
          <path d="M24 9 L27 14 M36 7 L35 13 M42 10 L40 15" stroke="#c8cbd0" strokeWidth="0.8" />
        </g>
      )}
      {/* Tělo koše se zužuje dolů. */}
      <path
        d="M12.5 15 H51.5 L47.5 57 A4 4 0 0 1 43.5 60.5 H20.5 A4 4 0 0 1 16.5 57 Z"
        fill={`url(#${id("telo")})`}
        stroke="#9ea3ab"
        strokeWidth="1"
      />
      {/* Drátěné žebrování. */}
      {[20, 26, 32, 38, 44].map((x) => (
        <path
          key={x}
          d={`M${x} 19 L${32 + (x - 32) * 0.86} 56.5`}
          stroke="#aeb3bb"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      ))}
      {/* Horní obruč. */}
      <rect x="10.5" y="12.5" width="43" height="5" rx="2.5" fill="#e8eaee" stroke="#9ea3ab" strokeWidth="1" />
    </svg>
  );
}
