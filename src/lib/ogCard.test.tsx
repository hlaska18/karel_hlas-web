// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OG_SIZE, ogCard, ogTemata } from "@/lib/ogCard";

describe("OG_SIZE", () => {
  it("matches the standard Open Graph card dimensions", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });
});

describe("ogCard", () => {
  const opts = {
    headline: "Hotové materiály do hodin",
    sub: "Pracovní listy, testy a plány hodin",
    byline: "Karel Hlas",
    domain: "karelhlas.xyz",
    temata: ["Grafika", "Umělá inteligence"],
  };

  it("renders the provided text content", () => {
    render(ogCard(opts));
    expect(screen.getByText(opts.headline)).toBeTruthy();
    expect(screen.getByText(opts.sub)).toBeTruthy();
    expect(screen.getByText(opts.byline)).toBeTruthy();
    expect(screen.getByText(opts.domain)).toBeTruthy();
  });

  it("renders a chip for every topic it is given", () => {
    render(ogCard(opts));
    for (const t of opts.temata) expect(screen.getByText(t)).toBeTruthy();
  });
});

describe("ogTemata", () => {
  // Štítky se berou z TOOL_LABEL, aby se karta nemohla rozejít s bankou.
  // Test proto hlídá vazbu na skutečné popisky, ne konkrétní slova na kartě.
  it("translates the topic names", () => {
    expect(ogTemata("cs")).toContain("Grafika a multimédia");
    expect(ogTemata("en")).toContain("Graphics & multimedia");
  });

  it("names four topics that have their own files", () => {
    expect(ogTemata("cs")).toHaveLength(4);
    for (const prazdne of ["Excel", "Word", "Power BI"]) {
      expect(ogTemata("cs")).not.toContain(prazdne);
    }
  });
});
