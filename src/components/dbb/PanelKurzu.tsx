"use client";

/**
 * Panel Kurz SQL – lekce s výkladem a seznamem úkolů jako v SQLBoltu.
 *
 * Úkoly se odškrtávají samy: po spuštění dotazu (F5) nebo po tom, co žák
 * v programu něco udělá (rozbalí tabulku, zapíše změny…). Tlačítko
 * Zkontrolovat tu proto není. Pořád platí dva stupně pomoci z kurzu na webu:
 * nejdřív nápověda, řešení až po prvním pokusu.
 */

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lightbulb, KeyRound, PartyPopper, ArrowRight, ExternalLink } from "lucide-react";
import { useDbb } from "@/components/dbb/kontext";
import { KURZ, SADY, lekceHotova, povinne, souborLekce, rozdelSkore, type UkolKurzu } from "@/lib/dbb/kurz";
import { ID_ULOHY } from "@/lib/dbb/odkazUlohy";
import { t, jeAnglicky } from "@/lib/dbb/jazyk";
import { SLOVNICEK } from "@/lib/dbb/anglicky";
import { zvyrazni } from "@/lib/dbb/zvyrazneni";
import { sazba } from "@/lib/sazba";

/** Jazyk sazby: česky se svazují jednopísmenná slova, anglicky ne. */
const JAZYK = jeAnglicky() ? "en" : "cs";

const TRIDA: Record<string, string> = {
  slovo: "dbb-slovo",
  text: "dbb-text-hodnota",
  cislo: "dbb-cislo",
  komentar: "dbb-komentar",
  funkce: "dbb-funkce",
};

function Kod({ sql }: { sql: string }) {
  return (
    <pre className="dbb-kod dbb-posuv mt-2 select-text overflow-x-auto border border-dbb-mrizka bg-dbb-povrch px-2.5 py-2">
      {zvyrazni(sql).map((k, i) =>
        k.trida ? (
          <span key={i} className={TRIDA[k.trida]}>
            {k.text}
          </span>
        ) : (
          k.text
        ),
      )}
    </pre>
  );
}

/** Na co program čeká, aby úkol odškrtl – žák tak ví, že nemá mačkat nic dalšího. */
function cekaSeNa(ukol: UkolKurzu): string {
  if (ukol.ceka) return ukol.ceka;
  const k = ukol.kontrola;
  if (k.druh === "zmena") return t("Čeká se, až spustíš příkaz, který data změní (F5).", "Waiting for you to run a command that changes the data (F5).");
  if (k.druh === "dotaz") return t("Čeká se, až spustíš dotaz SELECT (F5).", "Waiting for you to run a SELECT query (F5).");
  return t("Čeká se, až to v programu uděláš.", "Waiting for you to do it in the program.");
}

function Ukol({ ukol, poradi, aktualni }: { ukol: UkolKurzu; poradi: number; aktualni: boolean }) {
  const api = useDbb();
  const { kurz } = api;
  const [napoveda, nastavNapovedu] = useState(false);
  const [reseni, nastavReseni] = useState(false);
  const hotovo = kurz.splneno.has(ukol.klic);
  const opsano = kurz.opsano.has(ukol.klic);
  // Řešení SQL se nabídne až po pokusu; postup v programu (bez SQL) rovnou.
  // Při předvádění učitel ukazuje řešení rovnou, nemusí napřed „zkoušet“.
  const reseniNabidnout = !!ukol.reseni && (!ukol.reseniJeSql || kurz.pokusy.has(ukol.klic) || api.predvadeni);
  const odezva = kurz.odezva && kurz.odezva.klic === ukol.klic ? kurz.odezva.text : null;

  return (
    <li
      className={`border-l-[3px] py-2 pl-2.5 pr-1 ${
        aktualni ? "border-dbb-akcent bg-dbb-povrch" : "border-transparent"
      }`}
    >
      <div className="flex items-start">
        <span
          className={`mr-2 mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            hotovo
              ? opsano
                ? "bg-dbb-slaby/25 text-dbb-slaby"
                : "bg-[#2e9d4f] text-white"
              : aktualni
                ? "bg-dbb-akcent text-dbb-akcent-text"
                : "bg-dbb-mrizka text-dbb-slaby"
          }`}
          title={hotovo ? (opsano ? t("Splněno s pomocí řešení", "Completed with the help of the solution") : t("Splněno", "Completed")) : undefined}
        >
          {hotovo ? <Check className="h-3 w-3" strokeWidth={3} /> : poradi}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] leading-snug ${hotovo ? "text-dbb-slaby" : ""}`}>
            {ukol.navic && (
              <span className="mr-1.5 rounded-sm bg-[#fff1c2] px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-[#6b5000]">
                {t("navíc", "extra")}
              </span>
            )}
            {sazba(ukol.zadani, JAZYK)}
          </p>

          {odezva && !hotovo && (
            <p role="status" className="mt-1.5 border-l-2 border-[#e8a33d] bg-[#fff8e1] px-2 py-1 text-[12px] leading-snug text-[#4a3500]">
              <b>{t("Ještě ne:", "Not yet:")}</b> {odezva}
            </p>
          )}

          {!hotovo && (
            <div className="mt-1 flex flex-wrap items-center text-[12px]">
              <button
                type="button"
                onClick={() => nastavNapovedu((v) => !v)}
                aria-expanded={napoveda}
                className="mr-4 inline-flex items-center text-dbb-akcent hover:underline"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" /> {napoveda ? t("Skrýt nápovědu", "Hide Hint") : t("Nápověda", "Hint")}
              </button>
              {napoveda && reseniNabidnout && (
                <button
                  type="button"
                  onClick={() => nastavReseni((v) => !v)}
                  aria-expanded={reseni}
                  className="inline-flex items-center text-dbb-akcent hover:underline"
                >
                  <KeyRound className="mr-1 h-3.5 w-3.5" /> {reseni ? t("Skrýt řešení", "Hide Solution") : t("Ukázat řešení", "Show Solution")}
                </button>
              )}
            </div>
          )}
          {!hotovo && aktualni && (
            <p className="mt-1 text-[11px] leading-snug text-dbb-slaby">{cekaSeNa(ukol)}</p>
          )}
          {!hotovo && napoveda && <p className="mt-1 text-[12px] leading-snug text-dbb-slaby">{sazba(ukol.hint, JAZYK)}</p>}
          {!hotovo && napoveda && !reseniNabidnout && !!ukol.reseni && (
            <p className="mt-1 text-[11px] text-dbb-slaby">
              {t("Řešení se nabídne, až jednou zkusíš dotaz spustit.", "The solution is offered once you have tried running a query.")}
            </p>
          )}
          {!hotovo && reseni && reseniNabidnout && (
            <div>
              {ukol.reseniJeSql ? <Kod sql={ukol.reseni} /> : <p className="mt-1.5 text-[12px] leading-snug">{ukol.reseni}</p>}
              {ukol.reseniJeSql && (
                <button
                  type="button"
                  onClick={() => kurz.vlozReseni(ukol.klic)}
                  className="mt-1 text-[12px] text-dbb-akcent hover:underline"
                >
                  {t("Vložit do editoru", "Insert into Editor")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function PanelKurzu() {
  const api = useDbb();
  const { kurz } = api;
  const VSECHNY_LEKCE = kurz.lekce;
  const index = VSECHNY_LEKCE.findIndex((l) => l.id === kurz.lekceId);
  const uloha = VSECHNY_LEKCE.filter((l) => l.id === ID_ULOHY)[0];
  const lekce = VSECHNY_LEKCE[index] || KURZ[0];
  const jeSada = lekce.id > KURZ.length;
  const hotoveLekce = KURZ.filter((l) => lekceHotova(l, kurz.splneno)).length;
  const hotova = lekceHotova(lekce, kurz.splneno);
  // „Další lekce“ vede jen v rámci kurzu nebo v rámci lekcí navíc, ne přes hranici.
  const dalsi = VSECHNY_LEKCE[index + 1] && (VSECHNY_LEKCE[index + 1].id > KURZ.length) === jeSada ? VSECHNY_LEKCE[index + 1] : undefined;
  const aktualni = lekce.ukoly.find((u) => !kurz.splneno.has(u.klic));
  const pozadovany = souborLekce(lekce);
  const jinySoubor = !!pozadovany && api.otevrena !== pozadovany;
  const vse = hotoveLekce === KURZ.length;

  return (
    <div className="dbb-posuv flex h-full select-text flex-col overflow-y-auto">
      {/* Přehled: výběr lekce a postup. */}
      <div className="sticky top-0 z-[1] shrink-0 border-b border-dbb-linka bg-dbb-lista px-3 pb-2 pt-2">
        <div className="flex items-center">
          <button
            type="button"
            aria-label={t("Předchozí lekce", "Previous lesson")}
            disabled={index <= 0}
            onClick={() => kurz.vyberLekci(VSECHNY_LEKCE[index - 1].id)}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[3px] enabled:hover:bg-dbb-hover disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={lekce.id}
            onChange={(e) => kurz.vyberLekci(Number(e.target.value))}
            aria-label={t("Lekce", "Lesson")}
            className="mx-1 h-[24px] min-w-0 flex-1 border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            <optgroup label={t("Kurz SQL", "SQL course")}>
              {KURZ.map((l) => (
                <option key={l.id} value={l.id}>
                  {lekceHotova(l, kurz.splneno) ? "✓ " : ""}
                  {l.id}. {l.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("Navíc: detektivka a procvičování", "Extra: detective story and practice")}>
              {SADY.map((s) => (
                <option key={s.lekce.id} value={s.lekce.id}>
                  {lekceHotova(s.lekce, kurz.splneno) ? "✓ " : ""}
                  {s.lekce.id}. {s.lekce.title}
                </option>
              ))}
            </optgroup>
            {uloha && (
              <optgroup label={t("Od učitele", "From your teacher")}>
                <option value={uloha.id}>
                  {lekceHotova(uloha, kurz.splneno) ? "✓ " : ""}
                  {uloha.title}
                </option>
              </optgroup>
            )}
          </select>
          <button
            type="button"
            aria-label={t("Další lekce", "Next lesson")}
            disabled={!VSECHNY_LEKCE[index + 1]}
            onClick={() => VSECHNY_LEKCE[index + 1] && kurz.vyberLekci(VSECHNY_LEKCE[index + 1].id)}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[3px] enabled:hover:bg-dbb-hover disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center text-[11px] text-dbb-slaby">
          <div className="mr-2 h-[6px] flex-1 overflow-hidden rounded-full bg-dbb-mrizka">
            <div className="h-full rounded-full bg-[#2e9d4f]" style={{ width: `${(hotoveLekce / KURZ.length) * 100}%` }} />
          </div>
          {(() => {
            const s = rozdelSkore(KURZ.filter((l) => lekceHotova(l, kurz.splneno)).map((l) => l.id));
            return `${t("Dotazy", "Queries")} ${s.dotazy[0]}/${s.dotazy[1]} · ${t("Program", "Program")} ${s.program[0]}/${s.program[1]}`;
          })()}
          <button
            type="button"
            onClick={() => api.otevritDialog({ druh: "vysledky" })}
            className="ml-2 text-dbb-akcent hover:underline"
          >
            {t("Moje výsledky", "My Results")}
          </button>
          <button
            type="button"
            onClick={() => api.otevritDialog({ druh: "okurzu" })}
            className="ml-2 text-dbb-akcent hover:underline"
          >
            {t("Pro učitele", "For Teachers")}
          </button>
        </div>
      </div>

      <div className="px-3 pb-4 pt-3">
        {vse && (
          <div className="mb-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2.5 text-[12px] leading-relaxed">
            <p className="flex items-center text-[13px] font-semibold">
              <PartyPopper className="mr-1.5 h-4 w-4 text-[#2e9d4f]" />{" "}
              {t(`Kurz dokončen – všech ${KURZ.length} lekcí!`, `Course completed – all ${KURZ.length} lessons!`)}
            </p>
            <p className="mt-1">
              {t(
                "Umíš SQL i program, ve kterém se s databázemi pracuje. Skutečný DB Browser for SQLite je zdarma –",
                "You know SQL and the program people use to work with databases. The real DB Browser for SQLite is free –",
              )}{" "}
              <a href="https://sqlitebrowser.org/dl/" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
                sqlitebrowser.org <ExternalLink className="inline h-3 w-3" />
              </a>
              {t(
                ". A kdo chce SQL dál (vnořené dotazy, sjednocení tabulek), pokračuje v anglickém kurzu",
                ". And if you want more SQL (subqueries, unions), carry on with the course",
              )}{" "}
              <a href="https://sqlbolt.com" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
                SQLBolt <ExternalLink className="inline h-3 w-3" />
              </a>
              .
            </p>
          </div>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-dbb-slaby">
          {lekce.id === ID_ULOHY
            ? t("Od učitele", "From your teacher")
            : jeSada
              ? t(`Lekce ${lekce.id} · navíc`, `Lesson ${lekce.id} · extra`)
              : t(`Lekce ${lekce.id}`, `Lesson ${lekce.id}`)}
        </p>
        <h2 className="mt-0.5 text-[15px] font-semibold leading-snug">{lekce.title}</h2>

        {jinySoubor && (
          <div className="mt-2 border border-[#f0c36d] bg-[#fff8e1] px-2.5 py-2 text-[12px] leading-snug text-[#4a3500]">
            {t("Tahle lekce pracuje s databází", "This lesson works with the database")} <b>{pozadovany}</b>
            {api.otevrena ? (
              <>
                {t(", ale otevřená je", ", but the open one is")} <b>{api.otevrena}</b>
              </>
            ) : (
              t(", ale žádná databáze teď není otevřená", ", but no database is open at the moment")
            )}
            .{" "}
            <button type="button" onClick={() => api.otevritDialog({ druh: "otevrit" })} className="text-dbb-akcent underline">
              {t("Otevřít databázi…", "Open Database…")}
            </button>
          </div>
        )}

        <p className="mt-2 text-[13px] leading-relaxed">{sazba(lekce.teach, JAZYK)}</p>
        {lekce.example && <Kod sql={lekce.example} />}

        {lekce.id === 1 && (
          <p className="mt-2 text-[12px] leading-snug text-dbb-slaby">
            {t(
              "Dotaz piš na kartě Spustit SQL a spusť ho klávesou F5 nebo zeleným tlačítkem ▶ nad editorem. Úkol se odškrtne sám, jakmile výsledek sedí.",
              "Write your query on the Execute SQL tab and run it with F5 or the green ▶ button above the editor. The task ticks itself off as soon as the result is right.",
            )}
          </p>
        )}

        <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-dbb-slaby">
          {t("Úkoly", "Tasks")} {povinne(lekce).filter((u) => kurz.splneno.has(u.klic)).length}/{povinne(lekce).length}
        </h3>
        <ol className="mt-1">
          {lekce.ukoly.map((u, i) => (
            <Ukol key={u.klic} ukol={u} poradi={i + 1} aktualni={!!aktualni && aktualni.klic === u.klic} />
          ))}
        </ol>

        {hotova && dalsi && (
          <div className="mt-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2 text-[12px]">
            <p className="flex items-center font-semibold">
              <Check className="mr-1.5 h-4 w-4 text-[#2e9d4f]" strokeWidth={3} /> {t("Lekce hotová", "Lesson done")}
            </p>
            <button
              type="button"
              onClick={() => kurz.vyberLekci(dalsi.id)}
              className="mt-1.5 inline-flex items-center border border-dbb-akcent bg-dbb-akcent px-3 py-1 text-[12px] text-dbb-akcent-text hover:brightness-110"
            >
              {t("Další lekce:", "Next lesson:")} {dalsi.title} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {lekce.databaze && (
          <p className="mt-3 text-[12px] text-dbb-slaby">
            {t("Rozbil(a) sis data?", "Broken your data?")}{" "}
            <button
              type="button"
              onClick={() => lekce.databaze && kurz.obnovDatabazi(lekce.databaze, true)}
              className="text-dbb-akcent underline"
            >
              {t("Obnovit původní", "Restore the original")} {lekce.databaze.soubor}
            </button>
          </p>
        )}

        {hotova && !dalsi && !vse && !jeSada && (
          <div className="mt-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2 text-[12px] leading-snug">
            <p className="flex items-center font-semibold">
              <Check className="mr-1.5 h-4 w-4 text-[#2e9d4f]" strokeWidth={3} /> {t("Lekce hotová", "Lesson done")}
            </p>
            <p className="mt-1">
              {t("Poslední lekce je za tebou. Ještě ti chybí:", "You have finished the last lesson. Still missing:")}{" "}
              {KURZ.filter((l) => !lekceHotova(l, kurz.splneno)).map((l, i) => (
                <span key={l.id}>
                  {i > 0 && ", "}
                  <button type="button" onClick={() => kurz.vyberLekci(l.id)} className="text-dbb-akcent underline">
                    {l.id}
                  </button>
                </span>
              ))}
              .
            </p>
          </div>
        )}

        {jeAnglicky() && pozadovany && SLOVNICEK[pozadovany] && (
          <details className="mt-4 border border-dbb-mrizka bg-dbb-povrch px-2.5 py-1.5 text-[12px]" open={lekce.id === 1 || lekce.id === 20}>
            <summary className="cursor-pointer font-semibold">Glossary – Czech names in {pozadovany}</summary>
            <dl className="mt-1.5 leading-snug">
              {SLOVNICEK[pozadovany].map(([cz, en]) => (
                <div key={cz} className="mt-1">
                  <dt className="dbb-kod inline font-semibold">{cz}</dt> <dd className="inline">{en}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {lekce.tabulka && !jinySoubor && (
          <p className="mt-4 text-[12px] text-dbb-slaby">
            {t("Obsah tabulek uvidíš i bez dotazu na kartě", "You can see what is in the tables without a query on the")}{" "}
            <button
              type="button"
              onClick={() => {
                api.nastavKartu("data");
                api.udalost("karta:data");
              }}
              className="text-dbb-akcent underline"
            >
              {t("Prohlížet data", "Browse Data")}
            </button>
            {t(".", " tab.")}
          </p>
        )}
      </div>
    </div>
  );
}
