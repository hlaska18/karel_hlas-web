/**
 * Změny stavu macOS simulace.
 *
 * Nejdůležitější rozdíl proti windowsovému reduceru je v tom, co dělá zavření
 * okna. Ve Windows se okno zavře a tím většinou skončí i program. Tady se
 * zavře JEN OKNO – aplikace zůstane v `bezici`, drží si horní lištu a v Docku
 * má pod ikonou tečku. Ukončí ji teprve `app/ukonci`.
 *
 * Není to detail kvůli věrnosti. Je to celá první úloha: žák si má na vlastní
 * kůži osahat, že okno a program jsou dvě různé věci.
 */

import type { Slozka } from "@/lib/win/fs";
import type { AppId, Obdelnik, Okno, StavMac } from "./stav";
import { VYCHOZI_OKNO, vychoziStavMac } from "./stav";

export type AkceMac =
  | { typ: "okno/otevri"; app: AppId; arg?: string; titul?: string }
  | { typ: "okno/zavri"; id: number }
  | { typ: "okno/dopredu"; id: number }
  | { typ: "okno/posun"; id: number; ram: Obdelnik }
  /** Ukončí aplikaci včetně všech jejích oken – tedy „Ukončit“ nebo Force Quit. */
  | { typ: "app/ukonci"; app: AppId }
  | { typ: "app/dopredu"; app: AppId }
  | { typ: "disk/nastav"; disk: Slozka }
  | { typ: "nastaveni/zmen"; zmena: Partial<StavMac["nastaveni"]> }
  | { typ: "stopa"; klic: string }
  | { typ: "ukoly/splneno"; ids: string[] }
  | { typ: "system/nacti"; stav: StavMac }
  | { typ: "system/reset" };

/** Kaskáda, ať nová okna nepadají přesně na sebe. */
const KASKADA = 26;

function novaPoloha(stav: StavMac, app: AppId): Obdelnik {
  const { w, h } = VYCHOZI_OKNO[app];
  const posun = (stav.okna.length % 5) * KASKADA;
  return { x: 120 + posun, y: 80 + posun, w, h };
}

const dopredu = (stav: StavMac, id: number): StavMac => {
  const okno = stav.okna.find((o) => o.id === id);
  if (!okno) return stav;
  const nejvyssi = Math.max(0, ...stav.okna.map((o) => o.z));
  if (okno.z === nejvyssi && stav.vpredu === okno.app) return stav;
  return {
    ...stav,
    vpredu: okno.app,
    okna: stav.okna.map((o) => (o.id === id ? { ...o, z: nejvyssi + 1 } : o)),
  };
};

export function reducerMac(stav: StavMac, akce: AkceMac): StavMac {
  switch (akce.typ) {
    case "okno/otevri": {
      const id = stav.citac;
      const nejvyssi = Math.max(0, ...stav.okna.map((o) => o.z));
      const okno: Okno = {
        id,
        app: akce.app,
        titul: akce.titul ?? "",
        arg: akce.arg,
        ram: novaPoloha(stav, akce.app),
        z: nejvyssi + 1,
      };
      return {
        ...stav,
        okna: [...stav.okna, okno],
        citac: id + 1,
        vpredu: akce.app,
        bezici: stav.bezici.includes(akce.app) ? stav.bezici : [...stav.bezici, akce.app],
        stopy: pridejStopu(stav.stopy, `spustil:${akce.app}`),
      };
    }

    case "okno/zavri": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno) return stav;
      // Aplikace se ZÁMĚRNĚ nechává běžet. Tohle je ta lekce.
      return {
        ...stav,
        okna: stav.okna.filter((o) => o.id !== akce.id),
        stopy: pridejStopu(stav.stopy, `zavrel-okno:${okno.app}`),
      };
    }

    case "okno/dopredu":
      return dopredu(stav, akce.id);

    case "okno/posun":
      return {
        ...stav,
        okna: stav.okna.map((o) => (o.id === akce.id ? { ...o, ram: akce.ram } : o)),
      };

    case "app/ukonci": {
      // Finder na Macu ukončit nejde. Není to omezení simulace, je to pravda
      // o tom systému – a v nabídce proto u Finderu „Ukončit“ chybí.
      if (akce.app === "finder") return stav;
      const zbyle = stav.bezici.filter((a) => a !== akce.app);
      return {
        ...stav,
        okna: stav.okna.filter((o) => o.app !== akce.app),
        bezici: zbyle,
        vpredu: stav.vpredu === akce.app ? "finder" : stav.vpredu,
        stopy: pridejStopu(stav.stopy, `ukoncil:${akce.app}`),
      };
    }

    case "app/dopredu": {
      if (!stav.bezici.includes(akce.app)) return stav;
      const jehoOkna = stav.okna.filter((o) => o.app === akce.app);
      if (jehoOkna.length === 0) return { ...stav, vpredu: akce.app };
      const posledni = jehoOkna.reduce((a, b) => (a.z > b.z ? a : b));
      return dopredu(stav, posledni.id);
    }

    case "disk/nastav":
      return { ...stav, disk: akce.disk };

    case "nastaveni/zmen":
      return { ...stav, nastaveni: { ...stav.nastaveni, ...akce.zmena } };

    case "stopa":
      if (stav.stopy.includes(akce.klic)) return stav;
      return { ...stav, stopy: [...stav.stopy, akce.klic] };

    case "ukoly/splneno": {
      const nove = akce.ids.filter((id) => !stav.splneno.includes(id));
      return nove.length ? { ...stav, splneno: [...stav.splneno, ...nove] } : stav;
    }

    case "system/nacti":
      return akce.stav;

    case "system/reset":
      return { ...vychoziStavMac(), splneno: stav.splneno, stopy: stav.stopy };

    default:
      return stav;
  }
}

function pridejStopu(stopy: string[], klic: string): string[] {
  return stopy.includes(klic) ? stopy : [...stopy, klic];
}
