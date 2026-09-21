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
  | {
      typ: "okno/otevri";
      app: AppId;
      arg?: string;
      titul?: string;
      /**
       * Okno otevřel SYSTÉM, ne žák – třeba uvítání po přihlášení. Pak se
       * nezapíše stopa `spustil:…`, jinak by žák dostal kus úlohy zadarmo:
       * „Lišta se mění" chce, aby Poznámky spustil sám.
       */
      samo?: boolean;
    }
  | { typ: "okno/zavri"; id: number }
  | { typ: "okno/dopredu"; id: number }
  | { typ: "okno/posun"; id: number; ram: Obdelnik }
  /** Aplikace si přepisuje text v záhlaví (Finder cestou, Terminál složkou). */
  | { typ: "okno/titul"; id: number; titul: string; arg?: string }
  /**
   * Pošle otevřené okno jinam. Používá nabídka „Jít“ ve Finderu – na Macu
   * přepne SOUČASNÉ okno, neotevře nové, a bez tohohle by to nešlo: cestu si
   * Finder drží ve vlastním stavu, kam lišta nedosáhne.
   */
  | { typ: "okno/arg"; id: number; arg: string }
  /** Žlutý puntík: okno zmizí do Docku, ale nezaniká. */
  | { typ: "okno/minimalizuj"; id: number }
  /** Zpátky z Docku. */
  | { typ: "okno/obnov"; id: number }
  /** Zelený puntík: přes celou plochu a zpátky. */
  | { typ: "okno/zvetsi"; id: number }
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
        stopy: akce.samo ? stav.stopy : pridejStopu(stav.stopy, `spustil:${akce.app}`),
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

    case "okno/titul": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      // Porovnání napřed: bez něj by se stav měnil při každém překreslení
      // aplikace a prostředí by se zacyklilo přes ukládací efekt.
      if (!okno || (okno.titul === akce.titul && okno.arg === (akce.arg ?? okno.arg))) return stav;
      return {
        ...stav,
        okna: stav.okna.map((o) =>
          o.id === akce.id ? { ...o, titul: akce.titul, arg: akce.arg ?? o.arg } : o,
        ),
      };
    }

    case "okno/arg": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno || okno.arg === akce.arg) return stav;
      const nejvyssi = Math.max(0, ...stav.okna.map((o) => o.z));
      return {
        ...stav,
        vpredu: okno.app,
        okna: stav.okna.map((o) =>
          // Okno se zároveň vytáhne dopředu a vrátí z Docku – „Jít“ na schované
          // okno by jinak nikam viditelně nevedlo.
          o.id === akce.id ? { ...o, arg: akce.arg, minimalizovane: false, z: nejvyssi + 1 } : o,
        ),
      };
    }

    case "okno/minimalizuj": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno) return stav;
      // Okno zůstává v seznamu. Rozdíl proti `okno/zavri` je celá pointa:
      // tam okno zanikne, tady se jen schová. Aplikace běží v obou případech.
      return {
        ...stav,
        okna: stav.okna.map((o) => (o.id === akce.id ? { ...o, minimalizovane: true } : o)),
        stopy: pridejStopu(stav.stopy, `minimalizoval:${okno.app}`),
      };
    }

    case "okno/obnov": {
      const okno = stav.okna.find((o) => o.id === akce.id);
      if (!okno) return stav;
      const nejvyssi = Math.max(0, ...stav.okna.map((o) => o.z));
      return {
        ...stav,
        vpredu: okno.app,
        okna: stav.okna.map((o) =>
          o.id === akce.id ? { ...o, minimalizovane: false, z: nejvyssi + 1 } : o,
        ),
        stopy: pridejStopu(stav.stopy, `vratil-z-docku:${okno.app}`),
      };
    }

    case "okno/zvetsi":
      return {
        ...stav,
        okna: stav.okna.map((o) => (o.id === akce.id ? { ...o, zvetsene: !o.zvetsene } : o)),
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

    case "nastaveni/zmen": {
      const nastaveni = { ...stav.nastaveni, ...akce.zmena };
      // Stopa se zapisuje jen při ZAPNUTÍ. Kdyby ji nechalo i vypnutí, úkol
      // „ukaž si položky s tečkou" by se odškrtl i tomu, kdo přepínač jen
      // našel a hned vrátil zpátky.
      const zapnul = akce.zmena.skrytePolozky === true && !stav.nastaveni.skrytePolozky;
      return {
        ...stav,
        nastaveni,
        stopy: zapnul ? pridejStopu(stav.stopy, "zapnul-tecky") : stav.stopy,
      };
    }

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
