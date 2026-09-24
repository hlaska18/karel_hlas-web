"use client";

/**
 * Dialogy virtuálního DB Browseru: „Uložit změny?“, otevření a založení
 * souboru (jako okno Windows), návrh tabulky, informace o kurzu, potvrzení.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import { HelpCircle, Info, Database, Folder, HardDrive, Monitor, Download, ExternalLink, Plus, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { useDbb, precti, uvoz, type Dialog } from "@/components/dbb/kontext";
import { IkonaProgramu } from "@/components/dbb/Okno";
import { MojeVysledky, PrehledTridy } from "@/components/dbb/Vysledky";
import { UlohaOdkazem } from "@/components/dbb/UlohaOdkazem";
import { Okno, Tlacitko, Paticka, Zprava } from "@/components/dbb/okna";
import { KNIHOVNA, MAX_SOUBORU, upravNazev, velikost } from "@/lib/dbb/soubory";
import { tabulky } from "@/lib/dbb/prikazy";
import { zvyrazni } from "@/lib/dbb/zvyrazneni";
import { stahni } from "@/lib/dbb/stahni";
import { t, jeAnglicky } from "@/lib/dbb/jazyk";

/* ─────────────────────────── soubory ─────────────────────────── */

const dva = (n: number) => (n < 10 ? `0${n}` : String(n));
function datum(t: number): string {
  const d = new Date(t);
  return `${dva(d.getDate())}.${dva(d.getMonth() + 1)}.${d.getFullYear()} ${dva(d.getHours())}:${dva(d.getMinutes())}`;
}

function DialogSouboru({
  rezim,
  zavrit,
  otevrit,
  vytvorit,
  smazat,
  nahrat,
}: {
  rezim: "otevrit" | "ulozit";
  zavrit: () => void;
  otevrit: (nazev: string) => void;
  vytvorit: (nazev: string) => void;
  smazat: (nazev: string) => void;
  /** Soubor ze skutečného počítače; vrací chybu, nebo null. */
  nahrat: (nazev: string, bajty: Uint8Array) => string | null;
}) {
  const api = useDbb();
  const soubory = Object.keys(api.disk).sort((a, b) => a.localeCompare(b, "cs"));
  const [vybrany, nastavVybrany] = useState<string | null>(rezim === "otevrit" ? null : null);
  const [nazev, nastavNazev] = useState("");
  const [chyba, nastavChybu] = useState<string | null>(null);
  const [nahradit, nastavNahradit] = useState<string | null>(null);
  const [mazani, nastavMazani] = useState<string | null>(null);
  const vyberRef = useRef<HTMLInputElement>(null);

  /** Soubor ze skutečného počítače – FileReader, ať to jde i ve starém Chromu. */
  const zPocitace = (soubor: File) => {
    const cteni = new FileReader();
    cteni.onload = () => {
      const chybaNahrani = nahrat(soubor.name, new Uint8Array(cteni.result as ArrayBuffer));
      if (chybaNahrani) nastavChybu(chybaNahrani);
    };
    cteni.onerror = () => nastavChybu(t("Soubor se nepodařilo přečíst.", "The file could not be read."));
    cteni.readAsArrayBuffer(soubor);
  };

  const potvrdit = (zadano?: string) => {
    const text = zadano !== undefined ? zadano : nazev;
    nastavChybu(null);
    if (rezim === "otevrit") {
      const n = text.trim();
      if (!n) return nastavChybu(t("Vyber soubor, který chceš otevřít.", "Choose the file you want to open."));
      if (!api.disk[n]) return nastavChybu(t(`Soubor „${n}“ ve složce není. Zkontroluj název.`, `There is no file “${n}” in the folder. Check the name.`));
      otevrit(n);
      return;
    }
    const u = upravNazev(text);
    if ("chyba" in u) return nastavChybu(u.chyba);
    if (u.nazev.toLowerCase() === KNIHOVNA) {
      return nastavChybu(t("Soubor knihovna.db potřebuje kurz – zvol pro svou databázi jiný název.", "The course needs the knihovna.db file – choose a different name for your database."));
    }
    if (api.disk[u.nazev]) {
      nastavNahradit(u.nazev);
      return;
    }
    if (soubory.length >= MAX_SOUBORU) {
      return nastavChybu(t("Ve složce je moc souborů. Nějaký starý smaž (pravým tlačítkem → Odstranit).", "There are too many files in the folder. Delete an old one (right-click → Delete)."));
    }
    vytvorit(u.nazev);
  };

  const nav = (ikona: ReactNode, text: string, aktivni?: boolean) => (
    <div className={`flex h-[24px] items-center px-2 text-[12px] ${aktivni ? "bg-dbb-vyber" : "text-dbb-slaby"}`}>
      <span className="mr-2 flex h-4 w-4 items-center justify-center">{ikona}</span>
      {text}
    </div>
  );

  return (
    <Okno
      titulek={rezim === "otevrit" ? t("Vyberte soubor databáze", "Choose a database file") : t("Vyberte název souboru pro novou databázi", "Choose a file name for the new database")}
      zavrit={zavrit}
      sirka={720}
    >
      <div className="flex shrink-0 items-center border-b border-dbb-linka px-3 py-2 text-[12px]">
        <div className="flex h-[26px] flex-1 items-center border border-dbb-linka px-2">
          <Monitor className="mr-1.5 h-3.5 w-3.5 text-dbb-slaby" /> {t("Tento počítač", "This PC")}{" "}
          <span className="mx-1.5 text-dbb-slaby">›</span>
          {t("Stažené soubory", "Downloads")}
        </div>
        <div className="ml-2 flex h-[26px] w-[180px] items-center border border-dbb-linka px-2 text-dbb-slaby">{t("Hledat: Stažené soubory", "Search Downloads")}</div>
      </div>
      <div className="flex min-h-[250px] flex-1">
        <div className="w-[170px] shrink-0 border-r border-dbb-linka py-1">
          {nav(<Monitor className="h-3.5 w-3.5" />, t("Plocha", "Desktop"))}
          {nav(<Download className="h-3.5 w-3.5 text-[#2e75b6]" />, t("Stažené soubory", "Downloads"), true)}
          {nav(<Folder className="h-3.5 w-3.5 text-[#c9901a]" />, t("Dokumenty", "Documents"))}
          {nav(<Folder className="h-3.5 w-3.5 text-[#c9901a]" />, t("Obrázky", "Pictures"))}
          {nav(<HardDrive className="h-3.5 w-3.5" />, t("Tento počítač", "This PC"))}
        </div>
        <div className="dbb-posuv min-w-0 flex-1 overflow-auto">
          <table className="w-full text-[12px]" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="text-left text-dbb-slaby">
                <th className="h-[24px] border-b border-dbb-mrizka px-3 font-normal">{t("Název", "Name")}</th>
                <th className="border-b border-dbb-mrizka px-3 font-normal">{t("Datum změny", "Date modified")}</th>
                <th className="border-b border-dbb-mrizka px-3 font-normal">{t("Typ", "Type")}</th>
                <th className="border-b border-dbb-mrizka px-3 text-right font-normal">{t("Velikost", "Size")}</th>
              </tr>
            </thead>
            <tbody>
              {soubory.map((s) => (
                <tr
                  key={s}
                  onClick={() => {
                    nastavVybrany(s);
                    nastavNazev(s);
                    nastavMazani(null);
                  }}
                  onDoubleClick={() => potvrdit(s)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    nastavVybrany(s);
                    nastavNazev(s);
                    if (s !== KNIHOVNA) nastavMazani(s);
                  }}
                  className={`cursor-default ${vybrany === s ? "bg-dbb-vyber" : "hover:bg-dbb-hover"}`}
                >
                  <td className="h-[24px] px-3">
                    <span className="flex items-center">
                      <Database className="mr-2 h-3.5 w-3.5 text-[#2e75b6]" />
                      {s}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 text-dbb-slaby">{datum(api.disk[s].zmeneno)}</td>
                  <td className="whitespace-nowrap px-3 text-dbb-slaby">{t("Soubor DB", "DB File")}</td>
                  <td className="whitespace-nowrap px-3 text-right text-dbb-slaby">{velikost(api.disk[s].bajty.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mazani && (
            <div className="m-3 border border-dbb-linka bg-dbb-okno px-3 py-2 text-[12px]">
              {t("Odstranit soubor", "Delete the file")} <b>{mazani}</b>?{" "}
              {t("Zpátky nepůjde vrátit.", "It can't be undone.")}
              <span className="ml-2 inline-flex">
                <Tlacitko
                  akce={() => {
                    if (api.otevrena === mazani) {
                      nastavChybu(t("Otevřený soubor nejde odstranit – nejdřív ho zavři.", "An open file can't be deleted – close it first."));
                    } else {
                      smazat(mazani);
                      nastavVybrany(null);
                      nastavNazev("");
                    }
                    nastavMazani(null);
                  }}
                >
                  {t("Odstranit", "Delete")}
                </Tlacitko>
                <Tlacitko akce={() => nastavMazani(null)}>{t("Ne", "No")}</Tlacitko>
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-dbb-linka bg-dbb-okno px-4 py-3 text-[12px]">
        <div className="flex items-center">
          <label htmlFor="dbb-nazev-souboru" className="w-[110px] shrink-0 text-right pr-2">
            {t("Název souboru:", "File name:")}
          </label>
          <input
            id="dbb-nazev-souboru"
            value={nazev}
            onChange={(e) => {
              nastavNazev(e.target.value);
              nastavChybu(null);
              nastavNahradit(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                potvrdit();
              }
            }}
            spellCheck={false}
            className="h-[24px] flex-1 border border-dbb-linka bg-dbb-povrch px-1.5 text-[12px] focus:border-dbb-akcent"
          />
          <select
            aria-label={t("Typ souboru", "File type")}
            className="ml-2 h-[24px] w-[230px] border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            <option>{t("Soubory databáze SQLite (*.db *.sqlite)", "SQLite database files (*.db *.sqlite)")}</option>
          </select>
        </div>
        {chyba && <p className="mt-2 pl-[110px] text-[#a4262c]">{chyba}</p>}
        {nahradit && (
          <p className="mt-2 pl-[110px]">
            {t("Soubor", "The file")} <b>{nahradit}</b>{" "}
            {t("už existuje. Chceš ho nahradit prázdnou databází?", "already exists. Do you want to replace it with an empty database?")}
            <span className="ml-2 inline-flex">
              <Tlacitko akce={() => vytvorit(nahradit)}>{t("Ano", "Yes")}</Tlacitko>
              <Tlacitko akce={() => nastavNahradit(null)}>{t("Ne", "No")}</Tlacitko>
            </span>
          </p>
        )}
        <div className="mt-3 flex items-center justify-end">
          {rezim === "otevrit" && (
            <span className="mr-auto">
              <input
                ref={vyberRef}
                type="file"
                accept=".db,.sqlite,.sqlite3,.db3"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (f) zPocitace(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => vyberRef.current && vyberRef.current.click()}
                className="h-[28px] rounded-[4px] border border-dbb-linka bg-dbb-povrch px-3 hover:bg-dbb-hover"
              >
                {t("Z tohoto počítače…", "From This Computer…")}
              </button>
            </span>
          )}
          <Tlacitko primarni akce={() => potvrdit()}>
            {rezim === "otevrit" ? t("Otevřít", "Open") : t("Uložit", "Save")}
          </Tlacitko>
          <Tlacitko akce={zavrit}>{t("Zrušit", "Cancel")}</Tlacitko>
        </div>
      </div>
    </Okno>
  );
}

/* ─────────────────────── návrh tabulky ─────────────────────── */

type Pole = {
  nazev: string;
  typ: string;
  nn: boolean;
  pk: boolean;
  ai: boolean;
  u: boolean;
  vychozi: string;
  odkaz: string;
};

const TYPY = ["INTEGER", "TEXT", "REAL", "NUMERIC", "BLOB"];

/** CREATE TABLE ve stejném tvaru, jaký píše program. */
export function sqlTabulky(nazev: string, pole: Pole[]): string {
  const radky = pole.map((p) => {
    let r = `\t${uvoz(p.nazev)}\t${p.typ}`;
    if (p.nn) r += " NOT NULL";
    const v = p.vychozi.trim();
    if (v) r += ` DEFAULT ${v !== "" && !isNaN(Number(v)) ? v : `'${v.replace(/'/g, "''")}'`}`;
    if (p.u) r += " UNIQUE";
    return r;
  });
  const pk = pole.filter((p) => p.pk);
  if (pk.length) {
    radky.push(
      `\tPRIMARY KEY(${pk.map((p) => uvoz(p.nazev) + (p.ai && pk.length === 1 ? " AUTOINCREMENT" : "")).join(",")})`,
    );
  }
  pole.forEach((p) => {
    const m = p.odkaz.match(/^(.+)\((.+)\)$/);
    if (m) radky.push(`\tFOREIGN KEY(${uvoz(p.nazev)}) REFERENCES ${uvoz(m[1])}(${uvoz(m[2])})`);
  });
  return `CREATE TABLE ${uvoz(nazev || "nova_tabulka")} (\n${radky.join(",\n")}\n);`;
}

function EditorTabulky({ zavrit }: { zavrit: () => void }) {
  const api = useDbb();
  const [nazev, nastavNazev] = useState("");
  const [pole, nastavPole] = useState<Pole[]>([]);
  const [vybrane, nastavVybrane] = useState<number | null>(null);
  const [chyba, nastavChybu] = useState<string | null>(null);

  // Kam může cizí klíč ukazovat: sloupce primárních klíčů ostatních tabulek.
  const cile = useMemo(() => {
    const db = api.db();
    if (!db) return [] as string[];
    const vysledek: string[] = [];
    tabulky(db).forEach((t) => {
      const info = precti(db, `PRAGMA table_info(${uvoz(t)})`);
      if (info) info.values.forEach((v) => Number(v[5]) > 0 && vysledek.push(`${t}(${v[1]})`));
    });
    return vysledek;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.verze]);

  const zmen = (i: number, zmena: Partial<Pole>) =>
    nastavPole((p) => p.map((x, j) => (j === i ? { ...x, ...zmena } : x)));

  const sql = sqlTabulky(nazev.trim(), pole);

  const ok = () => {
    const n = nazev.trim();
    if (!n) return nastavChybu(t("Napiš název tabulky.", "Type a table name."));
    if (!pole.length) return nastavChybu(t("Tabulka musí mít aspoň jedno pole – přidej ho tlačítkem Přidat.", "The table needs at least one field – add one with the Add button."));
    const nazvy = pole.map((p) => p.nazev.trim().toLowerCase());
    if (nazvy.some((x) => !x)) return nastavChybu(t("Každé pole musí mít název.", "Every field needs a name."));
    if (nazvy.some((x, i) => nazvy.indexOf(x) !== i)) return nastavChybu(t("Dvě pole nesmí mít stejný název.", "Two fields can't have the same name."));
    const c = api.provedAplikaci(sql);
    if (c) return nastavChybu(c);
    api.udalost("tabulka-z-dialogu");
    api.status(t(`Tabulka ${n} byla vytvořena. Nezapomeň změny zapsat.`, `The table ${n} has been created. Don't forget to write the changes.`));
    zavrit();
  };

  const bunka = "border-b border-r border-dbb-mrizka px-1";
  return (
    <Okno titulek={t("Upravit definici tabulky", "Edit table definition")} zavrit={zavrit} sirka={820}>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 text-[12px]">
        <label className="flex items-center">
          <span className="mr-2 w-[60px]">{t("Tabulka", "Table")}</span>
          <input
            value={nazev}
            onChange={(e) => nastavNazev(e.target.value)}
            spellCheck={false}
            placeholder={t("název tabulky", "table name")}
            className="h-[24px] flex-1 border border-dbb-linka px-1.5 focus:border-dbb-akcent"
          />
        </label>
        <p className="mt-3 font-semibold">{t("Pole", "Fields")}</p>
        <div className="mt-1 flex items-center">
          <button
            type="button"
            onClick={() => {
              nastavPole((p) =>
                p.concat({ nazev: `Pole${p.length + 1}`, typ: "INTEGER", nn: false, pk: false, ai: false, u: false, vychozi: "", odkaz: "" }),
              );
              nastavVybrane(pole.length);
            }}
            className="mr-1 flex h-[24px] items-center rounded-[3px] px-1.5 hover:bg-dbb-hover"
          >
            <Plus className="mr-1 h-3.5 w-3.5 text-[#2e9d4f]" /> {t("Přidat", "Add")}
          </button>
          <button
            type="button"
            disabled={vybrane === null}
            onClick={() => {
              if (vybrane === null) return;
              nastavPole((p) => p.filter((_, j) => j !== vybrane));
              nastavVybrane(null);
            }}
            className="mr-1 flex h-[24px] items-center rounded-[3px] px-1.5 enabled:hover:bg-dbb-hover disabled:opacity-45"
          >
            <Minus className="mr-1 h-3.5 w-3.5 text-[#c42b1c]" /> {t("Odebrat", "Remove")}
          </button>
          <button
            type="button"
            disabled={vybrane === null || vybrane === 0}
            onClick={() => {
              if (vybrane === null || vybrane === 0) return;
              nastavPole((p) => {
                const n = p.slice();
                const x = n[vybrane - 1];
                n[vybrane - 1] = n[vybrane];
                n[vybrane] = x;
                return n;
              });
              nastavVybrane(vybrane - 1);
            }}
            className="mr-1 flex h-[24px] items-center rounded-[3px] px-1.5 enabled:hover:bg-dbb-hover disabled:opacity-45"
          >
            <ArrowUp className="mr-1 h-3.5 w-3.5" /> {t("Nahoru", "Move Up")}
          </button>
          <button
            type="button"
            disabled={vybrane === null || vybrane >= pole.length - 1}
            onClick={() => {
              if (vybrane === null || vybrane >= pole.length - 1) return;
              nastavPole((p) => {
                const n = p.slice();
                const x = n[vybrane + 1];
                n[vybrane + 1] = n[vybrane];
                n[vybrane] = x;
                return n;
              });
              nastavVybrane(vybrane + 1);
            }}
            className="flex h-[24px] items-center rounded-[3px] px-1.5 enabled:hover:bg-dbb-hover disabled:opacity-45"
          >
            <ArrowDown className="mr-1 h-3.5 w-3.5" /> {t("Dolů", "Move Down")}
          </button>
        </div>
        <div className="dbb-posuv mt-1 max-h-[210px] min-h-[120px] overflow-auto border border-dbb-linka">
          <table className="w-full" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="bg-dbb-hlavicka text-left">
                <th className={`${bunka} h-[22px] font-normal`}>{t("Název", "Name")}</th>
                <th className={`${bunka} font-normal`}>{t("Typ", "Type")}</th>
                <th className={`${bunka} text-center font-normal`} title={t("Nesmí být prázdné (NOT NULL)", "Not null (NOT NULL)")}>NN</th>
                <th className={`${bunka} text-center font-normal`} title={t("Primární klíč (PRIMARY KEY)", "Primary key (PRIMARY KEY)")}>PK</th>
                <th className={`${bunka} text-center font-normal`} title={t("Automatické číslování (AUTOINCREMENT)", "Autoincrement (AUTOINCREMENT)")}>AI</th>
                <th className={`${bunka} text-center font-normal`} title={t("Jedinečné (UNIQUE)", "Unique (UNIQUE)")}>U</th>
                <th className={`${bunka} font-normal`}>{t("Výchozí", "Default")}</th>
                <th className={`${bunka} font-normal`}>{t("Cizí klíč", "Foreign Key")}</th>
              </tr>
            </thead>
            <tbody>
              {pole.map((p, i) => (
                <tr key={i} onMouseDown={() => nastavVybrane(i)} className={vybrane === i ? "bg-dbb-vyber" : ""}>
                  <td className={bunka}>
                    <input
                      value={p.nazev}
                      onChange={(e) => zmen(i, { nazev: e.target.value })}
                      spellCheck={false}
                      aria-label={t("Název pole", "Field name")}
                      className="h-[22px] w-full min-w-[110px] bg-transparent px-1"
                    />
                  </td>
                  <td className={bunka}>
                    <select
                      value={p.typ}
                      onChange={(e) => zmen(i, { typ: e.target.value })}
                      aria-label={t("Typ pole", "Field type")}
                      className="h-[22px] bg-transparent"
                    >
                      {TYPY.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  {(["nn", "pk", "ai", "u"] as const).map((k) => (
                    <td key={k} className={`${bunka} text-center`}>
                      <input
                        type="checkbox"
                        checked={p[k]}
                        onChange={(e) => zmen(i, { [k]: e.target.checked } as Partial<Pole>)}
                        aria-label={k.toUpperCase()}
                      />
                    </td>
                  ))}
                  <td className={bunka}>
                    <input
                      value={p.vychozi}
                      onChange={(e) => zmen(i, { vychozi: e.target.value })}
                      aria-label={t("Výchozí hodnota", "Default value")}
                      className="h-[22px] w-full min-w-[70px] bg-transparent px-1"
                    />
                  </td>
                  <td className={bunka}>
                    <select
                      value={p.odkaz}
                      onChange={(e) => zmen(i, { odkaz: e.target.value })}
                      aria-label={t("Cizí klíč", "Foreign key")}
                      className="h-[22px] max-w-[160px] bg-transparent"
                    >
                      <option value="">—</option>
                      {cile.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pole.length && <p className="px-2 py-3 text-dbb-slaby">{t("Zatím žádné pole. Přidej první tlačítkem Přidat.", "No fields yet. Add the first one with the Add button.")}</p>}
        </div>
        <pre className="dbb-kod dbb-posuv mt-3 max-h-[140px] overflow-auto border border-dbb-linka bg-dbb-okno px-2 py-1.5">
          {zvyrazni(sql).map((k, i) => (
            <span
              key={i}
              className={
                k.trida
                  ? { slovo: "dbb-slovo", text: "dbb-text-hodnota", cislo: "dbb-cislo", komentar: "dbb-komentar", funkce: "dbb-funkce" }[k.trida]
                  : undefined
              }
            >
              {k.text}
            </span>
          ))}
        </pre>
        {chyba && <p className="mt-2 text-[#a4262c]">{chyba}</p>}
      </div>
      <Paticka>
        <Tlacitko primarni akce={ok}>
          OK
        </Tlacitko>
        <Tlacitko akce={zavrit}>{t("Zrušit", "Cancel")}</Tlacitko>
      </Paticka>
    </Okno>
  );
}

/* ─────────────────────── informace ─────────────────────── */

function OKurzu({ zavrit }: { zavrit: () => void }) {
  if (jeAnglicky()) return <OKurzuAnglicky zavrit={zavrit} />;
  const odst = "mt-2.5";
  return (
    <Okno titulek="O kurzu a pro učitele" zavrit={zavrit} sirka={640}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px] leading-relaxed">
        <p className="text-[14px] font-semibold">Kurz SQL ve virtuálním DB Browseru</p>
        <p className={odst}>
          <b>Co to je.</b> Napodobenina programu DB Browser for SQLite, ve které běží kurz SQL. Lekce 1–13 jsou
          stejné jako na pracovním listu v bance, lekce 14–19 učí práci s programem: strukturu databáze, úpravu dat
          v mřížce, zápis změn do souboru a vlastní tabulku. Navíc je detektivka (lekce 20) a procvičování A a B
          (21 a 22) na jiných datech – obě varianty mají úlohy poskládané stejně, takže se hodí na písemku. Úkoly
          se odškrtávají samy, jakmile výsledek sedí.
        </p>
        <p className={odst}>
          <b>Kolik hodin.</b> Lekce 1–13 jsou jedna hodina u počítačů – průměrná třída 1. ročníku dojde za 45 minut
          do lekce 8 až 10, zbytek je dobrý domácí úkol. Lekce 14–19 jsou druhá hodina. Stačí prohlížeč, nic se
          neinstaluje.
        </p>
        <p className={odst}>
          <b>Jak poznáš, že to umí.</b> Žák otevře <i>Moje výsledky</i> (odkaz nahoře v panelu Kurz SQL): velké
          „Splněno X/19“ a dlaždice lekcí – šedá znamená splněno s pomocí vloženého řešení. Stačí obejít třídu, nebo
          ať pošlou fotku. Kód postupu z téhož okna vlož do <i>Nápověda → Přehled třídy</i> a dostaneš tabulku
          (i do Excelu). Kód je shrnutí, ne důkaz – dá se upravit. Důkazem práce je soubor z lekce 19, který si žák
          stáhne. A spolehlivá je pořád otázka: „Přečti nahlas, co tvůj dotaz dělá.“
        </p>
        <p className={odst}>
          <b>Vlastní úloha.</b> <i>Nápověda → Vytvořit úlohu pro třídu</i>: napíšeš zadání a správný SELECT, program
          z toho udělá odkaz do Teams. Žákovi se po otevření objeví jako „Úloha od učitele“ a kontroluje se sama.
        </p>
        <p className={odst}>
          <b>U projektoru.</b> <i>Nápověda → Režim předvádění</i> program zvětší, řešení jde ukázat hned a tvoje
          ukázka se ukládá zvlášť – nesmíchá se s postupem žáka, který u počítače sedí jindy.
        </p>
        <p className={odst}>
          <b>Když něco rozbijí.</b> Vrátit změny zahodí všechno od posledního zápisu. <i>Nápověda → Obnovit původní
          knihovna.db</i> vrátí soubor do stavu ze začátku kurzu, u procvičování je odkaz „Obnovit původní…“ přímo
          v lekci. <i>Nový žák</i> smaže postup i soubory – když si k počítači sedá někdo další.
        </p>
        <p className={odst}>
          <b>Před první hodinou.</b> Na jednom školním počítači pod žákovským účtem: (1) otevři kurz a spusť dotaz
          v lekci 1 – SQL engine se stahuje z tohoto webu, záložně z cdn.jsdelivr.net; (2) splň úkol a přihlas se na
          jiném počítači v učebně – když tam postup není, žáci si na konci hodiny musí zkopírovat kód postupu do
          Teams; (3) na školní klávesnici napiš &apos; * ; &lt; &gt; = – prváci je hledají;
          (4) zkus promítnout v režimu předvádění, jestli je písmo čitelné ze zadní lavice. Odkaz do Teams posílej
          bez www (karelhlas.vercel.app/sql), s www prohlížeč hlásí chybu certifikátu.
        </p>
        <p className={odst}>
          <b>Konec hodiny.</b> Ve 40. minutě: Nápověda → Moje výsledky → napsat jméno → Kopírovat → vložit do Teams.
          Ukaž to jednou v režimu předvádění, jinak to půlka třídy nestihne.
        </p>
        <p className={odst}>
          Plán hodin, pracovní list a řešení jsou v bance u tématu{" "}
          <a href="/?tema=Datab%C3%A1ze#banka" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
            Databáze
          </a>
          . Začni souborem „Jak toto téma učit“.
        </p>
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          OK
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}

function OKurzuAnglicky({ zavrit }: { zavrit: () => void }) {
  const odst = "mt-2.5";
  return (
    <Okno titulek="About the course / for teachers" zavrit={zavrit} sirka={640}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px] leading-relaxed">
        <p className="text-[14px] font-semibold">SQL course in a virtual DB Browser</p>
        <p className={odst}>
          <b>What it is.</b> A replica of DB Browser for SQLite with an SQL course inside. Lessons 1–13 teach SQL
          from SELECT to changing data, lessons 14–19 teach the program itself: the database structure, editing data in
          the grid, writing changes to the file and a table of your own. On top of that there is a detective story
          (lesson 20) and Practice A and B (21 and 22) on different data – both variants have their tasks built the
          same way, so they work for a test. Tasks tick themselves off as soon as the result is right.
        </p>
        <p className={odst}>
          <b>English version.</b> The program, the lessons and the feedback are in English; the practice data stay in
          Czech (a Czech school library), and the panel shows a glossary of the table and column names. For a CLIL
          lesson that is vocabulary work for free.
        </p>
        <p className={odst}>
          <b>Checking progress.</b> Pupils open <i>My Results</i> (the link at the top of the SQL Course panel): a big
          “Completed X/19” and lesson tiles – grey means completed with the help of an inserted solution. Walk round the
          class, or ask for a photo. Paste the progress codes into <i>Help → Class Overview</i> to get a table (for
          Excel too). A code is a summary, not proof – it can be edited. The proof of work is the file from lesson 19,
          which the pupil downloads. And the old question still works best: “Read out what your query does.”
        </p>
        <p className={odst}>
          <b>Your own task.</b> <i>Help → Create a Task for the Class</i>: write the task and the correct SELECT, and the
          program turns it into a link for Teams. Pupils see it as “Task from your teacher” and it checks itself.
        </p>
        <p className={odst}>
          <b>At the projector.</b> <i>Help → Presentation Mode</i> enlarges the program, lets you show solutions straight
          away and saves your demonstration separately from the progress of the pupil who uses the computer.
        </p>
        <p className={odst}>
          <b>If they break something.</b> Revert Changes throws away everything since the last write. <i>Help → Restore
          Original knihovna.db</i> returns the file to its state at the start of the course; the practice lessons have
          a “Restore original…” link of their own. <i>New Pupil</i> deletes the progress and the files.
        </p>
        <p className={odst}>
          <b>Before the first lesson.</b> On one school computer, under a pupil account: (1) open the course and run a
          query in lesson 1 – the SQL engine is downloaded from this site, with cdn.jsdelivr.net as a fallback;
          (2) complete a task and log in on another computer in the room – if the progress isn&apos;t there, pupils
          need to copy their progress code into Teams at the end of the lesson; (3) type &apos; * ; &lt; &gt; = on
          the school keyboard – first-years look for them; (4) try Presentation Mode on the projector to see whether the
          text is readable from the back row. Send the link without www (karelhlas.vercel.app/sql?z=en) – with www the
          browser reports a certificate error.
        </p>
        <p className={odst}>
          <b>End of the lesson.</b> At minute 40: Help → My Results → type your name → Copy → paste into Teams. Show it
          once in Presentation Mode, otherwise half the class won&apos;t make it.
        </p>
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          OK
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}

function OProgramu({ zavrit }: { zavrit: () => void }) {
  return (
    <Okno titulek={t("O programu DB Browser for SQLite", "About DB Browser for SQLite")} zavrit={zavrit} sirka={480}>
      <div className="flex items-start px-5 py-5 text-[12px] leading-relaxed">
        <IkonaProgramu className="mr-4 h-12 w-12 shrink-0" />
        <div>
          <p className="text-[14px] font-semibold">
            {t("DB Browser for SQLite – výuková napodobenina", "DB Browser for SQLite – a replica for learning")}
          </p>
          <p className="mt-2">
            {t(
              "Tohle není skutečný program. Rozložení oken a názvy odpovídají programu DB Browser for SQLite, pod napodobeninou ale běží opravdové SQLite přímo v prohlížeči. Nic se neinstaluje a databáze ani postup v kurzu se nikam neodesílají – zůstávají v tomhle prohlížeči.",
              "This is not the real program. The window layout and names match DB Browser for SQLite, but underneath the replica runs real SQLite right in your browser. Nothing gets installed, and neither the databases nor your progress are sent anywhere – they stay in this browser.",
            )}
          </p>
          <p className="mt-2">
            {t("Skutečný program je zdarma a open source:", "The real program is free and open source:")}{" "}
            <a href="https://sqlitebrowser.org" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
              sqlitebrowser.org <ExternalLink className="inline h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          OK
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}

/* ─────────────────────────── rozcestník ─────────────────────────── */

export function Dialogy({
  dialog,
  zavrit,
  rozhodnutiUlozit,
  otevritSoubor,
  vytvoritSoubor,
  smazatSoubor,
  nahratSoubor,
}: {
  dialog: Dialog | null;
  zavrit: () => void;
  rozhodnutiUlozit: (volba: "ulozit" | "neukladat" | "zrusit", potom: () => void) => void;
  otevritSoubor: (nazev: string) => void;
  vytvoritSoubor: (nazev: string) => void;
  smazatSoubor: (nazev: string) => void;
  nahratSoubor: (nazev: string, bajty: Uint8Array) => string | null;
}) {
  if (!dialog) return null;
  switch (dialog.druh) {
    case "ulozit":
      return (
        <Okno titulek="DB Browser for SQLite" zavrit={() => rozhodnutiUlozit("zrusit", dialog.potom)}>
          <Zprava ikona={<HelpCircle className="h-8 w-8 text-dbb-akcent" />}>
            {t(`Chcete uložit změny provedené v souboru databáze „${dialog.nazev}“?`, `Do you want to save the changes made to the database file “${dialog.nazev}”?`)}
            {"\n"}
            <span className="text-[11px] text-dbb-slaby">
              {t("Uložit udělá totéž co Soubor → Zapsat změny.", "Save does the same as File → Write Changes.")}
            </span>
          </Zprava>
          <Paticka>
            <Tlacitko primarni prvni akce={() => rozhodnutiUlozit("ulozit", dialog.potom)}>
              {t("Uložit", "Save")}
            </Tlacitko>
            <Tlacitko akce={() => rozhodnutiUlozit("neukladat", dialog.potom)}>{t("Neukládat", "Discard")}</Tlacitko>
            <Tlacitko akce={() => rozhodnutiUlozit("zrusit", dialog.potom)}>{t("Zrušit", "Cancel")}</Tlacitko>
          </Paticka>
        </Okno>
      );
    case "otevrit":
    case "nova":
      return (
        <DialogSouboru
          rezim={dialog.druh === "otevrit" ? "otevrit" : "ulozit"}
          zavrit={zavrit}
          otevrit={otevritSoubor}
          vytvorit={vytvoritSoubor}
          smazat={smazatSoubor}
          nahrat={nahratSoubor}
        />
      );
    case "tabulka":
      return <EditorTabulky zavrit={zavrit} />;
    case "okurzu":
      return <OKurzu zavrit={zavrit} />;
    case "oprogramu":
      return <OProgramu zavrit={zavrit} />;
    case "vysledky":
      return <MojeVysledky zavrit={zavrit} />;
    case "prehled":
      return <PrehledTridy zavrit={zavrit} />;
    case "uloha":
      return <UlohaOdkazem zavrit={zavrit} />;
    case "potvrdit":
      return (
        <Okno titulek={dialog.titulek} zavrit={zavrit}>
          <Zprava ikona={<HelpCircle className="h-8 w-8 text-dbb-akcent" />}>{dialog.text}</Zprava>
          <Paticka>
            <Tlacitko
              primarni
              akce={() => {
                zavrit();
                dialog.akce();
              }}
            >
              {dialog.tlacitko}
            </Tlacitko>
            <Tlacitko
              prvni
              akce={() => {
                zavrit();
                if (dialog.priZruseni) dialog.priZruseni();
              }}
            >
              {dialog.zrusit || t("Zrušit", "Cancel")}
            </Tlacitko>
          </Paticka>
        </Okno>
      );
    case "chybaZapisu":
      return (
        <Okno titulek={t("Změny se nepodařilo uložit", "The changes could not be saved")} zavrit={zavrit}>
          <Zprava ikona={<Info className="h-8 w-8 text-[#c42b1c]" />}>
            {t(
              `Soubor ${dialog.nazev} se nepodařilo uložit v prohlížeči – úložiště je plné, nebo ho prohlížeč nedovolí (třeba v anonymním okně). Změny v programu zůstanou, dokud stránku nezavřeš. Stáhni si soubor do počítače, ať o ně nepřijdeš.`,
              `The file ${dialog.nazev} could not be saved in the browser – the storage is full, or the browser doesn't allow it (in a private window, for example). The changes stay in the program until you close the page. Download the file to your computer so you don't lose them.`,
            )}
          </Zprava>
          <Paticka>
            <Tlacitko primarni prvni akce={() => stahni(dialog.nazev, dialog.bajty)}>
              {t("Stáhnout soubor", "Download the File")}
            </Tlacitko>
            <Tlacitko akce={zavrit}>{t("Zavřít", "Close")}</Tlacitko>
          </Paticka>
        </Okno>
      );
    case "zprava":
      return (
        <Okno titulek={dialog.titulek} zavrit={zavrit}>
          <Zprava ikona={<Info className="h-8 w-8 text-dbb-akcent" />}>{dialog.text}</Zprava>
          <Paticka>
            <Tlacitko primarni prvni akce={zavrit}>
              OK
            </Tlacitko>
          </Paticka>
        </Okno>
      );
    default:
      return null;
  }
}
