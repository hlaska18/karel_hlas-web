// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { HeroSimulatory } from "@/components/HeroSimulatory";
import { LanguageProvider } from "@/lib/i18n";
import { t, type Lang } from "@/lib/content";

/**
 * Tlačítka simulátorů v úvodu.
 *
 * Počty jsou v testu schválně jiné než skutečné (33 a 14): test hlídá, že
 * karta ukáže číslo, které dostane, a ne číslo napsané někde v textech.
 * Právě ručně psané „34 úloh" se jednou rozjelo se skutečností.
 */

function vykresli(lang: Lang, windows: number, macos: number, dilna = 20, dblab = 22) {
  return render(
    <LanguageProvider lang={lang} tr={t[lang]}>
      <HeroSimulatory ulohy={{ windows, macos, dilna, dblab }} />
    </LanguageProvider>,
  );
}

describe("HeroSimulatory", () => {
  it("vede na oba simulátory, pod nimi do NETLABu a DBLABu", () => {
    vykresli("cs", 33, 14);
    const odkazy = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(odkazy).toEqual(["/windows", "/macos", "/sitova-dilna", "/sql"]);
  });

  it("DBLAB ukáže předaný počet lekcí, anglicky je anglicky a vede na ?z=en", () => {
    vykresli("cs", 33, 14, 20, 22);
    expect(screen.getAllByRole("link")[3].textContent).toContain("DBLAB (kurz SQL)22 lekcí · jménem či kódem");
    cleanup();
    vykresli("cs", 33, 14, 20, 3);
    expect(screen.getAllByRole("link")[3].textContent).toContain("3 lekce");
    cleanup();
    vykresli("en", 33, 14, 20, 22);
    const dblab = screen.getAllByRole("link")[3];
    expect(dblab.getAttribute("href")).toBe("/sql?z=en");
    expect(dblab.textContent).toContain("22 lessons in English");
  });

  it("DBLAB má vlastní zadání s panelem Kurz SQL", async () => {
    const zapis = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: zapis } });
    vykresli("cs", 33, 14);
    fireEvent.click(screen.getByRole("button", { name: /Zkopírovat zadání – DBLAB/ }));
    await waitFor(() => expect(zapis).toHaveBeenCalled());
    const text: string = zapis.mock.calls[0][0];
    expect(text).toMatch(/\n\nhttps:\/\/karelhlas\.vercel\.app\/sql\n\n/);
    expect(text).toContain("Kurz SQL");
    expect(text).toContain("Moje výsledky");
    expect(text).not.toMatch(/Úkoly/);
  });

  it("dílna ukáže předaný počet zakázek a z angličtiny vede zpět na /en", () => {
    vykresli("cs", 33, 14, 3);
    expect(screen.getAllByRole("link")[2].textContent).toContain("3 zakázky · jménem či kódem");
    cleanup();
    vykresli("en", 33, 14, 20);
    const dilna = screen.getAllByRole("link")[2];
    expect(dilna.getAttribute("href")).toBe("/sitova-dilna?z=en");
    expect(dilna.textContent).toContain("20 jobs in Czech");
  });

  it("dílna má vlastní zadání, protože tlačítko Úkoly nemá", async () => {
    const zapis = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: zapis } });
    vykresli("cs", 33, 14);
    expect(screen.getAllByRole("button", { name: /Zkopírovat zadání/ })).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /Zkopírovat zadání – NETLAB/ }));
    await waitFor(() => expect(zapis).toHaveBeenCalled());
    const text: string = zapis.mock.calls[0][0];
    expect(text).toMatch(/\n\nhttps:\/\/karelhlas\.vercel\.app\/sitova-dilna\n\n/);
    expect(text).toContain("Kód postupu");
    expect(text).not.toMatch(/Úkoly|Moje výsledky/);
  });

  it("ukáže předaný počet úloh, správně vyskloňovaný, a že se vstupuje jménem nebo kódem postupu", () => {
    vykresli("cs", 7, 3);
    const [win, mac] = screen.getAllByRole("link");
    expect(win.textContent).toContain("7 úloh · jménem či kódem");
    expect(mac.textContent).toContain("3 úlohy · jménem či kódem");
    // Vstupní kódy od učitele jsou od 25. 9. 2026 zrušené. Kód postupu (od 7. 11. 2026)
    // je žákův vlastní, ten tu být smí.
    expect(win.textContent).not.toMatch(/vstupní|od učitele|od vyučující/i);
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
