import { describe, expect, it } from "vitest";
import { sazba } from "@/lib/sazba";

const NBSP = " ";

describe("sazba", () => {
  it("sváže jednopísmennou předložku s dalším slovem", () => {
    expect(sazba("pracovní list v hodině", "cs")).toBe(`pracovní list v${NBSP}hodině`);
    expect(sazba("klíč k testu", "cs")).toBe(`klíč k${NBSP}testu`);
    expect(sazba("práce s žáky", "cs")).toBe(`práce s${NBSP}žáky`);
  });

  it("zvládne dvě předložky za sebou", () => {
    expect(sazba("a v hodině", "cs")).toBe(`a${NBSP}v${NBSP}hodině`);
  });

  it("chytne předložku i na začátku a po závorce nebo uvozovce", () => {
    expect(sazba("V hodině", "cs")).toBe(`V${NBSP}hodině`);
    expect(sazba("(a tak dále)", "cs")).toBe(`(a${NBSP}tak dále)`);
    expect(sazba("„o tom to je“", "cs")).toBe(`„o${NBSP}tom to je“`);
  });

  it("nesahá na delší slova ani na písmeno uvnitř slova", () => {
    expect(sazba("na okraji", "cs")).toBe("na okraji");
    expect(sazba("do hodiny", "cs")).toBe("do hodiny");
    // „u“ uvnitř slova nesmí nic spustit
    expect(sazba("Laboratoř grafiky", "cs")).toBe("Laboratoř grafiky");
  });

  it("pro angličtinu nedělá nic – tam se jednopísmenná slova nesvazují", () => {
    const en = "a worksheet in a lesson";
    expect(sazba(en, "en")).toBe(en);
  });

  it("nechá prázdný řetězec být", () => {
    expect(sazba("", "cs")).toBe("");
  });
});
