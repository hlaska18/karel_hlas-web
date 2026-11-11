"use client";

/** Hodina 7: laboratoř efektivity. Dvojice měří dva postupy na stejné úloze a počítá operace. */

import { useState } from "react";
import { Play, Trash2 } from "lucide-react";
import {
  cislo,
  cisloZOdhadu,
  FAZE_H7,
  mer,
  mereniDoCisel,
  mereniZCisel,
  odhadSedi,
  OTAZKY_ODHADU,
  ULOHY,
  ulohaPodleId,
  vychoziH7,
  type DataH7,
  type Mereni,
  type UlohaId,
} from "@/lib/algolab/laborator";
import { km } from "@/lib/algolab/trasy";
import { Dal, KostraLekce, Nadpis, ReflexeLekce, Vyber, Znacka, cz, useLekce } from "./Kostra";
import { CisloPole, Hlaska, Karta, Zjednoduseno, hlavni, poleTrida, tlacitko } from "./spolecne";
import { JakFunguje, type Algoritmus } from "./JakFunguje";

type Zmen = (z: Partial<DataH7>) => void;

const HYPOTEZY = [
  "Rozdíl mezi postupy zůstane pořád zhruba stejný.",
  "Rozdíl poroste: pomalejší postup bude se zvětšováním vstupu zaostávat čím dál víc.",
  "U velkého vstupu se postupy vyrovnají.",
];

export function Hodina7() {
  const { stav, data, zmen, jdiNa } = useLekce(7, FAZE_H7, vychoziH7);
  const u = ulohaPodleId(data.uloha);
  return (
    <KostraLekce faze={FAZE_H7} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "problem" && <Zadani data={data} zmen={zmen} dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <Hypoteza data={data} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <Merit data={data} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <Odhad data={data} zmen={zmen} dal={() => jdiNa("reflexe", "vyzva")} />}
      {stav.faze === "reflexe" && (
        <div className="flex flex-col gap-4">
          {data.hypoteza >= 0 && (
            <div className="max-w-3xl">
              <Hlaska druh={data.hypoteza === 1 ? "ok" : "tip"}>
                Tvoje hypotéza: „{HYPOTEZY[data.hypoteza]}“{" "}
                {data.hypoteza === 1
                  ? "Měření ji potvrdilo."
                  : `Měření ukázalo něco jiného: postup „${u.postupB}“ roste pomaleji, takže s velikostí vstupu rozdíl roste.`}
                {data.hypotezaText.trim() ? ` K tomu sis napsal(a): „${data.hypotezaText.trim()}“` : ""}
              </Hlaska>
            </div>
          )}
          <ReflexeLekce
            algoritmy={POSTUPY[u.id]}
            otazka={`Co jste naměřili u úlohy „${u.nazev}“? Jak roste počet operací obou postupů a proč měříme operace, ne sekundy?`}
            text={data.zaver}
            zmenText={(t) => zmen({ zaver: t })}
            odkryto={data.vzor}
            odkryj={() => {
              zmen({ vzor: true });
              jdiNa("reflexe", "reflexe");
            }}
            skryj={() => zmen({ vzor: false })}
            vzor={
              <>
                {VZORY[u.id]} Počet operací nezávisí na tom, jak rychlý je počítač ani co v něm zrovna běží, takže měření jde zopakovat a
                porovnat. Sekundy se od počítače k počítači liší, ale poměr mezi postupy se s velikostí vstupu mění stejně. Porovnej to se
                svou odpovědí: je v ní, jak rychle roste který postup, a proč operace?
              </>
            }
            pojmy={[
              { pojem: "Operace", text: "Jeden krok algoritmu, který se dá spočítat: porovnání, vyzkoušená kombinace, spočítaná buňka tabulky." },
              {
                pojem: "Růst počtu operací",
                text: "Jak se změní počet operací, když se vstup zvětší, třeba zdesetinásobí. Rozhoduje víc než rychlost počítače.",
              },
              {
                pojem: "Odhad podle vzorce",
                text: "Když by měření trvalo příliš dlouho, spočítá se počet operací ze vzorce, který jsme odvodili u menších vstupů.",
              },
              {
                pojem: "Přesnost proti rychlosti",
                text: "Heuristika je rychlá, ale nezaručí nejlepší výsledek. Přesný postup ho zaručí, ale u velkých úloh nemusí doběhnout.",
              },
            ]}
            zaver="Příště: závěrečné ověření. Pozná se v něm, jestli umíš vybrat vhodný algoritmus a vysvětlit proč."
          />
        </div>
      )}
    </KostraLekce>
  );
}

const VZORY: Record<string, string> = {
  hledani:
    "Lineární vyhledávání potřebuje v průměru zhruba polovinu tolika porovnání, kolik je krabic: desetkrát víc krabic, desetkrát víc porovnání. Binárnímu přibudou při zdesetinásobení jen tři až čtyři porovnání.",
  razeni:
    "Bubble Sort udělá n(n − 1)/2 porovnání: desetkrát víc karet, zhruba stokrát víc porovnání. Merge Sort roste jen o něco rychleji než počet karet (n · log₂ n), takže rozdíl se s velikostí rychle zvětšuje.",
  batoh:
    "Hrubá síla zkouší 2ⁿ kombinací: každá další zakázka počet zdvojnásobí. Tabulka má jen n × (kapacita + 1) buněk, roste mnohem pomaleji, a dá stejný nejlepší přínos.",
  trasy:
    "Hrubá síla zkouší n!/2 tras, s každým dalším zákazníkem se počet vynásobí. Nejbližší soused s 2-opt potřebuje řádově n² porovnání, ale trasa bývá o něco delší než nejkratší.",
};

function Zadani({ data, zmen, dal }: { data: DataH7; zmen: Zmen; dal: () => void }) {
  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <Nadpis uvod="Ve dvojici vyberte jednu úlohu. Budete na ní měřit dva postupy, které už znáte, a porovnávat, kolik operací udělají pro různě velké vstupy.">
        Laboratoř efektivity
      </Nadpis>
      <div className="grid gap-2.5 md:grid-cols-2" role="radiogroup" aria-label="Úloha">
        {ULOHY.map((u) => (
          <button
            key={u.id}
            type="button"
            role="radio"
            aria-checked={data.uloha === u.id}
            onClick={() => zmen({ uloha: u.id })}
            className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left ${data.uloha === u.id ? "border-[#6fe3c2] bg-[#123c30]" : "border-white/10 bg-[#0d1714] hover:bg-[#101c18]"}`}
          >
            <span className="text-[15px] font-semibold">{u.nazev}</span>
            <span className="text-[13px] text-[#c5d6cf]">
              A: {u.postupA} · B: {u.postupB}
            </span>
            <span className="text-[12px] text-[#a6bdb4]">Operace: {u.operace}</span>
          </button>
        ))}
      </div>
      <Karta>
        <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
          Proč operace a ne sekundy? Stejný program běží na školním počítači jinak rychle než na herním notebooku a zdrží ho i jiné karty
          prohlížeče. Počet operací je pokaždé stejný. Postupy se opravdu spustí na náhodných datech a operace se počítají cestou.
        </p>
      </Karta>
      <Dal onClick={dal}>Vyslovit hypotézu</Dal>
    </div>
  );
}

function Hypoteza({ data, zmen, dal }: { data: DataH7; zmen: Zmen; dal: () => void }) {
  const u = ulohaPodleId(data.uloha);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod={`Úloha: ${u.nazev}. A: ${u.postupA}, B: ${u.postupB}. Než začnete měřit, napište, co čekáte.`}>Hypotéza</Nadpis>
      <Vyber
        cislo={1}
        text="Co se stane s rozdílem mezi postupy, když bude vstup čím dál větší?"
        moznosti={HYPOTEZY}
        vybrano={data.hypoteza}
        vyber={(i) => zmen({ hypoteza: i })}
        ok={false}
        zkontrolovano={false}
      />
      <label className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
        <span>
          <span className="font-semibold">2.</span> Odhadněte, kolik operací udělá každý postup, když {u.velikost.split(" (")[0]} bude {cz(u.navrhy[3])}. Stačí
          řádově.
        </span>
        <textarea
          value={data.hypotezaText}
          onChange={(e) => zmen({ hypotezaText: e.target.value })}
          rows={3}
          placeholder="A: asi …, B: asi …"
          className="w-full rounded-lg border border-[#6f8a80] bg-[#080d0b] p-2.5 text-[14px] leading-relaxed text-[#e8f3ef] placeholder:text-[#a6bdb4]"
        />
      </label>
      <Dal onClick={dal} disabled={data.hypoteza < 0}>
        Měřit
      </Dal>
    </div>
  );
}

function Pruh({ hodnota, max, barva }: { hodnota: number; max: number; barva: string }) {
  const podil = max > 1 ? Math.log10(Math.max(1, hodnota)) / Math.log10(max) : 0;
  return <div className="h-2 rounded-full" style={{ width: `${Math.max(2, podil * 100)}%`, background: barva }} />;
}

/** Postupy A a B v laboratoři (u tras je B dvojice nejbližší soused + 2-opt). */
const POSTUPY: Record<UlohaId, Algoritmus[]> = {
  hledani: ["linearni", "binarni"],
  razeni: ["bubble", "merge"],
  batoh: ["hrubabatoh", "batoh"],
  trasy: ["hrubatrasy", "soused", "dvaopt"],
};

function Merit({ data, zmen, dal }: { data: DataH7; zmen: Zmen; dal: () => void }) {
  const u = ulohaPodleId(data.uloha);
  const [n, nastavN] = useState(u.navrhy[0]);
  const [pocita, nastavPocita] = useState(false);
  const vsechna = mereniZCisel(data.mereni);
  const moje = vsechna.filter((m) => m.uloha === u.id).sort((a, b) => a.n - b.n);
  const max = Math.max(10, ...moje.map((m) => Math.max(m.a, m.b)));

  const zmer = (velikost: number) => {
    nastavPocita(true);
    // Dát prohlížeči chvíli, ať ukáže „Měřím…“: velké vstupy počítají desetiny sekundy.
    window.setTimeout(() => {
      const m = mer(u.id, velikost, data.seed);
      const bezStejne = vsechna.filter((x) => !(x.uloha === u.id && x.n === m.n));
      zmen({ mereni: [...bezStejne, m].flatMap(mereniDoCisel), seed: data.seed + 1 });
      nastavPocita(false);
    }, 30);
  };

  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod={`${u.nazev}. Operace: ${u.operace}. Změřte aspoň čtyři velikosti, nejlépe každou zhruba desetkrát větší než předchozí.`}>Měření</Nadpis>
      <details className="max-w-3xl rounded-xl border border-white/10 bg-[#0d1714] px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-semibold text-[#6fe3c2]">Připomeňte si, jak oba postupy fungují</summary>
        <div className="mt-3 flex flex-col gap-3">
          {POSTUPY[u.id].map((a) => (
            <JakFunguje key={a} algoritmus={a} kratce />
          ))}
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px]">Velikost ({u.velikost}):</span>
        {u.navrhy.map((v) => (
          <button key={v} type="button" disabled={pocita} onClick={() => zmer(v)} className={tlacitko}>
            {cz(v)}
          </button>
        ))}
        <span className="mx-1 text-[13px] text-[#a6bdb4]">nebo vlastní</span>
        <CisloPole hodnota={n} od={1} po={u.max} onZmena={nastavN} popisek="Vlastní velikost vstupu" />
        <button type="button" disabled={pocita} onClick={() => zmer(n)} className={hlavni}>
          <Play className="h-4 w-4" /> {pocita ? "Měřím…" : "Změřit"}
        </button>
      </div>
      <p className="text-[13px] text-[#a6bdb4]">
        Postup A se spouští do {cz(u.limitA)}, postup B do {cz(u.limitB)}. Nad tím by se čekalo příliš dlouho, ukáže se odhad podle vzorce
        (označený).
      </p>
      {moje.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-[14px] tabular-nums">
            <caption className="sr-only">Naměřené počty operací</caption>
            <thead className="bg-[#101c18] text-left text-[12px] text-[#a6bdb4]">
              <tr>
                <th scope="col" className="px-3 py-2 text-right font-medium">Velikost</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">A: {u.postupA}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">B: {u.postupB}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">A : B</th>
                {u.id === "trasy" && <th scope="col" className="px-3 py-2 text-right font-medium">Délka A / B (km)</th>}
                <th scope="col" className="w-[28%] px-3 py-2 font-medium">Operací (logaritmická osa)</th>
              </tr>
            </thead>
            <tbody>
              {moje.map((m) => (
                <Radek key={m.n} m={m} max={max} trasy={u.id === "trasy"} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {moje.some((m) => m.a >= 1e15 || m.b >= 1e15) && (
        <p className="text-[13px] text-[#a6bdb4]">Zápis 10²³ znamená jedničku a za ní 23 nul. Tak velká čísla se už slovy nepíšou.</p>
      )}
      {moje.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => zmen({ mereni: vsechna.filter((m) => m.uloha !== u.id).flatMap(mereniDoCisel) })}
            className={tlacitko}
          >
            <Trash2 className="h-4 w-4" /> Smazat měření této úlohy
          </button>
        </div>
      )}
      {moje.length >= 3 && (
        <Hlaska>
          Podívejte se na sloupec A : B. Jak se mění, když se vstup zvětšuje? Na logaritmické ose je každá čárka desetkrát víc než předchozí,
          takže stejně dlouhý přírůstek pruhu znamená stejný násobek.
        </Hlaska>
      )}
      <Karta>
        <Zjednoduseno>
          {u.id === "hledani"
            ? "Lineární i binární hledání se měří jako průměr z 20 hledání náhodných dílů."
            : u.id === "batoh"
              ? "Kapacita stroje je polovina součtu dob všech zakázek, takže s počtem zakázek roste i tabulka."
              : u.id === "trasy"
                ? "Heuristika tu je nejbližší soused a pak 2-opt s první nalezenou zlepšující výměnou."
                : "Data jsou náhodná. U Merge Sortu se počet porovnání trochu liší podle dat, u Bubble Sortu ne."}
        </Zjednoduseno>
      </Karta>
      <Dal onClick={dal} disabled={moje.length < 3}>
        Pokračovat k odhadu
      </Dal>
    </div>
  );
}

function Radek({ m, max, trasy }: { m: Mereni; max: number; trasy: boolean }) {
  const odhad = <span className="ml-1 text-[11px] text-[#e5b73b]">odhad</span>;
  return (
    <tr className="border-t border-white/[.07]">
      <td className="px-3 py-1.5 text-right">{cz(m.n)}</td>
      <td className="px-3 py-1.5 text-right">
        {cislo(m.a)}
        {m.odhadA && odhad}
      </td>
      <td className="px-3 py-1.5 text-right">
        {cislo(m.b)}
        {m.odhadB && odhad}
      </td>
      <td className="px-3 py-1.5 text-right">{m.b > 0 ? `${cislo(Math.round((m.a / m.b) * 10) / 10)}×` : "–"}</td>
      {trasy && (
        <td className="px-3 py-1.5 text-right">
          {m.delkaA !== undefined ? km(m.delkaA) : "–"} / {m.delkaB !== undefined ? km(m.delkaB) : "–"}
        </td>
      )}
      <td className="px-3 py-1.5">
        <div className="flex flex-col gap-1">
          <Pruh hodnota={m.a} max={max} barva="#ff9d8a" />
          <Pruh hodnota={m.b} max={max} barva="#6fe3c2" />
        </div>
      </td>
    </tr>
  );
}

function Odhad({ data, zmen, dal }: { data: DataH7; zmen: Zmen; dal: () => void }) {
  const odpovedi = OTAZKY_ODHADU.map((_, i) => data.odhady[i] ?? "");
  const ok = OTAZKY_ODHADU.map((q, i) => odhadSedi(cisloZOdhadu(odpovedi[i]), q.spravne));
  const z = data.zkontrolovano;
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod="Odhadněte bez měření, podle toho, jak počty rostly. Stačí přesnost na 20 %. Psát můžete 1,2 mil., 5 000 000 nebo 2^40.">
        Odhad
      </Nadpis>
      {OTAZKY_ODHADU.map((q, i) => (
        <label key={q.text} className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
          <span>
            <span className="font-semibold">{i + 1}.</span> {q.text}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <input
              value={odpovedi[i]}
              onChange={(e) => zmen({ odhady: odpovedi.map((x, j) => (j === i ? e.target.value : x)), zkontrolovano: false })}
              autoComplete="off"
              className={`${poleTrida} w-[180px]`}
            />
            {z && <Znacka ok={ok[i]} />}
            {z && !ok[i] && <span className="text-[13px] text-[#c5d6cf]">Správně je asi {cislo(q.spravne)}.</span>}
          </span>
        </label>
      ))}
      {z && (
        <Hlaska druh={ok.every(Boolean) ? "ok" : "tip"}>
          {ok.every(Boolean)
            ? "Všechny odhady sedí. Vzorce z předchozích hodin fungují i daleko za tím, co jde změřit."
            : `Sedí ${ok.filter(Boolean).length} ze 4. Vzpomeň si na vzorce: n(n − 1)/2, n · log₂ n, 2ⁿ, ⌊log₂ n⌋ + 1.`}
        </Hlaska>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => zmen({ zkontrolovano: true })} className={hlavni}>
          Zkontrolovat
        </button>
        <button type="button" onClick={dal} className={tlacitko}>
          Pokračovat k závěru
        </button>
      </div>
    </div>
  );
}
