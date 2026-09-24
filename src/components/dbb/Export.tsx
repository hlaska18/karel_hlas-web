"use client";

/**
 * Export do CSV – tabulka nebo výsledek posledního dotazu, jako Soubor →
 * Export → Tabulka do souboru CSV ve skutečném DB Browseru. Výchozí
 * nastavení sedí na český Excel (středník, desetinná čárka, UTF-8 s BOM),
 * aby šel výsledek rovnou otevřít dvojklikem.
 */

import { useMemo, useState } from "react";
import { useDbb, precti, uvoz } from "@/components/dbb/kontext";
import { Okno, Tlacitko, Paticka } from "@/components/dbb/okna";
import { t } from "@/lib/dbb/jazyk";
import { tabulky } from "@/lib/dbb/prikazy";
import { stahni } from "@/lib/dbb/stahni";
import { doCsv, csvKeStazeni, EXPORT_PRO_EXCEL, type Oddelovac } from "@/lib/dbb/csv";

/** Zdroj „výsledek posledního dotazu“ v seznamu – tabulka se tak jmenovat nemůže. */
const VYSLEDEK = "\u0000vysledek";

const POLE = "h-[26px] border border-dbb-linka bg-dbb-povrch px-1.5 text-[12px] focus:border-dbb-akcent";

export function ExportCsv({ zdroj, zavrit }: { zdroj?: "vysledek" | string; zavrit: () => void }) {
  const api = useDbb();
  const db = api.db();
  const seznam = db ? tabulky(db) : [];
  const maVysledek = !!(api.vystup && api.vystup.vysledek && !api.vystup.nahled);
  const [vyber, nastavVyber] = useState(() =>
    zdroj === "vysledek" && maVysledek ? VYSLEDEK : zdroj && seznam.indexOf(zdroj) !== -1 ? zdroj : seznam[0] || VYSLEDEK,
  );
  const [oddelovac, nastavOddelovac] = useState<Oddelovac>(EXPORT_PRO_EXCEL.oddelovac);
  const [desetinnaCarka, nastavDesetinnouCarku] = useState(EXPORT_PRO_EXCEL.desetinnaCarka);
  const [hlavicka, nastavHlavicku] = useState(EXPORT_PRO_EXCEL.hlavicka);

  const data = useMemo(() => {
    if (vyber === VYSLEDEK) return api.vystup && api.vystup.vysledek ? api.vystup.vysledek : null;
    return precti(db, `SELECT * FROM ${uvoz(vyber)};`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vyber, api.verze]);
  const text = data ? doCsv(data.columns, data.values, { oddelovac, desetinnaCarka, hlavicka }) : "";
  const nazevSouboru = vyber === VYSLEDEK ? t("vysledek-dotazu.csv", "query-result.csv") : `${vyber}.csv`;

  const stahnout = () => {
    if (!data) return;
    stahni(nazevSouboru, csvKeStazeni(text), "text/csv");
    api.udalost(`export:${vyber === VYSLEDEK ? "vysledek" : vyber}`);
    api.status(
      t(
        `Soubor ${nazevSouboru} je ve složce Stažené soubory tvého počítače – otevři ho v Excelu.`,
        `The file ${nazevSouboru} is in your computer's Downloads folder – open it in Excel.`,
      ),
    );
    zavrit();
  };

  const nahled = text.split("\r\n").slice(0, 7).join("\n");

  return (
    <Okno titulek={t("Exportovat do CSV", "Export to CSV File")} zavrit={zavrit} sirka={640}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-4 py-3 text-[12px]">
        <label className="flex items-center">
          <span className="mr-2 w-[90px] shrink-0">{t("Co exportovat:", "Export:")}</span>
          <select value={vyber} onChange={(e) => nastavVyber(e.target.value)} className={`${POLE} min-w-[220px] py-0`}>
            {maVysledek && <option value={VYSLEDEK}>{t("výsledek posledního dotazu", "result of the last query")}</option>}
            {seznam.map((s) => (
              <option key={s} value={s}>
                {t(`tabulka ${s}`, `table ${s}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex flex-wrap items-center">
          <label className="mb-2 mr-5 flex items-center">
            <span className="mr-2 w-[90px] shrink-0">{t("Oddělovač:", "Separator:")}</span>
            <select
              value={oddelovac}
              onChange={(e) => {
                const o = e.target.value as Oddelovac;
                nastavOddelovac(o);
                // Desetinná čárka jen se středníkem – s čárkou by se sloupce slily.
                nastavDesetinnouCarku(o === ";");
              }}
              className={`${POLE} py-0`}
            >
              <option value=";">{t("středník ; (český Excel)", "semicolon ; (Czech Excel)")}</option>
              <option value=",">{t("čárka ,", "comma ,")}</option>
              <option value={"\t"}>{t("tabulátor", "tab")}</option>
            </select>
          </label>
          <label className="mb-2 mr-5 flex items-center">
            <input
              type="checkbox"
              checked={desetinnaCarka}
              onChange={(e) => nastavDesetinnouCarku(e.target.checked)}
              className="mr-1.5"
            />
            {t("Desetinná čárka (18,5)", "Decimal comma (18,5)")}
          </label>
          <label className="mb-2 flex items-center">
            <input type="checkbox" checked={hlavicka} onChange={(e) => nastavHlavicku(e.target.checked)} className="mr-1.5" />
            {t("Názvy sloupců v prvním řádku", "Column names in the first line")}
          </label>
        </div>
        <p className="text-dbb-slaby">
          {data
            ? t(
                `Náhled souboru ${nazevSouboru} – ${data.values.length} řádků.`,
                `Preview of ${nazevSouboru} – ${data.values.length} rows.`,
              )
            : t("Není co exportovat.", "There is nothing to export.")}
        </p>
        <pre className="dbb-kod dbb-posuv mt-1 max-h-[180px] overflow-auto border border-dbb-mrizka bg-dbb-okno px-2 py-1.5 text-[11px]">
          {nahled}
        </pre>
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={stahnout} zakazano={!data}>
          {t("Stáhnout", "Download")}
        </Tlacitko>
        <Tlacitko akce={zavrit}>{t("Zrušit", "Cancel")}</Tlacitko>
      </Paticka>
    </Okno>
  );
}
