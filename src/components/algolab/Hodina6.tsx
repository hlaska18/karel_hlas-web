"use client";

/** Hodina 6: nejrychlejší cesta sítí (Dijkstra) a simulace náhodných výpadků cest. */

import { useState } from "react";
import {
  bezCesty,
  casCesty,
  CESTY,
  cestaDo,
  CIL,
  dijkstra,
  DNU,
  FAZE_H6,
  HALY,
  kritickaCesta,
  najdiHranu,
  nazevCesty,
  nejlepsiZalohy,
  porovnejZalohy,
  simuluj,
  START,
  vychoziH6,
  type DataH6,
} from "@/lib/algolab/grafy";
import { Dal, KostraLekce, Krokovac, Nadpis, Otazka, ReflexeLekce, Vyber, Znacka, cisloOdpovedi, cz, useLekce } from "./Kostra";
import { Hlaska, Karta, Zjednoduseno, hlavni, poleTrida, tlacitko } from "./spolecne";
import { JakFunguje } from "./JakFunguje";

type Zmen = (z: Partial<DataH6>) => void;

const D = dijkstra(HALY, CESTY, START);
const NEJ_CESTA = cestaDo(D.predchozi, CIL);
const NEJ_CAS = D.casy[CIL];
const KRITICKA = kritickaCesta(HALY, CESTY);
/** Pevné zadání interpretace: 10 % a sada dní 2026. */
const P_ZADANI = 10;
const SEED_ZADANI = 2026;
const SIM_ZADANI = simuluj(HALY, CESTY, P_ZADANI, SEED_ZADANI);
const NEJ_ZALOHY = nejlepsiZalohy(porovnejZalohy(HALY, CESTY, P_ZADANI, SEED_ZADANI));
const nazev = (i: number) => nazevCesty(HALY, CESTY[i]);

const PROC = [
  "Do Montáže vedou jen dvě cesty. Když se obě zavřou ve stejný den, díly nedojedou vůbec, a to je horší než pár minut zdržení.",
  "Simulace se spletla, správně je to Sklad – Lisovna.",
  "Kontrola – Montáž je nejkratší cesta v celé síti.",
  "Záloha se vybírá náhodně, výsledek pokaždé vyjde jinak.",
];

export function Hodina6() {
  const { stav, data, zmen, jdiNa } = useLekce(6, FAZE_H6, vychoziH6);
  return (
    <KostraLekce faze={FAZE_H6} aktualni={stav.faze} hotovo={stav.hotovo} jdiNa={jdiNa}>
      {stav.faze === "zadani" && <Zadani dal={() => jdiNa("pokus", "zadani")} />}
      {stav.faze === "pokus" && <Pokus data={data} zmen={zmen} dal={() => jdiNa("dijkstra", "pokus")} />}
      {stav.faze === "dijkstra" && <Dijkstra data={data} zmen={zmen} dal={() => jdiNa("simulace", "dijkstra")} />}
      {stav.faze === "simulace" && <Simulace data={data} zmen={zmen} dal={() => jdiNa("interpretace", "simulace")} />}
      {stav.faze === "interpretace" && <Interpretace data={data} zmen={zmen} dal={() => jdiNa("reflexe", "interpretace")} />}
      {stav.faze === "reflexe" && (
        <ReflexeLekce
          algoritmy={["dijkstra", "simulace"]}
          otazka="Jak Dijkstra pozná, že čas do haly už se nezlepší? A co ti řekla simulace, co samotný Dijkstra neřekne?"
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
              Dijkstra uzavře vždy halu s nejkratším dočasným časem. Kratší cesta do ní vést nemůže: musela by jít přes jinou neuzavřenou halu,
              do které je čas stejný nebo delší, a jízda po cestě nikdy nezabere záporný čas. Dijkstra ale počítá s jedním stavem sítě, kdy
              jsou všechny cesty otevřené. Simulace ho spustila pro {DNU} dní s náhodnými výpadky. Ukázala, jak často a o kolik se rozvoz
              zdrží a co je v síti zranitelné: do Montáže vedou jen dvě cesty. Porovnej to se svou odpovědí: je v ní uzavírání nejbližší haly
              a to, co přidala náhoda?
            </>
          }
          pojmy={[
            { pojem: "Graf", text: "Místa (uzly) a spojení mezi nimi (hrany). U hran může být číslo, třeba minuty jízdy. Graf je i silniční síť nebo počítačová síť." },
            {
              pojem: "Dijkstrův algoritmus",
              text: "Najde nejkratší cesty z jednoho místa do všech ostatních. Vždy uzavře nejbližší dosud neuzavřené místo a z něj zkusí zlepšit časy sousedů.",
            },
            {
              pojem: "Simulace",
              text: "Mnohokrát opakovaný výpočet s náhodně zvolenými podmínkami. Ukáže, co se děje obvykle a co výjimečně.",
            },
            {
              pojem: "Robustnost",
              text: "Jak dobře systém funguje, když se něco pokazí. Síť je robustnější, když do důležitých míst vede víc nezávislých cest.",
            },
          ]}
          zaver="Příště: laboratoř. Ve dvojici změříš, jak rostou počty operací u algoritmů z předchozích hodin."
        />
      )}
    </KostraLekce>
  );
}

/* ───────────── Síť ───────────── */

const SX = 6;
const SY = 4;

function Sit({
  zvyrazneneHaly = [],
  uzavrene = [],
  aktualni,
  cesta = [],
  zavrene = [],
  zaloha = -1,
  klikHala,
  klikCesta,
  popisky,
  popisek,
}: {
  zvyrazneneHaly?: number[];
  uzavrene?: number[];
  aktualni?: number;
  cesta?: number[];
  zavrene?: number[];
  zaloha?: number;
  klikHala?: (i: number) => void;
  klikCesta?: (i: number) => void;
  popisky?: (i: number) => string | null;
  popisek: string;
}) {
  const hranyCesty = cesta.slice(1).map((u, i) => najdiHranu(CESTY, cesta[i], u));
  return (
    <svg viewBox="0 20 600 330" className="h-auto w-full max-w-[640px] shrink-0 rounded-xl border border-white/10 bg-[#0b1411]" role="img" aria-label={popisek}>
      {CESTY.map((h, i) => {
        const a = HALY[h.a];
        const b = HALY[h.b];
        const naCeste = hranyCesty.includes(i);
        const zavrena = zavrene.includes(i);
        const mx = ((a.x + b.x) / 2) * SX;
        const my = ((a.y + b.y) / 2) * SY;
        return (
          <g key={i} onClick={klikCesta ? () => klikCesta(i) : undefined} className={klikCesta ? "cursor-pointer" : undefined}>
            <line
              x1={a.x * SX}
              y1={a.y * SY}
              x2={b.x * SX}
              y2={b.y * SY}
              stroke={zavrena ? "#ff9d8a" : naCeste ? "#6fe3c2" : i === zaloha ? "#e5b73b" : "#4b6159"}
              strokeWidth={naCeste || i === zaloha ? 4 : 2}
              strokeDasharray={zavrena ? "8 6" : undefined}
            />
            {klikCesta && <line x1={a.x * SX} y1={a.y * SY} x2={b.x * SX} y2={b.y * SY} stroke="transparent" strokeWidth={16} />}
            <circle cx={mx} cy={my} r={11} fill="#0b1411" stroke={i === zaloha ? "#e5b73b" : "#4b6159"} />
            <text x={mx} y={my + 4.5} textAnchor="middle" fontSize={13} fill="#e8f3ef" className="tabular-nums">
              {h.minut}
            </text>
          </g>
        );
      })}
      {HALY.map((u, i) => {
        const uzavrena = uzavrene.includes(i);
        const je = aktualni === i;
        const zvyraznena = zvyrazneneHaly.includes(i);
        const pop = popisky?.(i);
        return (
          <g key={u.nazev} onClick={klikHala ? () => klikHala(i) : undefined} className={klikHala ? "cursor-pointer" : undefined}>
            <rect
              x={u.x * SX - 42}
              y={u.y * SY - 15}
              width={84}
              height={30}
              rx={8}
              fill={je ? "#6fe3c2" : uzavrena ? "#123c30" : zvyraznena ? "#1f4136" : "#18332b"}
              stroke={je || zvyraznena ? "#6fe3c2" : i === START || i === CIL ? "#e5b73b" : "#6f8a80"}
              strokeWidth={je || zvyraznena ? 2 : 1}
            />
            <text x={u.x * SX} y={u.y * SY + 4.5} textAnchor="middle" fontSize={13} fill={je ? "#06201a" : "#e8f3ef"} fontWeight={je ? 600 : 400}>
              {u.nazev}
            </text>
            {pop && (
              <text x={u.x * SX} y={u.y * SY + (u.y < 50 ? -21 : 31)} textAnchor="middle" fontSize={12} fill="#e5b73b" className="tabular-nums">
                {pop}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Zadani({ dal }: { dal: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Nadpis
        uvod="Díly jezdí vozíkem ze Skladu do Montáže. Haly spojují cesty a číslo u cesty je, kolik minut po ní vozík jede. Vozík může jet po cestě oběma směry. Jak se dostat do Montáže nejrychleji? A co když se některá cesta zavře?"
      >
        Rozvoz po areálu
      </Nadpis>
      <Sit popisek="Areál: haly a cesty s minutami jízdy" />
      <Karta>
        <Zjednoduseno>Doba jízdy po cestě je pořád stejná. Ve skutečnosti záleží na provozu, nakládce i řidiči.</Zjednoduseno>
      </Karta>
      <Dal onClick={dal}>Najít cestu</Dal>
    </div>
  );
}

function Pokus({ data, zmen, dal }: { data: DataH6; zmen: Zmen; dal: () => void }) {
  const cesta = data.cesta.length && data.cesta[0] === START ? data.cesta : [START];
  const posledni = cesta[cesta.length - 1];
  const hotovo = posledni === CIL;
  const cas = casCesty(CESTY, cesta);
  const pridej = (i: number) => {
    if (hotovo || cesta.includes(i) || najdiHranu(CESTY, posledni, i) < 0) return;
    zmen({ cesta: [...cesta, i] });
  };
  const sousede = HALY.map((_, i) => i).filter((i) => !cesta.includes(i) && najdiHranu(CESTY, posledni, i) >= 0);
  return (
    <div className="flex flex-col gap-4">
      <Nadpis uvod="Klikej na haly, kudy pojede vozík. Další hala musí být s poslední spojená cestou.">Vlastní pokus</Nadpis>
      <div className="flex flex-wrap items-start gap-6">
        <Sit cesta={cesta} zvyrazneneHaly={hotovo ? [] : sousede} aktualni={posledni} klikHala={pridej} popisek="Areál s tvou cestou" />
        <div className="flex min-w-[260px] flex-col gap-2.5">
          {!hotovo && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kam dál">
              {sousede.map((i) => (
                <button key={i} type="button" onClick={() => pridej(i)} className={tlacitko}>
                  {HALY[i].nazev}
                </button>
              ))}
            </div>
          )}
          <p className="text-[14px] text-[#c5d6cf]" aria-live="polite">
            {cesta.map((i) => HALY[i].nazev).join(" → ")}: <b className="tabular-nums">{cas} min</b>
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => zmen({ cesta: cesta.slice(0, -1) })} disabled={cesta.length < 2} className={tlacitko}>
              O halu zpět
            </button>
            <button type="button" onClick={() => zmen({ cesta: [START] })} disabled={cesta.length < 2} className={tlacitko}>
              Začít znovu
            </button>
          </div>
          {hotovo && (
            <Hlaska>
              Do Montáže za {cas} min. Je to nejrychlejší možnost? Cest ze Skladu do Montáže, které žádnou halu neprojedou dvakrát, je tu 28.
              V reálné síti s tisíci křižovatek by jich byly miliardy. Dijkstrův algoritmus najde nejrychlejší, aniž by je zkoušel.
            </Hlaska>
          )}
        </div>
      </div>
      <Dal onClick={dal} disabled={!hotovo}>
        Pokračovat: Dijkstra krok za krokem
      </Dal>
    </div>
  );
}

function Dijkstra({ data, zmen, dal }: { data: DataH6; zmen: Zmen; dal: () => void }) {
  const krok = Math.min(data.krok, D.kroky.length);
  const k = krok > 0 ? D.kroky[krok - 1] : null;
  const casy = k ? k.casy : HALY.map((_, i) => (i === START ? 0 : Infinity));
  const uzavrene = k ? k.uzavrene : [];
  const konec = krok >= D.kroky.length;
  const potrebaTip = !konec && data.tipy.length <= krok;
  const tip = (i: number) => {
    if (!potrebaTip || uzavrene.includes(i)) return;
    zmen({ tipy: [...data.tipy.slice(0, krok), i] });
  };
  const trefy = D.kroky.filter((x, i) => data.tipy[i] === x.uzavrena).length;
  const vlastni = data.cesta.length > 1 && data.cesta[data.cesta.length - 1] === CIL ? casCesty(CESTY, data.cesta) : null;
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-[22px] font-semibold">Dijkstra krok za krokem</h2>
      <JakFunguje algoritmus="dijkstra" />
      <div className="flex flex-wrap items-start gap-6">
        <Sit
          uzavrene={uzavrene}
          aktualni={k?.uzavrena}
          cesta={konec ? NEJ_CESTA : []}
          popisky={(i) => (casy[i] === Infinity ? "?" : `${casy[i]} min`)}
          klikHala={potrebaTip ? tip : undefined}
          popisek="Areál s dočasnými časy hal"
        />
        <div className="flex min-w-[280px] max-w-md flex-1 flex-col gap-2.5">
          {potrebaTip && (
            <div className="rounded-xl border border-[#e5b73b]/40 bg-[#1d1a0f] p-3.5">
              <div className="text-[11px] font-semibold tracking-[.08em] text-[#e5b73b]">TIPNI SI NEJDŘÍV</div>
              <p className="mt-1 text-[14px]">Kterou halu Dijkstra v {krok + 1}. kroku uzavře?</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {HALY.map((h, i) =>
                  uzavrene.includes(i) ? null : (
                    <button key={h.nazev} type="button" onClick={() => tip(i)} className={tlacitko}>
                      {h.nazev}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
          {!potrebaTip && !konec && (
            <p className="text-[14px] text-[#c5d6cf]">
              Tvůj tip: <b>{HALY[data.tipy[krok]].nazev}</b>. Klikni na Další krok.
            </p>
          )}
          {k && (
            <Karta nadpis={`${krok}. krok: uzavře se ${HALY[k.uzavrena].nazev} (${k.cas} min)`}>
              {data.tipy[krok - 1] !== undefined && (
                <p className={`mb-1.5 text-[14px] ${data.tipy[krok - 1] === k.uzavrena ? "text-[#6fe3c2]" : "text-[#ffd9d0]"}`}>
                  {data.tipy[krok - 1] === k.uzavrena
                    ? "Tvůj tip vyšel."
                    : `Tvůj tip: ${HALY[data.tipy[krok - 1]].nazev}. Uzavře se ale ${HALY[k.uzavrena].nazev}, protože má ze všech neuzavřených hal nejmenší čas.`}
                </p>
              )}
              {k.zlepseni.length ? (
                <ul className="flex flex-col gap-1 text-[14px] text-[#c5d6cf]">
                  {k.zlepseni.map((z) => (
                    <li key={z.v}>
                      {HALY[z.v].nazev}: {z.stary === Infinity ? "zatím nevím" : `${z.stary} min`} →{" "}
                      {z.zlepsi ? <b className="text-[#6fe3c2]">{z.novy} min</b> : <span>přes {HALY[k.uzavrena].nazev} {z.novy} min, nezlepší</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-[#c5d6cf]">Všichni sousedé už jsou uzavření.</p>
              )}
            </Karta>
          )}
          {konec && (
            <Hlaska druh="ok">
              Nejrychlejší cesta: {NEJ_CESTA.map((i) => HALY[i].nazev).join(" → ")}, {NEJ_CAS} min
              {vlastni !== null ? `. Tvoje cesta z pokusu měla ${vlastni} min.` : "."} Tipů jsi trefil(a) {trefy} ze {D.kroky.length}.
              Algoritmus tím zná nejkratší čas i do všech ostatních hal.
            </Hlaska>
          )}
        </div>
      </div>
      <Krokovac
        krok={krok}
        pocet={D.kroky.length}
        nastav={(n) => zmen({ krok: n, tipy: data.tipy.slice(0, Math.max(n, Math.min(data.tipy.length, n + 1))) })}
        zamceno={potrebaTip ? "Nejdřív tipni, kterou halu uzavře." : undefined}
      />
      <Dal onClick={dal} disabled={!konec}>
        Pokračovat k simulaci výpadků
      </Dal>
    </div>
  );
}

const dni = (n: number) => `${n} ${n === 1 ? "den" : n >= 2 && n <= 4 ? "dny" : "dní"}`;

/** Sloupcový graf četností časů rozvozu za 200 dní. */
function Histogram({ cetnosti, nedojelo }: { cetnosti: Map<number, number>; nedojelo: number }) {
  const casy = Array.from(cetnosti.keys()).sort((a, b) => a - b);
  const sloupce: { popisek: string; pocet: number; varovani?: boolean }[] = casy.map((c) => ({ popisek: `${c}`, pocet: cetnosti.get(c) ?? 0 }));
  if (nedojelo) sloupce.push({ popisek: "nedojede", pocet: nedojelo, varovani: true });
  const max = Math.max(1, ...sloupce.map((s) => s.pocet));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-[150px] items-end gap-1.5" role="img" aria-label={`Četnost časů rozvozu: ${sloupce.map((s) => `${s.popisek} ${dni(s.pocet)}`).join(", ")}`}>
        {sloupce.map((s) => (
          <div key={s.popisek} className="flex w-[44px] flex-col items-center justify-end gap-1">
            <span className="text-[11px] tabular-nums text-[#c5d6cf]">{s.pocet}</span>
            <div className={`w-full rounded-t ${s.varovani ? "bg-[#ff9d8a]" : "bg-[#6fe3c2]"}`} style={{ height: `${(s.pocet / max) * 110}px`, minHeight: 2 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {sloupce.map((s) => (
          <span key={s.popisek} className="w-[44px] text-center text-[11px] text-[#a6bdb4]">
            {s.popisek}
          </span>
        ))}
      </div>
      <span className="text-[11px] text-[#a6bdb4]">minut rozvozu (počet dní nad sloupcem)</span>
    </div>
  );
}

function Simulace({ data, zmen, dal }: { data: DataH6; zmen: Zmen; dal: () => void }) {
  const sim = simuluj(HALY, CESTY, data.p, data.simSeed, data.zaloha);
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-[22px] font-semibold">Simulace výpadků</h2>
      <p className="max-w-3xl text-[14px] leading-relaxed text-[#c5d6cf]">
        Cesty se občas zavřou: oprava, vykládka, sníh. Simulace projde {DNU} dní. Jednu cestu můžeš <b>zálohovat</b>: ta se nezavře nikdy.
      </p>
      <JakFunguje algoritmus="simulace" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
        <label className="flex items-center gap-2 text-[14px]">
          Pravděpodobnost zavření cesty
          <input type="range" min={0} max={40} step={5} value={data.p} onChange={(e) => zmen({ p: Number(e.target.value) })} className="accent-[#6fe3c2]" />
          <b className="w-[40px] tabular-nums">{data.p} %</b>
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          Záloha
          <select value={data.zaloha} onChange={(e) => zmen({ zaloha: Number(e.target.value) })} className={poleTrida}>
            <option value={-1}>žádná</option>
            {CESTY.map((_, i) => (
              <option key={i} value={i}>
                {nazev(i)}
              </option>
            ))}
          </select>
        </label>
        <span className="flex items-center gap-2 text-[14px]">
          Sada dní <b className="tabular-nums">{data.simSeed}</b>
          <button type="button" onClick={() => zmen({ simSeed: data.simSeed + 1 })} className={tlacitko}>
            Jiných {DNU} dní
          </button>
          <button type="button" onClick={() => zmen({ p: P_ZADANI, simSeed: SEED_ZADANI, zaloha: -1 })} className={tlacitko}>
            Výchozí nastavení
          </button>
        </span>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Sit zaloha={data.zaloha} klikCesta={(i) => zmen({ zaloha: data.zaloha === i ? -1 : i })} popisek="Areál, kliknutím na cestu ji zálohuješ" />
        <div className="flex min-w-[300px] flex-col gap-3">
          <Histogram cetnosti={sim.cetnosti} nedojelo={sim.nedojelo} />
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[14px]">
            <dt className="text-[#a6bdb4]">Bez zdržení ({NEJ_CAS} min)</dt>
            <dd className="tabular-nums">{dni(sim.bezZdrzeni)}</dd>
            <dt className="text-[#a6bdb4]">Průměr (dny, kdy díly dojely)</dt>
            <dd className="tabular-nums">{cz(sim.prumer, 2)} min</dd>
            <dt className="text-[#a6bdb4]">Nejhorší den</dt>
            <dd className="tabular-nums">{sim.nejhorsi} min</dd>
            <dt className="text-[#a6bdb4]">Díly nedojely vůbec</dt>
            <dd className={`tabular-nums ${sim.nedojelo ? "font-semibold text-[#ff9d8a]" : ""}`}>{dni(sim.nedojelo)}</dd>
          </dl>
        </div>
      </div>
      <Karta>
        <Zjednoduseno>
          Cesty se zavírají nezávisle na sobě a vždy na celý den. Ve skutečnosti spolu výpadky souvisí: sníh zavře víc cest najednou.
          Stejná sada dní dá vždy stejný výsledek, takže zálohy jde porovnat spravedlivě.
        </Zjednoduseno>
      </Karta>
      <Dal onClick={dal}>Pokračovat: co z toho plyne</Dal>
    </div>
  );
}

function Interpretace({ data, zmen, dal }: { data: DataH6; zmen: Zmen; dal: () => void }) {
  const [zavrena, nastavZavrenou] = useState(-1);
  const ok1 = data.kriticka === KRITICKA.hrana;
  const ok2 = cisloOdpovedi(data.odpovedBezZdrzeni) === SIM_ZADANI.bezZdrzeni;
  const ok3 = NEJ_ZALOHY.includes(data.nejlepsiZaloha);
  const ok4 = data.proc === 0;
  const z = data.zkontrolovano;
  const vse = ok1 && ok2 && ok3 && ok4;
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Nadpis uvod={`Odpovídej podle simulace s výchozím nastavením: ${P_ZADANI} %, sada dní ${SEED_ZADANI}. Simulaci si můžeš otevřít v předchozí fázi.`}>
        Co z toho plyne
      </Nadpis>
      <Karta nadpis="Nástroj: zavři jednu cestu natrvalo">
        <label className="flex flex-wrap items-center gap-2 text-[14px]">
          Zavřená cesta
          <select value={zavrena} onChange={(e) => nastavZavrenou(Number(e.target.value))} className={poleTrida}>
            <option value={-1}>žádná</option>
            {CESTY.map((_, i) => (
              <option key={i} value={i}>
                {nazev(i)}
              </option>
            ))}
          </select>
          <span>
            → nejrychlejší rozvoz <b className="tabular-nums">{zavrena >= 0 ? bezCesty(HALY, CESTY, zavrena) : NEJ_CAS} min</b>
          </span>
        </label>
      </Karta>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-[14px] leading-relaxed">
          <span className="font-semibold">1.</span> Kterou cestu by bylo nejhorší ztratit natrvalo (rozvoz se nejvíc prodlouží)?
        </legend>
        <div className="flex items-center gap-2">
          <select value={data.kriticka} onChange={(e) => zmen({ kriticka: Number(e.target.value), zkontrolovano: false })} className={poleTrida} aria-label="Nejhorší ztráta">
            <option value={-1}>vyber cestu</option>
            {CESTY.map((_, i) => (
              <option key={i} value={i}>
                {nazev(i)}
              </option>
            ))}
          </select>
          {z && <Znacka ok={ok1} />}
        </div>
      </fieldset>
      <Otazka
        cislo={2}
        text={`Kolik dní z ${DNU} jely díly bez zdržení, bez zálohy?`}
        hodnota={data.odpovedBezZdrzeni}
        zmen={(t) => zmen({ odpovedBezZdrzeni: t, zkontrolovano: false })}
        ok={ok2}
        zkontrolovano={z}
      />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-[14px] leading-relaxed">
          <span className="font-semibold">3.</span> Kterou jednu cestu se vyplatí zálohovat? Nejlepší je ta, se kterou díly nejméně dní
          nedojedou, při shodě ta s nižším průměrem.
        </legend>
        <div className="flex items-center gap-2">
          <select value={data.nejlepsiZaloha} onChange={(e) => zmen({ nejlepsiZaloha: Number(e.target.value), zkontrolovano: false })} className={poleTrida} aria-label="Nejlepší záloha">
            <option value={-1}>vyber cestu</option>
            {CESTY.map((_, i) => (
              <option key={i} value={i}>
                {nazev(i)}
              </option>
            ))}
          </select>
          {z && <Znacka ok={ok3} />}
        </div>
      </fieldset>
      <Vyber
        cislo={4}
        text="Proč je nejlepší záloha jiná cesta než ta, jejíž ztráta rozvoz nejvíc prodlouží?"
        moznosti={PROC}
        vybrano={data.proc}
        vyber={(i) => zmen({ proc: i, zkontrolovano: false })}
        ok={ok4}
        zkontrolovano={z}
      />
      {z && (
        <Hlaska druh={vse ? "ok" : "tip"}>
          {vse
            ? `Přesně tak. Bez Skladu – Lisovny se jezdí ${KRITICKA.cas} min místo ${NEJ_CAS}, to je zdržení. Když se ale ve stejný den zavřou obě cesty do Montáže, díly nedojedou vůbec. Záloha cesty Kontrola – Montáž tomu zabrání a navíc je na nejrychlejší cestě.`
            : `Správně ${[ok1, ok2, ok3, ok4].filter(Boolean).length} ze 4. Pomůže nástroj nahoře a simulace s výchozím nastavením.`}
        </Hlaska>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => zmen({ zkontrolovano: true })} className={hlavni}>
          Zkontrolovat
        </button>
        <button type="button" onClick={dal} className={tlacitko}>
          Pokračovat k vyhodnocení
        </button>
      </div>
    </div>
  );
}
