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

export type VysledekPrihlaseni =
  | { stav: "ok"; listek: string; splneno: string[]; novy: boolean }
  | { stav: "spatny-tvar" }
  | { stav: "nesedi" };

export async function prihlasNeboZaloz(
  uloziste: Uloziste,
  syrovaPrezdivka: unknown,
  syroveHeslo: unknown,
  podpis: string,
  ted = Date.now(),
): Promise<VysledekPrihlaseni> {
  const heslo = typeof syroveHeslo === "string" ? syroveHeslo : "";
  const prezdivka = normalizujPrezdivku(typeof syrovaPrezdivka === "string" ? syrovaPrezdivka : "");

  if (!prezdivkaSedi(prezdivka) || heslo.length < 4 || heslo.length > MAX_HESLO) {
    return { stav: "spatny-tvar" };
  }

  const zaznam = await uloziste.nacti(prezdivka);
  if (zaznam) {
    if (!hesloSedi(heslo, zaznam.hash, zaznam.sul)) return { stav: "nesedi" };
    await uloziste.uloz(prezdivka, { ...zaznam, naposled: ted });
    return {
      stav: "ok",
      listek: vyrobLístek(prezdivka, podpis, ted),
      splneno: ocisti(zaznam.splneno),
      novy: false,
    };
  }

  const { hash, sul } = zahashuj(heslo);
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
