import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { KNIHOVNY, cdnAdresa, vlastniAdresa } from "@/lib/knihovny";

/*
 * Vlastní kopie knihoven pro náhledy (public/vendor) musí být bajt po bajtu
 * stejné jako soubory na CDN – jinak by je prohlížeč kvůli otisku SRI
 * nespustil a náhled by tiše spadl na zálohu. Kopie vyrábí
 * scripts/nahledy-kopie.mjs.
 */
describe("knihovny pro náhledy", () => {
  for (const k of KNIHOVNY) {
    it(`${k.balik}@${k.verze}: kopie existuje, sedí s otiskem a má licenci`, () => {
      const soubor = join(process.cwd(), "public", vlastniAdresa(k));
      expect(existsSync(soubor)).toBe(true);
      const otisk = "sha384-" + createHash("sha384").update(readFileSync(soubor)).digest("base64");
      expect(otisk).toBe(k.sri);
      expect(existsSync(join(process.cwd(), "public", "vendor", `${k.balik}@${k.verze}`, k.licence))).toBe(true);
      expect(cdnAdresa(k)).toBe(`https://cdn.jsdelivr.net/npm/${k.balik}@${k.verze}/${k.soubor}`);
    });
  }
});
