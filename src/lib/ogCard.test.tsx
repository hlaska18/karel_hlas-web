// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OG_SIZE, ogCard } from "@/lib/ogCard";

describe("OG_SIZE", () => {
  it("matches the standard Open Graph card dimensions", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
  });
});

describe("ogCard", () => {
  const opts = {
    headline: "Hotové materiály do hodin",
    sub: "Excel, Word, Python a Power BI",
    byline: "Karel Hlas",
    domain: "karelhlas.xyz",
  };

  it("renders the provided text content", () => {
    render(ogCard(opts));
    expect(screen.getByText(opts.headline)).toBeTruthy();
    expect(screen.getByText(opts.sub)).toBeTruthy();
    expect(screen.getByText(opts.byline)).toBeTruthy();
    expect(screen.getByText(opts.domain)).toBeTruthy();
  });

  it("renders the four tool chips", () => {
    render(ogCard(opts));
    for (const tool of ["Excel", "Word", "Python", "Power BI"]) {
      expect(screen.getByText(tool)).toBeTruthy();
    }
  });
});
