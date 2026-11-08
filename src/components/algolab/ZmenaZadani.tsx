"use client";

/** Druhá část experimentu: žák mění čísla a sleduje tabulku proti oběma pravidlům. */

import { useMemo, useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import {
  KAPACITA,
  ZAKAZKY,
  odKolikaSeVyplati,
  optimalniPlan,
  pocetBunek,
  pocetKombinaci,
  pravidloNejvynosnejsi,
  pravidloZaHodinu,
  spoctiTabulku,
  vsechnaOptima,
  zpetnaCesta,
  type Plan,
  type Zakazka,
} from "@/lib/algolab/batoh";
import type { StavBatohu } from "@/lib/algolab/stav";
import { CisloPole, Hlaska, Karta, TabulkaDP, Zjednoduseno, hlavni, tlacitko } from "./spolecne";

const cislo = (n: number) => n.toLocaleString("cs-CZ");

function Vysledek({
  nazev,
  jak,
  plan,
  zakazky,
  optimum,
}: {
  nazev: string;
  /** Jednou větou, jak k plánu došel (8. 11. 2026: samotný název byl nekonkrétní). */
  jak: string;
  plan: Plan;
  zakazky: Zakazka[];
  optimum: number;
}) {
  const nejlepsi = plan.prinos === optimum;
  return (
    <div className={`rounded-xl border p-3 ${nejlepsi ? "border-[#6fe3c2]/50 bg-[#123c30]" : "border-white/10 bg-[#0d1714]"}`}>
      <div className="text-[13px] font-semibold text-[#c5d6cf]">{nazev}</div>
      <div className="text-[12px] text-[#a6bdb4]">{jak}</div>
      <div className="mt-1 text-[20px] font-semibold tabular-nums">{plan.prinos} tis. Kč</div>
      <div className="mt-0.5 text-[13px] text-[#a6bdb4]">
        {zakazky.filter((z) => plan.ids.includes(z.id)).map((z) => z.nazev).join(", ") || "žádný vybraný úkol"}
      </div>
    </div>
  );
}

export function ZmenaZadani({ stav, zmen, dal }: { stav: StavBatohu; zmen: (zmena: Partial<StavBatohu>) => void; dal: () => void }) {
  const { zakazky, kapacita } = stav.uprava;
  const [pocet, nastavPocet] = useState(5);

  const { tabulka, cesta, optimum, nejvynosnejsi, zaHodinu, pocetOptim } = useMemo(
    () => ({
      tabulka: spoctiTabulku(zakazky, kapacita),
      cesta: zpetnaCesta(zakazky, kapacita).filter((k) => k.vzata).map((k): [number, number] => [k.radek, k.sloupec]),
      optimum: optimalniPlan(zakazky, kapacita),
      nejvynosnejsi: pravidloNejvynosnejsi(zakazky, kapacita),
      zaHodinu: pravidloZaHodinu(zakazky, kapacita),
      // Pět úkolů = 32 kombinací, hrubá síla je tu zadarmo.
      pocetOptim: vsechnaOptima(zakazky, kapacita).length,
    }),
    [zakazky, kapacita],
  );
  /** Úkol 4: kolik pravidlo „přínos za hodinu“ ztratilo proti tabulce. */
  const ztrata = optimum.prinos > 0 ? (optimum.prinos - zaHodinu.prinos) / optimum.prinos : 0;
  const puvodni = () => zmen({ uprava: { zakazky: ZAKAZKY, kapacita: KAPACITA } });

  const upravZakazku = (id: string, zmena: Partial<Zakazka>) =>
    zmen({ uprava: { kapacita, zakazky: zakazky.map((z) => (z.id === id ? { ...z, ...zmena } : z)) } });

  const kombinace = pocetKombinaci(pocet);
  const bunky = pocetBunek(pocet, kapacita);
  const vyplatiSe = odKolikaSeVyplati(kapacita);

  return (
    <div className="flex flex-col gap-3.5">
      <Karta nadpis="Zkus to">
        <p className="mb-2 text-[14px] leading-relaxed text-[#c5d6cf]">
          Každý úkol začni s původním zadáním.{" "}
          <button type="button" onClick={puvodni} className="underline decoration-dotted underline-offset-2 hover:text-[#e8f3ef]">
            Vrátit původní čísla
          </button>
        </p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[14px] leading-relaxed text-[#c5d6cf]">
          <li>Nastav kapacitu 9 h. Hřídele a Příruby se spolu nevejdou. Který plán vyhraje teď?</li>
          <li>Najdi kapacitu, při které obě pravidla najdou totéž co tabulka. A kapacitu, při které obě selžou.</li>
          <li>Zvyš přínos Držáků tak, aby se dostaly do nejlepšího plánu při 10 hodinách.</li>
          <li>Změň čísla tak, aby pravidlo Nejlepší přínos za hodinu ztratilo proti tabulce aspoň čtvrtinu.</li>
        </ol>
      </Karta>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="flex flex-col gap-1 text-[13px] text-[#a6bdb4]">
          Kapacita (h)
          <CisloPole hodnota={kapacita} od={1} po={20} popisek="Kapacita stroje v hodinách" onZmena={(n) => zmen({ uprava: { zakazky, kapacita: n } })} />
        </label>
        {zakazky.map((z) => (
          <fieldset key={z.id} className="flex flex-col gap-1 text-[13px] text-[#a6bdb4]">
            <legend className="mb-1">{z.nazev}</legend>
            <div className="flex items-center gap-1">
              <CisloPole hodnota={z.doba} od={1} po={20} popisek={`${z.nazev}: doba v hodinách`} onZmena={(n) => upravZakazku(z.id, { doba: n })} />
              <span>h</span>
              <CisloPole hodnota={z.prinos} od={0} po={99} popisek={`${z.nazev}: přínos v tisících Kč`} onZmena={(n) => upravZakazku(z.id, { prinos: n })} />
            </div>
          </fieldset>
        ))}
        <button type="button" onClick={puvodni} className={tlacitko}>
          <RotateCcw className="h-4 w-4" /> Původní zadání
        </button>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        <Vysledek nazev="Tabulka: jistě nejlepší" jak="U každého úkolu porovná obě možnosti, vzít ho, nebo ne." plan={optimum} zakazky={zakazky} optimum={optimum.prinos} />
        <Vysledek nazev="Nejvýnosnější první" jak="Bere od největšího přínosu, co se nevejde, přeskočí." plan={nejvynosnejsi} zakazky={zakazky} optimum={optimum.prinos} />
        <Vysledek nazev="Nejlepší přínos za hodinu" jak="Bere od největšího přínosu na hodinu (přínos : doba), co se nevejde, přeskočí." plan={zaHodinu} zakazky={zakazky} optimum={optimum.prinos} />
      </div>

      {ztrata >= 0.25 && (
        <Hlaska druh="ok">
          Úkol 4 máš: přínos za hodinu tu dá {zaHodinu.prinos} tis. Kč, tabulka {optimum.prinos} tis. Kč. Pravidlo ztratilo{" "}
          {Math.round(ztrata * 100)} %. Kolik ztratí, dopředu nevíš, a v tom je ten rozdíl proti tabulce.
        </Hlaska>
      )}
      {pocetOptim > 1 && <Hlaska>Stejně dobrých plánů je tu víc. Tabulka ukazuje jeden z nich.</Hlaska>}

      <TabulkaDP zakazky={zakazky} kapacita={kapacita} tabulka={tabulka} cesta={cesta} />

      <Karta nadpis="Vyplatí se tabulka vždycky?">
        <label className="flex flex-wrap items-center gap-3 text-[14px] text-[#c5d6cf]">
          Počet úkolů: <b className="w-6 tabular-nums">{pocet}</b>
          <input
            type="range"
            min={1}
            max={40}
            value={pocet}
            onChange={(e) => nastavPocet(Number(e.target.value))}
            aria-label="Počet úkolů"
            className="w-64 accent-[#6fe3c2]"
          />
        </label>
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
          <div className="rounded-lg bg-[#122019] p-3">
            <div className="text-[13px] text-[#a6bdb4]">Zkoušet všechny kombinace: 2^{pocet}</div>
            <div className="text-[20px] font-semibold tabular-nums">{cislo(kombinace)}</div>
          </div>
          <div className="rounded-lg bg-[#122019] p-3">
            <div className="text-[13px] text-[#a6bdb4]">
              Buňky tabulky: {pocet} × ({kapacita} + 1), bez řádku „žádný úkol“
            </div>
            <div className="text-[20px] font-semibold tabular-nums">{cislo(bunky)}</div>
          </div>
        </div>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
          {`${srovnaniPetiUkolu(kapacita, vyplatiSe)} Tabulka ale roste i s kapacitou: každá hodina přidá sloupec.`}
        </p>
        <div className="mt-2">
          <Zjednoduseno>Porovnáváme počet kombinací a buněk. Práce na jednu kombinaci a na jednu buňku není úplně stejná.</Zjednoduseno>
        </div>
      </Karta>

      {nejvynosnejsi.prinos === optimum.prinos && zaHodinu.prinos === optimum.prinos && (
        <Hlaska>U těchto čísel obě pravidla našla nejlepší přínos. To je náhoda zadání, ne záruka. Tabulka to ví jistě pro jakákoli čísla.</Hlaska>
      )}

      <div>
        <button type="button" onClick={dal} className={hlavni}>
          Na výzvu <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Věta o pěti úkolech podle skutečných čísel. Při malé kapacitě je tabulka menší
 * než 32 kombinací už u pěti úkolů (Codex 7. 11. 2026: dřív tvrdila opak).
 */
function srovnaniPetiUkolu(kapacita: number, vyplatiSe: number): string {
  const kombinace = pocetKombinaci(5);
  const bunky = pocetBunek(5, kapacita);
  if (bunky >= kombinace) {
    return `Pro pět úkolů by se dalo vyzkoušet všech ${kombinace} kombinací a tabulka má dokonce víc buněk (${bunky}). Výhra přichází až s větším počtem: při ${kapacita} h je kombinací víc než buněk od ${vyplatiSe} úkolů.`;
  }
  return `Pro pět úkolů a ${kapacita} h je kombinací ${kombinace} a buněk tabulky ${bunky}, takže tabulka je menší už tady. Kombinací je víc než buněk od ${vyplatiSe} úkolů.`;
}
