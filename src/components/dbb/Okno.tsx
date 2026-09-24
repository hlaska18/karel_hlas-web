"use client";

/**
 * Rám DB Browseru: hlavička webové aplikace, nabídky, lišta s tlačítky,
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
  ArrowLeft,
} from "lucide-react";
import { useDbb, precti, type Karta } from "@/components/dbb/kontext";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import { stahni } from "@/lib/dbb/stahni";
import { t } from "@/lib/dbb/jazyk";

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

/* ─────────────────────────────── hlavička ─────────────────────────────── */

/**
 * Hlavička webové aplikace. Dřív tu byl titulek okna Windows 11 s křížky
 * a po zavření plocha; Karel chtěl kurz jako webovou aplikaci bez Windows
 * (24. 9. 2026). Rozložení programu pod ní zůstává – na něj navazují
 * lekce 14–19 i materiály v bance.
 */
export function Hlavicka({ soubor, zpet }: { soubor: string | null; zpet: () => void }) {
  return (
    <div className="flex h-[34px] shrink-0 items-center border-b border-dbb-linka bg-dbb-povrch px-3">
      <IkonaProgramu className="mr-2 h-4 w-4 shrink-0" />
      <span className="shrink-0 whitespace-nowrap text-[13px]">
        <span className="text-dbb-slaby">Karel Hlas · </span>
        <b className="font-semibold">{t("Kurz SQL", "SQL Course")}</b>
      </span>
      {soubor && (
        <span className="ml-3 flex min-w-0 items-center truncate text-[12px] text-dbb-slaby" title={soubor}>
          <span className="mr-2 h-3.5 w-px shrink-0 bg-dbb-linka" aria-hidden="true" />
          {soubor}
        </span>
      )}
      <span className="flex-1" />
      <button
        type="button"
        onClick={zpet}
        className="flex h-[24px] shrink-0 items-center rounded-[3px] border border-dbb-linka bg-dbb-okno px-2.5 text-[12px] hover:bg-dbb-hover"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        {t("Zpět na web", "Back to the Website")}
      </button>
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
  ulozKopii,
  predvadeni,
  jazyk,
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
  /** Stáhne otevřenou databázi do skutečného počítače. */
  ulozKopii: () => void;
  /** Zapne nebo ukončí režim předvádění pro projektor. */
  predvadeni: () => void;
  /** Přepne program do druhého jazyka (čeština ↔ angličtina). */
  jazyk: () => void;
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
      text: ok ? v_poradku : `${t("Kontrola našla problémy:", "The check found problems:")}\n${radky.join("\n")}`,
    });
  };

  const nabidky: { nazev: string; polozky: Polozka[] }[] = [
    {
      nazev: t("Soubor", "File"),
      polozky: [
        { text: t("Nová databáze…", "New Database…"), akce: novaDatabaze },
        { text: t("Otevřít databázi…", "Open Database…"), zkratka: "Ctrl+O", akce: otevritDatabazi },
        { text: t("Zavřít databázi", "Close Database"), akce: zavritDatabazi, zakazano: bezDb },
        "-",
        { text: t("Zapsat změny", "Write Changes"), zkratka: "Ctrl+S", akce: api.zapsat, zakazano: !api.zmeneno },
        { text: t("Vrátit změny", "Revert Changes"), akce: api.vratit, zakazano: !api.zmeneno },
        "-",
        { text: t("Nahrát databázi z počítače…", "Upload Database from Computer…"), akce: () => api.vyberSoubor("db") },
        { text: t("Uložit kopii do počítače…", "Save a Copy to This Computer…"), akce: ulozKopii, zakazano: bezDb },
        "-",
        { text: t("Importovat tabulku z CSV…", "Import Table from CSV File…"), akce: () => api.vyberSoubor("csv"), zakazano: bezDb },
        { text: t("Importovat databázi ze SQL…", "Import Database from SQL File…"), akce: () => api.vyberSoubor("sql") },
        {
          text: t("Exportovat tabulku do CSV…", "Export Table to CSV File…"),
          akce: () => api.otevritDialog({ druh: "exportCsv" }),
          zakazano: bezDb,
        },
        { text: t("Exportovat databázi do SQL…", "Export Database to SQL File…"), akce: api.exportujSql, zakazano: bezDb },
        "-",
        { text: t("Konec", "Exit"), akce: konec },
      ],
    },
    {
      nazev: t("Úpravy", "Edit"),
      polozky: [
        { text: t("Vytvořit tabulku…", "Create Table…"), akce: () => api.otevritDialog({ druh: "tabulka" }), zakazano: bezDb },
        { text: t("Upravit tabulku…", "Modify Table…"), zakazano: true },
        { text: t("Vytvořit index…", "Create Index…"), zakazano: true },
        "-",
        { text: t("Předvolby…", "Preferences…"), zakazano: true },
      ],
    },
    {
      nazev: t("Zobrazit", "View"),
      polozky: [
        { text: t("Kurz SQL", "SQL Course"), akce: () => api.nastavDokKartu("kurz") },
        { text: t("Schéma DB", "DB Schema"), akce: () => api.nastavDokKartu("schema") },
        { text: t("Log SQL", "SQL Log"), akce: () => api.nastavDokKartu("log") },
      ],
    },
    {
      nazev: t("Nástroje", "Tools"),
      polozky: [
        {
          text: t("Kontrola integrity", "Integrity Check"),
          akce: kontrola("PRAGMA integrity_check;", t("Kontrola integrity", "Integrity Check"), t("Databáze je v pořádku (integrity_check: ok).", "The database is fine (integrity_check: ok).")),
          zakazano: bezDb,
        },
        {
          text: t("Kontrola cizích klíčů", "Foreign-Key Check"),
          akce: kontrola("PRAGMA foreign_key_check;", t("Kontrola cizích klíčů", "Foreign-Key Check"), t("Všechny cizí klíče ukazují na existující řádky.", "All foreign keys point to existing rows.")),
          zakazano: bezDb,
        },
      ],
    },
    {
      nazev: t("Nápověda", "Help"),
      polozky: [
        { text: t("Moje výsledky…", "My Results…"), akce: () => api.otevritDialog({ druh: "vysledky" }) },
        {
          text: t("Stáhnout knihovna.db do počítače", "Download knihovna.db to This Computer"),
          akce: () => {
            const s = api.disk[KNIHOVNA];
            if (s) stahni(KNIHOVNA, s.bajty);
          },
        },
        { text: t("Obnovit původní knihovna.db…", "Restore Original knihovna.db…"), akce: obnovitKnihovnu },
        { text: t("Nový žák…", "New Pupil…"), akce: novyZak },
        "-",
        { text: t("O kurzu a pro učitele…", "About the Course / For Teachers…"), akce: () => api.otevritDialog({ druh: "okurzu" }) },
        { text: t("Přehled třídy (pro učitele)…", "Class Overview (for Teachers)…"), akce: () => api.otevritDialog({ druh: "prehled" }) },
        { text: t("Vytvořit úlohu pro třídu…", "Create a Task for the Class…"), akce: () => api.otevritDialog({ druh: "uloha" }) },
        {
          text: api.predvadeni ? t("Ukončit režim předvádění", "End Presentation Mode") : t("Režim předvádění (projektor)…", "Presentation Mode (Projector)…"),
          akce: predvadeni,
        },
        "-",
        { text: t("O programu DB Browser for SQLite…", "About DB Browser for SQLite…"), akce: () => api.otevritDialog({ druh: "oprogramu" }) },
        "-",
        { text: t("English version", "Česká verze (Czech version)"), akce: jazyk },
        { text: t("Přepnout na webovou podobu kurzu", "Switch to the Web Version (in Czech)"), akce: webovaPodoba },
        { text: t("Zpět na web", "Back to the Website"), akce: zpetNaWeb },
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
      <TlacitkoListy ikona={<FilePlus2 className="h-4 w-4 text-[#2e75b6]" />} text={t("Nová databáze", "New Database")} akce={novaDatabaze} />
      <TlacitkoListy
        ikona={<FolderOpen className="h-4 w-4 text-[#c9901a]" />}
        text={t("Otevřít databázi", "Open Database")}
        akce={otevritDatabazi}
        titulek={t("Otevřít databázi (Ctrl+O)", "Open Database (Ctrl+O)")}
      />
      <Oddelovac />
      {/* Šedá, dokud není co zapsat – podle toho žák pozná neuložené změny. */}
      <TlacitkoListy
        ikona={<Save className="h-4 w-4 text-[#2e75b6]" />}
        text={t("Zapsat změny", "Write Changes")}
        akce={api.zapsat}
        zakazano={!api.zmeneno}
        titulek={t("Zapsat změny (Ctrl+S)", "Write Changes (Ctrl+S)")}
      />
      <TlacitkoListy
        ikona={<Undo2 className="h-4 w-4 text-[#c9901a]" />}
        text={t("Vrátit změny", "Revert Changes")}
        akce={api.vratit}
        zakazano={!api.zmeneno}
      />
      <Oddelovac />
      <TlacitkoListy ikona={<FolderInput className="h-4 w-4" />} text={t("Otevřít projekt", "Open Project")} zakazano />
      <TlacitkoListy ikona={<FileOutput className="h-4 w-4" />} text={t("Uložit projekt", "Save Project")} zakazano />
      <Oddelovac />
      <TlacitkoListy ikona={<Link2 className="h-4 w-4" />} text={t("Připojit databázi", "Attach Database")} zakazano />
      <TlacitkoListy
        ikona={<XCircle className="h-4 w-4 text-[#c42b1c]" />}
        text={t("Zavřít databázi", "Close Database")}
        akce={zavritDatabazi}
        zakazano={!api.otevrena}
      />
    </div>
  );
}

/* ─────────────────────────────── karty ─────────────────────────────── */

const KARTY: { id: Karta; text: string }[] = [
  { id: "struktura", text: t("Struktura databáze", "Database Structure") },
  { id: "data", text: t("Prohlížet data", "Browse Data") },
  { id: "pragma", text: t("Upravit pragma", "Edit Pragmas") },
  { id: "sql", text: t("Spustit SQL", "Execute SQL") },
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
