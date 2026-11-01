// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

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

  it("ukáže předaný počet úloh, správně vyskloňovaný, a že se vstupuje jménem", () => {
    vykresli("cs", 7, 3);
    const [win, mac] = screen.getAllByRole("link");
    expect(win.textContent).toContain("7 úloh · přihlášení jménem");
    expect(mac.textContent).toContain("3 úlohy · přihlášení jménem");
    // Vstupní kódy jsou od 25. 9. 2026 zrušené – na úvodu už nesmí být.
    expect(win.textContent).not.toMatch(/kód/);
  });

  it("anglicky řekne, že prostředí je česky", () => {
    vykresli("en", 1, 14);
    const [win, mac] = screen.getAllByRole("link");
    expect(win.textContent).toContain("1 task in Czech");
    expect(mac.textContent).toContain("14 tasks in Czech");
    expect(win.textContent).not.toMatch(/code/);
  });

  it("odkaz není vnořený v jiném odkazu", () => {
    const { container } = vykresli("cs", 33, 14);
    expect(container.querySelector("a a")).toBeNull();
  });

  it("zkopíruje zadání s adresou na samostatném řádku (neslepí se s textem v Teams)", async () => {
    const zapis = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: zapis } });
    vykresli("cs", 33, 14);
    fireEvent.click(screen.getByRole("button", { name: /Zkopírovat zadání – Virtuální Windows 11/ }));
    await waitFor(() => expect(zapis).toHaveBeenCalled());
    const text: string = zapis.mock.calls[0][0];
    expect(text).toMatch(/\n\nhttps:\/\/karelhlas\.vercel\.app\/windows\n\n/);
    expect(text).toContain("Moje výsledky");
  });
});
