/**
 * Ikony prostředí.
 *
 * Všechny jsou kreslené tady v kódu. Systémové ikony Windows jsou chráněná
 * grafika a do školního webu je kopírovat nejde – tyhle mají stejnou roli
 * a stejné barevné klíče (složka žlutá, textový soubor bílý s linkami,
 * archiv se zipem), takže je žák pozná, ale nejsou to ony.
 *
 * Neznámé a kancelářské přípony schválně dostávají obecný dokument s barevným
 * pruhem a vypsanou příponou. Ikona tím říká přesně to, co má: „tohle je
 * soubor typu DOCX" – a ne „tohle je Word", který v počítači stejně není.
 */

import { typSouboru, type AppId, type IkonaKlic } from "@/lib/win/typy";
import { pripona } from "@/lib/win/fs";

export type KlicIkony =
  | IkonaKlic
  | AppId
  | "kos"
  | "kos-plny"
  | "tento-pocitac"
  | "disk"
  | "sit"
  | "uzivatel";

interface Props {
  klic: KlicIkony;
  velikost?: number;
  /** Přípona vypsaná na obecném dokumentu (DOCX, XLSX…). */
  popisek?: string;
  className?: string;
}

/* ───────── stavební kameny ───────── */

const Slozka = ({ barva = "#f7c661", tmava = "#e8a93a" }: { barva?: string; tmava?: string }) => (
  <>
    <path d="M4 12a3 3 0 0 1 3-3h8.2l2.4 3H41a3 3 0 0 1 3 3v3H4z" fill={tmava} />
    <path
      d="M4 17.5h40a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"
      fill={barva}
    />
    <path d="M4 17.5h40a3 3 0 0 1 3 3v2H4z" fill="#fff" fillOpacity="0.35" />
  </>
);

const List = ({ barva = "#ffffff" }: { barva?: string }) => (
  <>
    <path
      d="M11 5.5h17.5L38 15.5v27a2.5 2.5 0 0 1-2.5 2.5h-24A2.5 2.5 0 0 1 9 42.5v-34A2.5 2.5 0 0 1 11.5 6z"
      fill={barva}
      stroke="#c9ccd1"
      strokeWidth="1"
    />
    <path d="M28.5 5.5 38 15.5h-7a2.5 2.5 0 0 1-2.5-2.5z" fill="#dfe3e8" />
  </>
);

const linky = (barva: string) =>
  [21, 26, 31, 36].map((y, i) => (
    <rect
      key={y}
      x="14"
      y={y}
      width={i === 3 ? 12 : 19}
      height="2"
      rx="1"
      fill={barva}
    />
  ));

/** Obecný dokument s barevným pruhem a vypsanou příponou. */
function Dokument({ barva, popisek }: { barva: string; popisek: string }) {
  return (
    <>
      <List />
      <rect x="6" y="27" width="30" height="14" rx="3" fill={barva} />
      <text
        x="21"
        y="37"
        textAnchor="middle"
        fontSize={popisek.length > 3 ? 8 : 9.5}
        fontWeight="700"
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {popisek}
      </text>
    </>
  );
}

/* ───────── jednotlivé ikony ───────── */

function kresba(klic: KlicIkony, popisek?: string) {
  switch (klic) {
    case "slozka":
    case "slozka-otevrena":
      return <Slozka />;

    case "pruzkumnik":
      return (
        <>
          <Slozka />
          <path d="M4 17.5h40a3 3 0 0 1 3 3v6H4z" fill="#3f8ce0" />
          <rect x="10" y="20" width="28" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.85" />
        </>
      );

    case "tento-pocitac":
      return (
        <>
          <rect x="5" y="9" width="38" height="25" rx="2.5" fill="#4b5563" />
          <rect x="7.5" y="11.5" width="33" height="20" rx="1.5" fill="#6fb6ef" />
          <path d="M7.5 11.5h33v9h-33z" fill="#8fcbf7" />
          <path d="M14 38h20l2 4H12z" fill="#9aa4b2" />
          <rect x="9" y="41" width="30" height="2.5" rx="1.25" fill="#6b7280" />
        </>
      );

    case "disk":
      return (
        <>
          <rect x="5" y="14" width="38" height="20" rx="3" fill="#9aa4b2" />
          <rect x="5" y="14" width="38" height="9" rx="3" fill="#b6bec9" />
          <circle cx="36" cy="28" r="2.5" fill="#4ade80" />
          <rect x="10" y="26" width="16" height="3" rx="1.5" fill="#6b7280" />
        </>
      );

    case "kos":
    case "kos-plny":
      return (
        <>
          {klic === "kos-plny" && (
            <>
              <rect x="15" y="8" width="11" height="8" rx="1.5" fill="#f7c661" transform="rotate(-14 20 12)" />
              <rect x="24" y="6" width="9" height="9" rx="1.5" fill="#ffffff" stroke="#c9ccd1" transform="rotate(12 28 10)" />
            </>
          )}
          <path d="M13 15h22l-2 27a3 3 0 0 1-3 2.8H18a3 3 0 0 1-3-2.8z" fill="#9fb6c9" fillOpacity="0.75" />
          <path d="M13 15h22l-.6 8H13.6z" fill="#c3d4e2" fillOpacity="0.8" />
          <rect x="10.5" y="11" width="27" height="4.5" rx="2.25" fill="#7a8fa3" />
          <rect x="19" y="7.5" width="10" height="4" rx="2" fill="#7a8fa3" />
          <g stroke="#63788b" strokeWidth="1.6" strokeLinecap="round">
            <path d="M20 23v15M24 23v15M28 23v15" />
          </g>
        </>
      );

    case "text":
      return (
        <>
          <List />
          {linky("#8a9099")}
        </>
      );

    case "kod":
      return (
        <>
          <List />
          <g stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M19 24l-5 5 5 5M28 24l5 5-5 5" />
          </g>
        </>
      );

    case "html":
      return (
        <>
          <List />
          <rect x="6" y="27" width="30" height="14" rx="3" fill="#e2703a" />
          <text x="21" y="37" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui">
            HTML
          </text>
        </>
      );

    case "tabulka":
      return (
        <>
          <List />
          <g fill="#4a9e6a">
            <rect x="13" y="21" width="21" height="4" rx="1" />
            <rect x="13" y="27" width="9" height="3.5" rx="1" fillOpacity="0.6" />
            <rect x="25" y="27" width="9" height="3.5" rx="1" fillOpacity="0.6" />
            <rect x="13" y="33" width="9" height="3.5" rx="1" fillOpacity="0.6" />
            <rect x="25" y="33" width="9" height="3.5" rx="1" fillOpacity="0.6" />
          </g>
        </>
      );

    case "obrazek":
      return (
        <>
          <List />
          <rect x="12" y="20" width="24" height="18" rx="2" fill="#bfe3ff" />
          <circle cx="18.5" cy="26" r="2.6" fill="#ffd76e" />
          <path d="M12 38l7.5-9 5.5 6 4-4.5 7 7.5z" fill="#5aa96f" />
        </>
      );

    case "pdf":
      return <Dokument barva="#c8352c" popisek="PDF" />;

    case "word":
      return <Dokument barva="#2b5fb3" popisek={popisek ?? "DOCX"} />;

    case "excel":
      return <Dokument barva="#1c6b41" popisek={popisek ?? "XLSX"} />;

    case "prezentace":
      return <Dokument barva="#c25219" popisek={popisek ?? "PPTX"} />;

    case "zvuk":
      return (
        <>
          <List />
          <path d="M27 20v14.5a4 4 0 1 1-2.5-3.7V23l-8 1.8v11.4a4 4 0 1 1-2.5-3.7V22z" fill="#7c5cd6" />
        </>
      );

    case "video":
      return (
        <>
          <List />
          <rect x="12" y="22" width="24" height="15" rx="2.5" fill="#3b4a5a" />
          <path d="M20 26.5l8 4.5-8 4.5z" fill="#ffffff" />
        </>
      );

    case "zip":
      return (
        <>
          <Slozka barva="#f2d08a" tmava="#dcb15c" />
          <rect x="21" y="9" width="6" height="33" rx="1" fill="#ffffff" fillOpacity="0.92" />
          <g fill="#b08a3a">
            {[12, 17, 22, 27, 32, 37].map((y) => (
              <rect key={y} x="22" y={y} width="4" height="2.5" rx="0.6" />
            ))}
          </g>
          <rect x="20" y="24" width="8" height="10" rx="2" fill="#e0b95f" stroke="#a8822f" />
        </>
      );

    case "aplikace":
      return (
        <>
          <rect x="7" y="9" width="34" height="32" rx="5" fill="#5b6470" />
          <rect x="7" y="9" width="34" height="9" rx="5" fill="#79838f" />
          <path d="M18 24l6 6-6 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );

    case "poznamkovy-blok":
      return (
        <>
          <rect x="9" y="6" width="30" height="38" rx="3" fill="#ffffff" stroke="#c9ccd1" />
          <rect x="9" y="6" width="30" height="8" rx="3" fill="#3f8ce0" />
          {linky("#9aa1aa")}
        </>
      );

    case "malovani":
      return (
        <>
          <path
            d="M24 6c10 0 18 6.7 18 15 0 5-4 7.5-8 7.5h-3.2c-2.4 0-4 1.7-4 3.8 0 1 .5 1.8 1 2.6.6.9 1.2 1.8 1.2 3 0 2.5-2 4.6-5 4.6C13.8 42.5 6 34.3 6 24 6 14 14 6 24 6z"
            fill="#f0f3f7"
            stroke="#c3c9d1"
          />
          <circle cx="16" cy="17" r="3.2" fill="#e0483c" />
          <circle cx="25" cy="13" r="3.2" fill="#f2b134" />
          <circle cx="33" cy="18" r="3.2" fill="#3f8ce0" />
          <circle cx="14" cy="28" r="3.2" fill="#4aa96a" />
        </>
      );

    case "kalkulacka":
      return (
        <>
          <rect x="9" y="5" width="30" height="38" rx="5" fill="#41505f" />
          <rect x="13" y="9" width="22" height="9" rx="2" fill="#cfe6f7" />
          <g fill="#8ea4b8">
            {[22, 29, 36].map((y) =>
              [14, 21, 28].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="5.5" height="5" rx="1.4" />),
            )}
          </g>
          <rect x="28" y="22" width="5.5" height="12" rx="1.4" fill="#f2a341" />
        </>
      );

    case "nastaveni":
      return (
        <>
          <path
            d="M24 5.5l3.1 4.2 5.1-1.3 1 5.2 5 1.9-2 4.9 3.3 4.1-4.1 3.3 1.2 5.2-5.2 1-2.6 4.6-4.8-2.2-4.8 2.2-2.6-4.6-5.2-1 1.2-5.2-4.1-3.3 3.3-4.1-2-4.9 5-1.9 1-5.2 5.1 1.3z"
            fill="#7a8695"
          />
          <circle cx="24" cy="24" r="7.5" fill="#eef2f6" />
          <circle cx="24" cy="24" r="3.6" fill="#7a8695" />
        </>
      );

    case "terminal":
      return (
        <>
          <rect x="5" y="8" width="38" height="32" rx="5" fill="#1f2933" />
          <rect x="5" y="8" width="38" height="7" rx="5" fill="#2d3a46" />
          <path d="M13 23l5 4.5-5 4.5" stroke="#4ade80" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="21" y="30" width="11" height="2.4" rx="1.2" fill="#94a3b8" />
        </>
      );

    case "spravce-uloh":
      return (
        <>
          <rect x="5" y="8" width="38" height="32" rx="4" fill="#f4f6f9" stroke="#c9ccd1" />
          <rect x="5" y="8" width="38" height="7" rx="4" fill="#dce3ec" />
          <g fill="#3f8ce0">
            <rect x="11" y="27" width="5" height="8" rx="1.5" />
            <rect x="19" y="22" width="5" height="13" rx="1.5" />
            <rect x="27" y="18" width="5" height="17" rx="1.5" />
            <rect x="35" y="25" width="4" height="10" rx="1.5" />
          </g>
        </>
      );

    case "fotky":
      return (
        <>
          <rect x="8" y="11" width="30" height="24" rx="3" fill="#ffffff" stroke="#c9ccd1" transform="rotate(-8 23 23)" />
          <rect x="11" y="14" width="30" height="24" rx="3" fill="#ffffff" stroke="#c9ccd1" />
          <rect x="13" y="16" width="26" height="20" rx="2" fill="#bfe3ff" />
          <circle cx="20" cy="22" r="2.6" fill="#ffd76e" />
          <path d="M13 36l8-9 6 6.5 4-4 8 6.5z" fill="#5aa96f" />
        </>
      );

    case "prohlizec":
      return (
        <>
          <circle cx="24" cy="24" r="18" fill="#1a8fd1" />
          <path d="M24 6c5 5 5 31 0 36-5-5-5-31 0-36z" fill="#ffffff" fillOpacity="0.45" />
          <path d="M6.6 18h34.8M6.6 30h34.8" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" />
          <circle cx="24" cy="24" r="18" fill="none" stroke="#0e6ea3" strokeWidth="2" />
        </>
      );

    case "ovladaci-panely":
      return (
        <>
          <rect x="6" y="9" width="36" height="30" rx="4" fill="#eef2f6" stroke="#c3c9d1" />
          <g stroke="#5b6470" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 18h24M12 24h24M12 30h24" />
          </g>
          <g fill="#3f8ce0">
            <circle cx="20" cy="18" r="3.4" />
            <circle cx="29" cy="24" r="3.4" />
            <circle cx="17" cy="30" r="3.4" />
          </g>
        </>
      );

    case "sit":
      return (
        <>
          <circle cx="24" cy="24" r="17" fill="#3f8ce0" />
          <g stroke="#ffffff" strokeWidth="2" fill="none">
            <path d="M24 7c5 5 5 29 0 34M24 7c-5 5-5 29 0 34M8 18h32M8 30h32" />
          </g>
        </>
      );

    case "uzivatel":
      return (
        <>
          <circle cx="24" cy="24" r="20" fill="#5b7fb5" />
          <circle cx="24" cy="19" r="7" fill="#ffffff" fillOpacity="0.92" />
          <path d="M10 41a14 14 0 0 1 28 0z" fill="#ffffff" fillOpacity="0.92" />
        </>
      );

    default:
      return (
        <>
          <List />
          <rect x="6" y="27" width="30" height="14" rx="3" fill="#8a9099" />
          <text x="21" y="37" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui">
            {(popisek ?? "?").slice(0, 4)}
          </text>
        </>
      );
  }
}

export function Ikona({ klic, velikost = 32, popisek, className }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={velikost}
      height={velikost}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {kresba(klic, popisek)}
    </svg>
  );
}

/** Ikona pro položku na disku – vybere klíč podle názvu souboru. */
export function IkonaSouboru({
  jmeno,
  slozka,
  velikost = 32,
  klic,
  className,
}: {
  jmeno: string;
  slozka: boolean;
  velikost?: number;
  /** Vynucený klíč (koš, tento počítač…) – přebije odvození z názvu. */
  klic?: KlicIkony;
  className?: string;
}) {
  if (klic) return <Ikona klic={klic} velikost={velikost} className={className} />;
  if (slozka) return <Ikona klic="slozka" velikost={velikost} className={className} />;
  return (
    <Ikona
      klic={typSouboru(jmeno).ikona}
      velikost={velikost}
      popisek={pripona(jmeno).toUpperCase()}
      className={className}
    />
  );
}
