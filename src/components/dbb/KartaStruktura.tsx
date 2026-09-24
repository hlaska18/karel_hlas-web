"use client";

/**
 * Karta Struktura databáze – strom tabulek se sloupci, typy a schématem.
 * Rozbalení tabulky hlásí kurzu (lekce 14 na to čeká).
 */

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Table2, KeyRound, Columns3, Trash2, Printer, Plus, Pencil } from "lucide-react";
import { useDbb, precti, uvoz } from "@/components/dbb/kontext";
import { tabulky } from "@/lib/dbb/prikazy";
import type { SqlDbSoubor } from "@/lib/sqljs";
import { t } from "@/lib/dbb/jazyk";

export type Sloupec = { nazev: string; typ: string; notNull: boolean; pk: boolean; odkaz?: string };
export type TabulkaInfo = { nazev: string; sql: string; sloupce: Sloupec[] };

/** Tabulky otevřené databáze i se sloupci – sdílí je Struktura a Schéma DB. */
export function nactiStrukturu(db: SqlDbSoubor | null): {
  tabulky: TabulkaInfo[];
  indexy: string[];
  pohledy: string[];
  spoustece: string[];
} {
  if (!db) return { tabulky: [], indexy: [], pohledy: [], spoustece: [] };
  const master = precti(db, "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name");
  const radky = master ? master.values : [];
  const podle = (typ: string) => radky.filter((r) => r[0] === typ).map((r) => String(r[1]));
  const vysledek: TabulkaInfo[] = tabulky(db).map((nazev) => {
    const sqlRadek = radky.find((r) => r[0] === "table" && r[1] === nazev);
    const info = precti(db, `PRAGMA table_info(${uvoz(nazev)})`);
    const klice = precti(db, `PRAGMA foreign_key_list(${uvoz(nazev)})`);
    const odkazy: Record<string, string> = {};
    if (klice) klice.values.forEach((k) => (odkazy[String(k[3])] = `${k[2]}(${k[4] === null ? "" : k[4]})`));
    return {
      nazev,
      sql: sqlRadek ? String(sqlRadek[2]) : "",
      sloupce: info
        ? info.values.map((v) => ({
            nazev: String(v[1]),
            typ: String(v[2] || ""),
            notNull: Number(v[3]) === 1,
            pk: Number(v[5]) > 0,
            odkaz: odkazy[String(v[1])],
          }))
        : [],
    };
  });
  return { tabulky: vysledek, indexy: podle("index"), pohledy: podle("view"), spoustece: podle("trigger") };
}

/** Definice sloupce, jak ji ukazuje sloupec Schéma: "rok" INTEGER NOT NULL. */
export function schemaSloupce(s: Sloupec): string {
  let t = `${uvoz(s.nazev)} ${s.typ}`.trim();
  if (s.notNull) t += " NOT NULL";
  if (s.odkaz) t += ` REFERENCES ${s.odkaz}`;
  return t;
}

function Tlacitko({ ikona, text, akce, zakazano }: { ikona: ReactNode; text: string; akce?: () => void; zakazano?: boolean }) {
  return (
    <button
      type="button"
      onClick={akce}
      disabled={zakazano || !akce}
      className="flex h-[24px] items-center rounded-[3px] px-1.5 text-[12px] enabled:hover:bg-dbb-hover disabled:opacity-45"
    >
      <span className="mr-1.5 flex h-4 w-4 items-center justify-center">{ikona}</span>
      {text}
    </button>
  );
}

export function KartaStruktura() {
  const api = useDbb();
  const [rozbalene, nastavRozbalene] = useState<Set<string>>(new Set(["#tabulky"]));
  const [vybrana, nastavVybranou] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => nactiStrukturu(api.db()), [api.verze, api.otevrena]);

  const prepni = (klic: string) => {
    const otevrit = !rozbalene.has(klic);
    if (otevrit && !klic.startsWith("#")) api.udalost(`strom:${klic}`);
    nastavRozbalene((r) => {
      const n = new Set(r);
      if (otevrit) n.add(klic);
      else n.delete(klic);
      return n;
    });
  };

  // Obyčejná funkce, ne komponenta: komponenta definovaná uvnitř by se po
  // každém kliknutí vytvořila znovu a klik na šipku by se ztratil.
  const radek = ({
    uroven,
    klic,
    ikona,
    nazev,
    typ,
    schema,
    rozbalitelny,
    oznacitelny,
  }: {
    uroven: number;
    klic: string;
    ikona?: ReactNode;
    nazev: string;
    typ?: string;
    schema?: string;
    rozbalitelny?: boolean;
    oznacitelny?: boolean;
  }) => {
    const otevreny = rozbalene.has(klic);
    const oznaceny = oznacitelny && vybrana === klic;
    return (
      <tr
        key={klic}
        onMouseDown={() => oznacitelny && nastavVybranou(klic)}
        onDoubleClick={() => rozbalitelny && prepni(klic)}
        className={oznaceny ? "bg-dbb-vyber" : "hover:bg-dbb-hover"}
      >
        <td className="h-[21px] whitespace-nowrap pr-3" style={{ paddingLeft: 4 + uroven * 18 }}>
          <span className="inline-flex items-center">
            {rozbalitelny ? (
              <button
                type="button"
                aria-label={otevreny ? `Sbalit ${nazev}` : `Rozbalit ${nazev}`}
                aria-expanded={otevreny}
                onClick={() => prepni(klic)}
                className="mr-1 flex h-4 w-4 items-center justify-center text-dbb-slaby hover:text-dbb-text"
              >
                {otevreny ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="mr-1 inline-block w-4" />
            )}
            {ikona && <span className="mr-1.5 flex h-4 w-4 items-center justify-center">{ikona}</span>}
            {nazev}
          </span>
        </td>
        <td className="whitespace-nowrap pr-3 text-dbb-slaby">{typ}</td>
        <td className="max-w-0 truncate whitespace-nowrap pr-2 text-dbb-slaby">{schema}</td>
      </tr>
    );
  };

  if (!api.otevrena) {
    return <div className="h-full bg-dbb-povrch" />;
  }

  const radky: ReactNode[] = [];
  radky.push(
    radek({ uroven: 0, klic: "#tabulky", nazev: `${t("Tabulky", "Tables")} (${s.tabulky.length})`, rozbalitelny: true }),
  );
  if (rozbalene.has("#tabulky")) {
    s.tabulky.forEach((t) => {
      radky.push(
        radek({
          uroven: 1,
          klic: t.nazev,
          ikona: <Table2 className="h-3.5 w-3.5 text-[#2e75b6]" />,
          nazev: t.nazev,
          schema: t.sql.replace(/\s+/g, " "),
          rozbalitelny: true,
          oznacitelny: true,
        }),
      );
      if (rozbalene.has(t.nazev)) {
        t.sloupce.forEach((c) =>
          radky.push(
            radek({
              uroven: 2,
              klic: `${t.nazev}.${c.nazev}`,
              ikona: c.pk ? (
                <KeyRound className="h-3.5 w-3.5 text-[#c9901a]" />
              ) : (
                <Columns3 className="h-3.5 w-3.5 text-dbb-slaby" />
              ),
              nazev: c.nazev,
              typ: c.typ,
              schema: schemaSloupce(c),
            }),
          ),
        );
      }
    });
  }
  (
    [
      ["#indexy", t("Indexy", "Indices"), s.indexy],
      ["#pohledy", t("Pohledy", "Views"), s.pohledy],
      ["#spoustece", t("Spouštěče", "Triggers"), s.spoustece],
    ] as [string, string, string[]][]
  ).forEach(([klic, nazev, polozky]) => {
    radky.push(
      radek({ uroven: 0, klic, nazev: `${nazev} (${polozky.length})`, rozbalitelny: polozky.length > 0 }),
    );
    if (rozbalene.has(klic)) {
      polozky.forEach((p) => radky.push(radek({ uroven: 1, klic: `${klic}.${p}`, nazev: p })));
    }
  });

  const vybranaTabulka = vybrana && s.tabulky.some((t) => t.nazev === vybrana) ? vybrana : null;

  return (
    <div className="flex h-full flex-col p-1.5">
      <div className="flex h-[28px] shrink-0 items-center">
        <Tlacitko
          ikona={<Plus className="h-4 w-4 text-[#2e9d4f]" />}
          text={t("Vytvořit tabulku", "Create Table")}
          akce={() => api.otevritDialog({ druh: "tabulka" })}
        />
        <Tlacitko ikona={<Plus className="h-4 w-4" />} text={t("Vytvořit index", "Create Index")} zakazano />
        <Tlacitko ikona={<Pencil className="h-4 w-4" />} text={t("Upravit tabulku", "Modify Table")} zakazano />
        <Tlacitko
          ikona={<Trash2 className="h-4 w-4 text-[#c42b1c]" />}
          text={t("Smazat tabulku", "Delete Table")}
          zakazano={!vybranaTabulka}
          akce={
            vybranaTabulka
              ? () =>
                  api.otevritDialog({
                    druh: "potvrdit",
                    titulek: t("Smazat tabulku", "Delete Table"),
                    text: t(
                      `Opravdu chceš smazat tabulku „${vybranaTabulka}“ i se všemi jejími daty? Dokud změny nezapíšeš, jde to vrátit tlačítkem Vrátit změny.`,
                      `Are you sure you want to delete the table “${vybranaTabulka}” with all its data? Until you write the changes, Revert Changes can undo it.`,
                    ),
                    tlacitko: t("Smazat", "Delete"),
                    akce: () => {
                      const chyba = api.provedAplikaci(`DROP TABLE ${uvoz(vybranaTabulka)};`);
                      if (chyba) api.otevritDialog({ druh: "zprava", titulek: t("Smazat tabulku", "Delete Table"), text: chyba });
                      nastavVybranou(null);
                    },
                  })
              : undefined
          }
        />
        <Tlacitko ikona={<Printer className="h-4 w-4" />} text={t("Tisk", "Print")} zakazano />
      </div>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto border border-dbb-linka bg-dbb-povrch">
        <table className="w-full table-fixed text-[12px]" style={{ borderSpacing: 0 }}>
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "14%" }} />
            <col />
          </colgroup>
          <thead>
            <tr className="text-left">
              <th className="sticky top-0 h-[22px] border-b border-r border-dbb-mrizka bg-dbb-hlavicka px-2 font-normal">{t("Název", "Name")}</th>
              <th className="sticky top-0 border-b border-r border-dbb-mrizka bg-dbb-hlavicka px-2 font-normal">{t("Typ", "Type")}</th>
              <th className="sticky top-0 border-b border-dbb-mrizka bg-dbb-hlavicka px-2 font-normal">{t("Schéma", "Schema")}</th>
            </tr>
          </thead>
          <tbody>{radky}</tbody>
        </table>
      </div>
    </div>
  );
}
