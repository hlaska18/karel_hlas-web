"use client";

/** Výzva s vlastními čísly. Je formativní, proto se kontroluje hned a jde opakovat. */

import { useEffect, useMemo } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { komentarKroku } from "@/lib/algolab/batoh";
import { PRAZDNA_VYZVA, type StavBatohu } from "@/lib/algolab/stav";
import { vygenerujVyzvu } from "@/lib/algolab/vyzva";
import { Hlaska, Karta, TabulkaDP, hlavni, poleTrida, tlacitko } from "./spolecne";

const novySeed = () => Math.floor(Math.random() * 4294967296);

export function FazeVyzva({ stav, zmen, dal }: { stav: StavBatohu; zmen: (zmena: Partial<StavBatohu>) => void; dal: () => void }) {
  const seed = stav.seedVyzvy;
  /* Náhoda až po připojení a jednou: návrat do fáze zadání nemění. */
  useEffect(() => {
    if (seed === null) zmen({ seedVyzvy: novySeed() });
  }, [seed, zmen]);

  const vyzva = useMemo(() => (seed === null ? null : vygenerujVyzvu(seed)), [seed]);
  if (!vyzva) return null;

  const { bunky, vyznam, kapacitaNavic, zakazky, kapacita, tabulka } = vyzva;
  const o = stav.vyzva;
  const uprav = (zmena: Partial<typeof o>) => zmen({ vyzva: { ...o, zkontrolovano: false, ...zmena } });

  const bunkyOk = bunky.map((b, i) => o.bunky[i].trim() !== "" && Number(o.bunky[i]) === b.hodnota);
  const vyznamOk = o.vyznam !== null && vyznam.moznosti[o.vyznam]?.spravne === true;
  const rozdilOk = o.rozdil.trim() !== "" && Number(o.rozdil) === kapacitaNavic.rozdil;
  const vse = bunkyOk.every(Boolean) && vyznamOk && rozdilOk;
  const vyplneno = o.bunky.every((b) => b.trim() !== "") && o.vyznam !== null && o.rozdil.trim() !== "";

  const zkontroluj = () => {
    zmen({
      vyzva: { ...o, zkontrolovano: true },
      ...(vse && !stav.hotovo.includes("vyzva") ? { hotovo: [...stav.hotovo, "vyzva" as const] } : {}),
    });
  };

  const indexBunky = (r: number, s: number) => bunky.findIndex((b) => b.radek === r && b.sloupec === s);
  const planText = zakazky.filter((z) => kapacitaNavic.plan.ids.includes(z.id)).map((z) => z.nazev).join(" + ");
  const zakazkaVyznamu = zakazky[vyznam.radek - 1];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold">Nová čísla, stejný postup</h2>
        <button type="button" onClick={() => zmen({ seedVyzvy: novySeed(), vyzva: PRAZDNA_VYZVA })} className={tlacitko}>
          <RotateCcw className="h-4 w-4" /> Jiná čísla
        </button>
      </div>
      <p className="text-[15px] leading-relaxed text-[#c5d6cf]">
        Stroj má {kapacita} volných hodin. Tentokrát za tebe počítač nic nedoplní, ale po kontrole hned uvidíš, jak to dopadlo. Tahle výzva
        se neznámkuje.
      </p>

      <Karta nadpis="1. Doplň tři buňky s rámečkem">
        <TabulkaDP
          zakazky={zakazky}
          kapacita={kapacita}
          tabulka={tabulka}
          vlastni={(r, s) => {
            const i = indexBunky(r, s);
            if (i < 0) return null;
            const trida =
              o.zkontrolovano && bunkyOk[i] ? "border-[#6fe3c2]" : o.zkontrolovano ? "border-[#ff9d8a]" : "border-[#6fe3c2]/60";
            return (
              <input
                type="number"
                value={o.bunky[i]}
                aria-label={`${zakazky[r - 1].nazev}, ${s} h`}
                onChange={(e) => uprav({ bunky: o.bunky.map((b, j) => (j === i ? e.target.value : b)) })}
                className={`${poleTrida} w-[52px] !px-1 !py-0.5 text-center ${trida}`}
              />
            );
          }}
        />
        {o.zkontrolovano &&
          bunky.map((b, i) =>
            bunkyOk[i] ? null : (
              <div key={i} className="mt-2">
                <Hlaska druh="tip">
                  <b>
                    {b.zakazka.nazev}, {b.sloupec} h:
                  </b>{" "}
                  {komentarKroku(b)}
                </Hlaska>
              </div>
            ),
          )}
      </Karta>

      <Karta nadpis={`2. Co znamená číslo v řádku ${zakazkaVyznamu.nazev} a sloupci ${vyznam.sloupec}?`}>
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Význam buňky">
          {vyznam.moznosti.map((m, i) => (
            <label key={m.text} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-[14px] leading-relaxed hover:bg-[#101c18]">
              <input
                type="radio"
                name="vyznam-bunky"
                checked={o.vyznam === i}
                onChange={() => uprav({ vyznam: i })}
                className="mt-1 accent-[#6fe3c2]"
              />
              {m.text}
            </label>
          ))}
        </div>
        {o.zkontrolovano && !vyznamOk && (
          <div className="mt-2">
            <Hlaska druh="tip">
              Řádek určuje, ze kterých úkolů smíš vybírat (všechny až po tento řádek), a sloupec, kolik hodin máš. Hodnota je nejlepší
              výsledek, ne přínos jednoho úkolu.
            </Hlaska>
          </div>
        )}
      </Karta>

      <Karta nadpis={`3. Stroj dostane hodinu navíc (${kapacita + 1} h). O kolik tisíc Kč vzroste nejlepší přínos?`}>
        <p className="mb-2 text-[14px] leading-relaxed text-[#c5d6cf]">
          V tabulce chybí jeden sloupec. Dopočítej ho, nebo zadání přenes do části Změň zadání.
        </p>
        <input
          type="number"
          value={o.rozdil}
          aria-label="O kolik vzroste nejlepší přínos"
          onChange={(e) => uprav({ rozdil: e.target.value })}
          className={`${poleTrida} w-[90px]`}
        />
        {o.zkontrolovano && !rozdilOk && (
          <div className="mt-2">
            <Hlaska druh="tip">
              Při {kapacita + 1} h je nejlepší {planText} za {kapacitaNavic.prinos} tis. Kč, tedy o {kapacitaNavic.rozdil} více. Hodina navíc může
              změnit celý plán, nejen přidat úkol.
            </Hlaska>
          </div>
        )}
      </Karta>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!vyplneno} onClick={zkontroluj} className={hlavni}>
          Zkontrolovat
        </button>
        {!vyplneno && <span className="text-[13px] text-[#a6bdb4]">Vyplň všechny tři části.</span>}
      </div>

      {o.zkontrolovano && (
        <div role="status" className="flex flex-col items-start gap-2.5">
          {vse ? (
            <>
              <Hlaska druh="ok">
                Všechno správně. Nejlepší plán při {kapacita} h přinese {vyzva.optimum.prinos} tis. Kč a obě hladová pravidla ho tady minula.
              </Hlaska>
              <button type="button" onClick={dal} className={hlavni}>
                Na reflexi <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Hlaska druh="tip">Něco ještě nesedí. Podívej se na poznámky výš a oprav to.</Hlaska>
          )}
        </div>
      )}
    </div>
  );
}
