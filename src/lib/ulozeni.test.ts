// @vitest-environment jsdom
/** Upozornění na neukládání (Karel 29. 9. 2026). */

import { describe, expect, it, vi } from "vitest";
import { ulozDoProhlizece, UDALOST_ULOZENI } from "@/lib/ulozeni";

describe("hlášení o ukládání do prohlížeče", () => {
  it("když zápis selže, ohlásí to; když se zase povede, ohlásí návrat", () => {
    const udalosti: boolean[] = [];
    window.addEventListener(UDALOST_ULOZENI, (e) => udalosti.push((e as CustomEvent<boolean>).detail));
    const puvodni = Storage.prototype.setItem;
    const plne = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("plné", "QuotaExceededError");
    });
    expect(ulozDoProhlizece("x", "1")).toBe(false);
    expect(ulozDoProhlizece("x", "2")).toBe(false);
    plne.mockRestore();
    expect(Storage.prototype.setItem).toBe(puvodni);
    expect(ulozDoProhlizece("x", "3")).toBe(true);
    // Hlásí jen změnu stavu: selhání jednou, návrat jednou.
    expect(udalosti).toEqual([false, true]);
  });
});
