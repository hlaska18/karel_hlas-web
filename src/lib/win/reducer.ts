/**
 * Jediné místo, kde se stav virtuálního počítače mění.
 *
 * Reducer je čistá funkce, takže se dá otestovat bez prohlížeče – a hlavně
 * se nemůže stát, že by dvě aplikace držely rozcházející se představu o tom,
 * co je na disku.
 */

import { zasifruj } from "./virus";
import type { Slozka, Uzel } from "./fs";
import {
  VYCHOZI_OKNO,
  vychoziStav,
  type Nastaveni,
  type Obdelnik,
  type Okno,
  type PolozkaKose,
  type Prichyceni,
  type Stav,
} from "./stav";
import { APLIKACE, type AppId } from "./typy";

export type { Prichyceni };

export type Akce =
  | { typ: "okno/otevri"; app: AppId; arg?: string; titul?: string; plocha?: Obdelnik }
  | { typ: "okno/zavri"; id: number }
  | { typ: "okno/zamer"; id: number }
  | { typ: "okno/prepni"; id: number }
  | { typ: "okno/minimalizuj"; id: number }
  | { typ: "okno/maximalizuj"; id: number }
  | { typ: "okno/obnov"; id: number }
  | { typ: "okno/posun"; id: number; obdelnik: Obdelnik }
  | { typ: "okno/prichyt"; id: number; kam: Prichyceni }
  | { typ: "okno/titul"; id: number; titul: string; arg?: string }
  | { typ: "disk/nastav"; disk: Slozka }
  | { typ: "kos/vloz"; polozky: PolozkaKose[] }
  | { typ: "kos/obnov"; id: string; disk: Slozka }
  | { typ: "kos/odeber"; id: string }
  | { typ: "kos/vyprazdni" }
  | { typ: "schranka/nastav"; schranka: Stav["schranka"] }
  | { typ: "nastaveni/zmen"; zmena: Partial<Nastaveni> }
  | { typ: "stopa"; klic: string }
  | { typ: "ukoly/splneno"; ids: string[] }
  | { typ: "system/nacti"; stav: Stav }
  | { typ: "system/reset" }
  /** Cvičný škodlivý program – jen změna stavu simulace, nic se nespouští. */
  | { typ: "virus/spust" }
  | { typ: "virus/zastav" };

/**
 * Aplikace, které běží jen v jedné kopii. Spuštění „podruhé" jen přepne na
 * už otevřené okno – stejně jako Nastavení nebo Správce úloh ve Windows.
 */
const JEDINACEK: AppId[] = ["nastaveni", "spravce-uloh", "kalkulacka", "ovladaci-panely"];

/** Odsazení každého dalšího okna, aby se nová okna nekladla přesně na sebe. */
const KASKADA = 28;

function novaPoloha(stav: Stav, app: AppId, plocha?: Obdelnik): Obdelnik {
  const { w, h } = VYCHOZI_OKNO[app];
  const sirkaPlochy = plocha?.w ?? 1280;
  const vyskaPlochy = plocha?.h ?? 720;
  // Na malé obrazovce okno zmenšíme, ať se vejde i s okrajem.
  const sirka = Math.min(w, Math.max(320, sirkaPlochy - 40));
  const vyska = Math.min(h, Math.max(240, vyskaPlochy - 40));
  const krok = (stav.okna.length % 6) * KASKADA;
  const x = Math.max(0, Math.round((sirkaPlochy - sirka) / 2) - 60 + krok);
  const y = Math.max(0, Math.round((vyskaPlochy - vyska) / 2) - 40 + krok);
  return {
    x: Math.min(x, Math.max(0, sirkaPlochy - sirka)),
    y: Math.min(y, Math.max(0, vyskaPlochy - vyska)),
    w: sirka,
    h: vyska,
  };
}

const zamer = (stav: Stav, id: number): Stav => {
  const citac = stav.citac + 1;
  return {
    ...stav,
    citac,
    okna: stav.okna.map((o) =>
      o.id === id
        ? { ...o, z: citac, stav: o.stav === "minimalizovane" ? "normalni" : o.stav }
        : o,
    ),
  };
};

const upravOkno = (stav: Stav, id: number, uprava: (o: Okno) => Okno): Stav => ({
  ...stav,
  okna: stav.okna.map((o) => (o.id === id ? uprava(o) : o)),
});

export function reducer(stav: Stav, akce: Akce): Stav {
  switch (akce.typ) {
    case "okno/otevri": {
      if (JEDINACEK.includes(akce.app)) {
        const bezici = stav.okna.find((o) => o.app === akce.app);
        if (bezici) {
          const zamereny = zamer(stav, bezici.id);
          return akce.arg
            ? upravOkno(zamereny, bezici.id, (o) => ({ ...o, arg: akce.arg }))
            : zamereny;
        }
      }
      const citac = stav.citac + 1;
      const okno: Okno = {
        id: citac,
        app: akce.app,
        titul: akce.titul ?? APLIKACE[akce.app].nazev,
        ...novaPoloha(stav, akce.app, akce.plocha),
        z: citac,
        stav: "normalni",
        arg: akce.arg,
      };
      return {
        ...stav,
        citac,
        okna: [...stav.okna, okno],
        stopy: pridejStopu(stav.stopy, `spustil:${akce.app}`),
      };
    }

    case "okno/zavri":
      return { ...stav, okna: stav.okna.filter((o) => o.id !== akce.id) };

    case "okno/zamer":
      return zamer(stav, akce.id);

    case "okno/prepni": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno) return stav;
      const nejvyssi = Math.max(...stav.okna.map((o) => o.z));
      // Klik na panel: aktivní okno schová, neaktivní vytáhne dopředu.
      if (okno.stav !== "minimalizovane" && okno.z === nejvyssi) {
        return upravOkno(stav, akce.id, (o) => ({ ...o, stav: "minimalizovane" }));
      }
      return zamer(stav, akce.id);
    }

    case "okno/minimalizuj":
      return upravOkno(stav, akce.id, (o) => ({ ...o, stav: "minimalizovane" }));

    case "okno/maximalizuj":
      return zamer(
        upravOkno(stav, akce.id, (o) => ({
          ...o,
          stav: "maximalizovane",
          prichyceni: null,
          puvodni: o.stav === "normalni" ? { x: o.x, y: o.y, w: o.w, h: o.h } : o.puvodni,
        })),
        akce.id,
      );

    case "okno/obnov":
      return zamer(
        upravOkno(stav, akce.id, (o) => ({
          ...o,
          stav: "normalni",
          prichyceni: null,
          ...(o.puvodni ?? {}),
          puvodni: undefined,
        })),
        akce.id,
      );

    case "okno/posun":
      return upravOkno(stav, akce.id, (o) => ({
        ...o,
        ...akce.obdelnik,
        stav: "normalni",
        prichyceni: null,
      }));

    case "okno/prichyt":
      return zamer(
        upravOkno(stav, akce.id, (o) => ({
          ...o,
          prichyceni: akce.kam,
          stav: "normalni",
          puvodni: o.prichyceni ? o.puvodni : { x: o.x, y: o.y, w: o.w, h: o.h },
        })),
        akce.id,
      );

    case "okno/titul": {
      // Beze změny se stav nesmí vracet nový. Aplikace hlásí titulek z efektu
      // a nový objekt by ten efekt spustil znovu – a znovu, donekonečna.
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno) return stav;
      const arg = akce.arg ?? okno.arg;
      if (okno.titul === akce.titul && okno.arg === arg) return stav;
      return upravOkno(stav, akce.id, (o) => ({ ...o, titul: akce.titul, arg }));
    }

    case "disk/nastav":
      return { ...stav, disk: akce.disk };

    case "kos/vloz":
      return { ...stav, kos: [...stav.kos, ...akce.polozky] };

    case "kos/obnov":
      return { ...stav, disk: akce.disk, kos: stav.kos.filter((p) => p.id !== akce.id) };

    case "kos/odeber":
      return { ...stav, kos: stav.kos.filter((p) => p.id !== akce.id) };

    case "kos/vyprazdni":
      return { ...stav, kos: [] };

    case "schranka/nastav":
      return { ...stav, schranka: akce.schranka };

    case "nastaveni/zmen":
      return { ...stav, nastaveni: { ...stav.nastaveni, ...akce.zmena } };

    case "stopa":
      // Známou stopu ignorujeme včetně identity stavu – jinak by se z jednoho
      // `useEffect` stala smyčka.
      if (stav.stopy.includes(akce.klic)) return stav;
      return { ...stav, stopy: [...stav.stopy, akce.klic] };

    case "ukoly/splneno": {
      const nove = akce.ids.filter((id) => !stav.splneno.includes(id));
      return nove.length ? { ...stav, splneno: [...stav.splneno, ...nove] } : stav;
    }

    case "system/nacti":
      return akce.stav;

    case "virus/spust": {
      // Přejmenuje připravené soubory a položí na plochu výzvu. Soubory, které
      // si žák vytvořil sám, zůstávají – Karlovo rozhodnutí, ať nikdo nepřijde
      // o vlastní práci.
      if (stav.virusBezi) return stav;
      return { ...stav, disk: zasifruj(stav.disk), virusBezi: true };
    }
    case "virus/zastav":
      return stav.virusBezi ? { ...stav, virusBezi: false } : stav;

    case "system/reset":
      return vychoziStav();

    default:
      return stav;
  }
}

/** Stopy se neopakují – seznam je množina, ne historie. */
function pridejStopu(stopy: string[], klic: string): string[] {
  return stopy.includes(klic) ? stopy : [...stopy, klic];
}

/** Pomůcka pro aplikace: zabal uzly do položek koše. */
export function doKose(uzly: Uzel[], puvod: string[]): PolozkaKose[] {
  return uzly.map((uzel, i) => ({
    id: `${Date.now()}-${i}-${uzel.jmeno}`,
    uzel,
    puvod,
    smazano: Date.now(),
  }));
}
