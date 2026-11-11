"use client";

/** Hodina 5: heuristiky u okružní trasy (nejbližší soused, 2-opt). */

import { FAZE_LEKCE } from "@/lib/algolab/lekce";
import { novySeed } from "@/lib/algolab/nahoda";
import {
  delkaTrasy,
  dvaOpt,
  hrana,
  km,
  MISTA,
  nejblizsiSoused,
  nejkratsiTrasa,
  pocetTras,
  vychoziH5,
  vyzvaTras,
  type DataH5,
  type Misto,
} from "@/lib/algolab/trasy";
import { Casti, Dal, KontrolaVyzvy, KostraLekce, Krokovac, Nadpis, Otazka, ReflexeLekce, TipniSi, Znacka, cisloOdpovedi, cz, useLekce, useSeed } from "./Kostra";
import { Hlaska, Karta, Zjednoduseno, hlavni, tlacitko } from "./spolecne";
import { JakFunguje } from "./JakFunguje";

type Zmen = (z: Partial<DataH5>) => void;

const SOUSED = nejblizsiSoused(MISTA);
const OPT = dvaOpt(MISTA, SOUSED.trasa);
const NEJKRATSI = nejkratsiTrasa(MISTA);
const DELKA_SOUSED = delkaTrasy(MISTA, SOUSED.trasa);
const ZAKAZNIKU = MISTA.length - 1;

export function Hodina5() {
  const { stav, data, zmen, jdiNa } = useLekce(5, FAZE_LEKCE, vychoziH5);
  return (
    <KostraLekce faze={FAZE_LEKCE} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "problem" && <Problem dal={() => jdiNa("pokus", "problem")} />}
      {stav.faze === "pokus" && <Pokus data={data} zmen={zmen} dal={() => jdiNa("experiment", "pokus")} />}
      {stav.faze === "experiment" && <Experiment data={data} zmen={zmen} dal={() => jdiNa("vyzva", "experiment")} />}
      {stav.faze === "vyzva" && <Vyzva data={data} zmen={zmen} dal={() => jdiNa("reflexe", "vyzva")} />}
      {stav.faze === "reflexe" && (
        <ReflexeLekce
          algoritmy={["soused", "dvaopt", "hrubatrasy"]}
          otazka="Proč se u tras technika spokojíme s heuristikou a co tím riskujeme?"
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
              Počet tras roste jako faktoriál: s každým dalším zákazníkem se vynásobí. U dvaceti zákazníků by je i počítač, který
              zkusí miliardu tras za sekundu, zkoušel skoro čtyřicet let. Nikdo zatím nezná přesný postup, který by byl vždy rychlý. Heuristika najde dobrou trasu rychle,
              ale nezaručí, že je nejkratší. Riskujeme pár kilometrů navíc. Často se to vyplatí, protože trasa musí být hotová dnes ráno,
              ne za čtyřicet let. Porovnej to se svou odpovědí: je v ní rychlý růst počtu tras i to, co heuristika nezaručí?
            </>
          }
          pojmy={[
            {
              pojem: "Heuristika",
              text: "Postup, který rychle najde dobré řešení, ale nezaručuje to nejlepší. Používá se, když přesný výpočet trvá příliš dlouho.",
            },
            { pojem: "Nejbližší soused", text: "Heuristika pro trasy: z místa, kde jsi, jeď k nejbližšímu dosud nenavštívenému." },
            {
              pojem: "2-opt",
              text: "Vylepšení trasy: vezme dva úseky, rozpojí je a úsek mezi nimi projede obráceně. Když se trasa zkrátí, změnu nechá. Tak rozplétá křížení.",
            },
            {
              pojem: "Kombinatorická exploze",
              text: "Počet možností roste s velikostí úlohy tak rychle, že všechny nejde vyzkoušet ani nejrychlejším počítačem.",
            },
          ]}
          zaver="Příště: síť cest mezi halami. Tam nejrychlejší cestu najde přesný a rychlý algoritmus a heuristika není potřeba."
        />
      )}
    </KostraLekce>
  );
}

/* ───────────── Mapa ───────────── */

function Mapa({
  mista,
  trasa,
  zvyraznit = [],
  nove = [],
  klik,
  navstivene = [],
  aktualni,
  popisek,
  hranyKlik,
  vybraneHrany = [],
  uzavrit,
}: {
  mista: Misto[];
  /** Okružní trasa (poslední se vrací na první), nebo rozpracovaná cesta. */
  trasa: number[];
  zvyraznit?: number[];
  nove?: [number, number][];
  klik?: (i: number) => void;
  navstivene?: number[];
  aktualni?: number;
  popisek: string;
  hranyKlik?: (i: number) => void;
  vybraneHrany?: number[];
  /** Uzavřít okruh návratem do dílny. Bez udání: když jsou v trase všechna místa. */
  uzavrit?: boolean;
}) {
  const uzavrena = uzavrit ?? trasa.length === mista.length;
  const hrany = trasa.map((_, i) => hrana(trasa, i)).slice(0, uzavrena ? trasa.length : Math.max(0, trasa.length - 1));
  return (
    <svg viewBox="-8 -8 116 116" className="h-[400px] w-[400px] shrink-0 rounded-xl border border-white/10 bg-[#0b1411]" role="img" aria-label={popisek}>
      {hrany.map(([a, b], i) => {
        const cervena = zvyraznit.includes(i);
        const vybrana = vybraneHrany.includes(i);
        return (
          <g key={`${a}-${b}-${i}`}>
            <line
              x1={mista[a].x}
              y1={mista[a].y}
              x2={mista[b].x}
              y2={mista[b].y}
              stroke={cervena || vybrana ? "#ff9d8a" : "#6fe3c2"}
              strokeWidth={cervena || vybrana ? 1.4 : 0.9}
              strokeDasharray={cervena ? "2.5 1.8" : undefined}
            />
            {hranyKlik && (
              <line
                x1={mista[a].x}
                y1={mista[a].y}
                x2={mista[b].x}
                y2={mista[b].y}
                stroke="transparent"
                strokeWidth={5}
                className="cursor-pointer"
                onClick={() => hranyKlik(i)}
              />
            )}
          </g>
        );
      })}
      {nove.map(([a, b], i) => (
        <line key={`n${i}`} x1={mista[a].x} y1={mista[a].y} x2={mista[b].x} y2={mista[b].y} stroke="#e5b73b" strokeWidth={1.4} />
      ))}
      {mista.map((m, i) => {
        const dilna = i === 0;
        const byl = navstivene.includes(i);
        return (
          <g key={m.nazev} onClick={klik ? () => klik(i) : undefined} className={klik ? "cursor-pointer" : undefined}>
            {dilna ? (
              <rect x={m.x - 3} y={m.y - 3} width={6} height={6} rx={1} fill="#e5b73b" />
            ) : (
              <circle cx={m.x} cy={m.y} r={2.6} fill={i === aktualni ? "#e5b73b" : byl ? "#6fe3c2" : "#18332b"} stroke="#6fe3c2" strokeWidth={0.6} />
            )}
            <text x={m.x} y={m.y - 4.2} textAnchor="middle" fontSize={4} fill="#e8f3ef">
              {m.nazev}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Problem({ dal }: { dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Nadpis
        uvod={`Servisní technik vyjede ráno z dílny, musí objet ${ZAKAZNIKU} zákazníků a večer se vrátit. Jezdí se vzdušnou čarou a mapa má měřítko v kilometrech. Čím kratší trasa, tím méně nafty a víc času u zákazníků.`}
      >
        Trasa servisního technika
      </Nadpis>
      <Mapa mista={MISTA} trasa={[]} popisek="Mapa s dílnou a zákazníky" />
      <Karta>
        <Zjednoduseno>Vzdálenosti měříme vzdušnou čarou. Skutečná trasa vede po silnicích a záleží i na provozu.</Zjednoduseno>
      </Karta>
      <Dal onClick={dal}>Naplánovat trasu</Dal>
    </div>
  );
}

function Pokus({ data, zmen, dal }: { data: DataH5; zmen: Zmen; dal: () => void }) {
  const trasa = [0, ...data.trasa.filter((i) => i > 0 && i < MISTA.length)];
  const hotovo = trasa.length === MISTA.length;
  const delka = delkaTrasy(MISTA, trasa);
  const ujeto = trasa.slice(1).reduce((s, m, i) => s + Math.hypot(MISTA[m].x - MISTA[trasa[i]].x, MISTA[m].y - MISTA[trasa[i]].y), 0);
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod="Klikej na zákazníky v pořadí, v jakém je technik objede. Z posledního se vrátí do dílny sám.">Vlastní pokus</Nadpis>
      <div className="flex flex-wrap items-start gap-6">
        <Mapa
          mista={MISTA}
          trasa={trasa}
          navstivene={trasa}
          klik={(i) => !hotovo && !trasa.includes(i) && zmen({ trasa: [...data.trasa, i] })}
          popisek="Mapa s tvou trasou"
        />
        <div className="flex min-w-[260px] flex-col gap-2.5">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zákazníci">
            {MISTA.slice(1).map((m, j) => (
              <button
                key={m.nazev}
                type="button"
                disabled={hotovo || trasa.includes(j + 1)}
                onClick={() => zmen({ trasa: [...data.trasa, j + 1] })}
                className={tlacitko}
              >
                {m.nazev}
              </button>
            ))}
          </div>
          <p className="text-[14px] text-[#c5d6cf]" aria-live="polite">
            {hotovo ? (
              <>
                Tvoje trasa: <b>{km(delka)} km</b> včetně návratu do dílny.
              </>
            ) : (
              <>
                Zatím ujeto {km(ujeto)} km, zbývá {MISTA.length - trasa.length} zákazníků.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => zmen({ trasa: data.trasa.slice(0, -1) })} disabled={!data.trasa.length} className={tlacitko}>
              O zákazníka zpět
            </button>
            <button type="button" onClick={() => zmen({ trasa: [] })} disabled={!data.trasa.length} className={tlacitko}>
              Začít znovu
            </button>
          </div>
          {hotovo && (
            <Hlaska>
              Různých tras je pro {ZAKAZNIKU} zákazníků {cz(pocetTras(ZAKAZNIKU))} (trasa a tatáž trasa opačným směrem se počítají jednou).
              Je ta tvoje nejkratší? Zkusit všechny ručně nejde. V experimentu vyzkoušíme dva rychlé postupy.
            </Hlaska>
          )}
        </div>
      </div>
      <Dal onClick={dal} disabled={!hotovo}>
        Pokračovat k experimentu
      </Dal>
    </div>
  );
}

/* ───────────── Experiment ───────────── */

const CASTI = [
  { id: "soused", nazev: "Nejbližší soused" },
  { id: "opt", nazev: "Rozplétání (2-opt)" },
  { id: "rust", nazev: "Proč nezkusit všechny" },
];

function Experiment({ data, zmen, dal }: { data: DataH5; zmen: Zmen; dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] font-semibold">Experiment</h2>
        <Casti casti={CASTI} aktualni={data.cast} vyber={(c) => zmen({ cast: c })} />
      </div>
      {data.cast === "soused" && <Soused data={data} zmen={zmen} />}
      {data.cast === "opt" && <DvaOpt data={data} zmen={zmen} />}
      {data.cast === "rust" && <Rust dal={dal} />}
    </div>
  );
}

function Soused({ data, zmen }: { data: DataH5; zmen: Zmen }) {
  const krok = Math.min(data.krokSoused, SOUSED.kroky.length + 1);
  const konec = krok > SOUSED.kroky.length;
  const trasa = SOUSED.trasa.slice(0, Math.min(krok, SOUSED.kroky.length) + 1);
  const k = krok >= 1 && krok <= SOUSED.kroky.length ? SOUSED.kroky[krok - 1] : null;
  const vlastni = data.trasa.length === ZAKAZNIKU ? delkaTrasy(MISTA, [0, ...data.trasa]) : null;
  return (
    <div className="flex flex-col gap-3.5">
      <JakFunguje algoritmus="soused" odkryto={konec} />
      <TipniSi
        otazka="Najde nejbližší soused vždycky nejkratší trasu?"
        moznosti={["Ano", "Ne"]}
        vybrano={data.tipSoused}
        vyber={(i) => zmen({ tipSoused: i })}
        spravne={1}
        vyhodnotit={konec}
        vysvetleni={`Bere vždy nejbližší místo a na celek nehledí. Na konci mu zbudou vzdálená místa a jede k nim přes celou mapu. Tady ujel ${km(DELKA_SOUSED)} km.`}
      />
      <div className="flex flex-wrap items-start gap-6">
        <Mapa mista={MISTA} trasa={trasa} uzavrit={konec} navstivene={trasa} aktualni={k ? k.vybrane : undefined} popisek="Trasa nejbližšího souseda" />
        <div className="flex min-w-[280px] flex-1 flex-col gap-2.5">
          {k && (
            <Karta nadpis={`Z místa ${MISTA[k.z].nazev}: vzdálenosti k nenavštíveným`}>
              <table className="w-full text-[14px] tabular-nums">
                <tbody>
                  {k.kandidati.map((c, i) => (
                    <tr key={c.misto} className={i === 0 ? "font-semibold text-[#6fe3c2]" : "text-[#c5d6cf]"}>
                      <td className="py-0.5">{MISTA[c.misto].nazev}</td>
                      <td className="py-0.5 text-right">{km(c.d)} km</td>
                      <td className="py-0.5 pl-2 text-[12px]">{i === 0 ? "nejblíž, jede sem" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Karta>
          )}
          {konec && (
            <Hlaska>
              Z posledního zákazníka se technik vrací do dílny. Celkem {km(DELKA_SOUSED)} km
              {vlastni !== null ? `, tvoje trasa z pokusu měla ${km(vlastni)} km.` : "."}
            </Hlaska>
          )}
        </div>
      </div>
      <Krokovac
        krok={krok}
        pocet={SOUSED.kroky.length + 1}
        nastav={(n) => zmen({ krokSoused: n })}
        zamceno={data.tipSoused < 0 ? "Nejdřív tipni." : undefined}
      />
      {konec && (
        <button type="button" onClick={() => zmen({ cast: "opt" })} className={`${hlavni} self-start`}>
          Dál: rozplétání trasy
        </button>
      )}
    </div>
  );
}

function DvaOpt({ data, zmen }: { data: DataH5; zmen: Zmen }) {
  const krok = Math.min(data.krok2opt, OPT.length);
  const konec = krok >= OPT.length;
  const trasa = krok === 0 ? SOUSED.trasa : OPT[krok - 1].po;
  const dalsi = !konec ? OPT[krok] : null;
  const usetreno = DELKA_SOUSED - delkaTrasy(MISTA, trasa);
  return (
    <div className="flex flex-col gap-3.5">
      <p className="max-w-3xl text-[14px] leading-relaxed text-[#c5d6cf]">Trasa nejbližšího souseda se na mapě kříží. Dá se vylepšit.</p>
      <JakFunguje algoritmus="dvaopt" odkryto={konec} />
      <TipniSi
        otazka="Kolik kilometrů 2-opt na trase nejbližšího souseda ušetří?"
        moznosti={["Asi 5 km", "Asi 60 km", "Asi 150 km"]}
        vybrano={data.tipOpt}
        vyber={(i) => zmen({ tipOpt: i })}
        spravne={1}
        vyhodnotit={konec}
        vysvetleni={`Ušetřil ${km(usetreno)} km ve ${OPT.length} výměnách: z ${km(DELKA_SOUSED)} na ${km(delkaTrasy(MISTA, trasa))} km.`}
      />
      <div className="flex flex-wrap items-start gap-6">
        <Mapa
          mista={MISTA}
          trasa={trasa}
          zvyraznit={dalsi ? [dalsi.i, dalsi.k] : []}
          nove={dalsi ? [[dalsi.pred[dalsi.i], dalsi.pred[dalsi.k]], [dalsi.pred[dalsi.i + 1], dalsi.pred[(dalsi.k + 1) % dalsi.pred.length]]] : []}
          popisek="Trasa během rozplétání"
        />
        <div className="flex min-w-[280px] flex-1 flex-col gap-2.5">
          {dalsi && (
            <Karta nadpis={`Výměna ${krok + 1}`}>
              <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
                Červeně čárkovaně jsou dva úseky, které se rozpojí: {MISTA[dalsi.pred[dalsi.i]].nazev} – {MISTA[dalsi.pred[dalsi.i + 1]].nazev} a{" "}
                {MISTA[dalsi.pred[dalsi.k]].nazev} – {MISTA[dalsi.pred[(dalsi.k + 1) % dalsi.pred.length]].nazev}. Žlutě jsou nové úseky. Výměna
                ušetří {km(dalsi.usetri)} km.
              </p>
            </Karta>
          )}
          <p className="text-[14px] text-[#c5d6cf]">
            Délka trasy: <b className="tabular-nums">{km(delkaTrasy(MISTA, trasa))} km</b>
          </p>
          {konec && (
            <Hlaska druh="ok">
              Žádná další výměna už trasu nezkrátí. Počítač pro kontrolu vyzkoušel všech {cz(NEJKRATSI.zkouseno)} tras: nejkratší má{" "}
              {km(NEJKRATSI.delka)} km. Tady ji 2-opt našel, obecně to ale zaručené není. Může skončit u trasy, kterou žádná jedna výměna
              nezkrátí, a přesto existuje kratší.
            </Hlaska>
          )}
        </div>
      </div>
      <Krokovac krok={krok} pocet={OPT.length} nastav={(n) => zmen({ krok2opt: n })} popisek="Výměna" zamceno={data.tipOpt < 0 ? "Nejdřív tipni." : undefined} />
      {konec && (
        <button type="button" onClick={() => zmen({ cast: "rust" })} className={`${hlavni} self-start`}>
          Dál: proč nezkusit všechny trasy
        </button>
      )}
    </div>
  );
}

const ROKY = 365.25 * 24 * 3600;
function doba(sekund: number): string {
  if (sekund < 1) return "méně než sekunda";
  if (sekund < 60) return `${cz(sekund)} s`;
  if (sekund < 3600) return `${cz(sekund / 60)} min`;
  if (sekund < 86400) return `${cz(sekund / 3600, 1)} h`;
  if (sekund < ROKY) return `${cz(sekund / 86400)} dní`;
  return `${cz(sekund / ROKY)} let`;
}

function Rust({ dal }: { dal: () => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3.5">
      <JakFunguje algoritmus="hrubatrasy" />
      <p className="text-[14px] leading-relaxed text-[#c5d6cf]">
        Proč počítač prostě nevyzkouší všechny trasy? Představ si počítač, který zkusí miliardu tras za sekundu.
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-right text-[14px] tabular-nums">
          <caption className="sr-only">Počet tras a doba zkoušení podle počtu zákazníků</caption>
          <thead className="bg-[#101c18] text-[12px] text-[#a6bdb4]">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Zákazníků</th>
              <th scope="col" className="px-3 py-2 font-medium">Různých tras</th>
              <th scope="col" className="px-3 py-2 font-medium">Zkoušení všech</th>
            </tr>
          </thead>
          <tbody>
            {[5, 7, 10, 13, 15, 20].map((k) => (
              <tr key={k} className="border-t border-white/[.07]">
                <td className="px-3 py-1.5">{k}</td>
                <td className="px-3 py-1.5">{pocetTras(k) < 1e15 ? cz(pocetTras(k)) : `${cz(pocetTras(k) / 1e18, 1)} trilionu`}</td>
                <td className="px-3 py-1.5 font-semibold">{doba(pocetTras(k) / 1e9)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Hlaska>
        S každým dalším zákazníkem se počet tras vynásobí: z 10 na 11 zákazníků jedenáctkrát, z 19 na 20 dvacetkrát. Nejbližší soused a 2-opt
        potřebují pro 20 zákazníků jen stovky až tisíce porovnání vzdáleností.
      </Hlaska>
      <Karta>
        <Zjednoduseno>
          Existují chytřejší přesné postupy než zkoušet všechny trasy. I ty ale u velkého počtu zákazníků trvají neúnosně dlouho, a nikdo
          zatím nezná přesný postup, který by byl vždy rychlý.
        </Zjednoduseno>
      </Karta>
      <Dal onClick={dal}>Pokračovat k výzvě</Dal>
    </div>
  );
}

/* ───────────── Výzva ───────────── */

function Vyzva({ data, zmen, dal }: { data: DataH5; zmen: Zmen; dal: () => void }) {
  const v = vyzvaTras(useSeed(data.seed, (s) => zmen({ seed: s })));
  const poradi = data.vyzvaSoused.filter((i) => i > 0 && i < v.mista.length);
  const ok1 = JSON.stringify(poradi) === JSON.stringify(v.soused.slice(1));
  const vybrane = data.vyzvaHrany.slice(0, 2).sort((a, b) => a - b);
  const ok2 = vybrane.length === 2 && v.krizeni.some(([a, b]) => a === vybrane[0] && b === vybrane[1]);
  const ok3 = cisloOdpovedi(data.odpovedTras) === v.tras;
  const z = data.zkontrolovano;
  const odemceno2 = ok1 && (z || data.vyzvaOdemceno);
  const prepniHranu = (i: number) => {
    const h = data.vyzvaHrany.includes(i) ? data.vyzvaHrany.filter((x) => x !== i) : [...data.vyzvaHrany, i].slice(-2);
    zmen({ vyzvaHrany: h, zkontrolovano: false });
  };
  const nazvyHran = v.soused.map((_, i) => hrana(v.soused, i)).map(([a, b]) => `${v.mista[a].nazev} – ${v.mista[b].nazev}`);
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod="Zadání má každý jiné. Když chceš procvičit víc, vezmi si nové.">Výzva</Nadpis>
      <div className="flex flex-wrap items-start gap-6">
        <Mapa
          mista={v.mista}
          trasa={odemceno2 ? v.soused : [0, ...poradi]}
          navstivene={[0, ...poradi]}
          popisek={odemceno2 ? "Trasa nejbližšího souseda ve výzvě" : "Mapa výzvy"}
          hranyKlik={odemceno2 ? prepniHranu : undefined}
          vybraneHrany={odemceno2 ? vybrane : []}
        />
        <div className="flex min-w-[300px] max-w-xl flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-[14px] leading-relaxed">
              <span className="font-semibold">1.</span> V jakém pořadí objede zákazníky nejbližší soused, když vyjede z dílny? Klikej na jména.
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zákazníci výzvy">
              {v.mista.slice(1).map((m, j) => (
                <button
                  key={m.nazev}
                  type="button"
                  disabled={poradi.includes(j + 1)}
                  onClick={() => zmen({ vyzvaSoused: [...poradi, j + 1], vyzvaHrany: [], vyzvaOdemceno: false, zkontrolovano: false })}
                  className={tlacitko}
                >
                  {m.nazev}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[14px]">
              <span>Dílna → {poradi.map((i) => v.mista[i].nazev).join(" → ") || "…"}</span>
              <button type="button" onClick={() => zmen({ vyzvaSoused: poradi.slice(0, -1), vyzvaHrany: [], vyzvaOdemceno: false, zkontrolovano: false })} disabled={!poradi.length} className={tlacitko}>
                Zpět
              </button>
              {z && <Znacka ok={ok1} />}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-[14px] leading-relaxed">
              <span className="font-semibold">2.</span> Na trase nejbližšího souseda najdi dva úseky, které se kříží. Klikni na ně v mapě
              nebo níž.
            </div>
            {odemceno2 ? (
              <>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Úseky trasy">
                  {nazvyHran.map((n, i) => (
                    <button key={n} type="button" aria-pressed={vybrane.includes(i)} onClick={() => prepniHranu(i)} className={`${tlacitko} ${vybrane.includes(i) ? "!border-[#ff9d8a]" : ""}`}>
                      {n}
                    </button>
                  ))}
                </div>
                {z && vybrane.length === 2 && <Znacka ok={ok2} />}
              </>
            ) : (
              <p className="text-[13px] text-[#a6bdb4]">Odemkne se, až budeš mít otázku 1 zkontrolovanou a správně.</p>
            )}
          </div>
          <Otazka
            cislo={3}
            text={<>Kolik různých okružních tras existuje pro dílnu a {v.zakazniku} zákazníků? Trasa a tatáž trasa opačným směrem se počítají jednou.</>}
            hodnota={data.odpovedTras}
            zmen={(t) => zmen({ odpovedTras: t, zkontrolovano: false })}
            ok={ok3}
            zkontrolovano={z}
          />
        </div>
      </div>
      <KontrolaVyzvy
        zkontrolovano={z}
        spravne={[ok1, ok2, ok3].filter(Boolean).length}
        celkem={3}
        zkontroluj={() => zmen({ zkontrolovano: true, vyzvaOdemceno: data.vyzvaOdemceno || ok1 })}
        noveZadani={() => zmen({ seed: novySeed(), vyzvaSoused: [], vyzvaHrany: [], vyzvaOdemceno: false, odpovedTras: "", zkontrolovano: false })}
        dal={dal}
      />
    </div>
  );
}
