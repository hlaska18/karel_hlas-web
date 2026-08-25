/**
 * Postup v úlohách napříč počítači – čistá logika bez sítě a bez Reactu.
 *
 * Všechno, co se dá pokazit, je tady: normalizace přezdívky, hashování hesla,
 * podepisování lístku a slučování postupu. Routy v `src/app/api/postup/` z toho
 * jen skládají odpovědi, takže se dá otestovat bez Redisu i bez prohlížeče.
 *
 * CO O ŽÁKOVI VÍME: přezdívku a seznam splněných úloh. Nic víc. Přezdívka je
 * schválně přezdívka, ne jméno – záznam pak sám o sobě nikoho neidentifikuje.
 */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { UKOLY } from "@/lib/win/ukoly";

/** Přezdívka: písmena, číslice, pomlčka, podtržítko a tečka. Bez mezer. */
const TVAR_PREZDIVKY = /^[\p{L}\p{N}._-]{2,32}$/u;

/** Strop na heslo. Delší nemá smysl a jen by zdržoval scrypt. */
export const MAX_HESLO = 128;

/** Jak dlouho platí lístek. Delší než školní den, kratší než pololetí. */
const PLATNOST_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Normalizace přezdívky. Bez ní by „Kolibrik", „kolibrik " a „KOLIBRIK" byly
 * tři různé účty a žák by si nevšiml, proč mu zmizel postup.
 *
 * NFC schválně: macOS píše diakritiku rozloženou (NFD), takže „Ježek" zapsaný
 * na Macu a na Windows by jinak nebyl týž řetězec.
 */
export function normalizujPrezdivku(syrova: string): string {
  return syrova.normalize("NFC").trim().toLowerCase();
}

export function prezdivkaSedi(prezdivka: string): boolean {
  return TVAR_PREZDIVKY.test(prezdivka);
}

/* ───────────────────────── Heslo ───────────────────────── */

/**
 * Scrypt v asynchronní podobě.
 *
 * Schválně ne `scryptSync`: scrypt je drahý ZÁMĚRNĚ, aby se heslo nedalo
 * hádat po milionech. Jenže v synchronní podobě to znamená, že po dobu
 * výpočtu stojí celá smyčka a server nedělá nic jiného. Nejtěžší chvíle
 * přitom nepřijde od útočníka, ale v 8:00, kdy se přihlásí celá třída naráz.
 * Asynchronní varianta počítá na vlákně navíc, takže se požadavky nezablokují
 * jeden druhým.
 *
 * Cena výpočtu se NESNIŽUJE. Levnější parametry by znehodnotily hashe všech
 * existujících účtů a žáci by se uprostřed pololetí nepřihlásili; zbytek
 * zátěže hlídá strop na počet pokusů v `sluzba.ts`.
 */
const scryptAsync = promisify(scrypt) as (
  heslo: string,
  sul: string,
  delka: number,
) => Promise<Buffer>;

/**
 * Hashování scryptem ze standardní knihovny – žádná další závislost.
 * Sůl je na každý účet jiná, takže dva žáci se stejným heslem mají jiný hash.
 */
export async function zahashuj(
  heslo: string,
  sul = randomBytes(16).toString("hex"),
): Promise<{ hash: string; sul: string }> {
  const hash = await scryptAsync(heslo, sul, 64);
  return { hash: hash.toString("hex"), sul };
}

/**
 * Ověření hesla. Porovnává se v konstantním čase: obyčejné `===` prozradí
 * délkou shodné předpony, jak daleko se útočník trefil.
 */
export async function hesloSedi(heslo: string, hash: string, sul: string): Promise<boolean> {
  const ocekavany = Buffer.from(hash, "hex");
  // Poškozený nebo prázdný záznam: scrypt s nulovou délkou vyhodí výjimku,
  // což by z toho udělalo pád serveru místo obyčejného „heslo nesedí".
  if (ocekavany.length === 0) return false;
  const spocitany = await scryptAsync(heslo, sul, ocekavany.length);
  return ocekavany.length === spocitany.length && timingSafeEqual(ocekavany, spocitany);
}

/* ───────────────────────── Lístek ───────────────────────── */

/**
 * Po přihlášení se vydá podepsaný lístek a heslo se dál neposílá. Podpis je
 * HMAC tajemstvím z prostředí – bez něj by šlo lístek vyrobit a číst cizí
 * postup.
 */
export function vyrobLístek(prezdivka: string, podpis: string, ted = Date.now()): string {
  const telo = `${prezdivka}.${ted + PLATNOST_MS}`;
  return `${telo}.${createHmac("sha256", podpis).update(telo).digest("hex")}`;
}

/** Přezdívka z platného lístku, jinak `null`. */
export function precti(listek: string, podpis: string, ted = Date.now()): string | null {
  const casti = listek.split(".");
  if (casti.length !== 3) return null;
  const [prezdivka, doKdy, otisk] = casti;

  const ocekavany = createHmac("sha256", podpis).update(`${prezdivka}.${doKdy}`).digest("hex");
  const a = Buffer.from(otisk, "hex");
  const b = Buffer.from(ocekavany, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (!Number.isFinite(Number(doKdy)) || Number(doKdy) < ted) return null;
  return prezdivka;
}

/* ───────────────────────── Postup ───────────────────────── */

const ZNAMA_ID = new Set(UKOLY.map((u) => u.id));

/**
 * Propustí jen id úloh, které opravdu existují.
 *
 * Bez tohohle filtru by byl z endpointu úložiště na cokoli: kdokoli by mohl
 * poslat megabajt vymyšlených řetězců a nechat si je uložit.
 */
export function ocisti(splneno: unknown): string[] {
  if (!Array.isArray(splneno)) return [];
  return [...new Set(splneno.filter((id): id is string => typeof id === "string" && ZNAMA_ID.has(id)))];
}

/**
 * Sloučení postupu ze dvou počítačů.
 *
 * Sjednocení stačí, protože splněná úloha už nikdy neubude (viz `ukoly/splneno`
 * v reduceru). Kdo udělá úlohy doma offline a pak se přihlásí ve škole, sečte
 * se to a nic není potřeba řešit jako konflikt.
 */
export function slouc(a: string[], b: string[]): string[] {
  return ocisti([...a, ...b]);
}
