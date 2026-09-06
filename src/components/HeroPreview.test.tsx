// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { HeroPreview } from "@/components/HeroPreview";
import { LanguageProvider } from "@/lib/i18n";
import type { BankItem } from "@/lib/materials";

/**
 * Karta v hlavičce musí vést na KONKRÉTNÍ materiál.
 *
 * Dřív byl celý stoh jeden odkaz na `#banka`, takže karta slibovala jeden
 * soubor a doručila seznam témat. Tenhle test hlídá obojí: že karta je
 * odkaz na svůj soubor (aby fungovalo Cmd+klik i „kopírovat adresu")
 * a že prostý klik místo skoku otevře náhled.
 */

function item(p: Partial<BankItem> & { href: string; tool: string; ext: string }): BankItem {
  return {
    label: { cs: "Ukázkový materiál", en: "Sample material" },
    kind: "doc",
    sizeBytes: 1000,
    topicNo: 1,
    topicLabel: { cs: "Téma", en: "Topic" },
    audience: "student",
    courseIds: ["1L"],
    coursesLabel: { cs: "1. ročník", en: "Year 1" },
    ...p,
  } as BankItem;
}

/** `.pdf` schválně: vykreslí se jako <iframe>, takže test nesahá na CDN. */
const PDF = item({ href: "/materialy/1L/5/test.pdf", tool: "Python", ext: "pdf" });

function vykresli(pool: BankItem[]) {
  return render(
    <LanguageProvider lang="cs">
      <HeroPreview pool={pool} />
    </LanguageProvider>,
  );
}

describe("HeroPreview", () => {
  it("karta je odkaz na svůj soubor", () => {
    vykresli([PDF]);
    const odkaz = screen.getByRole("link", { name: /Ukázkový materiál/ });
    expect(odkaz.getAttribute("href")).toBe(PDF.href);
  });

  it("odkaz není vnořený v jiném odkazu", () => {
    const { container } = vykresli([PDF]);
    expect(container.querySelector("a a")).toBeNull();
  });

  it("klik otevře náhled místo skoku na banku", () => {
    vykresli([PDF]);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: /Ukázkový materiál/ }), { button: 0 });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("Cmd+klik nechá odkaz prohlížeči", () => {
    vykresli([PDF]);
    // jsdom neumí navigaci a vypsal by „Not implemented: navigation".
    // Že se sem kliknutí vůbec dostane, je přesně to, co test tvrdí –
    // handler ho nezachytil a nechal propadnout na odkaz.
    const spolkni = (e: Event) => e.preventDefault();
    document.addEventListener("click", spolkni);
    try {
      fireEvent.click(screen.getByRole("link", { name: /Ukázkový materiál/ }), {
        button: 0,
        metaKey: true,
      });
    } finally {
      document.removeEventListener("click", spolkni);
    }
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("bez materiálů nevykreslí nic", () => {
    const { container } = vykresli([]);
    expect(container.querySelector("a")).toBeNull();
  });
});
