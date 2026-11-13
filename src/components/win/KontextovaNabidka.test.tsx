// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { KontextovaNabidka } from "@/components/win/ui";

/**
 * Podnabídka v místní nabídce Windows (test na ostrém webu 13. 11. 2026):
 * najetí myší ji otevřelo a kliknutí ji pak přepnutím zavřelo, takže „Nový“
 * na první pohled nic nedělal. Kliknutí ji má jen otevřít.
 */
describe("KontextovaNabidka", () => {
  const vykresli = (akce = vi.fn()) =>
    render(
      <KontextovaNabidka
        misto={{
          x: 10,
          y: 10,
          polozky: [{ id: "novy", nazev: "Nový", podnabidka: [{ id: "slozka", nazev: "Složka", akce }] }],
        }}
        zavri={() => {}}
      />,
    );

  it("najetí a pak kliknutí nechá podnabídku otevřenou", () => {
    const akce = vi.fn();
    vykresli(akce);
    const novy = screen.getByRole("menuitem", { name: "Nový" });
    fireEvent.mouseEnter(novy.parentElement!);
    expect(novy.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(novy);
    expect(novy.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByText("Složka"));
    expect(akce).toHaveBeenCalled();
  });

  it("samotné kliknutí (dotyk, bez najetí) podnabídku otevře", () => {
    vykresli();
    const novy = screen.getByRole("menuitem", { name: "Nový" });
    fireEvent.click(novy);
    expect(novy.getAttribute("aria-expanded")).toBe("true");
  });
});
