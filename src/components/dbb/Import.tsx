"use client";

/**
 * Soubory ze skutečného počítače: tabulka z CSV (i z Excelu přes Uložit
 * jako CSV) a databáze ze souboru SQL – jako Soubor → Import ve skutečném
 * DB Browseru. Databázi .db nahrává rovnou `nahrajSoubor` v DbBrowseru.
 */

import { useMemo, useState } from "react";
import { useDbb } from "@/components/dbb/kontext";
import { Okno, Tlacitko, Paticka } from "@/components/dbb/okna";
import { t } from "@/lib/dbb/jazyk";
import { upravNazev, volnyNazev } from "@/lib/dbb/soubory";
import {
  dekodujText,
  odhadniOddelovac,
  parsujCsv,
  pripravTabulku,
  nazevProSql,
  MAX_RADKU_CSV,
  type Oddelovac,
} from "@/lib/dbb/csv";

const POLE = "h-[26px] border border-dbb-linka bg-dbb-povrch px-1.5 text-[12px] focus:border-dbb-akcent";

export function ImportCsv({ soubor, bajty, zavrit }: { soubor: string; bajty: Uint8Array; zavrit: () => void }) {
  const api = useDbb();
  const { text, kodovani } = useMemo(() => dekodujText(bajty), [bajty]);
  const [oddelovac, nastavOddelovac] = useState<Oddelovac>(() => odhadniOddelovac(text));
  const [hlavicka, nastavHlavicku] = useState(true);
  const [nazev, nastavNazev] = useState(() => nazevProSql(soubor.replace(/\.[^.]*$/, ""), "tabulka"));
  const [chyba, nastavChybu] = useState<string | null>(null);

  const radky = useMemo(() => parsujCsv(text, oddelovac), [text, oddelovac]);
  const tabulka = useMemo(() => pripravTabulku(radky, hlavicka), [radky, hlavicka]);
  const moc = tabulka.data.length > MAX_RADKU_CSV;

  const importovat = () => {
    const n = nazevProSql(nazev, "");
    if (!n) return nastavChybu(t("Napiš název tabulky.", "Type a table name."));
    if (!tabulka.sloupce.length || !tabulka.data.length) {
      return nastavChybu(t("V souboru nejsou žádná data.", "The file contains no data."));
    }
    if (moc) {
      return nastavChybu(
        t(`Řádků je moc – do prohlížeče se vejde nejvýš ${MAX_RADKU_CSV}.`, `Too many rows – the browser can hold at most ${MAX_RADKU_CSV}.`),
      );
    }
    const c = api.importujTabulku(n, tabulka);
    if (c) nastavChybu(c);
    else zavrit();
  };

  return (
    <Okno titulek={t("Importovat tabulku z CSV", "Import Table from CSV File")} zavrit={zavrit} sirka={760}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-4 py-3 text-[12px]">
        <p className="text-dbb-slaby">
          {t("Soubor", "File")} <b className="text-dbb-text">{soubor}</b> · {t("kódování", "encoding")} {kodovani} ·{" "}
          {t(
            `tabulka se vytvoří v otevřené databázi ${api.otevrena || ""}.`,
            `the table will be created in the open database ${api.otevrena || ""}.`,
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center">
          <label className="mb-2 mr-5 flex items-center">
            <span className="mr-2">{t("Název tabulky:", "Table name:")}</span>
            <input
              value={nazev}
              onChange={(e) => {
                nastavNazev(e.target.value);
                nastavChybu(null);
              }}
              spellCheck={false}
              className={`${POLE} w-[200px]`}
            />
          </label>
          <label className="mb-2 mr-5 flex items-center">
            <span className="mr-2">{t("Oddělovač:", "Separator:")}</span>
            <select value={oddelovac} onChange={(e) => nastavOddelovac(e.target.value as Oddelovac)} className={`${POLE} py-0`}>
              <option value=";">{t("středník ;", "semicolon ;")}</option>
              <option value=",">{t("čárka ,", "comma ,")}</option>
              <option value={"\t"}>{t("tabulátor", "tab")}</option>
            </select>
          </label>
          <label className="mb-2 flex items-center">
            <input type="checkbox" checked={hlavicka} onChange={(e) => nastavHlavicku(e.target.checked)} className="mr-1.5" />
            {t("První řádek jsou názvy sloupců", "Column names in the first line")}
          </label>
        </div>
        <p className="text-dbb-slaby">
          {t(
            `Náhled – ${tabulka.data.length} řádků. Názvy sloupců jsou upravené bez háčků a mezer, ať jdou psát v SQL; typ se pozná podle hodnot.`,
            `Preview – ${tabulka.data.length} rows. Column names are adjusted without accents and spaces so they can be typed in SQL; the type is guessed from the values.`,
          )}
        </p>
        <div className="dbb-posuv mt-1 max-h-[220px] overflow-auto border border-dbb-mrizka">
          <table className="w-full text-[11px]" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                {tabulka.sloupce.map((s, i) => (
                  <th key={i} className="sticky top-0 border-b border-dbb-mrizka bg-dbb-hlavicka px-2 py-0.5 text-left font-normal">
                    <span className="font-semibold">{s}</span> <span className="text-dbb-slaby">{tabulka.typy[i]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabulka.data.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  {r.map((b, j) => (
                    <td key={j} className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-0.5">
                      {b === null ? <i className="text-dbb-slaby">NULL</i> : String(b)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {chyba && <p className="mt-2 text-[#a4262c]">{chyba}</p>}
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={importovat} zakazano={moc || !tabulka.data.length}>
          {t("Importovat", "Import")}
        </Tlacitko>
        <Tlacitko akce={zavrit}>{t("Zrušit", "Cancel")}</Tlacitko>
      </Paticka>
    </Okno>
  );
}

export function ImportSql({ soubor, text, zavrit }: { soubor: string; text: string; zavrit: () => void }) {
  const api = useDbb();
  // Volný název – knihovna.sql nesmí přepsat knihovna.db, se kterou pracuje kurz.
  const [nazev, nastavNazev] = useState(() => volnyNazev(`${soubor.replace(/\.[^.]*$/, "")}.db`, Object.keys(api.disk)));
  const [chyba, nastavChybu] = useState<string | null>(null);

  const importovat = () => {
    const u = upravNazev(nazev);
    if ("chyba" in u) return nastavChybu(u.chyba);
    const c = api.importujSql(u.nazev, text);
    if (c) nastavChybu(c);
    else zavrit();
  };

  return (
    <Okno titulek={t("Importovat databázi ze souboru SQL", "Import Database from SQL File")} zavrit={zavrit} sirka={640}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-4 py-3 text-[12px]">
        <p>
          {t(
            `Příkazy ze souboru ${soubor} se spustí v nové databázi – třeba knihovna.sql z banky materiálů vyrobí knihovnu znovu.`,
            `The commands from ${soubor} will run in a new database – for example, knihovna.sql from the materials bank rebuilds the library.`,
          )}
        </p>
        <label className="mt-3 flex items-center">
          <span className="mr-2 shrink-0">{t("Název nové databáze:", "Name of the new database:")}</span>
          <input
            value={nazev}
            onChange={(e) => {
              nastavNazev(e.target.value);
              nastavChybu(null);
            }}
            spellCheck={false}
            className={`${POLE} flex-1`}
          />
        </label>
        <pre className="dbb-kod dbb-posuv mt-3 max-h-[200px] overflow-auto border border-dbb-mrizka bg-dbb-okno px-2 py-1.5 text-[11px]">
          {text.length > 3000 ? `${text.slice(0, 3000)}\n…` : text}
        </pre>
        {chyba && <p className="mt-2 text-[#a4262c]">{chyba}</p>}
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={importovat}>
          {t("Importovat", "Import")}
        </Tlacitko>
        <Tlacitko akce={zavrit}>{t("Zrušit", "Cancel")}</Tlacitko>
      </Paticka>
    </Okno>
  );
}
