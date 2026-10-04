import { describe, expect, it } from "vitest";
import { dekoduj, zakoduj, type Postup } from "@/lib/dbb/kodPostupu";

/** Kód s libovolným obsahem – tak, jak by ho mohl vyrobit upravený prohlížeč. */
function kodZ(obsah: unknown): string {
  const bajty = unescape(encodeURIComponent(JSON.stringify(obsah)));
  return "SQLKURZ1-" + btoa(bajty).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const platny: Postup = {
  jmeno: "Adam Novák",
  datum: "2026-10-05",
  hotove: [1, 2, 3],
  sede: [2],
  navic: 1,
  sady: { detektivka: [3, 5, 1] },
  ulohy: ["u-abc"],
  klice: ["k1"],
  nazvyUloh: { "u-abc": "Najdi knihy" },
};

describe("dekoduj – platné kódy", () => {
  it("platný kód projde beze změny", () => {
    expect(dekoduj(zakoduj(platny))).toEqual({ ...platny });
  });

  it("starší kód bez třetího čísla u sady projde", () => {
    const p = dekoduj(kodZ({ j: "Eva", d: "2026-09-20", h: [1], s: [], n: 0, x: { procvicovani: [4, 6] } }));
    expect(p?.sady).toEqual({ procvicovani: [4, 6] });
  });
});

describe("dekoduj – poškozené a upravené kódy (audit 4. 10. 2026)", () => {
  it("nesmyslná čísla se zahodí místo NaN a záporných hodnot", () => {
    const p = dekoduj(kodZ({ j: "X", d: "včera", h: [1, "2", -3, 1.5, "abc", 1, 5000], s: [2, 9], n: -4, x: { a: [7, 3, "x"] } }));
    expect(p).not.toBeNull();
    expect(p!.hotove).toEqual([1, 2]);
    expect(p!.sede).toEqual([2]); // 9 není hotová
    expect(p!.navic).toBe(0);
    expect(p!.datum).toBe("");
    expect(p!.sady).toEqual({ a: [3, 3, 0] }); // samostatně nejvýš celkem
  });

  it("přerostlé seznamy a texty se zkrátí", () => {
    const p = dekoduj(
      kodZ({
        j: "J".repeat(500),
        d: "2026-10-05",
        h: Array.from({ length: 500 }, (_, i) => i + 1),
        s: [],
        n: 10 ** 9,
        k: ["k".repeat(500), ...Array.from({ length: 300 }, (_, i) => `k${i}`)],
        u: ["u-1", "nic", "u-" + "x".repeat(100)],
      }),
    );
    expect(p!.jmeno.length).toBe(60);
    expect(p!.hotove.length).toBe(100);
    expect(p!.navic).toBe(1000);
    expect(p!.klice!.length).toBe(200);
    expect(p!.klice![0].length).toBe(80);
    expect(p!.ulohy).toEqual(["u-1", "u-" + "x".repeat(38)]);
  });

  it("obří nebo rozbitý kód vrátí null, nespadne", () => {
    expect(dekoduj("SQLKURZ1-" + "A".repeat(30000))).toBeNull();
    expect(dekoduj("SQLKURZ1-%%%")).toBeNull();
    expect(dekoduj(kodZ([1, 2, 3]))).toBeNull();
    expect(dekoduj(kodZ({ j: 5, h: [] }))).toBeNull();
  });
});
