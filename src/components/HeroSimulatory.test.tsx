// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { HeroSimulatory } from "@/components/HeroSimulatory";
import { LanguageProvider } from "@/lib/i18n";
import type { Lang } from "@/lib/content";

/**
 * Tlačítka simulátorů v úvodu.
 *
 * Počty jsou v testu schválně jiné než skutečné (33 a 14): test hlídá, že
 * karta ukáže číslo, které dostane, a ne číslo napsané někde v textech.
 * Právě ručně psané „34 úloh" se jednou rozjelo se skutečností.
 */

function vykresli(lang: Lang, windows: number, macos: number) {
  return render(
    <LanguageProvider lang={lang}>
      <HeroSimulatory ulohy={{ windows, macos }} />
    </LanguageProvider>,
  );
}

describe("HeroSimulatory", () => {
  it("vede na oba simulátory", () => {
    vykresli("cs", 33, 14);
    const odkazy = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(odkazy).toEqual(["/windows", "/macos"]);
  });

  it("ukáže předaný počet úloh, správně vyskloňovaný, a veřejný kód", () => {
    vykresli("cs", 7, 3);
    const [win, mac] = screen.getAllByRole("link");
    expect(win.textContent).toContain("7 úloh · kód WIN11");
    expect(mac.textContent).toContain("3 úlohy · kód MACOS");
  });

  it("anglicky řekne, že prostředí je česky", () => {
    vykresli("en", 1, 14);
    const [win, mac] = screen.getAllByRole("link");
    expect(win.textContent).toContain("1 task in Czech · code WIN11");
    expect(mac.textContent).toContain("14 tasks in Czech · code MACOS");
  });

  it("odkaz není vnořený v jiném odkazu", () => {
    const { container } = vykresli("cs", 33, 14);
    expect(container.querySelector("a a")).toBeNull();
  });
});
