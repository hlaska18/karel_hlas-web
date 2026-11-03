// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CrossSubject } from "@/components/CrossSubject";
import { t } from "@/lib/content";
import { LanguageProvider } from "@/lib/i18n";

/** Klik na předmět vymění mřížku za jeho obsah, stejně jako témata v bance. */

function vykresli() {
  Element.prototype.scrollIntoView = vi.fn();
  return render(
    <LanguageProvider lang="cs" tr={t.cs}>
      <CrossSubject />
    </LanguageProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("CrossSubject", () => {
  it("zavřený předmět nástroje neukazuje", () => {
    vykresli();
    expect(screen.getByRole("button", { name: /Fyzika/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /oPhysics/ })).toBeNull();
  });

  it("klik otevře předmět, zapíše ho do adresy a zpět vrátí mřížku", () => {
    vykresli();
    fireEvent.click(screen.getByRole("button", { name: /Fyzika/ }));

    expect(screen.getByRole("heading", { name: "Fyzika" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /oPhysics/ }).getAttribute("target")).toBe("_blank");
    expect(screen.queryByRole("button", { name: /Chemie/ })).toBeNull();
    expect(window.location.search).toBe("?predmet=fyzika");
    expect(window.location.hash).toBe("#jinam");

    fireEvent.click(screen.getByRole("button", { name: "Zpět na předměty" }));

    expect(screen.queryByRole("link", { name: /oPhysics/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Chemie/ })).toBeTruthy();
    expect(window.location.search).toBe("");
    expect(document.activeElement?.getAttribute("data-predmet")).toBe("fyzika");
  });

  it("sdílený odkaz otevře předmět, neznámý předmět se ignoruje", () => {
    window.history.replaceState(null, "", "/?predmet=chemie");
    vykresli();
    expect(screen.getByRole("heading", { name: "Chemie" })).toBeTruthy();
    cleanup();

    window.history.replaceState(null, "", "/?predmet=alchymie");
    vykresli();
    expect(screen.queryByRole("heading", { name: "Alchymie" })).toBeNull();
    expect(screen.getByRole("button", { name: /Fyzika/ })).toBeTruthy();
  });
});
