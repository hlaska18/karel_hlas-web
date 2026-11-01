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
import { sPokyny } from "./scenare";
import {
  chybyPriZmene,
  opravenaPorucha,
  sitProSituaci,
  sitSPoruchou,
  VYCHOZI_SIT,
  type Porucha,
  type SitStav,
  type Situace,
} from "./sit";

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
  | { typ: "okna/srovnej"; plocha: Obdelnik }
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
  | { typ: "virus/zastav" }
  /** Vtíravé okno: dokud běží, po zavření se vrací. */
  | { typ: "reklama/spust" }
  | { typ: "reklama/zastav" }
  // Síťové úlohy: počítač doma za routerem, nebo zpátky ve škole.
  | { typ: "sit/domov" }
  | { typ: "sit/skola" }
  | { typ: "sit/nastav"; sit: SitStav }
  | { typ: "sit/porucha"; porucha: Porucha }
  | { typ: "sit/situace"; situace: Situace }
  | { typ: "napoveda"; id: string };

/**
 * Aplikace, které běží jen v jedné kopii. Spuštění „podruhé" jen přepne na
 * už otevřené okno – stejně jako Nastavení nebo Správce úloh ve Windows.
 */
const JEDINACEK: AppId[] = ["nastaveni", "spravce-uloh", "kalkulacka"];

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

    case "okna/srovnej": {
      // Plocha se zmenšila (zmenšené okno prohlížeče, zavřená celá obrazovka)
      // a okna uložená z většího displeje by koukala ven. Skutečný Windows je
      // po změně rozlišení taky vtáhne zpátky.
      //
      // Sahá se JEN na okna, která ven opravdu lezou. Kdyby se přepočítávala
      // všechna, uživateli by se rozházela rozmístěná okna při každém
      // pixelu změny šířky.
      const { w: sirka, h: vyska } = akce.plocha;
      if (sirka < 320 || vyska < 240) return stav;
      let zmena = false;
      const okna = stav.okna.map((o) => {
        const w = Math.min(o.w, sirka);
        const h = Math.min(o.h, vyska);
        const x = Math.max(0, Math.min(o.x, sirka - w));
        const y = Math.max(0, Math.min(o.y, vyska - h));
        if (w === o.w && h === o.h && x === o.x && y === o.y) return o;
        zmena = true;
        return { ...o, x, y, w, h };
      });
      // Beze změny vrátit TÝŽ objekt: `srovnej` chodí z ResizeObserveru, takže
      // nový stav pokaždé by rozjel překreslování dokola.
      return zmena ? { ...stav, okna } : stav;
    }

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

    case "reklama/spust":
      if (stav.reklamaBezi) return stav;
      // Stopa je tu proto, aby šlo poznat, že vtíravé okno v tomhle počítači
      // VŮBEC BĚŽELO. Bez ní by se úkol „zbav se ho" odškrtl každému, kdo si
      // otevřel simulaci bez toho scénáře – `reklamaBezi` je tam totiž
      // rovnou `false`, tedy stav, který úkol považuje za splněný.
      return {
        ...stav,
        reklamaBezi: true,
        stopy: pridejStopu(stav.stopy, "reklama:spustena"),
      };

    case "reklama/zastav":
      return stav.reklamaBezi ? { ...stav, reklamaBezi: false } : stav;

    case "sit/nastav": {
      // Jakákoli změna sítě: Nastavení ve Windows, kabely u routeru, správa routeru.
      if (!stav.sit) return stav;
      const pred = stav.sit;
      let po = akce.sit;
      let stopy = pridejStopu(stav.stopy, "sit:zmena");
      // Porucha je opravená jen tehdy, když ji opravil žák – ne když se
      // počítač vrátil do výchozího stavu (`system/reset` stopu nepřidá).
      const opravena = opravenaPorucha(po);
      if (opravena) {
        stopy = pridejStopu(stopy, `porucha:${opravena}:opravena`);
        po = { ...po, porucha: undefined };
      }
      const chyby = { ...stav.chyby };
      for (const id of chybyPriZmene(pred, po)) chyby[id] = Math.min(99, (chyby[id] ?? 0) + 1);
      return { ...stav, sit: po, stopy, chyby };
    }

    case "sit/domov":
      return stav.sit ? stav : { ...stav, sit: VYCHOZI_SIT, stopy: stopyDoma(stav) };

    case "sit/skola":
      return { ...stav, sit: undefined, stopy: bezScenare(stav.stopy) };

    case "sit/situace":
      return {
        ...stav,
        disk: akce.situace === "router" ? sPokyny(stav.disk) : stav.disk,
        sit: sitProSituaci(akce.situace),
        // Doklady „ověřeno“ (ipconfig s adresou, přihlášení do routeru) platí
        // jen pro tenhle router – po novém začátku se musí udělat znovu.
        stopy: pridejStopu(
          bezScenare(stopyDoma(stav)).filter((s) => !s.startsWith("overeno:")),
          `situace:${akce.situace}:spustena`,
        ),
      };

    case "sit/porucha":
      return {
        ...stav,
        sit: sitSPoruchou(akce.porucha),
        stopy: pridejStopu(bezScenare(stopyDoma(stav)), `porucha:${akce.porucha}:spustena`),
      };

    case "napoveda": {
      const napovedy = { ...stav.napovedy };
      napovedy[akce.id] = (napovedy[akce.id] ?? 0) + 1;
      return { ...stav, napovedy };
    }

    case "system/reset":
      // Vrátí disk do stavu, ve kterém hodina začínala – z TÉHOŽ scénáře,
      // ne z výchozího. Odškrtané úlohy zůstávají: úklid počítače není důvod
      // přijít o hodinu práce, a splněný úkol už je splněný.
      return {
        ...vychoziStav(stav.scenar),
        splneno: stav.splneno,
        stopy: stav.stopy,
        ...(stav.chyby ? { chyby: stav.chyby } : {}),
        ...(stav.napovedy ? { napovedy: stav.napovedy } : {}),
      };

    default:
      return stav;
  }
}

/**
 * Stopy při příchodu na domácí síť: příkazy spuštěné ve škole se nepočítají,
 * úlohy mluví o domácí adrese a routeru. Když už žák doma je, nic se nemaže.
 */
function stopyDoma(stav: Stav): string[] {
  if (stav.sit) return stav.stopy;
  const skolni = ["prikaz:ipconfig-all", "ping:brana:ok", "ping:internet:ok", "nslookup:ok", "tracert:ok"];
  return stav.stopy.filter((s) => !skolni.includes(s));
}

/**
 * Vyměněná síť ukončí běžící scénář. Jinak by porucha se zapojenými kabely
 * odškrtla „Zapoj router“ ve scénáři, který žák předtím jen spustil.
 */
const bezScenare = (stopy: string[]) => stopy.filter((s) => !/^situace:.*:spustena$/.test(s));

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
