"use client";

/** Hodina 1: efektivita algoritmů na lineárním a binárním vyhledávání. */

import { FAZE_LEKCE } from "@/lib/algolab/lekce";
import { novySeed } from "@/lib/algolab/nahoda";
import {
  binarniKroky,
  binarniNejvic,
  cilNeserazene,
  cislaZTextu,
  linearniPocet,
  NESERAZENA,
  POKUS_INDEX,
  SKLAD,
  VELIKOSTI_RUSTU,
  vychoziH1,
  vyzvaHledani,
  type DataH1,
  type KrokBinarni,
} from "@/lib/algolab/vyhledavani";
import { Casti, Dal, KontrolaVyzvy, KostraLekce, Krokovac, Nadpis, Otazka, ReflexeLekce, TipniSi, Vyber, cisloOdpovedi, cz, useLekce, useSeed } from "./Kostra";
import { Hlaska, Karta, Zjednoduseno, hlavni, tlacitko } from "./spolecne";
import { JakFunguje } from "./JakFunguje";

type Zmen = (z: Partial<DataH1>) => void;

const HLEDANY = SKLAD[POKUS_INDEX];

export function Hodina1() {
  const { stav, data, zmen, jdiNa } = useLekce(1, FAZE_LEKCE, vychoziH1);
  return (
    <KostraLekce faze={FAZE_LEKCE} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "problem" && <Problem dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <Pokus data={data} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <Experiment data={data} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <Vyzva data={data} zmen={zmen} dal={() => jdiNa("reflexe", "vyzva")} />}
      {stav.faze === "reflexe" && (
        <ReflexeLekce
          algoritmy={["linearni", "binarni"]}
          otazka="Proč binárnímu vyhledávání stačí na milion krabic dvacet kroků a kdy ho nemůžeš použít?"
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
              Každý krok vyřadí polovinu krabic, které ještě zbývají. Milion se půlí na půl milionu, čtvrt milionu… a nejpozději
              dvacátý krok hledaný díl najde, protože 2<sup>20</sup> je víc než milion. Lineární hledání vyřadí jedním krokem jen jednu krabici.
              Půlit jde ale jen v seřazených datech: jen tam víš, že hledané číslo nemůže být na vyřazené straně. Porovnej to se svou
              odpovědí: je v ní půlení i podmínka seřazených dat?
            </>
          }
          pojmy={[
            { pojem: "Algoritmus", text: "Přesný postup řešení úlohy po krocích, který vždy skončí. Stejná úloha jde často řešit různými algoritmy." },
            { pojem: "Lineární vyhledávání", text: "Prochází položky jednu po druhé od začátku. Funguje vždy, i v neseřazených datech, ale u velkých dat je pomalé." },
            {
              pojem: "Binární vyhledávání",
              text: "Porovná hledané číslo s prostřední položkou a pokračuje jen v polovině, kde hledané být může. Potřebuje seřazená data.",
            },
            {
              pojem: "Efektivita algoritmu",
              text: "Jak rychle roste počet kroků, když roste velikost dat. Lineární hledání roste stejně rychle jako data, binární jen o jeden krok při každém zdvojnásobení.",
            },
          ]}
          zaver="Příště: když data seřazená nejsou, je potřeba je seřadit. I řazení jde udělat pomalu, nebo chytře."
        />
      )}
    </KostraLekce>
  );
}

/** 1 krok, 2–4 kroky, 5 a víc kroků. */
const kroku = (n: number) => `${cz(n)} ${n === 1 ? "krok" : n >= 2 && n <= 4 ? "kroky" : "kroků"}`;

function Problem({ dal }: { dal: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis
        uvod={
          <>
            Ve skladu stojí v řadě {SKLAD.length} zavřených krabic s díly. Na každé je výrobní číslo dílu a krabice jsou seřazené od
            nejmenšího čísla. Mistr potřebuje díl číslo <b>{HLEDANY}</b>. Do krabice se musíš podívat, abys číslo viděl(a).
          </>
        }
      >
        Kde je díl {HLEDANY}?
      </Nadpis>
      <Karta>
        <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
          Otevřeš krabici a porovnáš její číslo s hledaným. To je jeden krok. Najdi díl na co nejméně kroků. Ve skutečném skladu
          otevírá krabice počítač v databázi a krabic jsou miliony.
        </p>
      </Karta>
      <Dal onClick={dal}>Hledat ve skladu</Dal>
    </div>
  );
}

function Pokus({ data, zmen, dal }: { data: DataH1; zmen: Zmen; dal: () => void }) {
  const nalezeno = data.otevrene.includes(POKUS_INDEX);
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod={<>Klikni na krabici a otevři ji. Hledáš díl <b>{HLEDANY}</b>. Čísla rostou zleva doprava.</>}>Najdi díl {HLEDANY}</Nadpis>
      <div className="grid max-w-[1000px] grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5" role="group" aria-label="Krabice ve skladu">
        {SKLAD.map((cislo, i) => {
          const otevrena = data.otevrene.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={otevrena || nalezeno}
              onClick={() => zmen({ otevrene: [...data.otevrene, i] })}
              aria-label={otevrena ? `Krabice ${i + 1}: ${cislo}` : `Krabice ${i + 1}, zavřená`}
              className={`flex h-14 flex-col items-center justify-center rounded-lg border text-[13px] tabular-nums ${
                otevrena
                  ? cislo === HLEDANY
                    ? "border-[#6fe3c2] bg-[#6fe3c2] font-semibold text-[#06201a]"
                    : "border-white/[.14] bg-[#101c18] text-[#e8f3ef]"
                  : "border-[#6f8a80] bg-[#18332b] text-[#a6bdb4] hover:bg-[#1f4136]"
              }`}
            >
              <span className="text-[10px] opacity-70">{i + 1}.</span>
              {otevrena ? cislo : "?"}
            </button>
          );
        })}
      </div>
      <p className="text-[14px] text-[#c5d6cf]" aria-live="polite">
        Kroky: <b className="tabular-nums">{data.otevrene.length}</b>
      </p>
      {nalezeno && (
        <Hlaska druh="ok">
          Našel(a) jsi ho za {kroku(data.otevrene.length)}. Kdo by otevíral krabice popořadě od začátku, potřeboval by{" "}
          {kroku(linearniPocet(SKLAD, HLEDANY))}.{" "}
          {data.otevrene.length < binarniKroky(SKLAD, HLEDANY).length
            ? `Tentokrát ti pomohlo i štěstí. Existuje postup, kterému bez štěstí stačí nejvýš ${kroku(binarniKroky(SKLAD, HLEDANY).length)}, a to u kteréhokoli dílu v tomhle skladu. Jak, uvidíš v experimentu.`
            : data.otevrene.length === binarniKroky(SKLAD, HLEDANY).length
              ? "Přesně tolik stačí na kterýkoli díl v tomhle skladu, když se hledá chytře. Jak, uvidíš v experimentu."
              : `Jde to i na ${kroku(binarniKroky(SKLAD, HLEDANY).length)}, a to u kteréhokoli dílu v tomhle skladu. Jak, uvidíš v experimentu.`}
        </Hlaska>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => zmen({ otevrene: [] })} disabled={!data.otevrene.length} className={tlacitko}>
          Zavřít krabice a zkusit znovu
        </button>
      </div>
      <Dal onClick={dal} disabled={!nalezeno}>
        Pokračovat k experimentu
      </Dal>
    </div>
  );
}

/* ───────────── Experiment ───────────── */

const CASTI = [
  { id: "krokovani", nazev: "Binární hledání" },
  { id: "rust", nazev: "Jak to roste" },
  { id: "neserazena", nazev: "Neseřazený sklad" },
];

function Experiment({ data, zmen, dal }: { data: DataH1; zmen: Zmen; dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-semibold">Experiment</h2>
        <Casti casti={CASTI} aktualni={data.cast} vyber={(c) => zmen({ cast: c })} />
      </div>
      {data.cast === "krokovani" && <Krokovani data={data} zmen={zmen} />}
      {data.cast === "rust" && <Rust data={data} zmen={zmen} />}
      {data.cast === "neserazena" && <Neserazena data={data} zmen={zmen} dal={dal} />}
    </div>
  );
}

/** Řada krabic s vyznačeným úsekem, který ještě zbývá prohledat. */
function Rada({ pole, kroky, krok }: { pole: number[]; kroky: KrokBinarni[]; krok: number }) {
  const posledni = krok > 0 ? kroky[krok - 1] : null;
  const otevrene = new Set(kroky.slice(0, krok).map((k) => k.stred));
  // Úsek, ve kterém se hledá dál (po posledním kroku).
  let od = 0;
  let po = pole.length - 1;
  if (posledni) {
    if (posledni.vysledek === "vlevo") {
      od = posledni.od;
      po = posledni.stred - 1;
    } else if (posledni.vysledek === "vpravo") {
      od = posledni.stred + 1;
      po = posledni.do;
    } else {
      od = po = posledni.stred;
    }
  }
  return (
    <div className="grid max-w-[1000px] grid-cols-[repeat(16,minmax(0,1fr))] gap-1" aria-hidden="true">
      {pole.map((c, i) => {
        const vUseku = i >= od && i <= po;
        const jeTed = posledni?.stred === i;
        return (
          <span
            key={i}
            className={`flex h-11 flex-col items-center justify-center rounded-md border text-[12px] tabular-nums ${
              jeTed
                ? "border-[#6fe3c2] bg-[#6fe3c2] font-semibold text-[#06201a]"
                : otevrene.has(i)
                  ? "border-white/20 bg-[#101c18] text-[#e8f3ef]"
                  : vUseku
                    ? "border-[#6f8a80] bg-[#18332b] text-[#c5d6cf]"
                    : "border-white/[.06] text-[#a6bdb4]/50"
            }`}
          >
            <span className="text-[9px] opacity-70">{i + 1}.</span>
            {otevrene.has(i) || jeTed ? c : vUseku ? "?" : "–"}
          </span>
        );
      })}
    </div>
  );
}

function popisKroku(k: KrokBinarni, i: number) {
  const jedina = k.od === k.do;
  const zaklad = jedina
    ? `${i}. krok: zbývá jen krabice ${k.od + 1} s číslem ${k.hodnota}.`
    : `${i}. krok: zbývají krabice ${k.od + 1} až ${k.do + 1}, prostřední je ${k.stred + 1}. krabice s číslem ${k.hodnota}.`;
  if (k.vysledek === "nalezeno") return `${zaklad} To je hledaný díl.`;
  if (jedina) return `${zaklad} Hledané číslo je ${k.vysledek === "vlevo" ? "menší" : "větší"}, takže tu není. Krabici vyřadíš.`;
  return k.vysledek === "vlevo"
    ? `${zaklad} Hledané číslo je menší, takže může být jen vlevo. Pravou část i tuhle krabici vyřadíš.`
    : `${zaklad} Hledané číslo je větší, takže může být jen vpravo. Levou část i tuhle krabici vyřadíš.`;
}

const CILE_KROKOVANI = [9, 0, 22, 15];

function Krokovani({ data, zmen }: { data: DataH1; zmen: Zmen }) {
  const cil = SKLAD[data.cilKrok] ?? SKLAD[9];
  const kroky = binarniKroky(SKLAD, cil);
  const konec = data.krok >= kroky.length;
  return (
    <div className="flex flex-col gap-3.5">
      <p className="max-w-3xl text-[14px] leading-relaxed text-[#c5d6cf]">
        Ve vlastním pokusu jsi hledal(a) po svém. Počítače mají na hledání dva základní postupy.
      </p>
      <JakFunguje algoritmus="linearni" odkryto={konec} />
      <JakFunguje algoritmus="binarni" odkryto={konec} />
      <div className="flex flex-wrap items-center gap-2 text-[14px]">
        Hledaný díl:
        {CILE_KROKOVANI.map((i) => (
          <button
            key={i}
            type="button"
            aria-pressed={data.cilKrok === i}
            onClick={() => zmen({ cilKrok: i, krok: 0, tipKrok: -1 })}
            className={`${tlacitko} ${data.cilKrok === i ? "!border-[#6fe3c2]" : ""}`}
          >
            {SKLAD[i]}
          </button>
        ))}
      </div>
      <TipniSi
        otazka={<>Kolik kroků potřebuje binární hledání, aby našlo díl {cil}?</>}
        moznosti={["1", "2", "3", "4", "5"]}
        vybrano={data.tipKrok}
        vyber={(i) => zmen({ tipKrok: i })}
        spravne={kroky.length - 1}
        vyhodnotit={konec}
        vysvetleni={
          <>
            Lineárně by to bylo {kroku(linearniPocet(SKLAD, cil))}. Binárně jich v tomhle skladu nikdy není víc než {binarniNejvic(SKLAD.length)}:
            {" "}31 se rozpůlí na 15, 7, 3 a 1.
          </>
        }
      />
      <Rada pole={SKLAD} kroky={kroky} krok={data.krok} />
      <Krokovac krok={data.krok} pocet={kroky.length} nastav={(k) => zmen({ krok: k })} zamceno={data.tipKrok < 0 ? "Nejdřív tipni." : undefined} />
      <div className="flex min-h-[48px] flex-col gap-1.5" aria-live="polite">
        {kroky.slice(0, data.krok).map((k, i) => (
          <p key={i} className={`text-[14px] leading-relaxed ${i === data.krok - 1 ? "text-[#e8f3ef]" : "text-[#a6bdb4]"}`}>
            {popisKroku(k, i + 1)}
          </p>
        ))}
      </div>
      {konec && (
        <button type="button" onClick={() => zmen({ cast: "rust" })} className={`${hlavni} self-start`}>
          Dál: jak to roste
        </button>
      )}
    </div>
  );
}

function Rust({ data, zmen }: { data: DataH1; zmen: Zmen }) {
  const odkryto = data.tipRust >= 0;
  return (
    <div className="flex max-w-3xl flex-col gap-3.5">
      <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
        Ve skladu s 31 krabicemi je rozdíl 31 proti 5 krokům. Co se stane, když krabic přibude? Počítáme nejhorší případ: díl je v poslední
        prohledané krabici.
      </p>
      <TipniSi
        otazka="Kolik kroků nejvýš potřebuje binární hledání, když je krabic miliarda?"
        moznosti={["30", "1 000", "500 milionů", "1 miliarda"]}
        vybrano={data.tipRust}
        vyber={(i) => zmen({ tipRust: i })}
        spravne={0}
        vyhodnotit={odkryto}
        vysvetleni="Miliardu jde rozpůlit jen asi třicetkrát, než zbude jediná krabice (2 na 30 je přes miliardu)."
      />
      {odkryto && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-right text-[14px] tabular-nums">
            <caption className="sr-only">Nejvíc kroků podle velikosti skladu</caption>
            <thead className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Krabic</th>
                <th scope="col" className="px-3 py-2 font-medium">Lineární (nejvíc kroků)</th>
                <th scope="col" className="px-3 py-2 font-medium">Binární (nejvíc kroků)</th>
              </tr>
            </thead>
            <tbody>
              {VELIKOSTI_RUSTU.map((n) => (
                <tr key={n} className="border-t border-white/[.07]">
                  <td className="px-3 py-1.5">{cz(n)}</td>
                  <td className="px-3 py-1.5">{cz(n)}</td>
                  <td className="px-3 py-1.5 font-semibold text-[#6fe3c2]">{binarniNejvic(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {odkryto && (
        <>
          <Hlaska>
            Když se počet krabic zdesetinásobí, lineární hledání potřebuje desetkrát víc kroků. Binární jen o tři nebo čtyři víc, protože
            desetinásobek je zhruba trojí až čtverné zdvojnásobení a každé přidá jediný krok.
          </Hlaska>
          <button type="button" onClick={() => zmen({ cast: "neserazena" })} className={`${hlavni} self-start`}>
            Dál: neseřazený sklad
          </button>
        </>
      )}
    </div>
  );
}

function Neserazena({ data, zmen, dal }: { data: DataH1; zmen: Zmen; dal: () => void }) {
  const cil = cilNeserazene();
  const kroky = binarniKroky(NESERAZENA, cil);
  const konec = data.krokNeserazena >= kroky.length;
  return (
    <div className="flex flex-col gap-3.5">
      <p className="max-w-3xl text-[14px] leading-relaxed text-[#c5d6cf]">
        Do druhého skladu někdo krabice naskládal, jak přišly. Díl {cil} v něm je, zkusíme ho najít binárním hledáním.
      </p>
      <TipniSi
        otazka={<>Najde binární hledání díl {cil}?</>}
        moznosti={["Ano", "Ne"]}
        vybrano={data.tipNeserazena}
        vyber={(i) => zmen({ tipNeserazena: i })}
        spravne={1}
        vyhodnotit={konec}
        vysvetleni={
          <>
            Díl je v {NESERAZENA.indexOf(cil) + 1}. krabici, ale binární hledání ho vyřadilo. Z čísla v prostřední krabici usuzuje, na které
            straně hledané být nemůže. To platí jen v seřazených datech.
          </>
        }
      />
      <Rada pole={NESERAZENA} kroky={kroky} krok={data.krokNeserazena} />
      <Krokovac
        krok={data.krokNeserazena}
        pocet={kroky.length}
        nastav={(k) => zmen({ krokNeserazena: k })}
        zamceno={data.tipNeserazena < 0 ? "Nejdřív tipni." : undefined}
      />
      <div className="flex flex-col gap-1.5" aria-live="polite">
        {kroky.slice(0, data.krokNeserazena).map((k, i) => (
          <p key={i} className="text-[14px] leading-relaxed text-[#c5d6cf]">
            {popisKroku(k, i + 1)}
          </p>
        ))}
        {konec && <p className="text-[14px] font-semibold text-[#ff9d8a]">Úsek je prázdný, hledání skončilo: „díl tu není“. Ale je.</p>}
      </div>
      {konec && (
        <>
          <Karta>
            <Zjednoduseno>
              Seřadit data stojí čas. Vyplatí se, když v nich budeš hledat často: seřadíš jednou a pak každé hledání trvá pár kroků. Když
              hledáš jen jednou, je lineární hledání rychlejší než řazení.
            </Zjednoduseno>
          </Karta>
          <Dal onClick={dal}>Pokračovat k výzvě</Dal>
        </>
      )}
    </div>
  );
}

/* ───────────── Výzva ───────────── */

const VOLBY = [
  "Binární vyhledávání, je rychlejší.",
  "Lineární vyhledávání: data nejsou seřazená a hledáš jen jednou.",
  "Nejdřív seřadit a pak binárně, i když hledáš jen jednou.",
];

function Vyzva({ data, zmen, dal }: { data: DataH1; zmen: Zmen; dal: () => void }) {
  const v = vyzvaHledani(useSeed(data.seed, (s) => zmen({ seed: s })));
  const ok1 = JSON.stringify(cislaZTextu(data.odpovedKroky)) === JSON.stringify(v.kroky.map((k) => k.hodnota));
  const ok2 = cisloOdpovedi(data.odpovedNejvic) === v.nejvic;
  const ok3 = data.odpovedVolba === 1;
  const z = data.zkontrolovano;
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod="Zadání má každý jiné. Když chceš procvičit víc, vezmi si nové.">Výzva</Nadpis>
      <Karta>
        <div className="mb-2 text-[13px] text-[#a6bdb4]">Seřazený seznam čísel dílů:</div>
        <div className="flex flex-wrap gap-1">
          {v.pole.map((c, i) => (
            <span key={i} className="flex h-10 w-[46px] flex-col items-center justify-center rounded-md border border-white/[.14] bg-[#101c18] text-[13px] tabular-nums">
              <span className="text-[9px] text-[#a6bdb4]">{i + 1}.</span>
              {c}
            </span>
          ))}
        </div>
      </Karta>
      <Otazka
        cislo={1}
        text={
          <>
            Hledáš díl <b>{v.cil}</b>. Napiš čísla, se kterými ho binární hledání postupně porovná (oddělená čárkou). Prostřední krabici ber
            zaokrouhleně dolů: z krabic 1 až 4 je prostřední 2.
          </>
        }
        hodnota={data.odpovedKroky}
        zmen={(t) => zmen({ odpovedKroky: t, zkontrolovano: false })}
        ok={ok1}
        zkontrolovano={z}
        sirka="w-[280px]"
        napoveda="např. 512, 300, 410"
      />
      <Otazka
        cislo={2}
        text={<>Nejvýš kolik kroků potřebuje binární hledání v seřazeném seznamu {cz(v.n)} položek?</>}
        hodnota={data.odpovedNejvic}
        zmen={(t) => zmen({ odpovedNejvic: t, zkontrolovano: false })}
        ok={ok2}
        zkontrolovano={z}
      />
      <Vyber
        cislo={3}
        text="V neseřazeném seznamu 300 zakázek jednou hledáš zakázku číslo 4711. Co použiješ?"
        moznosti={VOLBY}
        vybrano={data.odpovedVolba}
        vyber={(i) => zmen({ odpovedVolba: i, zkontrolovano: false })}
        ok={ok3}
        zkontrolovano={z}
      />
      <KontrolaVyzvy
        zkontrolovano={z}
        spravne={[ok1, ok2, ok3].filter(Boolean).length}
        celkem={3}
        zkontroluj={() => zmen({ zkontrolovano: true })}
        noveZadani={() => zmen({ seed: novySeed(), odpovedKroky: "", odpovedNejvic: "", odpovedVolba: -1, zkontrolovano: false })}
        dal={dal}
      />
    </div>
  );
}
