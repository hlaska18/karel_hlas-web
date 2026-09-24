"use client";

/**
 * Rám okna DB Browseru: titulek Windows 11, nabídky, lišta s tlačítky,
 * karty a stavový řádek. Rozložení a názvy drží program (česky tak, jak je
 * má návod v bance), ikony jsou vlastní – obrázky programu nepřebíráme.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FilePlus2,
  FolderOpen,
  Save,
  Undo2,
  FolderInput,
  FileOutput,
  Link2,
  XCircle,
} from "lucide-react";
import { useDbb, precti, type Karta } from "@/components/dbb/kontext";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import { stahni } from "@/lib/dbb/stahni";

/** Ikona programu: databázový válec. Vlastní kresba, ne logo programu. */
export function IkonaProgramu({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="8" ry="3" fill="#5b9bd5" />
      <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13c0 1.7-3.6 3-8 3s-8-1.3-8-3Z" fill="#2e75b6" />
      <path d="M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3M4 14.5c0 1.7 3.6 3 8 3s8-1.3 8-3" fill="none" stroke="#bdd7ee" strokeWidth="1.2" />
      <ellipse cx="12" cy="5.5" rx="8" ry="3" fill="none" stroke="#1f4e79" strokeWidth="0.8" />
    </svg>
  );
}

/* ─────────────────────────────── titulek ─────────────────────────────── */

export function Titulek({
  text,
  minimalizovat,
  zavrit,
}: {
  text: string;
  minimalizovat: () => void;
  zavrit: () => void;
}) {
  const tlacitko = "flex h-full w-[46px] items-center justify-center transition-colors";
  return (
    <div className="flex h-[30px] shrink-0 items-center bg-dbb-povrch">
      <div className="flex min-w-0 flex-1 items-center pl-3">
        <IkonaProgramu className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate text-[12px]">{text}</span>
      </div>
      <div className="flex h-full shrink-0">
        <button type="button" aria-label="Minimalizovat" onClick={minimalizovat} className={`${tlacitko} hover:bg-black/[0.06]`}>
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M0 5h10" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        {/* Okno je přes celou obrazovku; obnovit menší okno tu nejde. */}
        <button type="button" aria-label="Obnovit z maximalizace" className={`${tlacitko} cursor-default`} tabIndex={-1}>
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M2.5 0.5h7v7M0.5 2.5h7v7h-7z" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button type="button" aria-label="Zavřít" onClick={zavrit} className={`${tlacitko} hover:bg-[#c42b1c] hover:text-white`}>
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
            <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── nabídky ─────────────────────────────── */

type Polozka = { text: string; zkratka?: string; akce?: () => void; zakazano?: boolean } | "-";

export function NabidkaOkna({
  novaDatabaze,
  otevritDatabazi,
  zavritDatabazi,
  konec,
  zpetNaWeb,
  webovaPodoba,
  obnovitKnihovnu,
  novyZak,
}: {
  novaDatabaze: () => void;
  otevritDatabazi: () => void;
  zavritDatabazi: () => void;
  konec: () => void;
  /** Odchod ze simulace na web – s neuloženými změnami se napřed zeptá. */
  zpetNaWeb: () => void;
  /** Přepne /sql na webovou podobu kurzu (volba se pamatuje). */
  webovaPodoba: () => void;
  obnovitKnihovnu: () => void;
  /** Smaže postup i soubory – pro dalšího žáka u stejného počítače. */
  novyZak: () => void;
}) {
  const api = useDbb();
  const [otevrene, nastavOtevrene] = useState<string | null>(null);
  const obalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otevrene) return;
    const mimo = (e: MouseEvent) => {
      if (obalRef.current && !obalRef.current.contains(e.target as Node)) nastavOtevrene(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") nastavOtevrene(null);
    };
    document.addEventListener("mousedown", mimo);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", mimo);
      document.removeEventListener("keydown", esc);
    };
  }, [otevrene]);

  const bezDb = !api.otevrena;
  const kontrola = (pragma: string, titulek: string, v_poradku: string) => () => {
    const r = precti(api.db(), pragma);
    const radky = r ? r.values.map((v) => v.map((c) => String(c)).join(" | ")) : [];
    const ok = r && (r.values.length === 0 || (r.values.length === 1 && String(r.values[0][0]) === "ok"));
    api.otevritDialog({
      druh: "zprava",
      titulek,
      text: ok ? v_poradku : `Kontrola našla problémy:\n${radky.join("\n")}`,
    });
  };

  const nabidky: { nazev: string; polozky: Polozka[] }[] = [
    {
      nazev: "Soubor",
      polozky: [
        { text: "Nová databáze…", akce: novaDatabaze },
        { text: "Otevřít databázi…", zkratka: "Ctrl+O", akce: otevritDatabazi },
        { text: "Zavřít databázi", akce: zavritDatabazi, zakazano: bezDb },
        "-",
        { text: "Zapsat změny", zkratka: "Ctrl+S", akce: api.zapsat, zakazano: !api.zmeneno },
        { text: "Vrátit změny", akce: api.vratit, zakazano: !api.zmeneno },
        "-",
        { text: "Import", zakazano: true },
        { text: "Export", zakazano: true },
        "-",
        { text: "Konec", akce: konec },
      ],
    },
    {
      nazev: "Úpravy",
      polozky: [
        { text: "Vytvořit tabulku…", akce: () => api.otevritDialog({ druh: "tabulka" }), zakazano: bezDb },
        { text: "Upravit tabulku…", zakazano: true },
        { text: "Vytvořit index…", zakazano: true },
        "-",
        { text: "Předvolby…", zakazano: true },
      ],
    },
    {
      nazev: "Zobrazit",
      polozky: [
        { text: "Kurz SQL", akce: () => api.nastavDokKartu("kurz") },
        { text: "Schéma DB", akce: () => api.nastavDokKartu("schema") },
        { text: "Log SQL", akce: () => api.nastavDokKartu("log") },
      ],
    },
    {
      nazev: "Nástroje",
      polozky: [
        {
          text: "Kontrola integrity",
          akce: kontrola("PRAGMA integrity_check;", "Kontrola integrity", "Databáze je v pořádku (integrity_check: ok)."),
          zakazano: bezDb,
        },
        {
          text: "Kontrola cizích klíčů",
          akce: kontrola("PRAGMA foreign_key_check;", "Kontrola cizích klíčů", "Všechny cizí klíče ukazují na existující řádky."),
          zakazano: bezDb,
        },
      ],
    },
    {
      nazev: "Nápověda",
      polozky: [
        { text: "O kurzu a pro učitele…", akce: () => api.otevritDialog({ druh: "okurzu" }) },
        {
          text: "Stáhnout knihovna.db do počítače",
          akce: () => {
            const s = api.disk[KNIHOVNA];
            if (s) stahni(KNIHOVNA, s.bajty);
          },
        },
        { text: "Obnovit původní knihovna.db…", akce: obnovitKnihovnu },
        { text: "Nový žák…", akce: novyZak },
        "-",
        { text: "O programu DB Browser for SQLite…", akce: () => api.otevritDialog({ druh: "oprogramu" }) },
        "-",
        { text: "Přepnout na webovou podobu kurzu", akce: webovaPodoba },
        { text: "Zpět na web", akce: zpetNaWeb },
      ],
    },
  ];

  return (
    <div ref={obalRef} role="menubar" className="relative flex h-[22px] shrink-0 items-stretch bg-dbb-povrch px-1">
      {nabidky.map((n) => (
        <div key={n.nazev} className="relative">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={otevrene === n.nazev}
            onMouseDown={(e) => {
              e.preventDefault();
              nastavOtevrene((o) => (o === n.nazev ? null : n.nazev));
            }}
            onMouseEnter={() => otevrene && nastavOtevrene(n.nazev)}
            className={`h-full px-2 text-[12px] ${otevrene === n.nazev ? "bg-dbb-vyber" : "hover:bg-dbb-hover"}`}
          >
            {n.nazev}
          </button>
          {otevrene === n.nazev && (
            <div
              role="menu"
              className="absolute left-0 top-full z-[60] min-w-[240px] border border-dbb-linka bg-dbb-povrch py-1 shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
            >
              {n.polozky.map((p, i) =>
                p === "-" ? (
                  <div key={i} className="mx-2 my-1 h-px bg-dbb-linka" />
                ) : (
                  <button
                    key={p.text}
                    type="button"
                    role="menuitem"
                    disabled={p.zakazano}
                    onClick={() => {
                      nastavOtevrene(null);
                      if (p.akce) p.akce();
                    }}
                    className="flex h-[24px] w-full items-center pl-7 pr-4 text-left text-[12px] enabled:hover:bg-dbb-hover disabled:text-dbb-slaby/60"
                  >
                    <span className="flex-1 whitespace-nowrap">{p.text}</span>
                    {p.zkratka && <span className="ml-8 text-dbb-slaby">{p.zkratka}</span>}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────── lišta ─────────────────────────────── */

function TlacitkoListy({
  ikona,
  text,
  akce,
  zakazano,
  titulek,
}: {
  ikona: ReactNode;
  text: string;
  akce?: () => void;
  zakazano?: boolean;
  titulek?: string;
}) {
  return (
    <button
      type="button"
      onClick={akce}
      disabled={zakazano || !akce}
      title={titulek || text}
      className="flex h-[26px] shrink-0 items-center whitespace-nowrap rounded-[3px] px-1.5 text-[12px] enabled:hover:bg-dbb-hover disabled:opacity-45"
    >
      <span className="mr-1.5 flex h-4 w-4 items-center justify-center">{ikona}</span>
      {text}
    </button>
  );
}

const Oddelovac = () => <span className="mx-1 h-5 w-px bg-dbb-linka" aria-hidden="true" />;

export function Lista({
  novaDatabaze,
  otevritDatabazi,
  zavritDatabazi,
}: {
  novaDatabaze: () => void;
  otevritDatabazi: () => void;
  zavritDatabazi: () => void;
}) {
  const api = useDbb();
  return (
    <div className="flex h-[32px] shrink-0 items-center overflow-hidden border-b border-dbb-linka bg-dbb-lista px-1.5">
      <TlacitkoListy ikona={<FilePlus2 className="h-4 w-4 text-[#2e75b6]" />} text="Nová databáze" akce={novaDatabaze} />
      <TlacitkoListy
        ikona={<FolderOpen className="h-4 w-4 text-[#c9901a]" />}
        text="Otevřít databázi"
        akce={otevritDatabazi}
        titulek="Otevřít databázi (Ctrl+O)"
      />
      <Oddelovac />
      {/* Šedá, dokud není co zapsat – podle toho žák pozná neuložené změny. */}
      <TlacitkoListy
        ikona={<Save className="h-4 w-4 text-[#2e75b6]" />}
        text="Zapsat změny"
        akce={api.zapsat}
        zakazano={!api.zmeneno}
        titulek="Zapsat změny (Ctrl+S)"
      />
      <TlacitkoListy
        ikona={<Undo2 className="h-4 w-4 text-[#c9901a]" />}
        text="Vrátit změny"
        akce={api.vratit}
        zakazano={!api.zmeneno}
      />
      <Oddelovac />
      <TlacitkoListy ikona={<FolderInput className="h-4 w-4" />} text="Otevřít projekt" zakazano />
      <TlacitkoListy ikona={<FileOutput className="h-4 w-4" />} text="Uložit projekt" zakazano />
      <Oddelovac />
      <TlacitkoListy ikona={<Link2 className="h-4 w-4" />} text="Připojit databázi" zakazano />
      <TlacitkoListy
        ikona={<XCircle className="h-4 w-4 text-[#c42b1c]" />}
        text="Zavřít databázi"
        akce={zavritDatabazi}
        zakazano={!api.otevrena}
      />
    </div>
  );
}

/* ─────────────────────────────── karty ─────────────────────────────── */

const KARTY: { id: Karta; text: string }[] = [
  { id: "struktura", text: "Struktura databáze" },
  { id: "data", text: "Prohlížet data" },
  { id: "pragma", text: "Upravit pragma" },
  { id: "sql", text: "Spustit SQL" },
];

export function Karty() {
  const api = useDbb();
  return (
    <div role="tablist" className="flex h-[25px] shrink-0 items-end">
      {KARTY.map((k) => {
        const aktivni = api.karta === k.id;
        return (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={aktivni}
            onClick={() => {
              api.nastavKartu(k.id);
              api.udalost(`karta:${k.id}`);
            }}
            className={`-mb-px mr-[-1px] border border-dbb-linka px-3 text-[12px] ${
              aktivni
                ? "relative z-[1] h-[25px] border-b-dbb-lista bg-dbb-lista"
                : "h-[22px] bg-dbb-okno hover:bg-dbb-hover"
            }`}
          >
            {k.text}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── stavový řádek ─────────────────────────── */

export function StavovyRadek({ text }: { text: string }) {
  // Neuložené změny tu schválně nehlásíme – skutečný program to nedělá
  // a lekce 16 učí poznat je podle tlačítek Zapsat a Vrátit změny.
  return (
    <div className="flex h-[22px] shrink-0 items-center border-t border-dbb-linka bg-dbb-okno px-2 text-[11px] text-dbb-slaby">
      <span className="flex-1 truncate">{text}</span>
      <span>UTF-8</span>
    </div>
  );
}
