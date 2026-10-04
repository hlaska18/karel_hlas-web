/**
 * Vlastní kopie knihoven pro náhledy v bance: public/vendor/<balík>@<verze>/.
 *
 * Proč: audit 4. 10. 2026 – náhledy Wordu, Excelu, PowerPointu a kódu braly
 * knihovny jen z cdn.jsdelivr.net. Když ho školní filtr zablokuje, náhled
 * nejde. Kurz SQL to už řeší vlastní kopií (scripts/sqljs-kopie.mjs), tady
 * stejně: web bere nejdřív kopii ze své domény a CDN je záloha.
 *
 * Seznam knihoven, verzí a otisků (SRI) je v src/lib/knihovny.json. Skript
 * stáhne soubor z jsDelivr, OVĚŘÍ otisk (kopie je bajt po bajtu stejná jako
 * soubor, který web dřív bral z CDN) a přiloží licenci.
 *
 * Spuštění (po změně verze nebo otisku v knihovny.json):
 *   node scripts/nahledy-kopie.mjs
 * Shodu kopií s knihovny.json hlídá test src/lib/knihovny.test.ts.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const koren = join(dirname(fileURLToPath(import.meta.url)), "..");
const knihovny = JSON.parse(readFileSync(join(koren, "src/lib/knihovny.json"), "utf8"));

for (const k of knihovny) {
  const zaklad = `https://cdn.jsdelivr.net/npm/${k.balik}@${k.verze}/`;
  const cil = join(koren, "public", "vendor", `${k.balik}@${k.verze}`);
  const odpoved = await fetch(zaklad + k.soubor);
  if (!odpoved.ok) throw new Error(`${k.balik}: HTTP ${odpoved.status}`);
  const data = Buffer.from(await odpoved.arrayBuffer());
  const otisk = "sha384-" + createHash("sha384").update(data).digest("base64");
  if (otisk !== k.sri) throw new Error(`${k.balik}: otisk nesedí (${otisk})`);
  const soubor = join(cil, k.soubor);
  mkdirSync(dirname(soubor), { recursive: true });
  writeFileSync(soubor, data);
  const lic = await fetch(zaklad + k.licence);
  if (!lic.ok) throw new Error(`${k.balik}: licence HTTP ${lic.status}`);
  writeFileSync(join(cil, k.licence), Buffer.from(await lic.arrayBuffer()));
  console.log(`${k.balik}@${k.verze} → public/vendor/${k.balik}@${k.verze}/${k.soubor}`);
}
