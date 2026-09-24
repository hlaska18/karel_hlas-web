"use client";

/**
 * Vytvořit úlohu pro třídu: učitel napíše zadání a správný SELECT, vyzkouší
 * ho nad původními daty a dostane odkaz, který pošle do Teams. Žákovi se
 * po otevření odkazu úloha objeví jako lekce „Úloha od učitele“.
 */

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { forkDb, type SqlResult } from "@/lib/sqljs";
import { Okno, Tlacitko, Paticka } from "@/components/dbb/okna";
import { kopiruj } from "@/components/dbb/Vysledky";
import { t, jeAnglicky } from "@/lib/dbb/jazyk";
import { chybaCesky } from "@/lib/dbb/chyby";
import { tabulky, sloupceDb } from "@/lib/dbb/prikazy";
import {
  DATABAZE_ULOH,
  MAX_ZADANI,
  MAX_DOTAZU,
  chybaDotazu,
  zakodujUlohu,
  klicUlohy,
  type UlohaOdkazu,
} from "@/lib/dbb/odkazUlohy";

type Zkouska = { ok: true; vysledek: SqlResult } | { ok: false; chyba: string };

const POLE = "w-full border border-dbb-linka bg-dbb-okno px-2 py-1 text-[12px] focus:border-dbb-akcent";

export function UlohaOdkazem({ zavrit }: { zavrit: () => void }) {
  const [soubor, nastavSoubor] = useState(DATABAZE_ULOH[0].soubor);
  const [zadani, nastavZadani] = useState("");
  const [napoveda, nastavNapovedu] = useState("");
  const [reference, nastavReferenci] = useState("");
  const [zkouska, nastavZkousku] = useState<Zkouska | null>(null);
  const [zkopirovano, nastavZkopirovano] = useState(false);

  const uloha: UlohaOdkazu = { zadani: zadani.trim(), napoveda: napoveda.trim(), soubor, reference: reference.trim() };
  const odkaz =
    zkouska && zkouska.ok && zkouska.vysledek.values.length > 0 && uloha.zadani
      ? `${window.location.origin}/sql?${jeAnglicky() ? "z=en&" : ""}ukol=${zakodujUlohu(uloha)}`
      : null;

  const zmena = () => {
    nastavZkousku(null);
    nastavZkopirovano(false);
  };

  const vyzkouset = () => {
    const chyba = chybaDotazu(uloha.reference);
    if (chyba) {
      nastavZkousku({ ok: false, chyba });
      return;
    }
    const d = DATABAZE_ULOH.filter((x) => x.soubor === soubor)[0];
    const db = forkDb(d.schema);
    try {
      const r = db.exec(uloha.reference);
      nastavZkousku({ ok: true, vysledek: r.length ? r[r.length - 1] : { columns: [], values: [] } });
    } catch (e) {
      nastavZkousku({
        ok: false,
        chyba: chybaCesky(e instanceof Error ? e.message : String(e), tabulky(db), {
          sloupce: sloupceDb(db),
          sql: uloha.reference,
        }),
      });
    } finally {
      db.close();
    }
  };

  return (
    <Okno titulek={t("Vytvořit úlohu pro třídu", "Create a Task for the Class")} zavrit={zavrit} sirka={720}>
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px] leading-relaxed">
        <p>
          {t(
            "Napiš zadání a správný dotaz. Žák po otevření odkazu dostane úlohu jako lekci „Úloha od učitele“ a program ji zkontroluje sám – stejně jako lekce kurzu, nad původními daty. Jde jen o dotazy SELECT.",
            "Write the task and the correct query. When a pupil opens the link, the task appears as the lesson “Task from your teacher” and the program checks it by itself – like the course lessons, against the original data. Only SELECT queries are possible.",
          )}
        </p>

        <label className="mt-3 block">
          <span className="font-semibold">{t("Databáze", "Database")}</span>
          <select
            value={soubor}
            onChange={(e) => {
              nastavSoubor(e.target.value);
              zmena();
            }}
            className={`${POLE} mt-1 h-[26px] py-0`}
          >
            {DATABAZE_ULOH.map((d) => (
              <option key={d.soubor} value={d.soubor}>
                {d.soubor}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block">
          <span className="font-semibold">{t("Zadání pro žáky", "Task for the pupils")}</span>
          <textarea
            value={zadani}
            maxLength={MAX_ZADANI}
            onChange={(e) => {
              nastavZadani(e.target.value);
              zmena();
            }}
            rows={3}
            placeholder={t("Vypiš názvy všech knih od Karla Čapka seřazené podle roku vydání.", "List the titles of all the books by Karel Čapek, sorted by year of publication.")}
            className={`${POLE} mt-1 resize-y`}
          />
        </label>

        <label className="mt-3 block">
          <span className="font-semibold">{t("Nápověda", "Hint")}</span>{" "}
          <span className="text-dbb-slaby">{t("(nepovinná)", "(optional)")}</span>
          <input
            value={napoveda}
            maxLength={MAX_ZADANI}
            onChange={(e) => {
              nastavNapovedu(e.target.value);
              zmena();
            }}
            placeholder={t("Použij WHERE a ORDER BY.", "Use WHERE and ORDER BY.")}
            className={`${POLE} mt-1 h-[26px]`}
          />
        </label>

        <label className="mt-3 block">
          <span className="font-semibold">{t("Správný dotaz", "Correct query")}</span>{" "}
          <span className="text-dbb-slaby">
            {t("(žákovi se neukáže, podle něj se kontroluje výsledek)", "(pupils don't see it; their result is checked against it)")}
          </span>
          <textarea
            value={reference}
            maxLength={MAX_DOTAZU}
            onChange={(e) => {
              nastavReferenci(e.target.value);
              zmena();
            }}
            rows={4}
            spellCheck={false}
            placeholder="SELECT nazev FROM knihy WHERE autor = 'Karel Čapek' ORDER BY rok;"
            className={`${POLE} dbb-kod mt-1 resize-y`}
          />
        </label>

        <div className="mt-2">
          <button
            type="button"
            onClick={vyzkouset}
            disabled={!uloha.reference}
            className="h-[26px] border border-dbb-linka bg-dbb-povrch px-3 enabled:hover:bg-dbb-hover disabled:opacity-45"
          >
            {t("Vyzkoušet dotaz", "Test the Query")}
          </button>
        </div>

        {zkouska && !zkouska.ok && (
          <p className="mt-2 border-l-2 border-[#c42b1c] bg-[#fdecea] px-2 py-1 text-[#6b1109]">{zkouska.chyba}</p>
        )}
        {zkouska && zkouska.ok && (
          <div className="mt-2">
            <p className={zkouska.vysledek.values.length ? "text-dbb-slaby" : "text-[#6b1109]"}>
              {zkouska.vysledek.values.length
                ? t(
                    `Dotaz vrací ${zkouska.vysledek.values.length} ${
                      zkouska.vysledek.values.length === 1 ? "řádek" : zkouska.vysledek.values.length < 5 ? "řádky" : "řádků"
                    }. Tohle musí vyjít i žákovi:`,
                    `The query returns ${zkouska.vysledek.values.length} ${
                      zkouska.vysledek.values.length === 1 ? "row" : "rows"
                    }. The pupils have to get this too:`,
                  )
                : t(
                    "Dotaz nevrací žádné řádky – úlohu by pak splnil každý dotaz, který nic nenajde. Uprav zadání, ať něco vrací.",
                    "The query returns no rows – then any query that finds nothing would pass. Change the task so that it returns something.",
                  )}
            </p>
            {zkouska.vysledek.values.length > 0 && (
              <div className="dbb-posuv mt-1 max-h-[150px] overflow-auto border border-dbb-mrizka">
                <table className="w-full text-[11px]" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {zkouska.vysledek.columns.map((c, i) => (
                        <th key={i} className="sticky top-0 border-b border-dbb-mrizka bg-dbb-hlavicka px-2 py-0.5 text-left font-normal">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zkouska.vysledek.values.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        {r.map((b, j) => (
                          <td key={j} className="border-b border-dbb-mrizka px-2 py-0.5">
                            {b === null ? <i className="text-dbb-slaby">NULL</i> : String(b)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {odkaz && (
          <div className="mt-4 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2.5">
            <p className="font-semibold">{t("Odkaz pro třídu", "Link for the class")}</p>
            <div className="mt-1 flex items-center">
              <input readOnly value={odkaz} aria-label={t("Odkaz na úlohu", "Link to the task")} onFocus={(e) => e.target.select()} className={`${POLE} dbb-kod h-[26px] min-w-0 flex-1 text-[11px]`} />
              <button
                type="button"
                onClick={() => kopiruj(odkaz, () => nastavZkopirovano(true))}
                className="ml-2 flex h-[26px] shrink-0 items-center border border-dbb-linka bg-dbb-povrch px-2 hover:bg-dbb-hover"
              >
                {zkopirovano ? <Check className="mr-1 h-3.5 w-3.5 text-[#2e9d4f]" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {zkopirovano ? t("Zkopírováno", "Copied") : t("Kopírovat", "Copy")}
              </button>
              <a
                href={odkaz}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex h-[26px] shrink-0 items-center border border-dbb-linka bg-dbb-povrch px-2 hover:bg-dbb-hover"
              >
                {t("Vyzkoušet", "Try It")} <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
            <p className="mt-1.5 text-dbb-slaby">
              {t("Kód úlohy", "The task code")} <b className="dbb-kod text-[11px] text-dbb-text">{klicUlohy(uloha)}</b>{" "}
              {t(
                "uvidíš v Přehledu třídy u žáků, kteří ji splnili. Správný dotaz je v odkazu zakódovaný, ne zašifrovaný – na test to není, na procvičení a domácí úkol ano.",
                "shows up in the Class Overview for pupils who solved it. The correct query is encoded in the link, not encrypted – fine for practice and homework, not for a test.",
              )}
            </p>
          </div>
        )}
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          {t("Zavřít", "Close")}
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}
