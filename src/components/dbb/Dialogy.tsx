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
    cteni.onerror = () => nastavChybu("Soubor se nepodařilo přečíst.");
    cteni.readAsArrayBuffer(soubor);
  };

  const potvrdit = (zadano?: string) => {
    const text = zadano !== undefined ? zadano : nazev;
    nastavChybu(null);
    if (rezim === "otevrit") {
      const n = text.trim();
      if (!n) return nastavChybu("Vyber soubor, který chceš otevřít.");
      if (!api.disk[n]) return nastavChybu(`Soubor „${n}“ ve složce není. Zkontroluj název.`);
      otevrit(n);
      return;
    }
    const u = upravNazev(text);
    if ("chyba" in u) return nastavChybu(u.chyba);
    if (u.nazev.toLowerCase() === KNIHOVNA) {
      return nastavChybu("Soubor knihovna.db potřebuje kurz – zvol pro svou databázi jiný název.");
    }
    if (api.disk[u.nazev]) {
      nastavNahradit(u.nazev);
      return;
    }
    if (soubory.length >= MAX_SOUBORU) {
      return nastavChybu("Ve složce je moc souborů. Nějaký starý smaž (pravým tlačítkem → Odstranit).");
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
      titulek={rezim === "otevrit" ? "Vyberte soubor databáze" : "Vyberte název souboru pro novou databázi"}
      zavrit={zavrit}
      sirka={720}
    >
      <div className="flex shrink-0 items-center border-b border-dbb-linka px-3 py-2 text-[12px]">
        <div className="flex h-[26px] flex-1 items-center border border-dbb-linka px-2">
          <Monitor className="mr-1.5 h-3.5 w-3.5 text-dbb-slaby" /> Tento počítač <span className="mx-1.5 text-dbb-slaby">›</span>
          Stažené soubory
        </div>
        <div className="ml-2 flex h-[26px] w-[180px] items-center border border-dbb-linka px-2 text-dbb-slaby">Hledat: Stažené soubory</div>
      </div>
      <div className="flex min-h-[250px] flex-1">
        <div className="w-[170px] shrink-0 border-r border-dbb-linka py-1">
          {nav(<Monitor className="h-3.5 w-3.5" />, "Plocha")}
          {nav(<Download className="h-3.5 w-3.5 text-[#2e75b6]" />, "Stažené soubory", true)}
          {nav(<Folder className="h-3.5 w-3.5 text-[#c9901a]" />, "Dokumenty")}
          {nav(<Folder className="h-3.5 w-3.5 text-[#c9901a]" />, "Obrázky")}
          {nav(<HardDrive className="h-3.5 w-3.5" />, "Tento počítač")}
        </div>
        <div className="dbb-posuv min-w-0 flex-1 overflow-auto">
          <table className="w-full text-[12px]" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="text-left text-dbb-slaby">
                <th className="h-[24px] border-b border-dbb-mrizka px-3 font-normal">Název</th>
                <th className="border-b border-dbb-mrizka px-3 font-normal">Datum změny</th>
                <th className="border-b border-dbb-mrizka px-3 font-normal">Typ</th>
                <th className="border-b border-dbb-mrizka px-3 text-right font-normal">Velikost</th>
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
                  <td className="whitespace-nowrap px-3 text-dbb-slaby">Soubor DB</td>
                  <td className="whitespace-nowrap px-3 text-right text-dbb-slaby">{velikost(api.disk[s].bajty.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mazani && (
            <div className="m-3 border border-dbb-linka bg-dbb-okno px-3 py-2 text-[12px]">
              Odstranit soubor <b>{mazani}</b>? Zpátky nepůjde vrátit.
              <span className="ml-2 inline-flex">
                <Tlacitko
                  akce={() => {
                    if (api.otevrena === mazani) {
                      nastavChybu("Otevřený soubor nejde odstranit – nejdřív ho zavři.");
                    } else {
                      smazat(mazani);
                      nastavVybrany(null);
                      nastavNazev("");
                    }
                    nastavMazani(null);
                  }}
                >
                  Odstranit
                </Tlacitko>
                <Tlacitko akce={() => nastavMazani(null)}>Ne</Tlacitko>
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-dbb-linka bg-dbb-okno px-4 py-3 text-[12px]">
        <div className="flex items-center">
          <label htmlFor="dbb-nazev-souboru" className="w-[110px] shrink-0 text-right pr-2">
            Název souboru:
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
            aria-label="Typ souboru"
            className="ml-2 h-[24px] w-[230px] border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            <option>Soubory databáze SQLite (*.db *.sqlite)</option>
          </select>
        </div>
        {chyba && <p className="mt-2 pl-[110px] text-[#a4262c]">{chyba}</p>}
        {nahradit && (
          <p className="mt-2 pl-[110px]">
            Soubor <b>{nahradit}</b> už existuje. Chceš ho nahradit prázdnou databází?
            <span className="ml-2 inline-flex">
              <Tlacitko akce={() => vytvorit(nahradit)}>Ano</Tlacitko>
              <Tlacitko akce={() => nastavNahradit(null)}>Ne</Tlacitko>
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
                Z tohoto počítače…
              </button>
            </span>
          )}
          <Tlacitko primarni akce={() => potvrdit()}>
            {rezim === "otevrit" ? "Otevřít" : "Uložit"}
          </Tlacitko>
          <Tlacitko akce={zavrit}>Zrušit</Tlacitko>
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
    if (!n) return nastavChybu("Napiš název tabulky.");
    if (!pole.length) return nastavChybu("Tabulka musí mít aspoň jedno pole – přidej ho tlačítkem Přidat.");
    const nazvy = pole.map((p) => p.nazev.trim().toLowerCase());
    if (nazvy.some((x) => !x)) return nastavChybu("Každé pole musí mít název.");
    if (nazvy.some((x, i) => nazvy.indexOf(x) !== i)) return nastavChybu("Dvě pole nesmí mít stejný název.");
    const c = api.provedAplikaci(sql);
    if (c) return nastavChybu(c);
    api.udalost("tabulka-z-dialogu");
    api.status(`Tabulka ${n} byla vytvořena. Nezapomeň změny zapsat.`);
    zavrit();
  };

  const bunka = "border-b border-r border-dbb-mrizka px-1";
  return (
    <Okno titulek="Upravit definici tabulky" zavrit={zavrit} sirka={820}>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 text-[12px]">
        <label className="flex items-center">
          <span className="mr-2 w-[60px]">Tabulka</span>
          <input
            value={nazev}
            onChange={(e) => nastavNazev(e.target.value)}
            spellCheck={false}
            placeholder="název tabulky"
            className="h-[24px] flex-1 border border-dbb-linka px-1.5 focus:border-dbb-akcent"
          />
        </label>
        <p className="mt-3 font-semibold">Pole</p>
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
            <Plus className="mr-1 h-3.5 w-3.5 text-[#2e9d4f]" /> Přidat
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
            <Minus className="mr-1 h-3.5 w-3.5 text-[#c42b1c]" /> Odebrat
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
            <ArrowUp className="mr-1 h-3.5 w-3.5" /> Nahoru
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
            <ArrowDown className="mr-1 h-3.5 w-3.5" /> Dolů
          </button>
        </div>
        <div className="dbb-posuv mt-1 max-h-[210px] min-h-[120px] overflow-auto border border-dbb-linka">
          <table className="w-full" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="bg-dbb-hlavicka text-left">
                <th className={`${bunka} h-[22px] font-normal`}>Název</th>
                <th className={`${bunka} font-normal`}>Typ</th>
                <th className={`${bunka} text-center font-normal`} title="Nesmí být prázdné (NOT NULL)">NN</th>
                <th className={`${bunka} text-center font-normal`} title="Primární klíč (PRIMARY KEY)">PK</th>
                <th className={`${bunka} text-center font-normal`} title="Automatické číslování (AUTOINCREMENT)">AI</th>
                <th className={`${bunka} text-center font-normal`} title="Jedinečné (UNIQUE)">U</th>
                <th className={`${bunka} font-normal`}>Výchozí</th>
                <th className={`${bunka} font-normal`}>Cizí klíč</th>
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
                      aria-label="Název pole"
                      className="h-[22px] w-full min-w-[110px] bg-transparent px-1"
                    />
                  </td>
                  <td className={bunka}>
                    <select
                      value={p.typ}
                      onChange={(e) => zmen(i, { typ: e.target.value })}
                      aria-label="Typ pole"
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
                      aria-label="Výchozí hodnota"
                      className="h-[22px] w-full min-w-[70px] bg-transparent px-1"
                    />
                  </td>
                  <td className={bunka}>
                    <select
                      value={p.odkaz}
                      onChange={(e) => zmen(i, { odkaz: e.target.value })}
                      aria-label="Cizí klíč"
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
          {!pole.length && <p className="px-2 py-3 text-dbb-slaby">Zatím žádné pole. Přidej první tlačítkem Přidat.</p>}
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
        <Tlacitko akce={zavrit}>Zrušit</Tlacitko>
      </Paticka>
    </Okno>
  );
}

/* ─────────────────────── informace ─────────────────────── */

function OKurzu({ zavrit }: { zavrit: () => void }) {
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
          <b>Před první hodinou.</b> Na jednom školním počítači a v prohlížeči, který žáci používají: (1) otevři
          kurz a spusť dotaz v lekci 1 – SQL engine se stahuje z internetu, školní síť ho nesmí blokovat; (2) splň
          úkol, odhlas se a přihlas znovu – když se postup ztratí, profil se maže a žáci si na konci hodiny musí
          opsat kód postupu nebo stáhnout soubor; (3) zkus promítnout v režimu předvádění, jestli je písmo čitelné
          ze zadní lavice.
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

function OProgramu({ zavrit }: { zavrit: () => void }) {
  return (
    <Okno titulek="O programu DB Browser for SQLite" zavrit={zavrit} sirka={480}>
      <div className="flex items-start px-5 py-5 text-[12px] leading-relaxed">
        <IkonaProgramu className="mr-4 h-12 w-12 shrink-0" />
        <div>
          <p className="text-[14px] font-semibold">DB Browser for SQLite – výuková napodobenina</p>
          <p className="mt-2">
            Tohle není skutečný program. Rozložení oken a názvy odpovídají programu DB Browser for SQLite, pod
            napodobeninou ale běží opravdové SQLite přímo v prohlížeči. Nic se neinstaluje a databáze ani postup
            v kurzu se nikam neodesílají – zůstávají v tomhle prohlížeči.
          </p>
          <p className="mt-2">
            Skutečný program je zdarma a open source:{" "}
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
            Chcete uložit změny provedené v souboru databáze „{dialog.nazev}“?
            {"\n"}
            <span className="text-[11px] text-dbb-slaby">Uložit udělá totéž co Soubor → Zapsat změny.</span>
          </Zprava>
          <Paticka>
            <Tlacitko primarni prvni akce={() => rozhodnutiUlozit("ulozit", dialog.potom)}>
              Uložit
            </Tlacitko>
            <Tlacitko akce={() => rozhodnutiUlozit("neukladat", dialog.potom)}>Neukládat</Tlacitko>
            <Tlacitko akce={() => rozhodnutiUlozit("zrusit", dialog.potom)}>Zrušit</Tlacitko>
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
              {dialog.zrusit || "Zrušit"}
            </Tlacitko>
          </Paticka>
        </Okno>
      );
    case "chybaZapisu":
      return (
        <Okno titulek="Změny se nepodařilo uložit" zavrit={zavrit}>
          <Zprava ikona={<Info className="h-8 w-8 text-[#c42b1c]" />}>
            Soubor {dialog.nazev} se nepodařilo uložit v prohlížeči – úložiště je plné, nebo ho prohlížeč nedovolí
            (třeba v anonymním okně). Změny v programu zůstanou, dokud stránku nezavřeš. Stáhni si soubor do
            počítače, ať o ně nepřijdeš.
          </Zprava>
          <Paticka>
            <Tlacitko primarni prvni akce={() => stahni(dialog.nazev, dialog.bajty)}>
              Stáhnout soubor
            </Tlacitko>
            <Tlacitko akce={zavrit}>Zavřít</Tlacitko>
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
