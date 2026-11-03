/**
 * Stav Síťové dílny. Ukládá se jen do prohlížeče, ven jde jen kód postupu,
 * který žák pošle sám (stejně jako v simulátorech).
 *
 * Rozdělanou práci ze simulátoru Windows převezme `nacti` jednou při prvním
 * vstupu: splněné zakázky, chyby, nápovědy a jméno. Samotnou síť ne, ta se
 * vrátí do výchozího stavu.
 */

import { ulozDoProhlizece } from "@/lib/ulozeni";
import {
  VYCHOZI_SIT,
  chybyPriZmene,
  doplnSit,
  opravenaPorucha,
  sitProSituaci,
  sitSPoruchou,
  type Porucha,
  type SitStav,
  type Situace,
} from "@/lib/win/sit";
import { vyhodnotDilnu } from "./ukoly";

export const KLIC_DILNY = "sitova-dilna";
/** Klíče simulátoru Windows, ze kterých se jednou převezme síťový postup. */
const KLIC_WINDOWS = "win11-vyuka-stav";
const KLIC_WINDOWS_SIT = "win11-vyuka-sit";

export interface StavDilny {
  jmeno: string;
  sit: SitStav;
  stopy: string[];
  splneno: string[];
  /** Chyby při opravě (`CHYBY_SITE`). Nesou se v kódu postupu. */
  chyby: Record<string, number>;
  /** Kolik nápověd žák u zakázky otevřel. Vidí jen on, do kódu nejde. */
  napovedy: Record<string, number>;
  /** Co žák od začátku poruchy zjistil v terminálu (podklad pro tipy). */
  dukazy: string[];
  /** Opravená porucha, která čeká na ověření. */
  overuje?: Porucha;
}

export const vychoziDilna = (jmeno = ""): StavDilny => ({
  jmeno,
  sit: VYCHOZI_SIT,
  stopy: [],
  splneno: [],
  chyby: {},
  napovedy: {},
  dukazy: [],
});

export type AkceDilny =
  | { typ: "prikaz"; stopy: string[]; dukazy: string[] }
  | { typ: "stopa"; stopa: string }
  | { typ: "sit/nastav"; sit: SitStav }
  | { typ: "sit/porucha"; porucha: Porucha }
  | { typ: "sit/situace"; situace: Situace }
  | { typ: "sit/vychozi" }
  | { typ: "napoveda"; id: string }
  | { typ: "jmeno"; jmeno: string }
  | { typ: "obnov"; ids: string[] }
  | { typ: "nacti"; stav: StavDilny };

const pridej = (seznam: string[], polozky: string[]) => {
  const novy = [...seznam];
  for (const p of polozky) if (!novy.includes(p)) novy.push(p);
  return novy;
};

/** Běžící scénář skončí, když se síť vymění za jinou. */
const bezScenare = (stopy: string[]) => stopy.filter((s) => !/^situace:.*:spustena$/.test(s));

/**
 * Stačí výsledek na ověření opravy? Porucha DNS se pingem na adresu ověřit
 * nedá: ten chodil i s poruchou. Musí jít o název.
 */
export function overuje(porucha: Porucha, stopy: string[]): boolean {
  const web = stopy.some((s) => s.startsWith("web:"));
  if (porucha === "dns") return web || stopy.includes("nslookup:ok") || stopy.includes("ping:nazev:ok");
  return web || stopy.includes("ping:internet:ok") || stopy.includes("tracert:ok");
}

/** Doplní stopu o ověření, když na ni čeká opravená porucha. */
function sOverenim(stav: StavDilny, nove: string[]): StavDilny {
  if (!stav.overuje || !overuje(stav.overuje, nove)) return stav;
  return { ...stav, overuje: undefined, stopy: pridej(stav.stopy, [`porucha:${stav.overuje}:overena`]) };
}

function krok(stav: StavDilny, akce: AkceDilny): StavDilny {
  switch (akce.typ) {
    case "prikaz":
      return sOverenim(
        { ...stav, stopy: pridej(stav.stopy, akce.stopy), dukazy: pridej(stav.dukazy, akce.dukazy) },
        akce.stopy,
      );
    case "stopa":
      return sOverenim({ ...stav, stopy: pridej(stav.stopy, [akce.stopa]) }, [akce.stopa]);
    case "sit/nastav": {
      const chyby = { ...stav.chyby };
      for (const id of chybyPriZmene(stav.sit, akce.sit)) chyby[id] = Math.min(99, (chyby[id] ?? 0) + 1);
      let sit = akce.sit;
      let stopy = pridej(stav.stopy, ["sit:zmena"]);
      let ceka = stav.overuje;
      const opravena = opravenaPorucha(sit);
      if (opravena) {
        stopy = pridej(stopy, [`porucha:${opravena}:opravena`]);
        sit = { ...sit, porucha: undefined };
        ceka = opravena;
      }
      return { ...stav, sit, stopy, chyby, overuje: ceka };
    }
    case "sit/porucha":
      return {
        ...stav,
        sit: sitSPoruchou(akce.porucha),
        stopy: pridej(
          bezScenare(stav.stopy).filter((s) => s !== `porucha:${akce.porucha}:opravena` && s !== `porucha:${akce.porucha}:overena`),
          [`porucha:${akce.porucha}:spustena`],
        ),
        dukazy: [],
        overuje: undefined,
      };
    case "sit/situace":
      return {
        ...stav,
        sit: sitProSituaci(akce.situace),
        // Důkaz z minula nesmí splnit zakázku na nové síti.
        stopy: pridej(bezScenare(stav.stopy).filter((s) => !s.startsWith("overeno:")), [`situace:${akce.situace}:spustena`]),
        dukazy: [],
        overuje: undefined,
      };
    case "sit/vychozi":
      return { ...stav, sit: VYCHOZI_SIT, stopy: bezScenare(stav.stopy), dukazy: [], overuje: undefined };
    case "napoveda":
      return { ...stav, napovedy: { ...stav.napovedy, [akce.id]: (stav.napovedy[akce.id] ?? 0) + 1 } };
    case "jmeno":
      return { ...stav, jmeno: akce.jmeno };
    case "obnov":
      return { ...stav, splneno: pridej(stav.splneno, akce.ids) };
    case "nacti":
      return akce.stav;
  }
}

/** Splněná zakázka zůstává splněná, i když si žák síť zase rozbije. */
export function reducerDilny(stav: StavDilny, akce: AkceDilny): StavDilny {
  const po = krok(stav, akce);
  return { ...po, splneno: pridej(po.splneno, vyhodnotDilnu(po)) };
}

function precti(klic: string): Record<string, unknown> | null {
  try {
    const text = window.localStorage.getItem(klic);
    const data = text ? (JSON.parse(text) as unknown) : null;
    return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const cisla = (data: unknown): Record<string, number> => {
  const vysledek: Record<string, number> = {};
  if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data)) if (typeof v === "number") vysledek[k] = v;
  }
  return vysledek;
};

const texty = (data: unknown): string[] => (Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : []);

const secti = (a: Record<string, number>, b: Record<string, number>) => {
  const vysledek = { ...a };
  for (const [k, v] of Object.entries(b)) vysledek[k] = Math.max(vysledek[k] ?? 0, v);
  return vysledek;
};

/** Síťový postup z dřívějšího simulátoru Windows, nebo `null`, když žádný není. */
function zWindows(): StavDilny | null {
  const bezny = precti(KLIC_WINDOWS);
  const cviceni = precti(KLIC_WINDOWS_SIT);
  const splneno = pridej(texty(cviceni?.splneno), texty(bezny?.splneno)).filter((id) => id.startsWith("sit-"));
  if (!splneno.length) return null;
  const jmenoZ = (data: Record<string, unknown> | null) => {
    const nastaveni = data?.nastaveni as { jmenoUctu?: unknown } | undefined;
    return typeof nastaveni?.jmenoUctu === "string" ? nastaveni.jmenoUctu : "";
  };
  return {
    ...vychoziDilna(jmenoZ(bezny) || jmenoZ(cviceni)),
    splneno,
    chyby: secti(cisla(cviceni?.chyby), cisla(bezny?.chyby)),
    napovedy: secti(cisla(cviceni?.napovedy), cisla(bezny?.napovedy)),
  };
}

export function nactiDilnu(): StavDilny {
  const ulozeny = precti(KLIC_DILNY);
  if (!ulozeny) return zWindows() ?? vychoziDilna();
  return {
    ...vychoziDilna(typeof ulozeny.jmeno === "string" ? ulozeny.jmeno : ""),
    sit: doplnSit(ulozeny.sit as Partial<SitStav> | undefined),
    stopy: texty(ulozeny.stopy),
    splneno: texty(ulozeny.splneno),
    chyby: cisla(ulozeny.chyby),
    napovedy: cisla(ulozeny.napovedy),
    dukazy: texty(ulozeny.dukazy),
    ...(typeof ulozeny.overuje === "string" ? { overuje: ulozeny.overuje as Porucha } : {}),
  };
}

export const ulozDilnu = (stav: StavDilny) => ulozDoProhlizece(KLIC_DILNY, JSON.stringify(stav));
