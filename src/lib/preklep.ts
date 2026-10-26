/**
 * Odhad, kterou stránku simulátoru chtěl člověk otevřít, když adresu napsal
 * s překlepem.
 *
 * Vercel Analytics v týdnu 5.–12. 10. 2026 ukázal asi deset ručně psaných
 * adres: /windovs, /windous, /wimdows, /windws, /windows), /windows/users,
 * /mac… Žáci adresu přepisují z tabule a končili na 404 bez odkazu na
 * simulátor. Stránka 404 teď podle tohohle odhadu nabídne tlačítko.
 *
 * Schválně nabídka, ne přesměrování: žák uvidí, že adresu napsal špatně.
 */

export type Simulator = "windows" | "macos" | "sql";

/** Editační vzdálenost (Levenshtein) – adresy jsou krátké, stačí přímý výpočet. */
function vzdalenost(a: string, b: string): number {
  let predchozi = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const radek = [i];
    for (let j = 1; j <= b.length; j++) {
      radek[j] = Math.min(
        predchozi[j] + 1,
        radek[j - 1] + 1,
        predchozi[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    predchozi = radek;
  }
  return predchozi[b.length];
}

/**
 * Nejmenší vzdálenost cíle od začátku slova. Začátek, protože k adrese se
 * někdy přilepí text (/windowsDÚ: dokončit úkol…).
 */
function blizkoZacatku(slovo: string, cil: string): number {
  let nejmene = Infinity;
  for (let delka = cil.length - 1; delka <= cil.length + 1; delka++) {
    if (delka < 1 || delka > slovo.length) continue;
    nejmene = Math.min(nejmene, vzdalenost(slovo.slice(0, delka), cil));
  }
  return nejmene;
}

export function odhadniSimulator(pathname: string): Simulator | null {
  let cesta = pathname;
  try {
    cesta = decodeURIComponent(pathname);
  } catch {
    // Rozbité %-kódování – pracuje se s adresou, jak přišla.
  }
  const segmenty = cesta.split("/").filter(Boolean);
  if (segmenty[0]?.toLowerCase() === "en") segmenty.shift();
  // Jen písmena bez diakritiky: „windows)“ → „windows“, „mac os“ → „macos“.
  const slovo = (segmenty[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!slovo) return null;

  if (slovo.startsWith("win") || blizkoZacatku(slovo, "windows") <= 2) return "windows";
  if (slovo.startsWith("mac") || blizkoZacatku(slovo, "macos") <= 1) return "macos";
  // „/sq“ = nedopsaný kurz SQL (Analytics 21.–25. 10. 2026).
  if (slovo.startsWith("sq")) return "sql";
  return null;
}
