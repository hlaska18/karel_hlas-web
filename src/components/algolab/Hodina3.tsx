"use client";

/** Hodina 3: dynamické programování na nejrychlejší cestě vozíku halou. */

import { useState, type ReactNode } from "react";
import { FAZE_LEKCE } from "@/lib/algolab/lekce";
import { novySeed } from "@/lib/algolab/nahoda";
import {
  cenaCesty,
  dalsiPole,
  HALA,
  hladovaCesta,
  komentarMrizky,
  krokyMrizky,
  nejlepsiCesta,
  pocetCest,
  spoctiMrizku,
  vychoziH3,
  vyzvaMrizky,
  type DataH3,
  type Mrizka,
  type Pole,
} from "@/lib/algolab/mrizka";
import { Casti, Dal, KontrolaVyzvy, KostraLekce, Nadpis, ReflexeLekce, TipniSi, Vyber, Znacka, cisloOdpovedi, cz, useLekce, useSeed } from "./Kostra";
import { CisloPole, Hlaska, Karta, Zjednoduseno, hlavni, poleTrida, tlacitko } from "./spolecne";
import { JakFunguje } from "./JakFunguje";

type Zmen = (z: Partial<DataH3>) => void;

const N = HALA.length;
const TABULKA = spoctiMrizku(HALA);
const KROKY = krokyMrizky(HALA);
const NEJLEPSI = nejlepsiCesta(HALA);
const HLADOVA = hladovaCesta(HALA);
const NEJLEPSI_CAS = cenaCesty(HALA, NEJLEPSI);
const HLADOVY_CAS = cenaCesty(HALA, HLADOVA);
const naPole = (i: number): Pole => [Math.floor(i / N), i % N];
const ZPET = NEJLEPSI.slice().reverse();

export function Hodina3() {
  const { stav, data, zmen, jdiNa } = useLekce(3, FAZE_LEKCE, vychoziH3);
  return (
    <KostraLekce faze={FAZE_LEKCE} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "problem" && <Problem dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <Pokus data={data} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <Experiment data={data} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <Vyzva data={data} zmen={zmen} dal={() => jdiNa("reflexe", "vyzva")} />}
      {stav.faze === "reflexe" && (
        <ReflexeLekce
          algoritmy={["mrizka"]}
          otazka={`Proč tabulka najde nejrychlejší cestu, i když nezkouší všech ${pocetCest(N, N)} cest?`}
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
              Do každého pole se dá přijet jen shora, nebo zleva. Nejrychlejší cesta do pole proto vede přes rychlejší z těch dvou sousedů a
              tabulka zná nejkratší čas do obou. Stačí vzít menší a přičíst čas pole. Tak se vyplní buňka po buňce až do cíle a každá se
              počítá jen jednou. Celé cesty se nezkoušejí, ale žádná se nevynechá: každá do pole vede přes jednoho ze dvou sousedů. Hladové
              pravidlo hledí jen o krok dopředu, proto se vyhne drahému poli, i když za ním vede rychlá cesta. Porovnej to se svou
              odpovědí: je v ní, že se z buněk tabulky skládá výsledek a že se každá počítá jednou?
            </>
          }
          pojmy={[
            {
              pojem: "Dynamické programování",
              text: "Postup, který rozloží úlohu na menší, stejné úlohy, jejich výsledky si uloží do tabulky a z nich skládá výsledek větší úlohy.",
            },
            { pojem: "Dílčí problém", text: "Menší verze téže úlohy. Tady: nejrychlejší cesta ze startu do jednoho pole haly." },
            {
              pojem: "Hladové pravidlo",
              text: "Bere vždy to, co teď vypadá nejlépe, a rozhodnutí už nemění. Bývá rychlé, ale nejlepší výsledek nezaručuje.",
            },
            { pojem: "Zpětná cesta", text: "Z hotové tabulky se cesta pozná odzadu: z cíle do souseda, odkud se do něj přijelo levněji." },
          ]}
          zaver="Příště: tabulka i tam, kde se nejezdí mřížkou, ale vybírají se zakázky do omezeného času stroje (problém batohu)."
        />
      )}
    </KostraLekce>
  );
}

/* ───────────── Hala ───────────── */

/** Mřížka haly. Obsah buňky a vzhled určuje volající, kliknutí je volitelné. */
function Mrizkovnik({
  g,
  popisek,
  bunka,
  trida,
  klik,
  aktivni,
  velikost = 52,
}: {
  g: Mrizka;
  velikost?: number;
  popisek: string;
  bunka: (r: number, s: number) => ReactNode;
  trida?: (r: number, s: number) => string;
  klik?: (r: number, s: number) => void;
  aktivni?: (r: number, s: number) => boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[12px] text-[#a6bdb4]">{popisek}</div>
      <div className="grid w-max gap-1" style={{ gridTemplateColumns: `repeat(${g[0].length}, ${velikost}px)` }}>
        {g.map((radek, r) =>
          radek.map((_, s) => {
            const zaklad = `flex items-center justify-center rounded-lg border text-[16px] tabular-nums ${
              trida?.(r, s) ?? "border-white/[.14] bg-[#101c18]"
            }`;
            const obsah = bunka(r, s);
            const rozmer = { height: velikost, width: velikost };
            return klik ? (
              <button
                key={`${r}-${s}`}
                type="button"
                disabled={!aktivni?.(r, s)}
                onClick={() => klik(r, s)}
                style={rozmer}
                aria-label={`Pole v ${r + 1}. řadě a ${s + 1}. sloupci, ${g[r][s]} s`}
                className={`${zaklad} enabled:cursor-pointer enabled:ring-1 enabled:ring-[#e5b73b] enabled:hover:bg-[#2a2614]`}
              >
                {obsah}
              </button>
            ) : (
              <div key={`${r}-${s}`} className={zaklad} style={rozmer}>
                {obsah}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

const naCeste = (cesta: Pole[], r: number, s: number) => cesta.some(([a, b]) => a === r && b === s);

function Problem({ dal }: { dal: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis
        uvod="Autonomní vozík veze díly halou z levého horního rohu do pravého dolního. Smí jet jen doprava, nebo dolů. Číslo v poli je, kolik sekund trvá polem projet: někde stojí regály, jinde se čeká na jeřáb."
      >
        Nejrychlejší cesta halou
      </Nadpis>
      <Mrizkovnik
        g={HALA}
        popisek="Hala (sekundy za průjezd polem)"
        bunka={(r, s) => HALA[r][s]}
        trida={(r, s) => (r + s === 0 || (r === N - 1 && s === N - 1) ? "border-[#6fe3c2] bg-[#123c30]" : "border-white/[.14] bg-[#101c18]")}
      />
      <Karta>
        <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
          Čas cesty je součet čísel všech polí, kterými vozík projede, včetně startu a cíle. Kudy pojede nejrychleji?
        </p>
      </Karta>
      <Dal onClick={dal}>Naplánovat cestu</Dal>
    </div>
  );
}

function Pokus({ data, zmen, dal }: { data: DataH3; zmen: Zmen; dal: () => void }) {
  const cesta = (data.cesta.length ? data.cesta : [0]).map(naPole);
  const konec = cesta[cesta.length - 1];
  const hotovo = konec[0] === N - 1 && konec[1] === N - 1;
  const cas = cenaCesty(HALA, cesta);
  const casTipu = data.tipHladova >= 0 && data.tipCas > 0 ? data.tipCas : cas;
  const spravnyTip = HLADOVY_CAS < casTipu ? 0 : HLADOVY_CAS === casTipu ? 1 : 2;
  const ukazHladovou = hotovo && data.tipHladova >= 0;
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod="Klikej na pole, kudy má vozík jet. Další pole musí být vpravo, nebo pod tím posledním.">Vlastní pokus</Nadpis>
      <div className="flex flex-wrap gap-8">
        <Mrizkovnik
          g={HALA}
          popisek="Tvoje cesta"
          bunka={(r, s) => HALA[r][s]}
          trida={(r, s) =>
            naCeste(cesta, r, s) ? "border-[#6fe3c2] bg-[#6fe3c2] font-semibold text-[#06201a]" : "border-white/[.14] bg-[#101c18]"
          }
          klik={(r, s) => zmen({ cesta: [...cesta.map(([a, b]) => a * N + b), r * N + s] })}
          aktivni={(r, s) => !hotovo && dalsiPole(konec, [r, s])}
        />
        {ukazHladovou && (
          <Mrizkovnik
            g={HALA}
            popisek="Hladové pravidlo: vždy na levnější sousední pole"
            bunka={(r, s) => HALA[r][s]}
            trida={(r, s) => (naCeste(HLADOVA, r, s) ? "border-[#e5b73b] bg-[#3a3214] font-semibold" : "border-white/[.14] bg-[#101c18]")}
          />
        )}
      </div>
      <p className="text-[14px] text-[#c5d6cf]" aria-live="polite">
        Čas tvé cesty: <b className="tabular-nums">{cas} s</b>
        {hotovo ? " (v cíli)" : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => zmen({ cesta: cesta.slice(0, -1).map(([a, b]) => a * N + b) })} disabled={cesta.length < 2} className={tlacitko}>
          O pole zpět
        </button>
        <button type="button" onClick={() => zmen({ cesta: [] })} disabled={cesta.length < 2} className={tlacitko}>
          Začít znovu
        </button>
      </div>
      {hotovo && (
        <TipniSi
          otazka="Strojník navrhuje jednoduché pravidlo: na každém poli jet na to sousední, kterým se projede rychleji. Dá jeho pravidlo lepší čas než tvoje cesta?"
          moznosti={["Lepší", "Stejný", "Horší"]}
          vybrano={data.tipHladova}
          vyber={(i) => zmen({ tipHladova: i, tipCas: cas })}
          spravne={spravnyTip}
          vyhodnotit={ukazHladovou}
          vysvetleni={
            <>
              Pravidlo dá {HLADOVY_CAS} s, tvoje cesta {casTipu !== cas ? `při tipu ${casTipu} s, teď ${cas} s` : `${cas} s`}. Hned na startu se vyhne devítce a sjede levým okrajem dolů, kde jsou pole pomalá.
              {cas > NEJLEPSI_CAS
                ? ` Existuje cesta za ${NEJLEPSI_CAS} s. Zkus ji najít, nebo pokračuj: experiment ukáže, jak ji spočítat jistě.`
                : " Tvoje cesta je nejrychlejší možná. V experimentu uvidíš, jak to dokázat bez zkoušení."}
            </>
          }
        />
      )}
      <Dal onClick={dal} disabled={!ukazHladovou}>
        Pokračovat k experimentu
      </Dal>
    </div>
  );
}

/* ───────────── Experiment ───────────── */

const CASTI = [
  { id: "tabulka", nazev: "Tabulka krok za krokem" },
  { id: "zmena", nazev: "Změň halu" },
];

function Experiment({ data, zmen, dal }: { data: DataH3; zmen: Zmen; dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-semibold">Experiment</h2>
        <Casti casti={CASTI} aktualni={data.cast} vyber={(c) => zmen({ cast: c })} />
      </div>
      {data.cast === "tabulka" ? <Tabulka data={data} zmen={zmen} /> : <ZmenHalu data={data} zmen={zmen} dal={dal} />}
    </div>
  );
}

function Tabulka({ data, zmen }: { data: DataH3; zmen: Zmen }) {
  const krok = Math.min(data.krok, KROKY.length);
  const [odpoved, nastavOdpoved] = useState("");
  const [spatne, nastavSpatne] = useState(false);
  const aktualni = krok < KROKY.length ? KROKY[krok] : null;
  const posledni = krok > 0 ? KROKY[krok - 1] : null;
  const hotovaTabulka = krok >= KROKY.length;
  const zpet = Math.min(data.zpet, ZPET.length);
  const cestaZpet = ZPET.slice(0, zpet);
  const vypocitano = (r: number, s: number) => r * N + s < krok;

  const posun = (spravne: boolean) => {
    if (!aktualni) return;
    zmen({ krok: krok + 1, zodpovezene: spravne ? [...data.zodpovezene, krok] : data.zodpovezene });
    nastavOdpoved("");
    nastavSpatne(false);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <JakFunguje algoritmus="mrizka" />
      <div className="flex flex-wrap gap-8">
        <Mrizkovnik
          g={HALA}
          popisek="Hala (sekundy za pole)"
          bunka={(r, s) => HALA[r][s]}
          trida={(r, s) =>
            aktualni && aktualni.r === r && aktualni.s === s ? "border-[#6fe3c2] bg-[#18332b] font-semibold" : "border-white/[.14] bg-[#101c18]"
          }
        />
        <Mrizkovnik
          g={HALA}
          popisek="Tabulka: nejkratší čas ze startu sem"
          bunka={(r, s) => (vypocitano(r, s) ? TABULKA[r][s] : aktualni && aktualni.r === r && aktualni.s === s ? "?" : "")}
          trida={(r, s) => {
            if (naCeste(cestaZpet, r, s)) return "border-[#6fe3c2] bg-[#6fe3c2] font-semibold text-[#06201a]";
            if (aktualni && aktualni.r === r && aktualni.s === s) return "border-[#6fe3c2] bg-[#18332b] font-semibold";
            if (aktualni && ((aktualni.r - 1 === r && aktualni.s === s) || (aktualni.r === r && aktualni.s - 1 === s)))
              return "border-[#6fe3c2] bg-[#1f4136] outline outline-1 outline-[#6fe3c2]";
            return vypocitano(r, s) ? "border-white/[.14] bg-[#101c18] text-[#c5d6cf]" : "border-white/[.06] bg-transparent";
          }}
        />
      </div>

      {aktualni && (
        <Karta nadpis={`Pole v ${aktualni.r + 1}. řadě a ${aktualni.s + 1}. sloupci`}>
          <p className="mb-2 text-[14px] leading-relaxed text-[#c5d6cf]">
            {aktualni.odkud === null
              ? `Start: vozík projede prvním polem za ${aktualni.cena} s.`
              : aktualni.nad === null
                ? `Horní řada: sem se dá přijet jen zleva (${aktualni.vlevo}). Pole stojí ${aktualni.cena} s.`
                : aktualni.vlevo === null
                  ? `Levý sloupec: sem se dá přijet jen shora (${aktualni.nad}). Pole stojí ${aktualni.cena} s.`
                  : `Shora je nejkratší čas ${aktualni.nad}, zleva ${aktualni.vlevo}. Pole stojí ${aktualni.cena} s.`}{" "}
            Kolik bude v buňce?
          </p>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (cisloOdpovedi(odpoved) === aktualni.hodnota) posun(true);
              else nastavSpatne(true);
            }}
          >
            <input
              value={odpoved}
              onChange={(e) => {
                nastavOdpoved(e.target.value);
                nastavSpatne(false);
              }}
              aria-label="Hodnota buňky"
              autoComplete="off"
              className={`${poleTrida} w-[90px]`}
            />
            <button type="submit" disabled={!odpoved.trim()} className={hlavni}>
              Ověřit
            </button>
            <button type="button" onClick={() => posun(false)} className={tlacitko}>
              Ukázat výpočet
            </button>
            <button type="button" onClick={() => zmen({ krok: KROKY.length })} className={tlacitko}>
              Dopočítat celou tabulku
            </button>
          </form>
          {spatne && (
            <p className="mt-2 text-[13px] text-[#ff9d8a]" role="status">
              Ještě ne. Vezmi menší z obou sousedů a přičti čas pole.
            </p>
          )}
        </Karta>
      )}
      {posledni && (
        <p className="text-[14px] leading-relaxed" aria-live="polite">
          {komentarMrizky(posledni)}
          {data.zodpovezene.includes(krok - 1) && <span className="ml-2 font-semibold text-[#6fe3c2]">Spočítal(a) jsi správně.</span>}
        </p>
      )}
      <div>
        <button type="button" onClick={() => zmen({ krok: 0, zodpovezene: [], zpet: 0 })} disabled={krok === 0} className={tlacitko}>
          Tabulku od začátku
        </button>
      </div>

      {hotovaTabulka && (
        <Karta nadpis="Kudy vede nejrychlejší cesta?">
          <p className="mb-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
            V pravém dolním rohu je {NEJLEPSI_CAS} s, nejkratší čas do cíle. Kudy se tam jede, se pozná odzadu: z každého pole do souseda
            nahoře, nebo vlevo, který má v tabulce menší číslo. Odtud se do pole přijelo.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => zmen({ zpet: zpet + 1 })} disabled={zpet >= ZPET.length} className={hlavni}>
              Další pole odzadu
            </button>
            <button type="button" onClick={() => zmen({ zpet: 0 })} disabled={zpet === 0} className={tlacitko}>
              Od cíle znovu
            </button>
            <span className="text-[13px] tabular-nums text-[#a6bdb4]">
              {zpet} z {ZPET.length} polí
            </span>
          </div>
          {zpet >= ZPET.length && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              <Hlaska druh="ok">
                Nejrychlejší cesta trvá {NEJLEPSI_CAS} s a jede přes devítku hned u startu. Hladové pravidlo se jí vyhnulo a skončilo na{" "}
                {HLADOVY_CAS} s. Tabulka měla jen {N * N} buněk, ale nevynechala žádnou z {pocetCest(N, N)} cest.
              </Hlaska>
              <button type="button" onClick={() => zmen({ cast: "zmena" })} className={`${hlavni} self-start`}>
                Dál: změň halu
              </button>
            </div>
          )}
        </Karta>
      )}
    </div>
  );
}

function ZmenHalu({ data, zmen, dal }: { data: DataH3; zmen: Zmen; dal: () => void }) {
  const g: Mrizka = data.uprava.length === N && data.uprava.every((r) => r.length === N) ? data.uprava : HALA;
  const t = spoctiMrizku(g);
  const nej = nejlepsiCesta(g);
  const hl = hladovaCesta(g);
  const nejCas = cenaCesty(g, nej);
  const hlCas = cenaCesty(g, hl);
  const nastavPole = (r: number, s: number, n: number) => zmen({ uprava: g.map((radek, i) => radek.map((x, j) => (i === r && j === s ? n : x))) });
  return (
    <div className="flex flex-col gap-3.5">
      <p className="max-w-3xl text-[14px] leading-relaxed text-[#c5d6cf]">
        Přepiš čísla v hale (1 až 9 s) a sleduj, jak se změní tabulka a obě cesty. Zkus: <b>a)</b> nastavit halu tak, aby hladové pravidlo
        našlo nejrychlejší cestu, <b>b)</b> aby bylo co nejhorší.
      </p>
      <div className="flex flex-wrap gap-8">
        <Mrizkovnik g={g} popisek="Hala (sekundy za pole)" bunka={(r, s) => <CisloPole hodnota={g[r][s]} od={1} po={9} onZmena={(n) => nastavPole(r, s, n)} popisek={`Pole ${r + 1}. řada, ${s + 1}. sloupec`} />} trida={() => "border-transparent"} velikost={72} />
        <Mrizkovnik
          g={g}
          popisek="Tabulka a cesty"
          bunka={(r, s) => t[r][s]}
          trida={(r, s) =>
            naCeste(nej, r, s) && naCeste(hl, r, s)
              ? "border-[#e5b73b] bg-[#6fe3c2] font-semibold text-[#06201a]"
              : naCeste(nej, r, s)
                ? "border-[#6fe3c2] bg-[#6fe3c2] font-semibold text-[#06201a]"
                : naCeste(hl, r, s)
                  ? "border-[#e5b73b] bg-[#3a3214]"
                  : "border-white/[.14] bg-[#101c18] text-[#c5d6cf]"
          }
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
        <span>
          <span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-[#6fe3c2] align-middle" /> nejrychlejší cesta: <b>{nejCas} s</b>
        </span>
        <span>
          <span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#e5b73b] bg-[#3a3214] align-middle" /> hladové pravidlo: <b>{hlCas} s</b>
        </span>
      </div>
      <Hlaska druh={hlCas === nejCas ? "ok" : "info"}>
        {hlCas === nejCas ? "Teď hladové pravidlo našlo nejrychlejší čas. Jistotu ale dává jen tabulka." : `Hladové pravidlo je o ${hlCas - nejCas} s pomalejší.`}
      </Hlaska>
      <div>
        <button type="button" onClick={() => zmen({ uprava: HALA.map((r) => r.slice()) })} className={tlacitko}>
          Vrátit původní halu
        </button>
      </div>
      <Karta>
        <Zjednoduseno>
          Vozík jede jen vpravo a dolů. Když smí i zpátky, cest je nekonečně mnoho a tabulka po řádcích nestačí. Na to je Dijkstrův
          algoritmus z hodiny 6.
        </Zjednoduseno>
        <p className="mt-2 text-[13px] leading-relaxed text-[#a6bdb4]">
          Cest v hale {N} × {N} je {pocetCest(N, N)}. V hale 20 × 20 by jich bylo {cz(pocetCest(20, 20))}, tabulka by měla jen 400 buněk.
        </p>
      </Karta>
      <Dal onClick={dal}>Pokračovat k výzvě</Dal>
    </div>
  );
}

/* ───────────── Výzva ───────────── */

function Vyzva({ data, zmen, dal }: { data: DataH3; zmen: Zmen; dal: () => void }) {
  const v = vyzvaMrizky(useSeed(data.seed, (s) => zmen({ seed: s })));
  const skryta = (r: number, s: number) => v.bunky.findIndex((b) => b.r === r && b.s === s);
  const ok = v.bunky.map((b, i) => cisloOdpovedi(data.bunky[i] ?? "") === b.hodnota);
  const okVyznam = v.vyznam.moznosti[data.vyznam]?.spravne === true;
  const okHladova = cisloOdpovedi(data.hladova) === v.hladova;
  const z = data.zkontrolovano;
  const pismeno = (i: number) => String.fromCharCode(65 + i);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod="Zadání má každý jiné. Když chceš procvičit víc, vezmi si nové.">Výzva</Nadpis>
      <div className="flex flex-wrap gap-8">
        <Mrizkovnik g={v.hala} popisek="Hala (sekundy za pole)" bunka={(r, s) => v.hala[r][s]} />
        <Mrizkovnik
          g={v.hala}
          popisek="Tabulka se třemi chybějícími buňkami"
          bunka={(r, s) => (skryta(r, s) >= 0 ? <b className="text-[#e5b73b]">{pismeno(skryta(r, s))}</b> : v.tabulka[r][s])}
          trida={(r, s) =>
            skryta(r, s) >= 0
              ? "border-[#e5b73b] bg-[#1d1a0f]"
              : v.vyznam.r === r && v.vyznam.s === s
                ? "border-[#6fe3c2] bg-[#18332b] text-[#c5d6cf]"
                : "border-white/[.14] bg-[#101c18] text-[#c5d6cf]"
          }
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[14px]">
          <span className="font-semibold">1.</span> Doplň buňky A, B a C.
        </legend>
        <div className="flex flex-wrap gap-4">
          {v.bunky.map((b, i) => (
            <label key={i} className="flex items-center gap-2 text-[14px]">
              <b className="text-[#e5b73b]">{pismeno(i)}</b>
              <input
                value={data.bunky[i] ?? ""}
                onChange={(e) => zmen({ bunky: data.bunky.map((x, j) => (j === i ? e.target.value : x)), zkontrolovano: false })}
                autoComplete="off"
                className={`${poleTrida} w-[72px]`}
              />
              {z && <Znacka ok={ok[i]} />}
            </label>
          ))}
        </div>
      </fieldset>
      <Vyber
        cislo={2}
        text={<>Co znamená číslo {v.tabulka[v.vyznam.r][v.vyznam.s]} v zeleně orámované buňce?</>}
        moznosti={v.vyznam.moznosti.map((m) => m.text)}
        vybrano={data.vyznam}
        vyber={(i) => zmen({ vyznam: i, zkontrolovano: false })}
        ok={okVyznam}
        zkontrolovano={z}
      />
      <label className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
        <span>
          <span className="font-semibold">3.</span> Kolik sekund dá v téhle hale hladové pravidlo (vždy na rychlejší sousední pole, při shodě
          vpravo)?
        </span>
        <span className="flex items-center gap-2">
          <input value={data.hladova} onChange={(e) => zmen({ hladova: e.target.value, zkontrolovano: false })} autoComplete="off" className={`${poleTrida} w-[90px]`} />
          {z && <Znacka ok={okHladova} />}
        </span>
      </label>
      <KontrolaVyzvy
        zkontrolovano={z}
        spravne={[...ok, okVyznam, okHladova].filter(Boolean).length}
        celkem={5}
        zkontroluj={() => zmen({ zkontrolovano: true })}
        noveZadani={() => zmen({ seed: novySeed(), bunky: ["", "", ""], vyznam: -1, hladova: "", zkontrolovano: false })}
        dal={dal}
      />
    </div>
  );
}
