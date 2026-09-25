// Řešení a postup všech úloh kurzu SQL v DB Browseru – pro učitele.
// Data jsou vytažená přímo z kurzu (lekce.json z src/lib/dbb), takže řešení
// odpovídají tomu, co program opravdu kontroluje.
const fs = require("fs");
const path = require("path");
const S = require("./spolecne");
const { d } = S;

const LEKCE = JSON.parse(fs.readFileSync(path.join(__dirname, "lekce.json"), "utf8"));
const VYSTUP = process.argv[2];

/* ───────────── rozbor SQL na kroky postupu ───────────── */

const jedenRadek = (sql) => sql.replace(/\s+/g, " ").replace(/\s*;\s*$/, "").trim();

/** Rozdělí skript na příkazy (středník mimo apostrofy). */
function prikazy(sql) {
  const vysledek = [];
  let akt = "";
  let vRetezci = false;
  for (const c of sql) {
    if (c === "'") vRetezci = !vRetezci;
    if (c === ";" && !vRetezci) {
      if (akt.trim()) vysledek.push(akt.trim());
      akt = "";
    } else akt += c;
  }
  if (akt.trim()) vysledek.push(akt.trim());
  return vysledek;
}

/** Vysvětlení podmínky WHERE. */
function poznamkyKPodmince(w) {
  const p = [];
  if (/\bAND\b/i.test(w)) p.push("AND = musí platit všechny podmínky zároveň");
  if (/\bOR\b/i.test(w)) p.push("OR = stačí jedna z podmínek");
  if (/\bLIKE\b/i.test(w)) p.push("% v LIKE znamená „cokoli před a za“");
  if (/\bBETWEEN\b/i.test(w)) p.push("BETWEEN … AND … bere i krajní hodnoty");
  if (/'/.test(w)) p.push("text patří do rovných apostrofů, čísla bez nich");
  return p.length ? ` (${p.join("; ")})` : "";
}

function popisSloupcu(cols) {
  if (cols.trim() === "*") return "všechny sloupce (`*`)";
  const poznamky = [];
  if (/COUNT\(\*\)/i.test(cols)) poznamky.push("`COUNT(*)` spočítá řádky");
  const avg = cols.match(/AVG\(([^)]+)\)/i);
  if (avg) poznamky.push(`\`AVG(${avg[1]})\` spočítá průměr sloupce ${avg[1]}`);
  if (/\bAS\b/i.test(cols)) poznamky.push("`AS` jen pojmenuje sloupec ve výsledku");
  if (/\w+\.\w+/.test(cols)) poznamky.push("`tabulka.sloupec` říká, ze které tabulky sloupec je");
  return `\`${cols.trim()}\`${poznamky.length ? ` – ${poznamky.join("; ")}` : ""}`;
}

function krokySelect(sql) {
  const s = jedenRadek(sql);
  const m = s.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(.*)$/i);
  if (!m) return null;
  const [, cols, from, zbytek] = m;
  const kroky = [`Z které tabulky: \`FROM ${from}\`.`];
  const joinRe = /JOIN\s+(\w+)\s+ON\s+(.+?)(?=\s+JOIN\s|\s+WHERE\s|\s+GROUP\s+BY\s|\s+ORDER\s+BY\s|$)/gi;
  let j;
  while ((j = joinRe.exec(zbytek))) {
    kroky.push(`Připoj tabulku ${j[1]} a řádky spáruj podle klíče: \`JOIN ${j[1]} ON ${j[2].trim()}\` (odkaz z jedné tabulky = id v druhé).`);
  }
  const where = zbytek.match(/WHERE\s+(.+?)(?=\s+GROUP\s+BY\s|\s+ORDER\s+BY\s|$)/i);
  if (where) kroky.push(`Nech jen řádky, pro které platí podmínka: \`WHERE ${where[1].trim()}\`${poznamkyKPodmince(where[1])}.`);
  const group = zbytek.match(/GROUP\s+BY\s+(.+?)(?=\s+ORDER\s+BY\s|$)/i);
  if (group) kroky.push(`Seskup řádky: \`GROUP BY ${group[1].trim()}\` – každá skupina dá jeden řádek výsledku.`);
  kroky.push(`Co vypsat: ${popisSloupcu(cols)}.`);
  const order = zbytek.match(/ORDER\s+BY\s+(.+)$/i);
  if (order) {
    const desc = /\bDESC\b/i.test(order[1]);
    kroky.push(`Seřaď: \`ORDER BY ${order[1].trim()}\` – ${desc ? "DESC řadí sestupně, od největšího" : "bez DESC vzestupně, od nejmenšího"}.`);
  }
  return kroky;
}

function krokyInsert(sql) {
  const s = jedenRadek(sql);
  const m = s.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)\s*VALUES\s*(.+)$/i);
  if (!m) return null;
  const [, tab, cols, hodnoty] = m;
  const kroky = [`Do které tabulky: \`INSERT INTO ${tab}\`.`, `Vyjmenuj sloupce, které plníš: \`(${cols.trim()})\`.`];
  if (!/\bid\b/i.test(cols)) kroky.push("Sloupec id vynech – u INTEGER PRIMARY KEY ho databáze doplní sama.");
  const vice = (hodnoty.match(/\)\s*,\s*\(/g) || []).length;
  kroky.push(
    `Hodnoty ve stejném pořadí jako sloupce: \`VALUES ${hodnoty.trim()}\`. Text v apostrofech, čísla bez nich.${vice ? ` Víc řádků najednou: skupiny v závorkách oddělené čárkou.` : ""}`,
  );
  return kroky;
}

function krokyUpdate(sql) {
  const s = jedenRadek(sql);
  const m = s.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
  if (!m) return null;
  const [, tab, set, where] = m;
  const kroky = [`Ve které tabulce: \`UPDATE ${tab}\`.`, `Co změnit: \`SET ${set.trim()}\`.`];
  if (where) kroky.push(`Kterých řádků se to týká: \`WHERE ${where.trim()}\`${poznamkyKPodmince(where)}. Bez WHERE by se změnily VŠECHNY řádky tabulky.`);
  else kroky.push("Tady schválně bez WHERE – změní se všechny řádky tabulky.");
  return kroky;
}

function krokyDelete(sql) {
  const s = jedenRadek(sql);
  const m = s.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (!m) return null;
  const [, tab, where] = m;
  const kroky = [`Ze které tabulky: \`DELETE FROM ${tab}\`.`];
  if (where) kroky.push(`Které řádky smazat: \`WHERE ${where.trim()}\`${poznamkyKPodmince(where)}. Bez WHERE by se smazala celá tabulka.`);
  return kroky;
}

function krokyCreate(sql) {
  const s = jedenRadek(sql);
  const m = s.match(/^CREATE\s+TABLE\s+(\w+)\s*\((.+)\)$/i);
  if (!m) return null;
  const [, tab, defs] = m;
  const kroky = [`Založ tabulku: \`CREATE TABLE ${tab}\`, sloupce patří do závorky a oddělují se čárkou.`];
  // Definice sloupců – čárky uvnitř závorek (REFERENCES knihy(id)) nedělí.
  const casti = [];
  let hloubka = 0;
  let akt = "";
  for (const c of defs) {
    if (c === "(") hloubka++;
    if (c === ")") hloubka--;
    if (c === "," && hloubka === 0) {
      casti.push(akt.trim());
      akt = "";
    } else akt += c;
  }
  if (akt.trim()) casti.push(akt.trim());
  for (const def of casti) {
    const nazev = def.split(/\s+/)[0];
    const pozn = [];
    if (/PRIMARY KEY/i.test(def)) pozn.push("PRIMARY KEY jednoznačně určuje řádek");
    const ref = def.match(/REFERENCES\s+(\w+)\((\w+)\)/i);
    if (ref) pozn.push(`REFERENCES dělá cizí klíč – odkaz na ${ref[1]}.${ref[2]}`);
    if (/\bINTEGER\b/i.test(def)) pozn.push("INTEGER = celé číslo");
    else if (/\bTEXT\b/i.test(def)) pozn.push("TEXT = text");
    else if (/\bREAL\b/i.test(def)) pozn.push("REAL = desetinné číslo");
    kroky.push(`Sloupec ${nazev}: \`${def}\`${pozn.length ? ` – ${pozn.join("; ")}` : ""}.`);
  }
  return kroky;
}

function krokyZeSql(sql) {
  const vse = [];
  const seznam = prikazy(sql);
  for (const p of seznam) {
    const k =
      (/^\s*SELECT/i.test(p) && krokySelect(p)) ||
      (/^\s*INSERT/i.test(p) && krokyInsert(p)) ||
      (/^\s*UPDATE/i.test(p) && krokyUpdate(p)) ||
      (/^\s*DELETE/i.test(p) && krokyDelete(p)) ||
      (/^\s*CREATE/i.test(p) && krokyCreate(p)) || [`Napiš příkaz \`${jedenRadek(p)}\`.`];
    if (seznam.length > 1) vse.push(`Příkaz ${vse.filter((x) => x.startsWith("Příkaz ")).length + 1}: \`${jedenRadek(p).split(" ").slice(0, 3).join(" ")} …\``);
    vse.push(...k);
  }
  return vse;
}

const JE_SQL = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|Třeba UPDATE)\b/i;

/** Kroky z řešení „klikacího“ úkolu: části oddělené šipkou →. */
const NABIDKY = ["Soubor", "Úpravy", "Zobrazit", "Nástroje", "Nápověda"];
const velke = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const tecka = (x) => (/[.!?]$/.test(x) ? x : `${x}.`);

function krokyZPostupu(reseni) {
  const casti = reseni
    .split("→")
    .map((x) => x.trim())
    .filter(Boolean);
  const kroky = [];
  for (let i = 0; i < casti.length; i++) {
    const x = casti[i];
    if (JE_SQL.test(x)) {
      const trebas = /^Třeba/i.test(x);
      const sql = x.replace(/^Třeba\s+/i, "");
      kroky.push(velke(`${trebas ? "třeba " : ""}na kartě Spustit SQL spusť \`${jedenRadek(sql)};\` (F5).`));
    } else if (NABIDKY.indexOf(x) !== -1 && casti[i + 1]) {
      let krok = `V nabídce ${x} vyber ${casti[i + 1]}`;
      i++;
      // Otevřít databázi → knihovna.db: soubor se vybírá v okně.
      if (casti[i + 1] && /\.db$/.test(casti[i + 1])) {
        krok += ` a v okně vyber ${casti[i + 1]}`;
        i++;
      }
      kroky.push(`${krok}.`);
    } else if (x === "Prohlížet data") kroky.push("Přepni na kartu Prohlížet data.");
    else if (/^tabulka\s+\w+$/i.test(x)) kroky.push(`Vyber tabulku ${x.split(/\s+/)[1]}.`);
    else if (x === "Neukládat") kroky.push("V okně Uložit změny? zvol Neukládat.");
    else if (x === "Uložit") kroky.push("Potvrď tlačítkem Uložit.");
    else if (x === "Enter") kroky.push("Potvrď klávesou Enter.");
    else if (x === "napiš název") kroky.push("Napiš název souboru, třeba hry.db.");
    else kroky.push(tecka(velke(x)));
  }
  return kroky;
}

/* ───────────── jak to program pozná ───────────── */

function jakToPozna(u) {
  if (u.druh === "dotaz") {
    const serazeno = /order\s+by/i.test(u.reference || "");
    const zaklad = u.nadCistou
      ? "Po F5 program pustí dotaz žáka i správné řešení na čisté kopii původních dat a porovná výsledky."
      : "Po F5 program porovná výsledek dotazu žáka s výsledkem správného řešení nad knihovnou žáka (s jeho tabulkou hodnoceni).";
    return `${zaklad} Porovnávají se hodnoty řádků i pořadí sloupců, názvy sloupců (AS) ne. ${
      serazeno ? "Záleží i na pořadí řádků, protože řešení řadí." : "Na pořadí řádků nezáleží."
    } Jiný zápis, který vrátí totéž, projde taky. Když výsledek nesedí, kurz napíše „Ještě ne“ a čím se liší.`;
  }
  if (u.druh === "zmena") {
    return `Po F5 program provede příkaz žáka i správné řešení na dvou čistých kopiích a porovná, jak tabulka vypadá po změně (\`${jedenRadek(u.check)}\`). Do souboru se zapisovat nemusí.`;
  }
  return u.ceka ? `${u.ceka.replace(/\.$/, "")}. Program to pozná sám, žádné tlačítko Zkontrolovat není.` : "Program to pozná sám z toho, co žák v programu udělá – žádné tlačítko Zkontrolovat není.";
}

/* ───────────── časté chyby podle lekce ───────────── */

const CHYBY = {
  1: ["Dotaz se spouští klávesou F5 (nebo Ctrl+Enter), ne Enterem – Enter jen zalomí řádek.", "Překlep v názvu tabulky (`kniha` místo `knihy`) – kurz vypíše, jaké tabulky databáze má."],
  2: ["Sloupce v jiném pořadí, než chce zadání – kurz porovnává i pořadí sloupců.", "Čárka za posledním sloupcem před FROM."],
  3: ["Text bez apostrofů (`zanr = román`) – SQLite hledá sloupec toho jména a kurz poradí apostrofy.", "Místo apostrofu znak ´ (klávesa vedle =) nebo uvozovky z Wordu – kurz to pozná a nabídne Nahradit apostrofem.", "Háčky a čárky v názvu sloupce (`název`) – kurz napíše, že názvy jsou bez diakritiky."],
  4: ["LIKE bez % hledá přesnou shodu celého textu.", "LIKE nerozlišuje velká a malá písmena jen u písmen bez háčků a čárek: `'%čapek%'` nenajde „Čapek“."],
  5: ["Bez DESC se řadí vzestupně.", "Texty s háčkem na začátku (Č, Š, Ž) jsou až za Z – SQLite řadí podle kódu znaků. Kurz to u výsledku vysvětlí."],
  6: ["`COUNT(sloupec)` vynechá prázdné (NULL) hodnoty, `COUNT(*)` počítá všechny řádky."],
  7: ["Průměr vyjde desetinné číslo – to je v pořádku, zaokrouhlovat se nemusí."],
  8: ["Chybí GROUP BY – výsledek je jen jeden řádek za celou tabulku.", "Sloupec, podle kterého se seskupuje, chybí v SELECT – není poznat, ke které skupině číslo patří."],
  9: ["ON spojuje odkaz s klíčem (`vypujcky.ctenar_id = ctenari.id`), ne dvě id.", "Sloupec, který je v obou tabulkách (`id`), bez názvu tabulky – SQLite hlásí nejednoznačný sloupec."],
  10: ["Každý JOIN potřebuje vlastní ON.", "Zaměněné sloupce v ON (`kniha_id` se páruje s knihy.id, `ctenar_id` s ctenari.id)."],
  11: ["INSERT spuštěný podruhé skončí chybou UNIQUE (id 11 už v tabulce je). Byl-li první pokus s překlepem, pomůže Vrátit změny a pak opravený příkaz – kurz to v lekci 11 řekne přímo.", "Dostupnost jako text (`'1'` nebo `'ano'`) místo čísla 1."],
  12: ["UPDATE bez WHERE změní všechny knihy. Kontroluje se to na čisté kopii, ale žák změnu vidí ve svých datech – pomůže Vrátit změny."],
  13: ["DELETE bez WHERE smaže celou tabulku. Změna zůstane v datech žáka, dokud ji nevrátí (Vrátit změny) – při přechodu do lekce 14 ji program zahodí sám."],
  14: ["Rozbalená jen skupina Tabulky, ne tabulka knihy.", "14b: odkazy do jiných tabulek poznáš podle `_id` na konci a slova REFERENCES ve sloupci Schéma."],
  15: ["Do filtru se píše podmínka bez názvu sloupce (`>1900`), ne celé `rok > 1900`.", "Po DELETE z lekcí 1–13, které žák zapsal, v knihovně chybí knihy – úkol 15a to řekne a poradí Nápověda → Obnovit původní knihovna.db.", "15b: přepsaná buňka čeká na zápis, ale úkol se splní už přepsáním."],
  16: ["16a se splní jen celým postupem: změna Temna → Zavřít databázi → Neukládat → znovu otevřít. Teprve pak je vidět, že změna zmizela.", "Když bylo Temno dostupné už v souboru z minula, program knihovnu při vstupu do lekce sám obnoví."],
  17: ["CREATE TABLE spuštěný podruhé skončí „already exists“ – CREATE z editoru smazat, nebo spustit jen INSERT přes Shift+F5 (jen příkaz, ve kterém stojí kurzor).", "17b: hodnocení je víc než tři (INSERT víckrát) – přebytečná smazat `DELETE FROM hodnoceni WHERE id > 3;`. Vrátit změny by zahodilo i nezapsanou tabulku ze 17a.", "17c: bez zápisu tabulka po zavření databáze zmizí."],
  18: ["Tabulka hodnoceni chybí (zavřeno bez zápisu, jiný počítač) – panel lekce nabídne tlačítko Založit hodnoceni znovu.", "JOIN přes `hodnoceni.kniha_id = knihy.id`."],
  19: ["Bez zápisu změn se tabulky po zavření ztratí.", "19e: stažený soubor hned nahrát do zadání v Teams – po odhlášení může ze Stažených souborů zmizet.", "Téma databáze je na žákovi; řešení níž je jen příklad (hry)."],
  20: ["Datum a čas jsou v databázi text: `datum = '2026-10-16'`, `cas BETWEEN '14:00' AND '15:00'`.", "Pachatele ostatním neprozrazovat – kurz to po vyřešení připomene."],
  21: ["V procvičování se řešení žákovi neukazuje, jen nápověda.", "A15: filtr musí zůstat vidět na kartě Prohlížet data. A16: nová cena musí být zapsaná do souboru dilna.db.", "Jako písemka: odkaz karelhlas.vercel.app/sql?pisemka=A – žák pak nevidí ani nápovědu."],
  22: ["V procvičování se řešení žákovi neukazuje, jen nápověda.", "B15: filtr musí zůstat vidět na kartě Prohlížet data. B16: nová cena musí být zapsaná do souboru stavebniny.db.", "Jako písemka: odkaz karelhlas.vercel.app/sql?pisemka=B – žák pak nevidí ani nápovědu."],
};

/* ───────────── sestavení dokumentu ───────────── */

const obsah = [];
const dnes = new Date();
const datum = `${dnes.getDate()}. ${dnes.getMonth() + 1}. ${dnes.getFullYear()}`;

obsah.push(
  new d.Paragraph({
    children: [new d.TextRun({ text: "Řešení a postup úloh", bold: true, size: 44, color: "17365D" })],
    spacing: { after: 60 },
  }),
  new d.Paragraph({
    children: [new d.TextRun({ text: "Kurz SQL ve virtuálním DB Browseru · karelhlas.vercel.app/sql · pro učitele", size: 24, color: "595959" })],
    spacing: { after: 240 },
  }),
);

obsah.push(S.nadpis("Jak číst tento dokument", 1));
[
  "U každé úlohy je zadání, postup řešení, správné řešení a to, jak úlohu pozná program. Úlohy označené „navíc“ se do hotové lekce nepočítají.",
  "Řešení SQL je jedno z možných. Program porovnává výsledek, ne text dotazu – jiný zápis, který vrátí totéž, projde taky.",
  "Postup je rozbor správného řešení v pořadí, v jakém se dotaz dá vymyslet: z které tabulky, které řádky, co vypsat, jak seřadit. Hodí se nahlas u tabule.",
  "Lekce 1–13, 14b, detektivka a procvičování se kontrolují nad původními daty, takže je nerozhodí, co si žák v databázi změnil. Lekce 18 pracuje s tabulkou, kterou si žák sám založil.",
  "Úkoly v programu (lekce 14–19 a poslední dvě úlohy procvičování) sleduje program sám – co přesně čeká, píše žákovi pod aktuálním úkolem.",
  `Dokument je vygenerovaný přímo z dat kurzu (${datum}). Když se kurz změní, vygeneruje se znovu.`,
].forEach((t) => obsah.push(S.odrazka(t)));

obsah.push(S.nadpis("Přehled lekcí", 1));
const radkyPrehledu = [["Lekce", "Název", "Databáze", "Úkoly"]];
for (const l of LEKCE) {
  const povinne = l.ukoly.filter((u) => !u.navic).length;
  const navic = l.ukoly.length - povinne;
  radkyPrehledu.push([String(l.id), l.title, l.soubor || "vlastní", `${povinne}${navic ? ` + ${navic} navíc` : ""}`]);
}
obsah.push(S.tabulka([900, 5338, 1800, 1600], radkyPrehledu));
obsah.push(
  S.slaby(
    "Lekce 1–13 jsou první hodina (SQL), 14–19 druhá (práce v programu). Lekce 20 je detektivka pro rychlé, 21 a 22 procvičování na jiných datech – obě varianty mají úlohy postavené stejně, hodí se na písemku ve dvou skupinách.",
  ),
);

for (const l of LEKCE) {
  obsah.push(new d.Paragraph({ children: [new d.PageBreak()] }));
  const typ = l.id <= 13 ? "SQL" : l.id <= 19 ? "práce v programu" : l.id === 20 ? "navíc – detektivka" : "navíc – procvičování";
  obsah.push(S.nadpis(`Lekce ${l.id} · ${l.title}`, 1));
  obsah.push(S.slaby(`${typ} · databáze: ${l.soubor || "vlastní, žák ji založí"}${l.id >= 20 ? ` · program ji při vstupu do lekce sám otevře` : ""}`));
  obsah.push(S.odstavec(l.teach));
  if (l.example) {
    obsah.push(S.odstavec("Ukázka v lekci:", { run: { bold: true } }));
    obsah.push(...S.kod(l.example));
  }
  if (CHYBY[l.id]) {
    obsah.push(S.nadpis("Časté chyby v lekci", 3));
    CHYBY[l.id].forEach((t) => obsah.push(S.odrazka(t)));
  }

  l.ukoly.forEach((u, i) => {
    obsah.push(S.nadpis(`Úkol ${i + 1}${u.navic ? " · navíc" : ""}`, 2));
    const inst = S.novyCislovanySeznam();
    const postup = [];
    if (u.reseniJeSql) {
      const jeDotaz = /^\s*SELECT/i.test(u.reseni);
      postup.push(`Na kartě Spustit SQL napiš ${jeDotaz ? "dotaz" : "příkaz"} do editoru.`);
      postup.push(...krokyZeSql(u.reseni));
      postup.push(`Spusť ho klávesou F5 (nebo Ctrl+Enter). Úkol se odškrtne sám, jakmile ${u.druh === "stav" ? "program vidí výsledek" : "výsledek sedí"}.`);
    } else {
      postup.push(...krokyZPostupu(u.reseni));
    }
    const radky = [
      ["Zadání", u.zadani],
      ["Nápověda v kurzu", u.hint],
      ["Postup", postup.map((p) => S.krok(p, inst, 21))],
      ["Řešení", u.reseniJeSql ? S.kod(u.reseni) : [S.odstavec(u.reseni, { run: { size: 21 } })]],
      ["Jak to program pozná", jakToPozna(u)],
    ];
    obsah.push(S.tabulka([2000, 7638], radky, { hlavicka: false, prvniSloupecTucne: true }));
  });
}

const doc = new d.Document({
  creator: "Karel Hlas",
  title: "Řešení a postup úloh – DB Browser",
  styles: S.styly,
  numbering: S.cislovani,
  sections: [{ properties: S.vlastnostiStrany, footers: S.zapati("Řešení a postup – DB Browser"), children: obsah }],
});

d.Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(VYSTUP, b);
  console.log("zapsáno", VYSTUP, b.length, "bajtů");
});
