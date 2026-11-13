import { describe, expect, it } from "vitest";
import {
  dekodujSimulator,
  jmenoPlatne,
  kodPriPrihlaseni,
  nenacteneKodySimulatoru,
  najdiKodySimulatoru,
  splnenychUloh,
  sloucitSimulatory,
  stejneJmeno,
  textKopieSimulatoru,
  zakodujSimulator,
  type PostupSimulatoru,
} from "./postupSimulatoru";

/*
 * Kód postupu ze simulátorů Windows a macOS (od 25. 9. 2026 místo vstupních
 * kódů). Na něm stojí, že učitel uvidí práci žáka jinde než na jeho počítači
 * a že žák může pokračovat doma.
 */
const zak = (jine: Partial<PostupSimulatoru> = {}): PostupSimulatoru => ({
  simulator: "macos",
  jmeno: "Šárka Řeháková",
  datum: "2026-09-25",
  splneno: ["zavri-okno-finderu", "poznamky-bez-okna"],
  celkem: 14,
  ...jine,
});

describe("kód postupu simulátorů", () => {
  it("se přečte zpátky i s diakritikou a pozná simulátor podle předpony", () => {
    const kod = zakodujSimulator(zak());
    expect(kod.indexOf("MAC1-")).toBe(0);
    expect(dekodujSimulator(kod)).toEqual(zak());
    const win = zakodujSimulator(zak({ simulator: "windows", splneno: ["pripony"] }));
    expect(win.indexOf("WIN1-")).toBe(0);
    expect(dekodujSimulator(win)?.simulator).toBe("windows");
  });

  it("najde kódy v celém vlákně z Teams a cizí text přeskočí", () => {
    const text = `Ahoj, posílám: Šárka · macOS 2/14 · ${zakodujSimulator(zak())}\nA tady Windows ${zakodujSimulator(
      zak({ simulator: "windows", jmeno: "Petr" }),
    )} a SQLKURZ1-xyz a WIN1-!!!`;
    const kody = najdiKodySimulatoru(text);
    expect(kody.map((k) => k.simulator)).toEqual(["macos", "windows"]);
    expect(dekodujSimulator("WIN1-nesmysl")).toBeNull();
  });

  it("sečte kódy téhož žáka z domu i ze školy, ale Windows a macOS drží zvlášť", () => {
    const slouceno = sloucitSimulatory([
      zak({ datum: "2026-09-24", splneno: ["a", "b"] }),
      zak({ jmeno: "rehakova sarka", datum: "2026-09-25", splneno: ["b", "c"], celkem: 15 }),
      zak({ simulator: "windows", splneno: ["x"] }),
    ]);
    expect(slouceno.length).toBe(2);
    const mac = slouceno.filter((z) => z.simulator === "macos")[0];
    expect(mac.splneno).toEqual(["a", "b", "c"]);
    expect(mac.datum).toBe("2026-09-25");
    expect(mac.celkem).toBe(15);
    expect(sloucitSimulatory([zak(), zak({ simulator: "windows" })]).length).toBe(2);
  });

  it("do Teams jde jméno a skóre před kódem", () => {
    expect(textKopieSimulatoru(zak(), "MAC1-abc", 2, 14)).toBe("Šárka Řeháková · macOS 2/14 · MAC1-abc");
  });
});

describe("přihlášení jménem", () => {
  it("chce aspoň dvě písmena a ne výchozí Žák", () => {
    expect(jmenoPlatne("Eva Malá")).toBe(true);
    expect(jmenoPlatne("  ")).toBe(false);
    expect(jmenoPlatne("E")).toBe(false);
    expect(jmenoPlatne("žák")).toBe(false);
  });

  it("pozná stejného žáka bez ohledu na diakritiku, velikost písmen a pořadí slov", () => {
    expect(stejneJmeno("Novák Adam", "adam novak")).toBe(true);
    expect(stejneJmeno("Adam Novák", "Eva Nováková")).toBe(false);
  });
});

describe("dekodujSimulator – poškozené a upravené kódy (audit 4. 10. 2026)", () => {
  const kodZ = (obsah: unknown) =>
    "WIN1-" +
    btoa(unescape(encodeURIComponent(JSON.stringify(obsah))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  it("propustí jen platná id úloh, bez opakování", () => {
    const p = dekodujSimulator(kodZ({ j: " Eva ", d: "2026-10-05", h: ["cmd-dir", "cmd-dir", "<b>x</b>", 5, "kos"], c: 33 }));
    expect(p).toEqual({ simulator: "windows", jmeno: "Eva", datum: "2026-10-05", splneno: ["cmd-dir", "kos"], celkem: 33 });
  });

  it("nesmyslné datum a počet úloh se zahodí", () => {
    const p = dekodujSimulator(kodZ({ j: "Eva", d: "zítra", h: [], c: -5 }));
    expect(p?.datum).toBe("");
    expect(p?.celkem).toBe(0);
    expect(dekodujSimulator(kodZ({ j: "Eva", d: "2026-10-05", h: [], c: 1e9 }))?.celkem).toBe(500);
  });

  it("obří nebo rozbitý kód vrátí null", () => {
    expect(dekodujSimulator("WIN1-" + "A".repeat(20000))).toBeNull();
    expect(dekodujSimulator(kodZ([1, 2]))).toBeNull();
    expect(dekodujSimulator(kodZ({ j: 1, h: [] }))).toBeNull();
  });
});

describe("kód postupu místo jména při přihlášení (7. 11. 2026)", () => {
  const patri = (id: string) => id !== "neexistuje";

  it("jméno kód nepřipomíná", () => {
    expect(kodPriPrihlaseni("Šárka Řeháková", "macos", patri)).toBeNull();
  });

  it("platný kód dá jméno a splněné úlohy, i vložený s celým řádkem z Teams", () => {
    const p = zak({ splneno: ["zavri-okno-finderu", "neexistuje"] });
    const radek = textKopieSimulatoru(p, zakodujSimulator(p), 1, 14);
    expect(kodPriPrihlaseni(radek, "macos", patri)).toEqual({ ok: true, jmeno: "Šárka Řeháková", splneno: ["zavri-okno-finderu"] });
  });

  it("kód z jiného simulátoru, useknutý kód a kód bez jména odmítne", () => {
    const win = zakodujSimulator(zak({ simulator: "windows" }));
    expect(kodPriPrihlaseni(win, "macos", patri)).toMatchObject({ ok: false });
    expect(kodPriPrihlaseni("MAC1-abc", "macos", patri)).toMatchObject({ ok: false });
    // Kódy z labů se nesmí přihlásit jako jméno (13. 11. 2026).
    expect(kodPriPrihlaseni("SQLKURZ1-abcdef", "windows", patri)).toEqual({
      ok: false,
      hlaska: "Tohle je kód postupu z DBLABu (kurz SQL), tady je Windows. Přihlas se jménem.",
    });
    expect(kodPriPrihlaseni("ALG1-xyz", "macos", patri)).toMatchObject({ ok: false, hlaska: expect.stringContaining("z ALGOLABu") });
    expect(kodPriPrihlaseni("ALGZ1-xyz", "sit", patri)).toMatchObject({ ok: false, hlaska: expect.stringContaining("tady je NETLAB") });
    expect(kodPriPrihlaseni(zakodujSimulator(zak({ jmeno: "Žák" })), "macos", patri)).toMatchObject({ ok: false });
  });

  it("NETLAB bere kód WSIT1- i starší kód WIN1- se síťovými úlohami (11. 11. 2026)", () => {
    const vDilne = (id: string) => id.startsWith("sit-");
    const sit = zakodujSimulator(zak({ simulator: "sit", splneno: ["sit-ip-pocitace", "sit-brana"], celkem: 20, chyby: { db: 1 } }));
    expect(kodPriPrihlaseni(`Šárka · NETLAB 2/20 · ${sit}`, "sit", vDilne)).toEqual({
      ok: true,
      jmeno: "Šárka Řeháková",
      splneno: ["sit-ip-pocitace", "sit-brana"],
    });
    const stary = zakodujSimulator(zak({ simulator: "windows", splneno: ["otevri-pruzkumnik", "sit-brana"], celkem: 33 }));
    expect(kodPriPrihlaseni(stary, "sit", vDilne)).toEqual({ ok: true, jmeno: "Šárka Řeháková", splneno: ["sit-brana"] });
    // Kód Windows bez síťových úloh a kód z Macu do NETLABu nepatří.
    const bezSite = zakodujSimulator(zak({ simulator: "windows", splneno: ["otevri-pruzkumnik"], celkem: 33 }));
    expect(kodPriPrihlaseni(bezSite, "sit", vDilne)).toMatchObject({ ok: false });
    expect(kodPriPrihlaseni(zakodujSimulator(zak()), "sit", vDilne)).toMatchObject({ ok: false });
    // Windows kód NETLABu dál odmítne.
    expect(kodPriPrihlaseni(sit, "windows", () => true)).toMatchObject({ ok: false });
    // Bez jména: v NETLABu neodkazuje na Moje výsledky, kód se tam už nevkládá.
    const bezJmena = kodPriPrihlaseni(zakodujSimulator(zak({ simulator: "sit", jmeno: "Žák", splneno: [] })), "sit", vDilne);
    expect(bezJmena).toEqual({ ok: false, hlaska: "V kódu chybí jméno. Přihlas se jménem." });
  });

  it("skloňuje počet úloh", () => {
    expect([0, 1, 3, 5].map(splnenychUloh)).toEqual(["0 splněných úloh", "1 splněná úloha", "3 splněné úlohy", "5 splněných úloh"]);
  });
});

describe("Přehled hlásí useknuté kódy (13. 11. 2026)", () => {
  it("najde useknutý kód a jméno ze zprávy, platný kód nehlásí", () => {
    const p = zak({ simulator: "windows" });
    const cely = zakodujSimulator(p);
    const radek = textKopieSimulatoru(p, cely, 1, 33);
    const useknuty = `Petr Malý · Windows 3/33 · ${cely.slice(0, 30)}`;
    expect(nenacteneKodySimulatoru(radek)).toEqual([]);
    expect(nenacteneKodySimulatoru(`${radek}\n${useknuty}`)).toEqual(["Petr Malý"]);
    expect(nenacteneKodySimulatoru(`Odpověď: MAC1-eyJqIjoi`)).toEqual([""]);
    // Kód na vlastním řádku pod jménem.
    expect(nenacteneKodySimulatoru(`Jana Nová · NETLAB 2/20 ·\nWSIT1-abc`)).toEqual(["Jana Nová"]);
  });
});
