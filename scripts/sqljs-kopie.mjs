/**
 * Vlastní kopie SQL enginu (sql.js) pro kurz SQL: public/sqljs/<verze>/.
 *
 * Proč: rada 24. 9. 2026 – engine se bral jen z cdn.jsdelivr.net. Když ho
 * školní filtr zablokuje, nepojede ani jeden dotaz. A soubor z CDN obsahuje
 * volitelné řetězení `?.`, které Chrome pod 80 a Safari pod 13.1 nepřečtou –
 * cíl webu (.browserslistrc) je přitom Chrome 64 a Safari 12. Překladač
 * Next.js soubory z CDN nepřekládá, proto se tu přeloží zvlášť.
 *
 * Spuštění (po změně verze sql.js v package.json i v src/lib/sqljs.ts):
 *   node scripts/sqljs-kopie.mjs
 * Hlídá to test src/lib/sqljs.test.ts (verze, žádné `?.` ani `??`).
 */

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const koren = join(dirname(fileURLToPath(import.meta.url)), "..");
const zdroj = join(koren, "node_modules", "sql.js");
const verze = JSON.parse(readFileSync(join(zdroj, "package.json"), "utf8")).version;
const cil = join(koren, "public", "sqljs", verze);
mkdirSync(cil, { recursive: true });

// Stejný cíl jako .browserslistrc. Jen formát a syntaxe – názvy se nemění,
// `initSqlJs` musí zůstat globální proměnnou.
buildSync({
  entryPoints: [join(zdroj, "dist", "sql-wasm.js")],
  outfile: join(cil, "sql-wasm.js"),
  target: ["chrome64", "edge79", "firefox67", "opera51", "safari12"],
  minifyWhitespace: true,
  minifySyntax: true,
  logLevel: "error",
});
copyFileSync(join(zdroj, "dist", "sql-wasm.wasm"), join(cil, "sql-wasm.wasm"));
copyFileSync(join(zdroj, "LICENSE"), join(cil, "LICENSE"));

console.log(`sql.js ${verze} → public/sqljs/${verze}/`);
