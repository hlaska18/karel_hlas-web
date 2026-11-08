"use client";

/**
 * Tabulka krok za krokem. Na vybraných buňkách se krokování zastaví a žák musí
 * hodnotu napsat sám (Karel: „moc naservírované“). Po vyplnění hledá plán odzadu.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { KAPACITA, ZAKAZKY, komentarKroku, krokyTabulky, optimalniPlan, spoctiTabulku, zpetnaCesta } from "@/lib/algolab/batoh";
import type { StavBatohu } from "@/lib/algolab/stav";
import { Hlaska, Karta, TabulkaDP, hlavni, poleTrida, tlacitko, type Bunka } from "./spolecne";

const TABULKA = spoctiTabulku(ZAKAZKY, KAPACITA);
const KROKY = krokyTabulky(ZAKAZKY, KAPACITA);
const CESTA = zpetnaCesta(ZAKAZKY, KAPACITA);
const OPTIMUM = optimalniPlan(ZAKAZKY, KAPACITA);
const RYCHLOST_MS = 750;

/**
 * Šrouby ukážou součet, Hřídele práci se zbytkem času, Příruby rozhodující buňku,
 * pouzdra opis nenulové hodnoty a nakonec výhru bez poslední zakázky.
 */
const OTAZKY = ["2:5", "3:7", "4:10", "5:6", "5:10"];
const klicBunky = (r: number, s: number) => `${r}:${s}`;
const POCTY = ["", "z prvního úkolu", "z prvních dvou úkolů", "z prvních tří úkolů", "z prvních čtyř úkolů", "ze všech pěti úkolů"];

export function Krokovani({ stav, zmen, dal }: { stav: StavBatohu; zmen: (zmena: Partial<StavBatohu>) => void; dal: () => void }) {
  const [hraje, nastavHraje] = useState(false);
  const [odpoved, nastavOdpoved] = useState("");
  const [chyb, nastavChyb] = useState(0);
  const [zpetChyba, nastavZpetChybu] = useState(false);
  const dalsiTlacitko = useRef<HTMLButtonElement>(null);
  const zpetBlok = useRef<HTMLDivElement>(null);
  const hotovoTlacitko = useRef<HTMLButtonElement>(null);

  const dalsi = KROKY[stav.krok];
  const stoji = !!dalsi && OTAZKY.includes(klicBunky(dalsi.radek, dalsi.sloupec)) && !stav.zodpovezene.includes(klicBunky(dalsi.radek, dalsi.sloupec));
  const vyplneno = stav.krok >= KROKY.length;
  const posledni = stav.krok > 0 ? KROKY[stav.krok - 1] : null;

  /* Přehrávání se samo zastaví u otázky i na konci. Bez animace, jen po krocích. */
  useEffect(() => {
    if (!hraje) return;
    if (stoji || vyplneno) {
      nastavHraje(false);
      return;
    }
    const casovac = window.setTimeout(() => zmen({ krok: stav.krok + 1 }), RYCHLOST_MS);
    return () => window.clearTimeout(casovac);
  }, [hraje, stoji, vyplneno, stav.krok, zmen]);

  const odkryta = useMemo(() => {
    const odkryte = new Set(KROKY.slice(0, stav.krok).map((k) => klicBunky(k.radek, k.sloupec)));
    return (r: number, s: number) => odkryte.has(klicBunky(r, s));
  }, [stav.krok]);

  const posun = (o: number) => {
    nastavHraje(false);
    nastavOdpoved("");
    nastavChyb(0);
    zmen({ krok: Math.max(0, Math.min(KROKY.length, stav.krok + o)) });
  };

  const zkontroluj = () => {
    if (!dalsi || odpoved.trim() === "") return;
    if (Number(odpoved) === dalsi.hodnota) prijmi();
    else nastavChyb((n) => n + 1);
  };

  const prijmi = () => {
    if (!dalsi) return;
    nastavOdpoved("");
    nastavChyb(0);
    zmen({ krok: stav.krok + 1, zodpovezene: [...stav.zodpovezene, klicBunky(dalsi.radek, dalsi.sloupec)] });
  };

  const cestaHotova = stav.zpet >= CESTA.length;

  /*
   * Když zmizí to, na čem byl fokus (karta s otázkou, ovládání tabulky, poslední
   * otázka cesty), přesune se na to, co přišlo místo něj. Jinak skončí na BODY.
   */
  const predtim = useRef({ stoji, vyplneno, cestaHotova });
  useEffect(() => {
    const p = predtim.current;
    if (!p.vyplneno && vyplneno) zpetBlok.current?.focus();
    else if (p.stoji && !stoji && !vyplneno) dalsiTlacitko.current?.focus();
    else if (!p.cestaHotova && cestaHotova && vyplneno) hotovoTlacitko.current?.focus();
    predtim.current = { stoji, vyplneno, cestaHotova };
  });

  const zpetKrok = vyplneno && !cestaHotova ? CESTA[stav.zpet] : null;
  const prosle: Bunka[] = CESTA.slice(0, stav.zpet).map((k) => [k.radek, k.sloupec]);
  const odpovezZpet = (vzata: boolean) => {
    if (!zpetKrok) return;
    if (vzata !== zpetKrok.vzata) {
      nastavZpetChybu(true);
      return;
    }
    nastavZpetChybu(false);
    zmen({ zpet: stav.zpet + 1 });
  };

  const aktualni: Bunka | null = zpetKrok
    ? [zpetKrok.radek, zpetKrok.sloupec]
    : stoji && dalsi
      ? [dalsi.radek, dalsi.sloupec]
      : !vyplneno && posledni
        ? [posledni.radek, posledni.sloupec]
        : null;
  const zdroje: Bunka[] | undefined = zpetKrok
    ? [[zpetKrok.radek - 1, zpetKrok.sloupec]]
    : stoji
      ? chyb > 0
        ? dalsi!.zdroje
        : undefined
      : !vyplneno
        ? posledni?.zdroje
        : undefined;

  return (
    <div className="flex flex-col gap-3.5">
      <Hlaska>
        <b>Co znamená buňka:</b> nejlepší přínos v tisících Kč, když smíš vybírat jen z prvních několika úkolů a stroj má daný počet
        hodin. Malé úlohy se spočítají dřív a větší se z nich jen skládají. Každá buňka porovná dvě možnosti: úkol nevzít (hodnota přímo
        nad ní), nebo ho vzít a k jeho přínosu přičíst nejlepší výsledek za zbylé hodiny. Ten se bere z řádku nad, protože stejný úkol
        nejde udělat podruhé.
      </Hlaska>

      <TabulkaDP
        zakazky={ZAKAZKY}
        kapacita={KAPACITA}
        tabulka={TABULKA}
        odkryta={odkryta}
        aktualni={aktualni}
        zdroje={zdroje}
        cesta={vyplneno ? prosle : undefined}
        vlastni={(r, s) => (stoji && dalsi?.radek === r && dalsi.sloupec === s ? "?" : null)}
      />

      {!vyplneno && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => posun(-1)} disabled={stav.krok === 0} className={tlacitko}>
            <ChevronLeft className="h-4 w-4" /> Předchozí
          </button>
          <button ref={dalsiTlacitko} type="button" onClick={() => posun(1)} disabled={stoji} className={tlacitko}>
            Další <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => nastavHraje((h) => !h)} disabled={stoji} className={tlacitko}>
            {hraje ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {hraje ? "Pauza" : "Přehrát"}
          </button>
          <span className="ml-1 text-[13px] tabular-nums text-[#a6bdb4]">
            Buňka {stav.krok} z {KROKY.length}
          </span>
        </div>
      )}

      {/* Během přehrávání by čtečka četla přes sebe, proto mlčí. */}
      {!vyplneno && !stoji && (
        <div aria-live={hraje ? "off" : "polite"}>
          <Hlaska>
            {posledni ? (
              <>
                <b>
                  {posledni.zakazka.nazev}, {posledni.sloupec} h:
                </b>{" "}
                {komentarKroku(posledni)}
              </>
            ) : (
              "Tabulka se vyplňuje po řádcích zleva doprava. Klikni na Další nebo Přehrát."
            )}
          </Hlaska>
        </div>
      )}

      {stoji && dalsi && (
        <Karta nadpis="Teď ty: kolik bude v buňce s otazníkem?">
          <p className="mb-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
            {dalsi.zakazka.nazev} ({dalsi.zakazka.doba} h, {dalsi.zakazka.prinos} tis. Kč), stroj má {dalsi.sloupec} h, vybíráš {POCTY[dalsi.radek]}.
          </p>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              zkontroluj();
            }}
          >
            <input
              type="number"
              value={odpoved}
              onChange={(e) => nastavOdpoved(e.target.value)}
              aria-label="Hodnota buňky"
              autoFocus
              className={`${poleTrida} w-[90px]`}
            />
            <button type="submit" disabled={odpoved.trim() === ""} className={hlavni}>
              Ověřit
            </button>
          </form>
          {chyb > 0 && (
            <div role="alert" className="mt-2.5 flex flex-col gap-2">
              <Hlaska druh="tip">
                {dalsi.vejdeSe
                  ? `To ještě ne. Úkol se vejde. Porovnej dvě možnosti ze zvýrazněných buněk: bez úkolu (hodnota přímo nad buňkou) a s úkolem (${dalsi.zakazka.prinos} + nejlepší přínos dřívějších úkolů při zbývajícím čase ${dalsi.sloupec - dalsi.zakazka.doba} h, to je hodnota o ${dalsi.zakazka.doba} h vlevo v řádku nad ní).`
                  : `To ještě ne. Vejde se úkol trvající ${dalsi.zakazka.doba} h do ${dalsi.sloupec} h? Když ne, hodnota se opíše shora.`}
              </Hlaska>
              {chyb >= 3 && (
                <div>
                  <button type="button" onClick={prijmi} className={tlacitko}>
                    Ukaž řešení a pokračuj
                  </button>
                </div>
              )}
            </div>
          )}
        </Karta>
      )}

      {zpetKrok && stav.zpet === 0 && (
        <div ref={zpetBlok} tabIndex={-1} className="focus:outline-none">
          <Karta nadpis="Tabulka zná nejlepší přínos. Které úkoly to jsou?">
            <p className="mb-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
              Plán se hledá odzadu, od pravého dolního rohu nahoru. První krok ti ukážu: {ukazkaPrvnihoKroku()}
            </p>
            <button type="button" onClick={() => zmen({ zpet: 1 })} className={hlavni}>
              Rozumím, další kroky udělám já <ChevronRight className="h-4 w-4" />
            </button>
          </Karta>
        </div>
      )}

      {zpetKrok && stav.zpet > 0 && (
        <Karta nadpis="Tabulka zná nejlepší přínos. Které úkoly to jsou?">
          <p className="mb-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
            Jsi v řádku {zpetKrok.zakazka.nazev}, ve sloupci {zpetKrok.sloupec} h. V buňce je <b>{TABULKA[zpetKrok.radek][zpetKrok.sloupec]}</b>,
            přímo nad ní <b>{TABULKA[zpetKrok.radek - 1][zpetKrok.sloupec]}</b>. Jsou {zpetKrok.zakazka.nazev.toLowerCase()} ({zpetKrok.zakazka.doba} h) v plánu?
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => odpovezZpet(true)} className={tlacitko}>
              Ano, jsou v plánu
            </button>
            <button type="button" onClick={() => odpovezZpet(false)} className={tlacitko}>
              Ne, nejsou
            </button>
          </div>
          {zpetChyba && (
            <div role="alert" className="mt-2.5">
              <Hlaska druh="tip">
                Když je hodnota stejná jako nad ní, šlo to i bez tohoto úkolu. Když je jiná, úkol se vyplatil a ubere se jeho doba.
              </Hlaska>
            </div>
          )}
        </Karta>
      )}

      {vyplneno && cestaHotova && (
        <>
          <Hlaska druh="ok">
            Nejlepší plán: <b>{ZAKAZKY.filter((z) => OPTIMUM.ids.includes(z.id)).map((z) => z.nazev).join(" + ")}</b>, {OPTIMUM.doba} h a{" "}
            <b>{OPTIMUM.prinos} tis. Kč</b>. Pravidla dala 49 a 50. Tabulka u každého úkolu porovnala obě možnosti, vzít ho, nebo ne, takže
            teď víš, že lepší plán neexistuje.
          </Hlaska>
          <div className="flex flex-wrap gap-2">
            <button ref={hotovoTlacitko} type="button" onClick={dal} className={hlavni}>
              Zkusit jiná čísla <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => zmen({ krok: 0, zpet: 0, zodpovezene: [] })} className={tlacitko}>
              <RotateCcw className="h-4 w-4" /> Projít tabulku znovu
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Vyřešený první krok zpětné cesty jako ukázka (Codex 7. 11. 2026), dál rozhoduje žák. */
function ukazkaPrvnihoKroku(): string {
  const k = CESTA[0];
  const tady = TABULKA[k.radek][k.sloupec];
  const nad = TABULKA[k.radek - 1][k.sloupec];
  return k.vzata
    ? `v buňce je ${tady}, přímo nad ní ${nad}. Čísla se liší, takže bez tohoto úkolu by to nešlo: ${k.zakazka.nazev} v plánu jsou. Odečteš jejich ${k.zakazka.doba} h a pokračuješ o řádek výš ve sloupci ${k.sloupec - k.zakazka.doba} h.`
    : `v buňce je ${tady}, přímo nad ní taky ${nad}. Stejně dobrý výsledek šel i bez tohoto úkolu, takže ${k.zakazka.nazev} v plánu nejsou. Zůstáváš ve sloupci ${k.sloupec} h a pokračuješ o řádek výš.`;
}
