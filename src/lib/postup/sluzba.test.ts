import { describe, expect, it } from "vitest";
import { prihlasNeboZaloz, ulozPostupDoUloziste } from "@/lib/postup/sluzba";
import { pametoveUloziste } from "@/lib/postup/uloziste";
import { vyrobLístek } from "@/lib/postup/jadro";
import { UKOLY } from "@/lib/win/ukoly";

const PODPIS = "tajemstvi-jen-pro-testy";
const A = UKOLY[0].id;
const B = UKOLY[1].id;
const C = UKOLY[2].id;

const prihlas = (u = pametoveUloziste()) => ({
  u,
  zaloz: (prezdivka: string, heslo: string) => prihlasNeboZaloz(u, prezdivka, heslo, PODPIS),
});

describe("přihlášení", () => {
  it("první přihlášení účet založí a vrátí prázdný postup", async () => {
    const { zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    expect(v).toMatchObject({ stav: "ok", novy: true, splneno: [] });
  });

  it("podruhé už účet nezakládá a heslo ověří", async () => {
    const { zaloz } = prihlas();
    await zaloz("kolibrik", "tajne123");
    expect(await zaloz("kolibrik", "tajne123")).toMatchObject({ stav: "ok", novy: false });
    expect(await zaloz("kolibrik", "jine")).toMatchObject({ stav: "nesedi" });
  });

  it("velikost písmen ani mezery nezaloží druhý účet", async () => {
    // Žák si napíše přezdívku pokaždé trochu jinak a nesmí tím přijít o postup.
    const { zaloz } = prihlas();
    await zaloz("Kolibrik", "tajne123");
    expect(await zaloz("  kolibrik ", "tajne123")).toMatchObject({ stav: "ok", novy: false });
  });

  it("odmítne nesmyslnou přezdívku i krátké heslo", async () => {
    const { zaloz } = prihlas();
    expect(await zaloz("a", "tajne123")).toMatchObject({ stav: "spatny-tvar" });
    expect(await zaloz("dva slova", "tajne123")).toMatchObject({ stav: "spatny-tvar" });
    expect(await zaloz("kolibrik", "abc")).toMatchObject({ stav: "spatny-tvar" });
  });

  it("dva žáci se stejným heslem mají oddělený postup", async () => {
    const { u, zaloz } = prihlas();
    const a = await zaloz("kolibrik", "stejne");
    const b = await zaloz("vydra", "stejne");
    if (a.stav !== "ok" || b.stav !== "ok") throw new Error("mělo projít");
    await ulozPostupDoUloziste(u, a.listek, [A], PODPIS);
    const znovu = await zaloz("vydra", "stejne");
    expect(znovu).toMatchObject({ stav: "ok", splneno: [] });
  });
});

describe("ukládání postupu", () => {
  it("uloží a při dalším přihlášení vrátí", async () => {
    const { u, zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    if (v.stav !== "ok") throw new Error("mělo projít");
    await ulozPostupDoUloziste(u, v.listek, [A, B], PODPIS);
    expect(await zaloz("kolibrik", "tajne123")).toMatchObject({ splneno: [A, B] });
  });

  it("sloučí postup ze dvou počítačů", async () => {
    // Doma offline úloha A, ve škole B – po přihlášení musí být obojí.
    const { u, zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    if (v.stav !== "ok") throw new Error("mělo projít");
    await ulozPostupDoUloziste(u, v.listek, [A], PODPIS);
    const vysledek = await ulozPostupDoUloziste(u, v.listek, [B, C], PODPIS);
    expect(vysledek.stav).toBe("ok");
    if (vysledek.stav !== "ok") return;
    expect([...vysledek.splneno].sort()).toEqual([A, B, C].sort());
  });

  it("postup nikdy neubude, ani když přijde kratší seznam", async () => {
    // Prohlížeč s prázdným localStorage nesmí smazat, co je na serveru.
    const { u, zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    if (v.stav !== "ok") throw new Error("mělo projít");
    await ulozPostupDoUloziste(u, v.listek, [A, B], PODPIS);
    const vysledek = await ulozPostupDoUloziste(u, v.listek, [], PODPIS);
    if (vysledek.stav !== "ok") throw new Error("mělo projít");
    expect([...vysledek.splneno].sort()).toEqual([A, B].sort());
  });

  it("vymyšlená id úloh se neuloží", async () => {
    const { u, zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    if (v.stav !== "ok") throw new Error("mělo projít");
    const vysledek = await ulozPostupDoUloziste(u, v.listek, [A, "vymyslene", "x".repeat(500)], PODPIS);
    if (vysledek.stav !== "ok") throw new Error("mělo projít");
    expect(vysledek.splneno).toEqual([A]);
  });

  it("cizí ani padělaný lístek neprojde", async () => {
    const { u } = prihlas();
    expect(await ulozPostupDoUloziste(u, "nesmysl", [A], PODPIS)).toMatchObject({
      stav: "neplatny-listek",
    });
    expect(
      await ulozPostupDoUloziste(u, vyrobLístek("kolibrik", "cizi-podpis"), [A], PODPIS),
    ).toMatchObject({ stav: "neplatny-listek" });
  });

  it("smazaný účet se ukládáním nevzkřísí", async () => {
    // Kdyby se záznam zakládal znovu, vrátilo by se to, co žák úmyslně smazal.
    const { u, zaloz } = prihlas();
    const v = await zaloz("kolibrik", "tajne123");
    if (v.stav !== "ok") throw new Error("mělo projít");
    await u.smaz("kolibrik");
    expect(await ulozPostupDoUloziste(u, v.listek, [A], PODPIS)).toMatchObject({
      stav: "nenalezeno",
    });
  });
});
