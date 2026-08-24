/**
 * Úložiště postupu. Klient je schovaný za tímhle modulem schválně:
 *  - testy si místo něj podstrčí paměť a nepotřebují síť,
 *  - výměna služby (dnes Upstash Redis přes Vercel Marketplace) je na jednom
 *    místě.
 *
 * Vercel KV už neexistuje – v prosinci 2024 se přesunulo pod Upstash, takže
 * `@vercel/kv` je mrtvý balíček a používá se `@upstash/redis`.
 */

import { Redis } from "@upstash/redis";

/** Co o účtu držíme. Nic víc o žákovi nevíme a vědět nepotřebujeme. */
export type Zaznam = {
  hash: string;
  sul: string;
  splneno: string[];
  zalozeno: number;
  naposled: number;
};

export interface Uloziste {
  nacti(prezdivka: string): Promise<Zaznam | null>;
  uloz(prezdivka: string, zaznam: Zaznam): Promise<void>;
  smaz(prezdivka: string): Promise<void>;
}

const klic = (prezdivka: string) => `zak:${prezdivka}`;

/**
 * Proměnné doplňuje Vercel při připojení úložiště k projektu. Podle toho, jak
 * Upstash integraci zrovna pojmenuje, to jsou `KV_REST_API_*` nebo
 * `UPSTASH_REDIS_REST_*` – bereme obojí, ať se nemusí nic přepisovat.
 */
function prihlaseni(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/** Je synchronizace vůbec nastavená? Bez proměnných web běží dál, jen lokálně. */
export const jeNastavene = (): boolean => prihlaseni() !== null;

let klient: Redis | null = null;

/**
 * Vrátí úložiště, nebo `null`, když není nastavené.
 *
 * `null` schválně místo výjimky: chybějící úložiště NENÍ chyba. Web má fungovat
 * i bez něj (a při `npm run dev` bez jakýchkoli tajemství), jen se
 * synchronizace ohlásí jako nedostupná.
 */
export function ziskejUloziste(): Uloziste | null {
  const udaje = prihlaseni();
  if (!udaje) return null;
  klient ??= new Redis({ url: udaje.url, token: udaje.token });
  const redis = klient;

  return {
    async nacti(prezdivka) {
      // Upstash vrací JSON už rozparsovaný; starší zápis mohl být řetězec.
      const syrove = await redis.get<Zaznam | string>(klic(prezdivka));
      if (!syrove) return null;
      return typeof syrove === "string" ? (JSON.parse(syrove) as Zaznam) : syrove;
    },
    async uloz(prezdivka, zaznam) {
      await redis.set(klic(prezdivka), zaznam);
    },
    async smaz(prezdivka) {
      await redis.del(klic(prezdivka));
    },
  };
}

/** Úložiště v paměti – pro testy a pro lokální vývoj bez Redisu. */
export function pametoveUloziste(): Uloziste {
  const data = new Map<string, Zaznam>();
  return {
    async nacti(prezdivka) {
      return data.get(prezdivka) ?? null;
    },
    async uloz(prezdivka, zaznam) {
      data.set(prezdivka, zaznam);
    },
    async smaz(prezdivka) {
      data.delete(prezdivka);
    },
  };
}
