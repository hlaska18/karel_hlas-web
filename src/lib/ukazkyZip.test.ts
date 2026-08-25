import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Složky s ukázkami banka nevypisuje (viz `_zdroje.txt` v `materials.ts`),
 * takže se k nim učitel dostane jedině přes ZIP vedle nich. Ten se generuje
 * ručně skriptem `scripts/vyrob-ukazky-zip.py` a commituje – kdyby zestárl,
 * nikdo by si toho nevšiml, protože v bance je vidět jen jeho řádek.
 * Tenhle test je tou pojistkou: hlídá, že obsah ZIPu odpovídá složce.
 */

const KOREN = path.join(process.cwd(), "public", "materialy");
const MARKER = "_zdroje.txt";

/** Jména souborů z ústředního adresáře ZIPu. Bez knihovny – formát je pevný. */
function jmenaVZipu(buf: Buffer): string[] {
  // Konec ústředního adresáře (EOCD) se hledá od konce: za ním smí být jen
  // komentář, který tenhle generátor nepíše.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("není to ZIP – chybí EOCD");

  const pocet = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const jmena: string[] = [];
  for (let i = 0; i < pocet; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("poškozený adresář ZIPu");
    const dlJmena = buf.readUInt16LE(p + 28);
    const dlExtra = buf.readUInt16LE(p + 30);
    const dlKomentare = buf.readUInt16LE(p + 32);
    jmena.push(buf.toString("utf8", p + 46, p + 46 + dlJmena).normalize("NFC"));
    p += 46 + dlJmena + dlExtra + dlKomentare;
  }
  return jmena;
}

function najdiSlozkyUkazek(dir: string): string[] {
  const nalez: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const cesta = path.join(dir, e.name);
    if (fs.existsSync(path.join(cesta, MARKER))) nalez.push(cesta);
    else nalez.push(...najdiSlozkyUkazek(cesta));
  }
  return nalez;
}

const slozky = najdiSlozkyUkazek(KOREN);

describe("ZIPy s ukázkami", () => {
  it("nějaké složky s ukázkami vůbec existují", () => {
    // Kdyby konvence zmizela, testy níž by prošly naprázdno.
    expect(slozky.length).toBeGreaterThan(0);
  });

  it.each(slozky.map((s) => [path.relative(KOREN, s), s]))("%s odpovídá svému ZIPu", (_n, slozka) => {
    const zip = `${slozka}.zip`;
    expect(fs.existsSync(zip), `chybí ${path.basename(zip)} – spusť scripts/vyrob-ukazky-zip.py`).toBe(true);

    const naDisku = fs
      .readdirSync(slozka, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name !== MARKER)
      .map((e) => `${path.basename(slozka)}/${e.name}`.normalize("NFC"))
      .sort();

    const vZipu = jmenaVZipu(fs.readFileSync(zip)).sort();
    expect(vZipu, "ZIP je zastaralý – spusť scripts/vyrob-ukazky-zip.py").toEqual(naDisku);
  });
});
