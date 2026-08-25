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
  /**
   * Zvýší počítadlo a vrátí jeho novou hodnotu. Při prvním zvýšení nastaví,
   * za jak dlouho samo zmizí – díky tomu je z toho klouzavé okno, které se
   * nemusí nijak uklízet.
   */
  pocitadlo(klic: string, sekund: number): Promise<number>;
  /** Vynuluje počítadlo. Používá se po úspěšném přihlášení. */
  vynulujPocitadlo(klic: string): Promise<void>;
}

const klic = (prezdivka: string) => `zak:${prezdivka}`;
const klicPocitadla = (k: string) => `poc:${k}`;

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
    async pocitadlo(k, sekund) {
      const kp = klicPocitadla(k);
      const kolik = await redis.incr(kp);
      // Vypršení se nastavuje jen při prvním zvýšení. Kdyby se obnovovalo
      // pokaždé, okno by se s každým dalším pokusem posouvalo dopředu a
      // zablokovaný by se odblokoval, až kdyby na chvíli přestal úplně.
      if (kolik === 1) await redis.expire(kp, sekund);
      return kolik;
    },
    async vynulujPocitadlo(k) {
      await redis.del(klicPocitadla(k));
    },
  };
}

/**
 * Úložiště v paměti – pro testy a pro lokální vývoj bez Redisu.
 *
 * `hodiny` se dají podstrčit, aby šlo v testech ověřit, že počítadlo po svém
 * okně opravdu vyprší, bez čekání patnácti minut.
 */
export function pametoveUloziste(hodiny: () => number = () => Date.now()): Uloziste {
  const data = new Map<string, Zaznam>();
  const pocitadla = new Map<string, { kolik: number; doKdy: number }>();
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
    async pocitadlo(k, sekund) {
      const ted = hodiny();
      const stavajici = pocitadla.get(k);
      if (!stavajici || stavajici.doKdy <= ted) {
        pocitadla.set(k, { kolik: 1, doKdy: ted + sekund * 1000 });
        return 1;
      }
      stavajici.kolik += 1;
      return stavajici.kolik;
    },
    async vynulujPocitadlo(k) {
      pocitadla.delete(k);
    },
  };
}
