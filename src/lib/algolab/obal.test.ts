import { describe, expect, it } from "vitest";
import { noveHeslo, normalizujHeslo, rozbal, zabal, zadaniZHesla, ZNAKY } from "./obal";
import { noveZadani } from "./zaverecne";

describe("obal kódů ALGOLABu", () => {
  it("vrátí stejný text včetně diakritiky a odmítne cizí účel", () => {
    const text = JSON.stringify({ reflexe: "Žluťoučký kůň – „tabulka“", n: 42 });
    const kod = zabal(text, "ALG1");
    expect(rozbal(kod, "ALG1")).toBe(text);
    expect(rozbal(kod, "ALGZ1")).toBeNull();
    expect(rozbal("", "ALG1")).toBeNull();
    expect(rozbal("@@@", "ALG1")).toBeNull();
  });

  it("stejný obsah dá stejný kód, jiný obsah úplně jiný začátek", () => {
    expect(zabal('{"v":1}', "ALG1")).toBe(zabal('{"v":1}', "ALG1"));
    expect(zabal('{"v":1,"a":1}', "ALG1").slice(0, 8)).not.toBe(zabal('{"v":1,"a":2}', "ALG1").slice(0, 8));
  });
});

/**
 * ZMRAZENO: id zadání se počítá z hesla. Kdyby se výpočet změnil, vyučující
 * by svými hesly už nevyhodnotil odevzdaná zadání.
 */
describe("heslo zadání", () => {
  it("id je 6 znaků, stejné pro velká, malá písmena i bez pomlček", () => {
    expect(zadaniZHesla("ABCD-EFGH-JKLM")).toMatchInlineSnapshot(`"R9YDBJ"`);
    expect(zadaniZHesla("abcd efgh jklm")).toBe(zadaniZHesla("ABCD-EFGH-JKLM"));
    expect(normalizujHeslo(" ab-cd ")).toBe("ABCD");
  });

  it("nové zadání: heslo 12 znaků ve skupinách, id z hesla", () => {
    for (let i = 0; i < 50; i++) {
      const { id, heslo } = noveZadani();
      expect(heslo).toMatch(new RegExp(`^[${ZNAKY}]{4}-[${ZNAKY}]{4}-[${ZNAKY}]{4}$`));
      expect(id).toMatch(new RegExp(`^[${ZNAKY}]{6}$`));
      expect(id).toBe(zadaniZHesla(heslo));
      expect(id).not.toBe("CVICNE");
    }
    expect(noveHeslo()).not.toBe(noveHeslo());
  });
});
