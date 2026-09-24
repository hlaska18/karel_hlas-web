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
import { KURZ, lekceHotova, povinne, type UkolKurzu } from "@/lib/dbb/kurz";
import { KNIHOVNA } from "@/lib/dbb/soubory";
import { zvyrazni } from "@/lib/dbb/zvyrazneni";
import { sazba } from "@/lib/sazba";

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

function Ukol({ ukol, poradi, aktualni }: { ukol: UkolKurzu; poradi: number; aktualni: boolean }) {
  const api = useDbb();
  const { kurz } = api;
  const [napoveda, nastavNapovedu] = useState(false);
  const [reseni, nastavReseni] = useState(false);
  const hotovo = kurz.splneno.has(ukol.klic);
  const opsano = kurz.opsano.has(ukol.klic);
  // Řešení SQL se nabídne až po pokusu; postup v programu (bez SQL) rovnou.
  const reseniNabidnout = !ukol.reseniJeSql || kurz.pokusy.has(ukol.klic);
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
          title={hotovo ? (opsano ? "Splněno s pomocí řešení" : "Splněno") : undefined}
        >
          {hotovo ? <Check className="h-3 w-3" strokeWidth={3} /> : poradi}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] leading-snug ${hotovo ? "text-dbb-slaby" : ""}`}>
            {ukol.navic && (
              <span className="mr-1.5 rounded-sm bg-[#fff1c2] px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-[#6b5000]">
                navíc
              </span>
            )}
            {sazba(ukol.zadani, "cs")}
          </p>

          {odezva && !hotovo && (
            <p role="status" className="mt-1.5 border-l-2 border-[#e8a33d] bg-[#fff8e1] px-2 py-1 text-[12px] leading-snug text-[#4a3500]">
              <b>Ještě ne:</b> {odezva}
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
                <Lightbulb className="mr-1 h-3.5 w-3.5" /> {napoveda ? "Skrýt nápovědu" : "Nápověda"}
              </button>
              {napoveda && reseniNabidnout && (
                <button
                  type="button"
                  onClick={() => nastavReseni((v) => !v)}
                  aria-expanded={reseni}
                  className="inline-flex items-center text-dbb-akcent hover:underline"
                >
                  <KeyRound className="mr-1 h-3.5 w-3.5" /> {reseni ? "Skrýt řešení" : "Ukázat řešení"}
                </button>
              )}
            </div>
          )}
          {!hotovo && napoveda && <p className="mt-1 text-[12px] leading-snug text-dbb-slaby">{sazba(ukol.hint, "cs")}</p>}
          {!hotovo && napoveda && !reseniNabidnout && (
            <p className="mt-1 text-[11px] text-dbb-slaby">Řešení se nabídne, až jednou zkusíš dotaz spustit.</p>
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
                  Vložit do editoru
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
  const index = KURZ.findIndex((l) => l.id === kurz.lekceId);
  const lekce = KURZ[index] || KURZ[0];
  const hotoveLekce = KURZ.filter((l) => lekceHotova(l, kurz.splneno)).length;
  const hotova = lekceHotova(lekce, kurz.splneno);
  const dalsi = KURZ[index + 1];
  const aktualni = lekce.ukoly.find((u) => !kurz.splneno.has(u.klic));
  const jinySoubor = lekce.knihovna && api.otevrena !== KNIHOVNA;
  const vse = hotoveLekce === KURZ.length;

  return (
    <div className="dbb-posuv flex h-full select-text flex-col overflow-y-auto">
      {/* Přehled: výběr lekce a postup. */}
      <div className="sticky top-0 z-[1] shrink-0 border-b border-dbb-linka bg-dbb-lista px-3 pb-2 pt-2">
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Předchozí lekce"
            disabled={index <= 0}
            onClick={() => kurz.vyberLekci(KURZ[index - 1].id)}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[3px] enabled:hover:bg-dbb-hover disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={lekce.id}
            onChange={(e) => kurz.vyberLekci(Number(e.target.value))}
            aria-label="Lekce"
            className="mx-1 h-[24px] min-w-0 flex-1 border border-dbb-linka bg-dbb-povrch px-1 text-[12px]"
          >
            {KURZ.map((l) => (
              <option key={l.id} value={l.id}>
                {lekceHotova(l, kurz.splneno) ? "✓ " : ""}
                {l.id}. {l.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Další lekce"
            disabled={!dalsi}
            onClick={() => dalsi && kurz.vyberLekci(dalsi.id)}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[3px] enabled:hover:bg-dbb-hover disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center text-[11px] text-dbb-slaby">
          <div className="mr-2 h-[6px] flex-1 overflow-hidden rounded-full bg-dbb-mrizka">
            <div className="h-full rounded-full bg-[#2e9d4f]" style={{ width: `${(hotoveLekce / KURZ.length) * 100}%` }} />
          </div>
          Hotovo {hotoveLekce}/{KURZ.length}
        </div>
      </div>

      <div className="px-3 pb-4 pt-3">
        {vse && (
          <div className="mb-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2.5 text-[12px] leading-relaxed">
            <p className="flex items-center text-[13px] font-semibold">
              <PartyPopper className="mr-1.5 h-4 w-4 text-[#2e9d4f]" /> Kurz dokončen – všech {KURZ.length} lekcí!
            </p>
            <p className="mt-1">
              Umíš SQL i program, ve kterém se s databázemi pracuje. Skutečný DB Browser for SQLite je zdarma –{" "}
              <a href="https://sqlitebrowser.org/dl/" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
                sqlitebrowser.org <ExternalLink className="inline h-3 w-3" />
              </a>
              . A kdo chce SQL dál (vnořené dotazy, sjednocení tabulek), pokračuje v anglickém kurzu{" "}
              <a href="https://sqlbolt.com" target="_blank" rel="noopener noreferrer" className="text-dbb-akcent underline">
                SQLBolt <ExternalLink className="inline h-3 w-3" />
              </a>
              .
            </p>
          </div>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-dbb-slaby">Lekce {lekce.id}</p>
        <h2 className="mt-0.5 text-[15px] font-semibold leading-snug">{lekce.title}</h2>

        {jinySoubor && (
          <div className="mt-2 border border-[#f0c36d] bg-[#fff8e1] px-2.5 py-2 text-[12px] leading-snug text-[#4a3500]">
            Tahle lekce pracuje s databází <b>knihovna.db</b>
            {api.otevrena ? (
              <>
                , ale otevřená je <b>{api.otevrena}</b>
              </>
            ) : (
              ", ale žádná databáze teď není otevřená"
            )}
            .{" "}
            <button type="button" onClick={() => api.otevritDialog({ druh: "otevrit" })} className="text-dbb-akcent underline">
              Otevřít databázi…
            </button>
          </div>
        )}

        <p className="mt-2 text-[13px] leading-relaxed">{sazba(lekce.teach, "cs")}</p>
        {lekce.example && <Kod sql={lekce.example} />}

        {lekce.id === 1 && (
          <p className="mt-2 text-[12px] leading-snug text-dbb-slaby">
            Dotaz piš na kartě Spustit SQL a spusť ho klávesou F5 nebo zeleným tlačítkem ▶ nad editorem. Úkol se
            odškrtne sám, jakmile výsledek sedí.
          </p>
        )}

        <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-dbb-slaby">
          Úkoly {povinne(lekce).filter((u) => kurz.splneno.has(u.klic)).length}/{povinne(lekce).length}
        </h3>
        <ol className="mt-1">
          {lekce.ukoly.map((u, i) => (
            <Ukol key={u.klic} ukol={u} poradi={i + 1} aktualni={!!aktualni && aktualni.klic === u.klic} />
          ))}
        </ol>

        {hotova && dalsi && (
          <div className="mt-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2 text-[12px]">
            <p className="flex items-center font-semibold">
              <Check className="mr-1.5 h-4 w-4 text-[#2e9d4f]" strokeWidth={3} /> Lekce hotová
            </p>
            <button
              type="button"
              onClick={() => kurz.vyberLekci(dalsi.id)}
              className="mt-1.5 inline-flex items-center border border-dbb-akcent bg-dbb-akcent px-3 py-1 text-[12px] text-dbb-akcent-text hover:brightness-110"
            >
              Další lekce: {dalsi.title} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {hotova && !dalsi && !vse && (
          <div className="mt-3 border border-[#9fd5ae] bg-[#eaf7ee] px-3 py-2 text-[12px] leading-snug">
            <p className="flex items-center font-semibold">
              <Check className="mr-1.5 h-4 w-4 text-[#2e9d4f]" strokeWidth={3} /> Lekce hotová
            </p>
            <p className="mt-1">
              Poslední lekce je za tebou. Ještě ti chybí:{" "}
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

        {lekce.tabulka && !jinySoubor && (
          <p className="mt-4 text-[12px] text-dbb-slaby">
            Obsah tabulek uvidíš i bez dotazu na kartě{" "}
            <button
              type="button"
              onClick={() => {
                api.nastavKartu("data");
                api.udalost("karta:data");
              }}
              className="text-dbb-akcent underline"
            >
              Prohlížet data
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
