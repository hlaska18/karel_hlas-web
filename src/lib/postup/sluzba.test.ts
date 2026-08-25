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

describe("strop na počet pokusů", () => {
  const IP = "10.0.0.1";

  it("po deseti špatných heslech dál nepustí", async () => {
    const { zaloz, u } = prihlas();
    await zaloz("kolibrik", "tajne123");
    for (let i = 0; i < 10; i++) {
      expect(await prihlasNeboZaloz(u, "kolibrik", "spatne", PODPIS)).toMatchObject({
        stav: "nesedi",
      });
    }
    expect(await prihlasNeboZaloz(u, "kolibrik", "spatne", PODPIS)).toMatchObject({
      stav: "prilis-mnoho-pokusu",
    });
    // A po vyčerpání stropu neprojde ani SPRÁVNÉ heslo – jinak by se strop
    // dal obejít tím, že útočník mezi pokusy zkusí to, co už zná.
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS)).toMatchObject({
      stav: "prilis-mnoho-pokusu",
    });
  });

  it("úspěšné přihlášení rozpočet nespotřebovává", async () => {
    // Nejdůležitější test celého stropu: žák, který se hlásí správně,
    // nesmí být po dvacáté hodině zamčený.
    const { u, zaloz } = prihlas();
    await zaloz("kolibrik", "tajne123");
    for (let i = 0; i < 30; i++) {
      expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS)).toMatchObject({
        stav: "ok",
      });
    }
  });

  it("po několika překlepech a trefě se počítadlo vynuluje", async () => {
    const { u, zaloz } = prihlas();
    await zaloz("kolibrik", "tajne123");
    for (let i = 0; i < 9; i++) await prihlasNeboZaloz(u, "kolibrik", "spatne", PODPIS);
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS)).toMatchObject({ stav: "ok" });
    // Kdyby se nenulovalo, další překlep by žáka rovnou zamkl.
    expect(await prihlasNeboZaloz(u, "kolibrik", "spatne", PODPIS)).toMatchObject({
      stav: "nesedi",
    });
  });

  it("po vypršení okna jde přihlášení znovu", async () => {
    let ted = 0;
    const u = pametoveUloziste(() => ted);
    await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS);
    for (let i = 0; i < 11; i++) await prihlasNeboZaloz(u, "kolibrik", "spatne", PODPIS);
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS)).toMatchObject({
      stav: "prilis-mnoho-pokusu",
    });
    ted += 16 * 60 * 1000;
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS)).toMatchObject({ stav: "ok" });
  });

  it("celá třída z jedné IP se přihlásí bez potíží", async () => {
    // Třicet žáků za jednou školní IP. Kdyby byl strop podle IP přísný,
    // vyhodilo by to půlku třídy z hodiny.
    const u = pametoveUloziste();
    for (let i = 0; i < 30; i++) {
      expect(
        await prihlasNeboZaloz(u, `zak${i}`, "tajne123", PODPIS, Date.now(), IP),
      ).toMatchObject({ stav: "ok" });
    }
  });

  it("hromadné zakládání účtů z jedné IP se zastaví", async () => {
    const u = pametoveUloziste();
    for (let i = 0; i < 120; i++) {
      await prihlasNeboZaloz(u, `bot${i}`, "tajne123", PODPIS, Date.now(), IP);
    }
    expect(
      await prihlasNeboZaloz(u, "bot120", "tajne123", PODPIS, Date.now(), IP),
    ).toMatchObject({ stav: "prilis-mnoho-pokusu" });
  });

  it("chybějící IP přihlášení nerozbije", async () => {
    // Lokální vývoj nemá `x-forwarded-for`; přezdívkový strop platí dál.
    const u = pametoveUloziste();
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS, Date.now(), null)).toMatchObject({
      stav: "ok",
    });
  });

  it("výpadek úložiště žáka nezamkne", async () => {
    // Radši chvíli bez stropu než třicet lidí, co se uprostřed hodiny
    // nedostanou k práci.
    const u = pametoveUloziste();
    u.pocitadlo = async () => {
      throw new Error("Redis neodpovídá");
    };
    expect(await prihlasNeboZaloz(u, "kolibrik", "tajne123", PODPIS, Date.now(), IP)).toMatchObject({
      stav: "ok",
    });
  });
});
