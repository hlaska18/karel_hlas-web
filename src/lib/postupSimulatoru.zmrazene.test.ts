import { describe, expect, it } from "vitest";
import { dekodujSimulator, najdiKodySimulatoru, sloucitSimulatory } from "./postupSimulatoru";
import { postup, UKOLY } from "./win/ukoly";

/*
 * ZÁCHRANNÁ SÍŤ (rada 31. 10. 2026, krok 0).
 *
 * Tyhle kódy vznikly 31. 10. 2026 PŘED stavbou síťové sady a mají přesně tvar,
 * jaký dnes leží v zadáních a odpovědích v Teams a Classroomu cizích učitelů.
 * Test hlídá, že je Přehled třídy přečte pořád stejně: stejná jména, stejné
 * úlohy, stejné „x/33“. Kódy se NESMÍ přegenerovat – když test spadne, je
 * rozbitá změna, ne test.
 */
const JANA_1 =
  "WIN1-eyJqIjoiSmFuYSBOb3bDoWtvdsOhIiwiZCI6IjIwMjYtMTAtMTQiLCJoIjpbInZ0aXJhdmUtb2tubyIsInNsb3prYS1pbmZvcm1hdGlrYSIsInByaXBvbnkiLCJjbWQtaXBjb25maWciXSwiYyI6MzR9";
const PETR_MAC = "MAC1-eyJqIjoiUGV0ciBTdm9ib2RhIiwiZCI6IjIwMjYtMTAtMjAiLCJoIjpbInphdnJpLW9rbm8tZmluZGVydSJdLCJjIjoxNH0";
const JANA_2 = "WIN1-eyJqIjoiSmFuYSBOb3bDoWtvdsOhIiwiZCI6IjIwMjYtMTAtMjEiLCJoIjpbImtvcyIsImNtZC1pcGNvbmZpZyJdLCJjIjozNH0";
/** Kód z budoucí verze: neznámá úloha a neznámé pole `x`. */
const EVA_BUDOUCI =
  "WIN1-eyJqIjoiRXZhIE1hbMOhIiwiZCI6IjIwMjYtMTAtMjIiLCJoIjpbImtvcyIsIm5lZXhpc3R1amljaS11bG9oYSJdLCJjIjozMywieCI6ImJ1ZG91Y2kgcG9sZSJ9";

describe("staré kódy postupu (zmrazené 31. 10. 2026)", () => {
  it("se dekódují přesně jako dřív", () => {
    expect(dekodujSimulator(JANA_1)).toStrictEqual({
      simulator: "windows",
      jmeno: "Jana Nováková",
      datum: "2026-10-14",
      splneno: ["vtirave-okno", "slozka-informatika", "pripony", "cmd-ipconfig"],
      celkem: 34,
    });
    expect(dekodujSimulator(PETR_MAC)).toStrictEqual({
      simulator: "macos",
      jmeno: "Petr Svoboda",
      datum: "2026-10-20",
      splneno: ["zavri-okno-finderu"],
      celkem: 14,
    });
    expect(dekodujSimulator(EVA_BUDOUCI)).toStrictEqual({
      simulator: "windows",
      jmeno: "Eva Malá",
      datum: "2026-10-22",
      splneno: ["kos", "neexistujici-uloha"],
      celkem: 33,
    });
  });

  it("výchozí sada má pořád 33 úloh a Přehled počítá stejně", () => {
    expect(UKOLY).toHaveLength(33);
    expect(postup(dekodujSimulator(JANA_1)!.splneno)).toEqual({ hotovo: 4, celkem: 33 });
    // Neznámá úloha se nepočítá, ani když ji kód nese.
    expect(postup(dekodujSimulator(EVA_BUDOUCI)!.splneno)).toEqual({ hotovo: 1, celkem: 33 });
  });

  it("se najdou ve vlákně z Teams a kódy téže žákyně se sečtou", () => {
    const vlakno = `Jana Nováková · Windows 4/34 · ${JANA_1}\nPetr: ${PETR_MAC}\nJana znovu ${JANA_2}`;
    const zaci = sloucitSimulatory(najdiKodySimulatoru(vlakno));
    expect(zaci).toStrictEqual([
      {
        simulator: "windows",
        jmeno: "Jana Nováková",
        datum: "2026-10-21",
        splneno: ["vtirave-okno", "slozka-informatika", "pripony", "cmd-ipconfig", "kos"],
        celkem: 34,
      },
      { simulator: "macos", jmeno: "Petr Svoboda", datum: "2026-10-20", splneno: ["zavri-okno-finderu"], celkem: 14 },
    ]);
  });

  it("poškozený kód se přeskočí", () => {
    expect(dekodujSimulator("WIN1-!!!")).toBeNull();
    expect(dekodujSimulator(JANA_1.slice(0, 40))).toBeNull();
  });
});
