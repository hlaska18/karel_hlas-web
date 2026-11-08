"use client";

/** První dvě fáze lekce: problém a vlastní pokus s oběma hladovými pravidly. */

import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { KAPACITA, ZAKAZKY, planZ, pravidloNejvynosnejsi, pravidloZaHodinu, type VysledekPravidla } from "@/lib/algolab/batoh";
import type { Pravidlo, StavBatohu } from "@/lib/algolab/stav";
import { Hlaska, Kapacita, Karta, Zjednoduseno, hlavni, tlacitko } from "./spolecne";

type Props = {
  stav: StavBatohu;
  zmen: (zmena: Partial<StavBatohu>) => void;
  dal: () => void;
};

const NEJVYNOSNEJSI = pravidloNejvynosnejsi(ZAKAZKY, KAPACITA);
const ZA_HODINU = pravidloZaHodinu(ZAKAZKY, KAPACITA);

const TIPY: { id: Pravidlo; text: string }[] = [
  { id: "nejvynosnejsi", text: "Nejvýnosnější první" },
  { id: "zaHodinu", text: "Nejlepší přínos za hodinu" },
  { id: "stejne", text: "Dají stejně" },
];

export function FazeProblem({ dal }: Pick<Props, "dal">) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h2 className="text-[22px] font-semibold">Které úkoly vzít?</h2>
      <p className="text-[15px] leading-relaxed text-[#c5d6cf]">
        Do konce týdne má stroj {KAPACITA} volných hodin a čeká na něj pět výrobních úkolů. Všechny se nestihnou. Ty rozhodneš,
        které stroj udělá, aby přínos pro firmu byl co největší.
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-[14px]">
          <thead className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Úkol</th>
              <th scope="col" className="px-3 py-2 font-medium">Doba výroby</th>
              <th scope="col" className="px-3 py-2 font-medium">Přínos</th>
            </tr>
          </thead>
          <tbody>
            {ZAKAZKY.map((z) => (
              <tr key={z.id} className="border-t border-white/[.07]">
                <td className="px-3 py-2">{z.nazev}</td>
                <td className="px-3 py-2 tabular-nums">{z.doba} h</td>
                <td className="px-3 py-2 tabular-nums">{z.prinos} tis. Kč</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Zjednoduseno>
        Úkol se udělá celý a jen jednou, jediné omezení je čas stroje a počítá se v celých hodinách. Skutečné plánování řeší taky
        termíny, přestavbu stroje nebo materiál.
      </Zjednoduseno>
      <div>
        <button type="button" onClick={dal} className={hlavni}>
          Sestavit vlastní plán <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Přínos za hodinu česky, na jedno desetinné místo (5,5). */
const zaHodinu = (prinos: number, doba: number) =>
  (prinos / doba).toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Druh = "prinos" | "zaHodinu";

const PRAVIDLA: { druh: Druh; nazev: string; radi: string; vysledek: VysledekPravidla }[] = [
  { druh: "prinos", nazev: "Nejvýnosnější první", radi: "podle přínosu, od největšího", vysledek: NEJVYNOSNEJSI },
  {
    druh: "zaHodinu",
    nazev: "Nejlepší přínos za hodinu",
    radi: "podle přínosu na jednu hodinu práce (přínos : doba), od největšího",
    vysledek: ZA_HODINU,
  },
];

/** Podle čeho pravidlo úkol zařadilo, např. „36 tis. Kč“ nebo „11 : 2 = 5,5 tis. Kč/h“. */
function Klic({ druh, doba, prinos }: { druh: Druh; doba: number; prinos: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      {druh === "prinos" ? `${prinos} tis. Kč` : `${prinos} : ${doba} = ${zaHodinu(prinos, doba)} tis. Kč/h`}
    </span>
  );
}

/** Seřazený seznam úkolů jednoho pravidla, ještě bez rozhodování (před tipem). */
function PoradiPravidla({ druh, nazev, radi, vysledek }: (typeof PRAVIDLA)[number]) {
  return (
    <div className="rounded-lg bg-[#122019] p-3">
      <div className="text-[15px] font-semibold">{nazev}</div>
      <p className="mb-2 text-[13px] text-[#a6bdb4]">Seřadí úkoly {radi}:</p>
      <ol className="flex flex-col gap-1 text-[14px]">
        {vysledek.poradi.map(({ zakazka }, i) => (
          <li key={zakazka.id} className="flex justify-between gap-3">
            <span>
              {i + 1}. {zakazka.nazev} <span className="text-[#a6bdb4]">({zakazka.doba} h)</span>
            </span>
            <Klic druh={druh} doba={zakazka.doba} prinos={zakazka.prinos} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Průchod pravidla krok za krokem: co vzalo, co přeskočilo a kolik hodin zbylo. */
function PrubehPravidla({ druh, nazev, vysledek }: (typeof PRAVIDLA)[number]) {
  let zbyva = KAPACITA;
  const kroky = vysledek.poradi.map(({ zakazka, vzata }) => {
    const pred = zbyva;
    if (vzata) zbyva -= zakazka.doba;
    return { zakazka, vzata, pred, po: zbyva };
  });
  return (
    <Karta nadpis={nazev}>
      <p className="mb-2 text-[13px] text-[#a6bdb4]">Začíná s {KAPACITA} volnými hodinami a jde odshora:</p>
      <ol className="flex flex-col gap-1.5 text-[14px]">
        {kroky.map(({ zakazka, vzata, pred, po }, i) => (
          <li key={zakazka.id} className={vzata ? "" : "text-[#a6bdb4]"}>
            <div className="flex justify-between gap-3">
              <span className={vzata ? "font-semibold" : ""}>
                {i + 1}. {zakazka.nazev} ({zakazka.doba} h)
              </span>
              <Klic druh={druh} doba={zakazka.doba} prinos={zakazka.prinos} />
            </div>
            <div className="text-[13px]">
              {vzata
                ? po > 0
                  ? `Vezme. Zbude ${po} h.`
                  : "Vezme. Stroj je plný."
                : pred > 0
                  ? `Přeskočí: trvá ${zakazka.doba} h, volné jsou jen ${pred} h.`
                  : "Přeskočí: stroj už je plný."}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-2.5 border-t border-white/10 pt-2 text-[14px] font-semibold tabular-nums">
        Vzalo {vysledek.poradi.filter((p) => p.vzata).map((p) => p.zakazka.nazev).join(" + ")}: {vysledek.doba} h,{" "}
        {vysledek.prinos} tis. Kč
      </p>
    </Karta>
  );
}

export function FazePokus({ stav, zmen, dal }: Props) {
  const [varovani, nastavVarovani] = useState("");
  const plan = planZ(ZAKAZKY, stav.plan);

  const prepni = (id: string) => {
    if (stav.planPotvrzen) return;
    if (stav.plan.includes(id)) {
      nastavVarovani("");
      zmen({ plan: stav.plan.filter((x) => x !== id) });
      return;
    }
    const z = ZAKAZKY.find((x) => x.id === id)!;
    const zbyva = KAPACITA - plan.doba;
    if (z.doba > zbyva) {
      nastavVarovani(`${z.nazev} se nevejdou: trvají ${z.doba} h a zbývá ${zbyva} h. Nejdřív něco odeber.`);
      return;
    }
    nastavVarovani("");
    zmen({ plan: [...stav.plan, id] });
  };

  const nejlepsiPravidlo = Math.max(NEJVYNOSNEJSI.prinos, ZA_HODINU.prinos);

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <h2 className="text-[22px] font-semibold">Sestav svůj plán</h2>
      <p className="text-[15px] leading-relaxed text-[#c5d6cf]">Klikáním vyber úkoly. Jaký největší přínos dokážeš získat za {KAPACITA} hodin?</p>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
        {ZAKAZKY.map((z) => {
          const vybrana = stav.plan.includes(z.id);
          return (
            <button
              key={z.id}
              type="button"
              aria-pressed={vybrana}
              disabled={stav.planPotvrzen}
              onClick={() => prepni(z.id)}
              className={`rounded-xl border p-3 text-left ${
                vybrana ? "border-[#6fe3c2] bg-[#123c30]" : "border-white/[.14] bg-[#0d1714] hover:bg-[#101c18]"
              } disabled:cursor-default`}
            >
              <span className="flex items-start justify-between gap-1 text-[14px] font-semibold">
                {z.nazev}
                {vybrana && <Check className="h-4 w-4 shrink-0 text-[#6fe3c2]" strokeWidth={2.6} aria-hidden="true" />}
              </span>
              <span className="mt-1.5 block text-[13px] tabular-nums text-[#c5d6cf]">
                {z.doba} h, {z.prinos} tis. Kč
              </span>
            </button>
          );
        })}
      </div>

      <Kapacita pouzito={plan.doba} kapacita={KAPACITA} />
      {varovani && (
        <div role="alert">
          <Hlaska druh="tip">{varovani}</Hlaska>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[16px] font-semibold tabular-nums">Tvůj plán: {plan.prinos} tis. Kč</span>
        {stav.planPotvrzen ? (
          <button type="button" onClick={() => zmen({ planPotvrzen: false, tip: null })} className={tlacitko}>
            Změnit plán
          </button>
        ) : (
          <button type="button" disabled={!stav.plan.length} onClick={() => zmen({ planPotvrzen: true })} className={hlavni}>
            Tohle je můj plán
          </button>
        )}
      </div>

      {stav.planPotvrzen && (
        <Karta nadpis="Dvě pravidla, která napadnou skoro každého">
          <p className="mb-3 text-[14px] leading-relaxed text-[#c5d6cf]">
            Obě pravidla postupují stejně: seřadí úkoly a berou je odshora. Když se úkol do zbývajících hodin nevejde, přeskočí ho a
            zkusí další. Liší se jen tím, <b>podle čeho</b> úkoly seřadí.
          </p>
          <div className="mb-3 grid gap-2.5 lg:grid-cols-2">
            {PRAVIDLA.map((p) => (
              <PoradiPravidla key={p.druh} {...p} />
            ))}
          </div>
          <p className="mb-2 text-[14px] font-semibold">Tipni si nejdřív: projdi oba seznamy s {KAPACITA} hodinami v ruce. Které pravidlo dá větší přínos?</p>
          <div className="flex flex-wrap gap-2">
            {TIPY.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={stav.tip === t.id}
                disabled={stav.tip !== null}
                onClick={() => zmen({ tip: t.id })}
                className={`${tlacitko} ${stav.tip === t.id ? "!border-[#6fe3c2] !text-[#e8f3ef]" : ""}`}
              >
                {t.text}
              </button>
            ))}
          </div>
        </Karta>
      )}

      {stav.planPotvrzen && stav.tip && (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {PRAVIDLA.map((p) => (
              <PrubehPravidla key={p.druh} {...p} />
            ))}
          </div>
          <Hlaska druh={stav.tip === "zaHodinu" ? "ok" : "tip"}>
            {stav.tip === "zaHodinu" ? "Tip vyšel. " : "Tip nevyšel. "}
            Nejlepší přínos za hodinu dá {ZA_HODINU.prinos} tis. Kč, nejvýnosnější první {NEJVYNOSNEJSI.prinos} tis. Kč. Nejvýnosnější
            první vezme hned {NEJVYNOSNEJSI.poradi[0].zakazka.nazev.toLowerCase()} na {NEJVYNOSNEJSI.poradi[0].zakazka.doba} h a na další dobré úkoly
            už nezbude čas.
          </Hlaska>
          <Hlaska>
            {plan.prinos > nejlepsiPravidlo
              ? `Tvůj plán za ${plan.prinos} tis. Kč porazil obě pravidla. Takže ani jedno z nich nehledá nejlepší řešení. Je nejlepší tvůj plán?`
              : plan.prinos === nejlepsiPravidlo
                ? `Tvůj plán dal stejně jako lepší z pravidel. Existuje ještě lepší?`
                : `Tvůj plán dal ${plan.prinos} tis. Kč, lepší z pravidel ${nejlepsiPravidlo} tis. Kč. Existuje ještě lepší plán než ${nejlepsiPravidlo} tis. Kč?`}{" "}
            Z toho, co zatím máš, to nepoznáš. Potřebuješ postup, který to zaručí.
          </Hlaska>
          <div>
            <button type="button" onClick={dal} className={hlavni}>
              Najít jistotu <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
