/**
 * Co se doopravdy stane při přihlášení a při ukládání.
 *
 * Odděleno od rout schválně: routy pak jen převádějí výsledek na HTTP a tahle
 * část se dá otestovat s úložištěm v paměti. Je to nejrizikovější místo celé
 * funkce — chyba tady znamená, že žák přijde o postup.
 */

import {
  MAX_HESLO,
  hesloSedi,
  normalizujPrezdivku,
  ocisti,
  precti,
  prezdivkaSedi,
  vyrobLístek,
  zahashuj,
} from "@/lib/postup/jadro";
import type { Uloziste } from "@/lib/postup/uloziste";

/**
 * Stropy na počet pokusů. Dvě různá počítadla, každé na jiné ohrožení.
 *
 * NEJDŮLEŽITĚJŠÍ VĚC TADY: celá třída sedí za jednou školní IP. Přísný strop
 * podle IP by neodradil útočníka (ten má adres, kolik chce), ale vyhodil by
 * z hodiny třicet žáků naráz. Proto:
 *
 *  - hádání hesla hlídá počítadlo podle PŘEZDÍVKY. Zvyšuje se při každém
 *    pokusu, ale po úspěchu se nuluje, takže ve výsledku počítá neúspěchy
 *    v řadě a žák, který se trefí, nikdy o nic nepřijde. Čte se ještě PŘED
 *    scryptem – jinak by útočník sice neuspěl, ale procesor by ho stál
 *    přesně tolik jako bez stropu;
 *  - IP má strop schválně velkorysý: třicet žáků se přihlásí třicetkrát,
 *    120 nechává prostor na překlepy a znovunačtení, ale zakládání účtů
 *    skriptem se do něj nevejde.
 */
const MAX_POKUSU_PREZDIVKA = 10;
const OKNO_PREZDIVKA_S = 15 * 60;
const MAX_POKUSU_IP = 120;
const OKNO_IP_S = 10 * 60;

export type VysledekPrihlaseni =
  | { stav: "ok"; listek: string; splneno: string[]; novy: boolean }
  | { stav: "spatny-tvar" }
  | { stav: "prilis-mnoho-pokusu" }
  | { stav: "nesedi" };

/**
 * Zvýší počítadlo a řekne, jestli se přeteklo.
 *
 * Když úložiště zrovna neodpoví, pouští DÁL. Přihlašování je uprostřed
 * hodiny; zablokovat kvůli výpadku Redisu třicet žáků by bylo horší než
 * chvíli nemít strop.
 */
async function pretekloUloziste(
  uloziste: Uloziste,
  klic: string,
  strop: number,
  oknoS: number,
): Promise<boolean> {
  try {
    return (await uloziste.pocitadlo(klic, oknoS)) > strop;
  } catch (err) {
    console.warn(`[postup] Počítadlo ${klic} selhalo, pouštím dál:`, err);
    return false;
  }
}

export async function prihlasNeboZaloz(
  uloziste: Uloziste,
  syrovaPrezdivka: unknown,
  syroveHeslo: unknown,
  podpis: string,
  ted = Date.now(),
  ip?: string | null,
): Promise<VysledekPrihlaseni> {
  // Podle IP se počítají VŠECHNY požadavky, ne jen neúspěšné – jinak by
  // hromadné zakládání účtů (samé úspěchy) neomezovalo nic.
  if (ip && (await pretekloUloziste(uloziste, `ip:${ip}`, MAX_POKUSU_IP, OKNO_IP_S))) {
    return { stav: "prilis-mnoho-pokusu" };
  }

  const heslo = typeof syroveHeslo === "string" ? syroveHeslo : "";
  const prezdivka = normalizujPrezdivku(typeof syrovaPrezdivka === "string" ? syrovaPrezdivka : "");

  if (!prezdivkaSedi(prezdivka) || heslo.length < 4 || heslo.length > MAX_HESLO) {
    return { stav: "spatny-tvar" };
  }

  const klicPokusu = `pokus:${prezdivka}`;
  const zaznam = await uloziste.nacti(prezdivka);
  if (zaznam) {
    // Strop se čte PŘED scryptem. Kdyby se kontroloval až po něm, hádání
    // hesel by sice neuspělo, ale procesor by stálo přesně tolik jako bez
    // stropu – a scrypt je drahý schválně.
    if (await pretekloUloziste(uloziste, klicPokusu, MAX_POKUSU_PREZDIVKA, OKNO_PREZDIVKA_S)) {
      return { stav: "prilis-mnoho-pokusu" };
    }
    if (!(await hesloSedi(heslo, zaznam.hash, zaznam.sul))) return { stav: "nesedi" };
    // Po úspěchu se počítadlo nuluje: kdo se po pár překlepech trefí, nemá
    // si příští hodinu nést jejich zbytek.
    await uloziste.vynulujPocitadlo(klicPokusu).catch(() => {});
    await uloziste.uloz(prezdivka, { ...zaznam, naposled: ted });
    return {
      stav: "ok",
      listek: vyrobLístek(prezdivka, podpis, ted),
      splneno: ocisti(zaznam.splneno),
      novy: false,
    };
  }

  const { hash, sul } = await zahashuj(heslo);
  await uloziste.uloz(prezdivka, { hash, sul, splneno: [], zalozeno: ted, naposled: ted });
  return { stav: "ok", listek: vyrobLístek(prezdivka, podpis, ted), splneno: [], novy: true };
}

export type VysledekUlozeni =
  | { stav: "ok"; splneno: string[] }
  | { stav: "neplatny-listek" }
  | { stav: "nenalezeno" };

export async function ulozPostupDoUloziste(
  uloziste: Uloziste,
  listek: unknown,
  splneno: unknown,
  podpis: string,
  ted = Date.now(),
): Promise<VysledekUlozeni> {
  const prezdivka = typeof listek === "string" ? precti(listek, podpis, ted) : null;
  if (!prezdivka) return { stav: "neplatny-listek" };

  const zaznam = await uloziste.nacti(prezdivka);
  // Lístek platí, ale záznam zmizel (žák si ho smazal jinde). Zakládat ho
  // znovu by vzkřísilo, co někdo úmyslně smazal.
  if (!zaznam) return { stav: "nenalezeno" };

  // Sjednocení: splněná úloha už nikdy neubude, takže konflikt nevzniká
  // a postup z druhého počítače se sečte.
  const sloucene = ocisti([...ocisti(zaznam.splneno), ...ocisti(splneno)]);
  await uloziste.uloz(prezdivka, { ...zaznam, splneno: sloucene, naposled: ted });
  return { stav: "ok", splneno: sloucene };
}
