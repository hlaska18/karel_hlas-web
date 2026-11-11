"use client";

/** Hodina 2: rozděl a panuj. Bubble Sort proti Merge Sortu, rekurze. */

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FAZE_LEKCE } from "@/lib/algolab/lekce";
import { novySeed } from "@/lib/algolab/nahoda";
import {
  bubbleKroky,
  bubblePorovnani,
  inverze,
  KARTY,
  mergeNejvic,
  mergeSort,
  urovneDeleni,
  urovniDeleni,
  VELIKOSTI_RAZENI,
  vychoziH2,
  vyzvaRazeni,
  type DataH2,
} from "@/lib/algolab/razeni";
import { cislaZTextu } from "@/lib/algolab/vyhledavani";
import { Casti, Dal, KontrolaVyzvy, KostraLekce, Krokovac, Nadpis, Otazka, ReflexeLekce, Stitek, TipniSi, cisloOdpovedi, cz, useLekce, useSeed } from "./Kostra";
import { Hlaska, Karta, Zjednoduseno, hlavni, tlacitko } from "./spolecne";
import { JakFunguje } from "./JakFunguje";

type Zmen = (z: Partial<DataH2>) => void;

const SERAZENE = KARTY.slice().sort((a, b) => a - b);
const MIN_VYMEN = inverze(KARTY);
const BUBBLE = bubbleKroky(KARTY);
const MERGE = mergeSort(KARTY);
const UROVNE = urovneDeleni(KARTY);
/** Kroky slévání za sebou: [index slévání, kolik karet už je ve výsledku]. */
const KROKY_MERGE: [number, number][] = MERGE.slevani.flatMap((s, i) => s.kroky.map((_, k) => [i, k + 1] as [number, number]));
const POROVNANI_MERGE = MERGE.slevani.reduce((s, x) => s + x.porovnani, 0);

export function Hodina2() {
  const { stav, data, zmen, jdiNa } = useLekce(2, FAZE_LEKCE, vychoziH2);
  return (
    <KostraLekce faze={FAZE_LEKCE} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "problem" && <Problem dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <Pokus data={data} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <Experiment data={data} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <Vyzva data={data} zmen={zmen} dal={() => jdiNa("reflexe", "vyzva")} />}
      {stav.faze === "reflexe" && (
        <ReflexeLekce
          algoritmy={["bubble", "merge"]}
          otazka="Proč je Merge Sort u velkého balíku mnohem rychlejší než Bubble Sort a co znamená, že Merge Sort „volá sám sebe“?"
          text={data.reflexe}
          zmenText={(t) => zmen({ reflexe: t })}
          odkryto={data.vzor}
          odkryj={() => {
            zmen({ vzor: true });
            jdiNa("reflexe", "reflexe");
          }}
          skryj={() => zmen({ vzor: false })}
          vzor={
            <>
              Bubble Sort porovnává každou kartu skoro s každou, takže při dvojnásobku karet udělá zhruba čtyřnásobek porovnání. Merge Sort
              balík půlí, a půlit jde jen asi log₂ n krát. Na každé úrovni dělení slévá všechny karty jednou, při slévání karty porovnává
              jen s vrchní kartou druhé hromádky. Proto má zhruba n · log₂ n porovnání. „Volá sám sebe“ znamená, že poloviny řadí stejným
              postupem jako celý balík, dokud nezbude jediná karta. Ta je seřazená sama o sobě. Porovnej to se svou odpovědí: je v ní půlení,
              slévání a konec rekurze?
            </>
          }
          pojmy={[
            { pojem: "Řazení", text: "Uspořádání položek podle klíče, třeba čísel od nejmenšího. Je základem rychlého hledání (hodina 1)." },
            {
              pojem: "Rozděl a panuj",
              text: "Velký problém se rozdělí na menší stejného druhu, ty se vyřeší a jejich výsledky se spojí. U Merge Sortu: rozpůlit, seřadit poloviny, slít.",
            },
            {
              pojem: "Rekurze",
              text: "Postup, který k vyřešení části úlohy použije sám sebe. Musí mít konec: u Merge Sortu je to hromádka s jedinou kartou.",
            },
            { pojem: "Slévání", text: "Spojení dvou seřazených hromádek do jedné. Stačí porovnávat jen vrchní karty obou hromádek." },
          ]}
          zaver="Příště: dynamické programování. Taky skládá velké řešení z menších, ale menší úlohy si ukládá do tabulky, protože se opakují."
        />
      )}
    </KostraLekce>
  );
}

function Problem({ dal }: { dal: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis
        uvod="Kontrola kvality dostala karty naměřených hřídelí. Na každé je průměr v milimetrech. Než je zapíše do protokolu, musí je seřadit od nejmenšího průměru. V protokolu za den jich ale bývají tisíce."
      >
        Seřaď karty
      </Nadpis>
      <div className="flex flex-wrap gap-1.5">
        {KARTY.map((k) => (
          <Stitek key={k}>{k} mm</Stitek>
        ))}
      </div>
      <Karta>
        <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
          Pravidlo: smíš prohodit jen dvě karty, které leží vedle sebe. Tak to dělá i jednoduchý program, který čísla v poli porovnává a
          prohazuje.
        </p>
      </Karta>
      <Dal onClick={dal}>Řadit karty</Dal>
    </div>
  );
}

function Pokus({ data, zmen, dal }: { data: DataH2; zmen: Zmen; dal: () => void }) {
  const poradi = data.poradi.length === KARTY.length ? data.poradi : KARTY;
  const hotovo = JSON.stringify(poradi) === JSON.stringify(SERAZENE);
  const prohod = (i: number) => {
    const nove = poradi.slice();
    [nove[i], nove[i + 1]] = [nove[i + 1], nove[i]];
    zmen({ poradi: nove, vymen: data.vymen + 1 });
  };
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod="Kliknutím na šipky mezi kartami je prohodíš. Seřaď je od nejmenšího průměru zleva.">Vlastní pokus</Nadpis>
      <div className="flex flex-wrap items-center gap-1">
        {poradi.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <Stitek stav={hotovo ? "hotovo" : "zakladni"}>{k} mm</Stitek>
            {i < poradi.length - 1 && (
              <button
                type="button"
                disabled={hotovo}
                onClick={() => prohod(i)}
                aria-label={`Prohodit ${k} a ${poradi[i + 1]}`}
                className="rounded-md p-1.5 text-[#a6bdb4] hover:bg-[#18332b] hover:text-[#6fe3c2] disabled:opacity-30"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            )}
          </span>
        ))}
      </div>
      <p className="text-[14px] text-[#c5d6cf]" aria-live="polite">
        Výměn: <b className="tabular-nums">{data.vymen}</b>
      </p>
      {hotovo && (
        <Hlaska druh="ok">
          Seřazeno na {data.vymen} {data.vymen === 1 ? "výměnu" : data.vymen < 5 ? "výměny" : "výměn"}.{" "}
          {data.vymen === MIN_VYMEN
            ? "Míň to nejde."
            : `Šlo by to na ${MIN_VYMEN}, míň ne.`}{" "}
          Dvojic karet ve špatném pořadí je v balíku {MIN_VYMEN} a jedna výměna sousedů opraví právě jednu takovou dvojici. U tisíce karet
          jich může být skoro půl milionu.
        </Hlaska>
      )}
      <div>
        <button type="button" onClick={() => zmen({ poradi: KARTY.slice(), vymen: 0 })} disabled={!data.vymen} className={tlacitko}>
          Zamíchat zpět a zkusit znovu
        </button>
      </div>
      <Dal onClick={dal} disabled={!hotovo}>
        Pokračovat k experimentu
      </Dal>
    </div>
  );
}

/* ───────────── Experiment ───────────── */

const CASTI = [
  { id: "bubble", nazev: "Bubble Sort" },
  { id: "merge", nazev: "Merge Sort" },
  { id: "rust", nazev: "Jak to roste" },
];

function Experiment({ data, zmen, dal }: { data: DataH2; zmen: Zmen; dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-semibold">Experiment</h2>
        <Casti casti={CASTI} aktualni={data.cast} vyber={(c) => zmen({ cast: c })} />
      </div>
      {data.cast === "bubble" && <Bubble data={data} zmen={zmen} />}
      {data.cast === "merge" && <Merge data={data} zmen={zmen} />}
      {data.cast === "rust" && <Rust dal={dal} />}
    </div>
  );
}

function Bubble({ data, zmen }: { data: DataH2; zmen: Zmen }) {
  const krok = Math.min(data.krokBubble, BUBBLE.length);
  const k = krok > 0 ? BUBBLE[krok - 1] : null;
  const pole = k ? k.pole : KARTY;
  const hotovoOd = k ? (krok === BUBBLE.length ? 0 : k.hotovoOd) : KARTY.length;
  return (
    <div className="flex flex-col gap-3.5">
      <JakFunguje algoritmus="bubble" />
      <div className="flex flex-wrap gap-1.5" aria-hidden="true">
        {pole.map((c, i) => (
          <Stitek key={i} stav={i >= hotovoOd ? "hotovo" : k && (i === k.i || i === k.i + 1) ? "aktivni" : "zakladni"}>
            {c}
          </Stitek>
        ))}
      </div>
      <Krokovac krok={krok} pocet={BUBBLE.length} nastav={(n) => zmen({ krokBubble: n })} popisek="Porovnání" />
      <p className="min-h-[24px] text-[14px] leading-relaxed" aria-live="polite">
        {k
          ? `${k.pruchod}. průchod: ${k.prohodit ? `${k.pole[k.i + 1]} > ${k.pole[k.i]}, karty se prohodí.` : `${k.pole[k.i]} ≤ ${k.pole[k.i + 1]}, karty zůstanou.`}`
          : "Zatím nic neporovnáno."}
      </p>
      {krok === BUBBLE.length && (
        <>
          <Hlaska>
            Seřazeno po {BUBBLE.length} porovnáních. Bubble Sort pro {KARTY.length} karet udělá vždy 7 + 6 + 5 + 4 + 3 + 2 + 1 ={" "}
            {bubblePorovnani(KARTY.length)} porovnání, i když jsou karty skoro seřazené.
          </Hlaska>
          <Karta>
            <Zjednoduseno>
              Tahle verze Bubble Sortu nikdy neskončí dřív. Vylepšená verze skončí, když v celém průchodu nic neprohodí. U zamíchaných karet
              to ale skoro nepomůže.
            </Zjednoduseno>
          </Karta>
          <button type="button" onClick={() => zmen({ cast: "merge" })} className={`${hlavni} self-start`}>
            Dál: Merge Sort
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Hromádka při slévání. Vrchní (první nevzatou) kartu jde přetáhnout do výsledku,
 * nebo na ni kliknout (klávesnice). Ostatní karty jen leží.
 */
function Hromadka({
  nazev,
  karty,
  vzato,
  strana,
  aktivni,
  vezmi,
}: {
  nazev: string;
  karty: number[];
  vzato: number;
  strana: "L" | "P";
  aktivni: boolean;
  vezmi: (strana: "L" | "P") => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[12px] text-[#a6bdb4]">{nazev}</div>
      <div className="flex min-h-[48px] flex-wrap items-center gap-1.5">
        {karty.map((c, i) => {
          if (i < vzato) return <span key={i} className="h-12 w-14 rounded-lg border border-dashed border-white/10" aria-hidden="true" />;
          const vrchni = i === vzato && aktivni;
          return vrchni ? (
            // Schválně ne <button>: Firefox tlačítko přetáhnout nedovolí.
            <div
              key={i}
              role="button"
              tabIndex={0}
              data-vrchni
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", strana);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => vezmi(strana)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                vezmi(strana);
              }}
              aria-label={`Vrchní karta ${strana === "L" ? "z levé" : "z pravé"} hromádky: ${c}. Přesunout do slité hromádky`}
              className="flex h-12 w-14 cursor-grab select-none items-center justify-center rounded-lg border-2 border-[#e5b73b] bg-[#18332b] text-[17px] font-semibold tabular-nums text-[#e8f3ef] shadow-[0_0_0_3px_rgba(229,183,59,.15)] hover:bg-[#1f4136] active:cursor-grabbing"
            >
              {c}
            </div>
          ) : (
            <span key={i} className="flex h-12 w-14 items-center justify-center rounded-lg border-2 border-white/[.14] bg-[#101c18] text-[17px] tabular-nums text-[#c5d6cf]">
              {c}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Merge({ data, zmen }: { data: DataH2; zmen: Zmen }) {
  const krok = Math.min(data.krokMerge, KROKY_MERGE.length);
  const konec = krok === KROKY_MERGE.length;
  // Rozpracované slévání: to, do kterého půjde další karta (na konci poslední celé).
  const [iSlevani, vzato] = konec ? [MERGE.slevani.length - 1, MERGE.slevani[MERGE.slevani.length - 1].kroky.length] : [KROKY_MERGE[krok][0], KROKY_MERGE[krok][1] - 1];
  const s = MERGE.slevani[iSlevani];
  const kroky = s.kroky.slice(0, vzato);
  const zLeva = kroky.filter((x) => x.odkud === "L").length;
  const zPrava = kroky.length - zLeva;
  const posledni = krok > 0 ? MERGE.slevani[KROKY_MERGE[krok - 1][0]].kroky[KROKY_MERGE[krok - 1][1] - 1] : null;
  const porovnaniDosud = MERGE.slevani.slice(0, iSlevani).reduce((a, x) => a + x.porovnani, 0) + kroky.filter((x) => x.porovnani).length;
  const zamceno = data.tipMerge < 0;
  // Chyba patří ke kroku, ve kterém vznikla (Zpět v krokovači ji tak schová).
  const [chybaKroku, nastavChybuKroku] = useState<{ krok: number; text: string } | null>(null);
  const chyba = chybaKroku && chybaKroku.krok === krok ? chybaKroku.text : "";
  const nastavChybu = (text: string) => nastavChybuKroku(text ? { krok, text } : null);
  const [nadCilem, nastavNadCilem] = useState(false);
  const hotovaSlevani = MERGE.slevani.slice(0, iSlevani);
  // Po přesunu karty zmizí tlačítko, na kterém byl fokus: vrátí se na další vrchní kartu (na konci na „Dál“).
  const obal = useRef<HTMLDivElement>(null);
  const [fokus, nastavFokus] = useState(false);
  useEffect(() => {
    if (!fokus) return;
    nastavFokus(false);
    const el = obal.current?.querySelector<HTMLElement>(konec ? "[data-dal]" : "[data-vrchni]");
    el?.focus({ preventScroll: true });
  }, [fokus, konec, krok]);
  // Jedna hromádka došla: zbytek druhé jde dolů bez porovnání, žák ho může přesunout najednou.
  const prazdna = !zamceno && !konec && (zLeva === s.levy.length || zPrava === s.pravy.length);
  const presunZbytek = () => {
    const posledniKrok = KROKY_MERGE.findIndex(([i, v]) => i === iSlevani && v === s.kroky.length);
    nastavChybu("");
    nastavFokus(true);
    zmen({ krokMerge: posledniKrok + 1 });
  };
  const vezmi = (strana: "L" | "P") => {
    if (zamceno || konec) return;
    const spravne = s.kroky[vzato];
    if (strana === spravne.odkud) {
      nastavChybu("");
      nastavFokus(true);
      zmen({ krokMerge: krok + 1 });
      return;
    }
    const tahle = strana === "L" ? s.levy[zLeva] : s.pravy[zPrava];
    nastavChybu(`${tahle} je větší než ${spravne.hodnota}. Do výsledku jde vždycky menší z obou vrchních karet.`);
  };
  return (
    <div ref={obal} className="flex flex-col gap-3.5">
      <JakFunguje algoritmus="merge" odkryto={konec} />
      <Karta nadpis="Dělení">
        <div className="flex flex-col gap-1.5" aria-label="Úrovně dělení balíku">
          {UROVNE.map((u, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5">
              <span className="w-[70px] text-[12px] text-[#a6bdb4]">{i === 0 ? "balík" : `${i}. půlení`}</span>
              {u.map((cast, j) => (
                <span key={j} className="rounded-md border border-white/[.14] px-1.5 py-0.5 text-[13px] tabular-nums">
                  {cast.join(" ")}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Karta>
      <TipniSi
        otazka={<>Bubble Sort potřeboval {bubblePorovnani(KARTY.length)} porovnání. Kolik jich bude potřebovat Merge Sort pro stejných {KARTY.length} karet?</>}
        moznosti={["Víc než 28", "Zhruba stejně", "Zhruba o třetinu méně"]}
        vybrano={data.tipMerge}
        vyber={(i) => zmen({ tipMerge: i })}
        spravne={2}
        vyhodnotit={konec}
        vysvetleni={
          <>
            Merge Sort tu porovnával {POROVNANI_MERGE}krát. Pro {KARTY.length} karet to nikdy není víc než {mergeNejvic(KARTY.length)}: tři úrovně
            slévání a na každé méně porovnání, než je karet (nejvýš 4 + 6 + 7).
          </>
        }
      />
      <Karta nadpis={`Slévání ${iSlevani + 1} z ${MERGE.slevani.length}`}>
        <div className="flex flex-col gap-3">
          <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
            {zamceno
              ? "Nejdřív tipni. Pak budeš slévat sám (sama)."
              : konec
                ? "Hotovo, balík je seřazený."
                : prazdna
                  ? `${zLeva === s.levy.length ? "Levá" : "Pravá"} hromádka je prázdná. Zbytek ${zLeva === s.levy.length ? "pravé" : "levé"} jde do slité hromádky bez porovnání.`
                  : "Přetáhni do dalšího volného políčka menší z obou vrchních karet (nebo na ni klikni)."}
          </p>
          {prazdna && (
            <button type="button" onClick={presunZbytek} className={`${tlacitko} self-start`}>
              Přesunout zbytek
            </button>
          )}
          <div className="flex flex-wrap gap-8">
            <Hromadka nazev="Levá hromádka" karty={s.levy} vzato={zLeva} strana="L" aktivni={!zamceno && !konec} vezmi={vezmi} />
            <Hromadka nazev="Pravá hromádka" karty={s.pravy} vzato={zPrava} strana="P" aktivni={!zamceno && !konec} vezmi={vezmi} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[12px] text-[#a6bdb4]">Slitá hromádka</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: s.levy.length + s.pravy.length }, (_, i) => {
                if (i < vzato)
                  return (
                    <span
                      key={i}
                      className={`flex h-12 w-14 items-center justify-center rounded-lg border-2 text-[17px] font-semibold tabular-nums ${
                        konec ? "border-[#6fe3c2] bg-[#6fe3c2] text-[#06201a]" : "border-[#6fe3c2]/50 bg-[#123c30] text-[#c8f5e6]"
                      }`}
                    >
                      {kroky[i].hodnota}
                    </span>
                  );
                const dalsi = i === vzato && !zamceno && !konec;
                return (
                  <span
                    key={i}
                    onDragOver={
                      dalsi
                        ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            nastavNadCilem(true);
                          }
                        : undefined
                    }
                    onDragLeave={dalsi ? () => nastavNadCilem(false) : undefined}
                    onDrop={
                      dalsi
                        ? (e) => {
                            e.preventDefault();
                            nastavNadCilem(false);
                            const strana = e.dataTransfer.getData("text/plain");
                            if (strana === "L" || strana === "P") vezmi(strana);
                          }
                        : undefined
                    }
                    className={`flex h-12 w-14 items-center justify-center rounded-lg border-2 border-dashed text-[12px] ${
                      dalsi ? (nadCilem ? "border-[#e5b73b] bg-[#e5b73b]/10 text-[#e5b73b]" : "border-[#e5b73b]/60 text-[#a6bdb4]") : "border-white/10 text-transparent"
                    }`}
                  >
                    {dalsi ? "sem" : ""}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="min-h-[1.5em] text-[14px] leading-relaxed" aria-live="polite">
            {chyba ? (
              <span className="text-[#ffd9d0]">{chyba}</span>
            ) : posledni && !konec && vzato === 0 ? (
              <span className="text-[#c5d6cf]">Předchozí slévání je hotové. Teď slij další dvě hromádky.</span>
            ) : posledni ? (
              <span className="text-[#c5d6cf]">
                {posledni.porovnani
                  ? `Porovnání vrchních karet: ${posledni.hodnota} je menší, jde do slité hromádky.`
                  : `Jedna hromádka je prázdná, ${posledni.hodnota} se jen přesune bez porovnání.`}
              </span>
            ) : null}
          </p>
          {hotovaSlevani.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#a6bdb4]">
              Už slité:
              {hotovaSlevani.map((h, i) => (
                <span key={i} className="rounded-md border border-white/[.14] px-1.5 py-0.5 text-[13px] tabular-nums text-[#c5d6cf]">
                  {h.vysledek.join(" ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </Karta>
      <Krokovac
        krok={krok}
        pocet={KROKY_MERGE.length}
        nastav={(n) => {
          nastavChybuKroku(null);
          zmen({ krokMerge: n });
        }}
        popisek="Karta"
        zamceno={data.tipMerge < 0 ? "Nejdřív tipni." : undefined}
      />
      <p className="text-[14px] text-[#c5d6cf]">
        Porovnání zatím: <b className="tabular-nums">{porovnaniDosud}</b>
      </p>
      {konec && (
        <button type="button" data-dal onClick={() => zmen({ cast: "rust" })} className={`${hlavni} self-start`}>
          Dál: jak to roste
        </button>
      )}
    </div>
  );
}

function Rust({ dal }: { dal: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3.5">
      <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
        U osmi karet je rozdíl 28 proti nejvýš 17. Tabulka ukazuje, jak se rozdíl zvětšuje s počtem karet. Merge Sort je uvedený v nejhorším
        případě.
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-right text-[14px] tabular-nums">
          <caption className="sr-only">Počet porovnání podle počtu karet</caption>
          <thead className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Karet</th>
              <th scope="col" className="px-3 py-2 font-medium">Bubble Sort</th>
              <th scope="col" className="px-3 py-2 font-medium">Merge Sort (nejvýš)</th>
              <th scope="col" className="px-3 py-2 font-medium">Kolikrát víc u Bubble Sortu</th>
            </tr>
          </thead>
          <tbody>
            {VELIKOSTI_RAZENI.map((n) => (
              <tr key={n} className="border-t border-white/[.07]">
                <td className="px-3 py-1.5">{cz(n)}</td>
                <td className="px-3 py-1.5">{cz(bubblePorovnani(n))}</td>
                <td className="px-3 py-1.5 font-semibold text-[#6fe3c2]">{cz(mergeNejvic(n))}</td>
                <td className="px-3 py-1.5">{cz(bubblePorovnani(n) / mergeNejvic(n), 1)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Hlaska>
        Když se karet zdesetinásobí, Bubble Sort potřebuje asi stokrát víc porovnání. Merge Sort jen o něco víc než desetkrát: přibudou
        tři až čtyři úrovně půlení. Počítač, který udělá miliardu porovnání za sekundu, seřadí milion karet Merge Sortem za setiny
        sekundy, Bubble Sortem za několik minut.
      </Hlaska>
      <Dal onClick={dal}>Pokračovat k výzvě</Dal>
    </div>
  );
}

/* ───────────── Výzva ───────────── */

function Vyzva({ data, zmen, dal }: { data: DataH2; zmen: Zmen; dal: () => void }) {
  const v = vyzvaRazeni(useSeed(data.seed, (s) => zmen({ seed: s })));
  const ok1 = cisloOdpovedi(data.odpovedPorovnani) === v.slevani.porovnani;
  const ok2 = JSON.stringify(cislaZTextu(data.odpovedPruchod)) === JSON.stringify(v.poPrvnimPruchodu);
  const ok3 = cisloOdpovedi(data.odpovedUrovne) === v.urovni;
  const z = data.zkontrolovano;
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod="Zadání má každý jiné. Když chceš procvičit víc, vezmi si nové.">Výzva</Nadpis>
      <Karta>
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="mb-1 text-[12px] text-[#a6bdb4]">Levá seřazená hromádka</div>
            <div className="flex gap-1">{v.levy.map((c) => <Stitek key={c}>{c}</Stitek>)}</div>
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[#a6bdb4]">Pravá seřazená hromádka</div>
            <div className="flex gap-1">{v.pravy.map((c) => <Stitek key={c}>{c}</Stitek>)}</div>
          </div>
        </div>
      </Karta>
      <Otazka
        cislo={1}
        text="Kolik porovnání udělá slévání těchto dvou hromádek? Když je jedna hromádka prázdná, zbytek druhé se přesune bez porovnání."
        hodnota={data.odpovedPorovnani}
        zmen={(t) => zmen({ odpovedPorovnani: t, zkontrolovano: false })}
        ok={ok1}
        zkontrolovano={z}
      />
      <Karta>
        <div className="mb-1 text-[12px] text-[#a6bdb4]">Karty pro Bubble Sort</div>
        <div className="flex gap-1">{v.bubbleVstup.map((c) => <Stitek key={c}>{c}</Stitek>)}</div>
      </Karta>
      <Otazka
        cislo={2}
        text="Jak budou karty seřazené po prvním průchodu Bubble Sortu? Napiš všech šest čísel zleva, oddělená čárkou."
        hodnota={data.odpovedPruchod}
        zmen={(t) => zmen({ odpovedPruchod: t, zkontrolovano: false })}
        ok={ok2}
        zkontrolovano={z}
        sirka="w-[280px]"
      />
      <Otazka
        cislo={3}
        text={<>Kolik úrovní půlení (jako v kartě Dělení) potřebuje balík {cz(v.n)} karet, než zbudou jednotlivé karty?</>}
        hodnota={data.odpovedUrovne}
        zmen={(t) => zmen({ odpovedUrovne: t, zkontrolovano: false })}
        ok={ok3}
        zkontrolovano={z}
      />
      <KontrolaVyzvy
        zkontrolovano={z}
        spravne={[ok1, ok2, ok3].filter(Boolean).length}
        celkem={3}
        zkontroluj={() => zmen({ zkontrolovano: true })}
        noveZadani={() => zmen({ seed: novySeed(), odpovedPorovnani: "", odpovedPruchod: "", odpovedUrovne: "", zkontrolovano: false })}
        dal={dal}
      />
    </div>
  );
}
