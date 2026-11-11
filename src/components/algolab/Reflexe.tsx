"use client";

/** Závěr lekce: vlastní slova nejdřív, vzorová odpověď až potom. */

import type { StavBatohu } from "@/lib/algolab/stav";
import { AlgoritmyHodiny } from "./JakFunguje";
import { Hlaska, Karta, NovyPojem, hlavni, tlacitko } from "./spolecne";

export function FazeReflexe({ stav, zmen }: { stav: StavBatohu; zmen: (zmena: Partial<StavBatohu>) => void }) {
  const odkryj = () =>
    zmen({ vzorOdkryt: true, hotovo: stav.hotovo.includes("reflexe") ? stav.hotovo : [...stav.hotovo, "reflexe"] });

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h2 className="text-[22px] font-semibold">Co si z toho bereš?</h2>
      <Karta nadpis="Proč nestačilo brát nejvýnosnější úkol, a jak může tabulka bez zkoušení všech plánů zaručit nejlepší výsledek?">
        <textarea
          value={stav.reflexe}
          onChange={(e) => zmen({ reflexe: e.target.value })}
          rows={5}
          aria-label="Tvoje odpověď"
          placeholder="Napiš to vlastními slovy, stačí dvě tři věty."
          className="w-full rounded-lg border border-[#6f8a80] bg-[#080d0b] p-2.5 text-[14px] leading-relaxed text-[#e8f3ef] placeholder:text-[#a6bdb4]"
        />
        <p className="mt-1 text-[12px] text-[#a6bdb4]">Odpověď se ukládá jen v tomhle prohlížeči, nikam se neposílá.</p>
        <div className="mt-2.5">
          {stav.vzorOdkryt ? (
            <button type="button" onClick={() => zmen({ vzorOdkryt: false })} className={tlacitko}>
              Skrýt vzorovou odpověď
            </button>
          ) : (
            <button type="button" disabled={stav.reflexe.trim().length < 10} onClick={odkryj} className={hlavni}>
              Porovnat se vzorovou odpovědí
            </button>
          )}
        </div>
      </Karta>

      {stav.vzorOdkryt && (
        <Hlaska druh="ok">
          Velký úkol může zabrat čas, který by dva menší využily lépe, takže rozhodnutí o jednom úkolu závisí na tom, co zbyde na ostatní.
          Tabulka nezkouší celé plány. Pro každý počet hodin si pamatuje nejlepší výsledek dosavadních úkolů. Nejlepší plán poslední úkol
          buď obsahuje, nebo ne. Pro oba případy tabulka už zná nejlepší výsledek: bez úkolu je to hodnota přímo nad buňkou, s úkolem jeho
          přínos plus nejlepší výsledek za zbylé hodiny z řádku nad. Vybere lepší z nich a jiná možnost není. Porovnej to se svou odpovědí: jsou v ní obě části?
        </Hlaska>
      )}

      <div className="grid gap-2.5 md:grid-cols-2">
        <NovyPojem pojem="Problém batohu 0/1">
          Vyber věci s co největší celkovou hodnotou tak, aby se vešly do omezené kapacity. Každou věc buď vezmeš celou (1), nebo vůbec (0).
        </NovyPojem>
        <NovyPojem pojem="Hladové pravidlo">
          V každém kroku bere to, co teď vypadá nejlépe, a rozhodnutí už nemění. Bývá rychlé. U batohu nejlepší výsledek nezaručuje,
          protože úkol jde vzít jen celý. U některých úloh ho zaručí, třeba když vracíš drobné v českých mincích co nejmenším počtem mincí a máš jich dost: vždycky vezmeš největší minci, která se ještě vejde.
        </NovyPojem>
        <NovyPojem pojem="Dílčí problém">
          Menší verze téže úlohy: méně úkolů, méně hodin. Z výsledků menších úloh se skládá výsledek větší.
        </NovyPojem>
        <NovyPojem pojem="Dynamické programování">
          Postup, který si výsledky dílčích problémů ukládá, aby je nemusel počítat znovu. Tady je tou pamětí tabulka.
        </NovyPojem>
      </div>
      <AlgoritmyHodiny algoritmy={["batoh"]} />
    </div>
  );
}
