"use client";

/**
 * Efekt džina – okno se při schování vsaje do své ikony v Docku.
 *
 * Kreslí se to jako JEDEN tvar v SVG, kterému se každý snímek přepočítá
 * obrys. Tvar trychtýře počítá `lib/mac/dzin.ts`, kde je i původ té
 * matematiky a její licence.
 *
 * PRVNÍ POKUS BYL Z VODOROVNÝCH PRUHŮ a nefungoval dobře. Shader popisuje
 * transformaci řádek po řádku, tak se nabízelo okno na řádky rozřezat
 * a každému dát `transform`. Jenže pruh je obdélník a zakřivený okraj z nich
 * vychází jako schodiště – při 26 pruzích to bylo zřetelně vidět, při 56 se
 * to zlepšilo jen na levé straně a na pravé, kde okraj běží šikmo, zůstalo.
 * Když se stejně kreslí zjednodušený tvar a ne skutečný obsah okna, nejsou
 * pruhy k ničemu: stačí ten obrys, a ten SVG nakreslí hladce a najednou.
 *
 * PROČ ZJEDNODUŠENÝ TVAR A NE SKUTEČNÝ OBSAH OKNA. Aby se ohýbalo doopravdy
 * to, co je v okně, muselo by se okno nejdřív vykreslit do obrázku. To
 * prohlížeč přímo neumí a obchází se to knihovnami, kterým jeden snímek
 * trvá stovky milisekund – tedy přesně v okamžiku, kdy má být animace
 * plynulá, by se zaseklo. Vsátí trvá necelou půlvteřinu a okno se během ní
 * scvrkne na ikonu; z obsahu by stejně nikdo nic nepřečetl. Kreslí se proto
 * plocha okna, pruh záhlaví a postranní panel, pokud ho okno má.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DOBA_MS,
  VZORKU,
  ZPOMALENI,
  nahladce,
  okrajeProuzku,
  postupRezu,
} from "@/lib/mac/dzin";
import { useMac } from "./system";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Co se má přehrát. `smer` 1 je do Docku, −1 ven z Docku. */
export interface Zadani {
  okno: { x: number; y: number; sirka: number; vyska: number };
  cil: { x: number; y: number; sirka: number; vyska: number };
  smer: 1 | -1;
  /** Výška pruhu záhlaví okna v pixelech. */
  zahlavi: number;
  /** Šířka postranního panelu, nebo 0, když ho okno nemá. */
  postranni: number;
  pomalu?: boolean;
  poDobehnuti?: () => void;
}

const Kontext = createContext<(z: Zadani) => void>(() => {});

/** Spustí vsátí. Když prostředí animace nechce, jen zavolá `poDobehnuti`. */
export const useDzin = () => useContext(Kontext);

export function DzinProvider({ children }: { children: ReactNode }) {
  const [zadani, nastavZadani] = useState<Zadani | null>(null);
  const plocha = useRef<SVGPathElement>(null);
  const panel = useRef<SVGPathElement>(null);
  const zahlavi = useRef<SVGPathElement>(null);
  const skupina = useRef<SVGGElement>(null);

  const { stav } = useMac();
  const omezeno = stav.nastaveni.omezitEfekty;
  const zmenseni = stav.nastaveni.efektMinimalizace === "zmenseni";

  const spust = useCallback(
    (z: Zadani) => {
      /*
       * Rozhoduje JEN nastavení prostředí, ne to, co hlásí počítač pod ním.
       * Dřív se džin sám vypnul, když prohlížeč hlásil „nechci animace"
       * (prefers-reduced-motion). Školní Windows to hlásí, kdykoli mají
       * vypnuté efekty animace – kvůli výkonu, ne kvůli žákovi – a ve třídě
       * pak džin prostě nebyl a nikde nešel zapnout. Tohle je Mac a Mac má
       * vlastní přepínač: Omezit pohyb v Nastavení. Nastavení taky řekne,
       * když počítač animace vypnuté má, takže kdo klid potřebuje, ví kde.
       */
      if (omezeno || z.okno.sirka <= 0 || z.okno.vyska <= 0) {
        z.poDobehnuti?.();
        return;
      }
      nastavZadani(z);
    },
    [omezeno],
  );
  // Efekt se čte při každém snímku z téhle proměnné, ať ho přepnutí
  // v Nastavení nezmění uprostřed letu.
  const zmenseniRef = useRef(zmenseni);
  zmenseniRef.current = zmenseni;

  useEffect(() => {
    if (!zadani) return;
    const zacatek = performance.now();
    const doba = DOBA_MS * (zadani.pomalu ? ZPOMALENI : 1);
    let bezi = true;
    let ram = 0;

    const { okno, cil } = zadani;
    // Cíl vyjádřený v podílu šířky okna – v téhle soustavě počítá `dzin.ts`.
    const kam = (cil.x + cil.sirka / 2 - okno.x) / okno.sirka;
    const sirkaDole = cil.sirka / okno.sirka;

    /**
     * Obrys trychtýře. `odkud` a `kam` vyřezávají jen pás okna – celek je
     * 0 až 1, samotné záhlaví třeba 0 až 0,1. Díky tomu se stejným výpočtem
     * nakreslí i postranní panel a pruh záhlaví, a všechno se ohne stejně.
     */
    /*
     * Efekt zmenšení: okno se zmenšuje jako celek, drží poměr stran a jeho
     * střed jede rovnou do dlaždice v Docku. Žádné ohýbání – proto je to
     * ta klidnější z obou voleb, stejně jako na Macu.
     */
    const zmenseniNaZacatku = zmenseniRef.current;
    const meritko = Math.min(cil.sirka / okno.sirka, cil.vyska / okno.vyska);
    const obdelnik = (
      postup: number,
      odshora: number,
      zdola: number,
      podilVpravo: number,
    ) => {
      const e = nahladce(postup);
      const k = mix(1, meritko, e);
      const sirka = okno.sirka * k;
      const vyska = okno.vyska * k;
      const stredX = mix(okno.x + okno.sirka / 2, cil.x + cil.sirka / 2, e);
      const stredY = mix(okno.y + okno.vyska / 2, cil.y + cil.vyska / 2, e);
      const l = stredX - sirka / 2;
      const r = l + sirka * podilVpravo;
      const t = stredY - vyska / 2 + vyska * odshora;
      const b = stredY - vyska / 2 + vyska * zdola;
      return `M${l.toFixed(1)},${t.toFixed(1)}L${r.toFixed(1)},${t.toFixed(1)}L${r.toFixed(1)},${b.toFixed(1)}L${l.toFixed(1)},${b.toFixed(1)}Z`;
    };

    const obrys = (
      postup: number,
      odshora: number,
      zdola: number,
      podilVpravo: number,
    ) => {
      if (zmenseniNaZacatku)
        return obdelnik(postup, odshora, zdola, podilVpravo);
      const levy: string[] = [];
      const pravy: string[] = [];
      for (let k = 0; k <= VZORKU; k++) {
        const s = odshora + ((zdola - odshora) * k) / VZORKU;
        // Každý řez má svůj vlastní postup: spodek napřed, vršek pozadu.
        const e = postupRezu(postup, s);
        const o = okrajeProuzku(1 - s, kam, sirkaDole);
        const y = mix(okno.y + s * okno.vyska, cil.y + s * cil.vyska, e);
        const l = mix(okno.x, okno.x + o.levy * okno.sirka, e);
        const r = mix(okno.x + okno.sirka, okno.x + o.pravy * okno.sirka, e);
        levy.push(`${l.toFixed(1)},${y.toFixed(1)}`);
        pravy.push(`${(l + (r - l) * podilVpravo).toFixed(1)},${y.toFixed(1)}`);
      }
      return `M${levy.join("L")}L${pravy.reverse().join("L")}Z`;
    };

    const snimek = (ted: number) => {
      if (!bezi) return;
      const uplynulo = Math.min(1, (ted - zacatek) / doba);
      const postup = zadani.smer === 1 ? uplynulo : 1 - uplynulo;
      const zahlaviPodil = Math.min(1, zadani.zahlavi / okno.vyska);
      const panelPodil = Math.min(1, zadani.postranni / okno.sirka);

      plocha.current?.setAttribute("d", obrys(postup, 0, 1, 1));
      panel.current?.setAttribute(
        "d",
        obrys(postup, zahlaviPodil, 1, panelPodil),
      );
      zahlavi.current?.setAttribute("d", obrys(postup, 0, zahlaviPodil, 1));
      if (skupina.current) {
        skupina.current.style.opacity = String(1 - nahladce(postup) * 0.2);
      }

      if (uplynulo < 1) {
        ram = requestAnimationFrame(snimek);
      } else {
        zadani.poDobehnuti?.();
        nastavZadani(null);
      }
    };

    ram = requestAnimationFrame(snimek);
    return () => {
      bezi = false;
      cancelAnimationFrame(ram);
    };
  }, [zadani]);

  return (
    <Kontext.Provider value={spust}>
      {children}
      {zadani && (
        <svg className="pointer-events-none fixed inset-0 z-[790] h-full w-full">
          <g ref={skupina}>
            <path ref={plocha} fill="rgb(var(--mac-povrch))" />
            <path ref={panel} fill="rgb(var(--mac-postranni))" />
            <path ref={zahlavi} fill="rgb(var(--mac-panel))" />
          </g>
        </svg>
      )}
    </Kontext.Provider>
  );
}

/** Výška pruhu okna. Drží se s `h-[58px]` v OknoRam. */
const ZAHLAVI = 58;

const ram = (e: Element) => {
  const r = e.getBoundingClientRect();
  return { x: r.left, y: r.top, sirka: r.width, vyska: r.height };
};

/** Ikona v Docku, do které okno letí. Schované okno má v Docku vlastní. */
function cilVDocku(app: string, oknoId: number): Element | null {
  return (
    document.querySelector(`[data-dock-okno="${oknoId}"]`) ??
    document.querySelector(`[data-dock-app="${app}"]`)
  );
}

/**
 * Znovu změří jen cíl. Při schovávání dlaždice okna v Docku vznikne až se
 * stavem, takže první měření trefí ikonu aplikace; po překreslení se změří
 * znovu a okno letí tam, kde doopravdy skončí.
 */
export function zmerCil(app: string, oknoId: number) {
  const cil = cilVDocku(app, oknoId);
  return cil ? ram(cil) : null;
}

/** Změří živé okno a jeho cíl. `null`, když jedno z nich není na obrazovce. */
export function zmerSchovani(oknoId: number, app: string) {
  const okno = document.querySelector(`[data-okno="${oknoId}"]`);
  const cil = cilVDocku(app, oknoId);
  if (!okno || !cil) return null;
  const panel = okno.querySelector("[data-postranni]");
  return {
    okno: ram(okno),
    cil: ram(cil),
    zahlavi: ZAHLAVI,
    postranni: panel ? panel.getBoundingClientRect().width : 0,
  };
}

/**
 * Totéž pro cestu ven z Docku. Okno na obrazovce ještě není, takže se jeho
 * místo dopočítá z uloženého rámu a z polohy plochy.
 */
export function zmerVraceni(
  oknoRam: { x: number; y: number; w: number; h: number },
  app: string,
  oknoId: number,
) {
  const plocha = document.querySelector(".mac-tapeta");
  const cil = cilVDocku(app, oknoId);
  if (!plocha || !cil) return null;
  const p = plocha.getBoundingClientRect();
  return {
    okno: {
      x: p.left + oknoRam.x,
      y: p.top + oknoRam.y,
      sirka: oknoRam.w,
      vyska: oknoRam.h,
    },
    cil: ram(cil),
    zahlavi: ZAHLAVI,
    postranni: 0,
  };
}
