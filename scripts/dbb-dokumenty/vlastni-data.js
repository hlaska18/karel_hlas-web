// Návod „Vlastní databáze z Excelu“ – pro žáky i pro učitele.
// Postup je ověřený v simulátoru na /sql (28. 9. 2026): CSV z českého Excelu
// (středník, Windows-1250) i CSV UTF-8 s čárkami, import, dotazy, export.
//
//   node scripts/dbb-dokumenty/vlastni-data.js zak    "<cesta>.docx"
//   node scripts/dbb-dokumenty/vlastni-data.js ucitel "<cesta>.docx"
const fs = require("fs");
const S = require("./spolecne");
const { d } = S;

const [KDO, VYSTUP] = process.argv.slice(2);
if (!["zak", "ucitel"].includes(KDO) || !VYSTUP) {
  console.error('Použití: node vlastni-data.js zak|ucitel "<cesta>.docx"');
  process.exit(1);
}

const o = [];
const N = (t, u) => o.push(S.nadpis(t, u));
const P = (t) => o.push(S.odstavec(t));
const Sl = (t) => o.push(S.slaby(t));
const B = (seznam) => seznam.forEach((t) => o.push(S.odrazka(t)));
const K = (seznam) => {
  const inst = S.novyCislovanySeznam();
  seznam.forEach((t) => o.push(S.krok(t, inst)));
};
const T = (sloupce, radky, volby) => {
  o.push(S.tabulka(sloupce, radky, volby));
  o.push(S.mezera());
};
const KOD = (t) => o.push(...S.kod(t));

function hlavicka(titulek, podtitulek) {
  o.push(
    new d.Paragraph({
      children: [new d.TextRun({ text: titulek, bold: true, size: 44, color: "17365D" })],
      spacing: { after: 60 },
    }),
    new d.Paragraph({
      children: [new d.TextRun({ text: podtitulek, size: 24, color: "595959" })],
      spacing: { after: 240 },
    }),
  );
}

/* Ukázková tabulka – stejná jako soubor filmy.csv v bance. */
const FILMY = [
  ["Název", "Rok", "Žánr", "Moje hodnocení"],
  ["Pelíšky", "1999", "komedie", "9,5"],
  ["Vratné lahve", "2007", "komedie", "8"],
  ["Obecná škola", "1991", "komedie", "7,5"],
  ["Harry Potter a Kámen mudrců", "2001", "fantasy", "9"],
  ["Interstellar", "2014", "sci-fi", "10"],
  ["Matrix", "1999", "sci-fi", "8,5"],
  ["Coco", "2017", "animovaný", "9,5"],
  ["Ledové království", "2013", "animovaný", "7"],
];

/* ═══════════════════════════════ ŽÁK ═══════════════════════════════ */
function zak() {
  hlavicka("Vlastní databáze z Excelu", "Návod · DB Browser na karelhlas.vercel.app/sql");
  P(
    "Kurz SQL pracuje s hotovou databází knihovny. Stejně dobře se ale můžeš ptát svých vlastních dat: tabulku si připravíš v Excelu, nahraješ ji do DB Browseru a ptáš se jí v SQL. Výsledek pak vrátíš zpátky do Excelu a třeba z něj uděláš graf.",
  );
  T(
    [2400, 7238],
    [
      ["Krok", "Kde"],
      ["1. Připrav tabulku", "Excel (nebo Google Tabulky)"],
      ["2. Ulož ji jako CSV", "Excel"],
      ["3. Založ databázi a nahraj CSV", "DB Browser na karelhlas.vercel.app/sql"],
      ["4. Ptej se v SQL", "DB Browser, karta Spustit SQL"],
      ["5. Výsledek zpátky do Excelu", "DB Browser → Excel"],
      ["6. Ulož si databázi", "DB Browser → tvůj počítač"],
    ],
  );
  Sl("Nechceš začínat v Excelu? V bance u tohoto návodu je hotový soubor filmy.csv – začni rovnou krokem 3.");

  /* ── 1 ── */
  N("1. Připrav tabulku v Excelu", 1);
  P("Téma je na tobě: filmy, hry, sport, mobily, výsledky měření z dílny… Stačí 8 až 20 řádků a 3 až 5 sloupců, z nichž aspoň jeden je číslo. Takhle vypadá ukázka:");
  T([4000, 1300, 2138, 2200], FILMY);
  P("Aby se tabulka dala nahrát a dobře se s ní počítalo, drž se těchto pravidel:");
  B([
    "Tabulka začíná v buňce A1. V prvním řádku jsou názvy sloupců, pod nimi data.",
    "Názvy sloupců piš krátce. Háčky, čárky a mezery program sám odstraní: z „Moje hodnocení“ bude `moje_hodnoceni`. Právě takový název pak píšeš v SQL.",
    "V jednom sloupci je vždycky jen jeden druh údaje: buď čísla, nebo text.",
    "Čísla piš jen jako čísla: `250`, ne „250 Kč“, a bez mezer mezi tisíci. Desetinná čárka nevadí (`9,5`). Když ve sloupci s čísly bude i jen jedna jednotka nebo slovo, uloží se celý sloupec jako text a nepůjde s ním počítat.",
    "Žádné sloučené buňky, součty pod tabulkou ani poznámky vedle ní. Do souboru patří jen tabulka.",
    "Datum se uloží jako text (12.03.2026) a podle něj se špatně řadí. Když ho potřebuješ, přidej si sloupec rok (případně mesic) jako obyčejné číslo.",
  ]);

  /* ── 2 ── */
  N("2. Ulož tabulku jako CSV", 1);
  P("CSV je obyčejný textový soubor: každý řádek tabulky je jeden řádek textu, buňky odděluje středník nebo čárka. Soubor .xlsx DB Browser neotevře, CSV ano.");
  K([
    "Ulož si nejdřív sešit normálně (.xlsx), ať máš tabulku i s formátováním.",
    "Soubor → Uložit jako (v novějším Excelu může být Uložit kopii). Jako typ souboru vyber takový, který začíná CSV – třeba CSV UTF-8. Program zvládne oba druhy CSV, které Excel nabízí.",
    "Když Excel upozorní, že se uloží jen aktuální list nebo že se ztratí formátování, potvrď to. Do databáze stačí hodnoty.",
  ]);
  Sl("Google Tabulky: Soubor → Stáhnout → formát .csv. Na Macu v Excelu stejně: Soubor → Uložit jako a formát CSV.");

  /* ── 3 ── */
  N("3. Založ databázi a nahraj do ní CSV", 1);
  P("Otevři karelhlas.vercel.app/sql na počítači s myší – na telefonu ani na tabletu kurz neběží.");
  K([
    "Soubor → Nová databáze… (nebo tlačítko Nová databáze na liště). Napiš název, třeba `filmy`, a klikni na Vytvořit.",
    "Otevře se okno Upravit definici tabulky. Zavři ho tlačítkem Zrušit – tabulku nebudeš skládat ručně, přijde z CSV.",
    "Soubor → Importovat tabulku z CSV… a vyber svůj soubor. Soubor můžeš do okna programu i přetáhnout myší.",
    "V okně Importovat tabulku z CSV zkontroluj název tabulky (je podle názvu souboru, můžeš ho přepsat) a že je zaškrtnuté První řádek jsou názvy sloupců. Oddělovač program pozná sám.",
    "Podívej se do náhledu na typ u každého sloupce: INTEGER = celé číslo, REAL = desetinné číslo, TEXT = text. Když je u sloupce s čísly TEXT, je v něm v Excelu něco navíc (jednotka, mezera, slovo) – oprav to a ulož CSV znovu.",
    "Klikni na Importovat.",
    "Zapsat změny (Ctrl+S). Dokud změny nezapíšeš, je tabulka jen v paměti programu a po zavření by se ztratila.",
  ]);
  P("Na kartě Prohlížet data uvidíš tabulku jako v Excelu. Na kartě Struktura databáze najdeš přesné názvy sloupců – ty budeš psát v SQL.");

  /* ── 4 ── */
  N("4. Ptej se v SQL", 1);
  P("Karta Spustit SQL, napiš dotaz a stiskni F5. Takhle se dá ptát ukázkové tabulky filmy:");
  T(
    [3300, 6338],
    [
      ["Otázka", "Dotaz"],
      ["Které filmy mám nejradši?", "`SELECT nazev, moje_hodnoceni FROM filmy ORDER BY moje_hodnoceni DESC;`"],
      ["Které filmy jsou z minulého století?", "`SELECT nazev, rok FROM filmy WHERE rok < 2000 ORDER BY rok;`"],
      ["Kolik filmů jsem hodnotil(a) aspoň devítkou?", "`SELECT COUNT(*) FROM filmy WHERE moje_hodnoceni >= 9;`"],
      ["Jaké mám komedie?", "`SELECT nazev FROM filmy WHERE zanr = 'komedie';`"],
      ["Který žánr mám nejradši?", "`SELECT zanr, COUNT(*) AS pocet, ROUND(AVG(moje_hodnoceni), 1) AS prumer FROM filmy GROUP BY zanr ORDER BY prumer DESC;`"],
    ],
  );
  B([
    "Text patří mezi apostrofy: `zanr = 'komedie'`. Čísla bez nich: `rok < 2000`.",
    "`ROUND(…, 1)` zaokrouhlí na jedno desetinné místo. Bez něj vyjde průměr třeba 8.333333333333334.",
    "Program píše desetinná čísla s tečkou (9.5), jak je v SQL zvykem. Do Excelu se vrátí s čárkou.",
  ]);
  N("Tvoje otázky", 2);
  P("Vymysli na svou tabulku aspoň pět otázek a ke každé napiš dotaz:");
  B([
    "jednu s podmínkou WHERE,",
    "jednu se seřazením ORDER BY,",
    "jednu, která něco spočítá (COUNT) nebo zprůměruje (AVG),",
    "jednu se skupinami GROUP BY,",
    "jednu úplně podle sebe.",
  ]);
  P("U každé si zapiš i odpověď jednou větou – třeba „Nejvýš hodnotím sci-fi, průměr 9,3.“");

  /* ── 5 ── */
  N("5. Výsledek zpátky do Excelu", 1);
  K([
    "Spusť dotaz, jehož výsledek chceš mít v Excelu (třeba ten s GROUP BY).",
    "Nad výsledkem klikni na Uložit výsledek do CSV. Nastavení nech, jak je – sedí na český Excel (středník, desetinná čárka).",
    "Klikni na Stáhnout. Soubor vysledek-dotazu.csv najdeš ve složce Stažené soubory.",
    "Otevři ho v Excelu a udělej z něj graf.",
  ]);
  Sl("Celou tabulku vyexportuješ přes Soubor → Exportovat tabulku do CSV…");

  /* ── 6 ── */
  N("6. Ulož si databázi", 1);
  P("Databáze je uložená jen v prohlížeči na tomhle počítači. Na jiném počítači (nebo po smazání profilu) tam nebude.");
  B([
    "Soubor → Uložit kopii do počítače… stáhne databázi jako soubor, třeba `filmy.db`. Když ji máš odevzdat, nahraj ji do Teams hned – po odhlášení může ze Stažených souborů zmizet.",
    "Příště ji otevřeš přes Soubor → Nahrát databázi z počítače… Soubor .db otevře i skutečný program DB Browser for SQLite.",
  ]);

  /* ── 7 ── */
  N("Když něco nejde", 1);
  T(
    [3700, 5938],
    [
      ["Co se děje", "Co s tím"],
      ["„Tenhle soubor program neumí“", "Vybral(a) jsi sešit .xlsx. Ulož ho z Excelu jako CSV (krok 2)."],
      ["„Nejdřív otevři databázi“", "Tabulka z CSV se přidává do otevřené databáze. Soubor → Nová databáze…"],
      ["„Tabulka … už v databázi je“", "Při importu přepiš název tabulky, nebo starou smaž: karta Struktura databáze, vyber ji a klikni na Smazat tabulku."],
      ["U čísel je v náhledu TEXT.", "Ve sloupci je jednotka, mezera mezi tisíci nebo slovo. Oprav to v Excelu, ulož CSV znovu a importuj znovu."],
      ["„no such column“", "Sloupec se jmenuje jinak, než píšeš – bez háčků a mezer. Přesné názvy jsou na kartě Struktura databáze. Nebo chybí apostrofy kolem textu."],
      ["Průměr nebo řazení podle čísel dělá divy.", "Sloupec je uložený jako TEXT. Viz o dva řádky výš."],
      ["„Řádků je moc“ / „Soubor je moc velký“", "Do prohlížeče se vejde nejvýš 5 000 řádků z jednoho CSV a soubor do 2 MB. Zmenši tabulku."],
    ],
  );
}

/* ═══════════════════════════════ UČITEL ═══════════════════════════════ */
function ucitel() {
  hlavicka("Návod pro učitele", "Vlastní databáze z Excelu · DB Browser na karelhlas.vercel.app/sql");
  P(
    "Simulátor DB Browseru neslouží jen k lekcím kurzu. Žák (nebo ty) do něj nahraje vlastní tabulku z Excelu, ptá se jí v SQL a výsledek vrátí do Excelu. Postup pro žáky je v souboru Návod – vlastní databáze z Excelu, ukázková data v souboru filmy.csv.",
  );

  N("K čemu to je", 1);
  B([
    "Žák uvidí, že SQL není jen cvičení nad knihovnou z kurzu: ptá se dat, která zná a která ho zajímají.",
    "Propojí dvě témata: Excel (tabulka, graf) a databáze (dotaz). Sám zažije, v čem je každý nástroj silný.",
    "Hodí se jako projekt na konec tématu, domácí úkol, práce pro rychlé nebo mezipředmětově (data z měření ve fyzice nebo v dílně, statistiky v zeměpisu).",
    "Učitel si tak může rychle projít i vlastní data – třeba výsledky testu podle tříd přes GROUP BY.",
  ]);

  N("Kdy a za jak dlouho", 1);
  P("Až po lekcích 1–19 kurzu: žák musí umět SELECT, WHERE, ORDER BY, COUNT, AVG a GROUP BY a vědět, že změny se musí zapsat. Celé to je jedna vyučovací hodina u počítačů.");
  T(
    [1500, 8138],
    [
      ["Minuty", "Co se děje"],
      ["0–5", "Ukázka na projektoru s filmy.csv: import, jeden dotaz s GROUP BY, výsledek zpátky do Excelu."],
      ["5–15", "Žáci si v Excelu připraví tabulku (8–20 řádků, 3–5 sloupců, aspoň jeden číselný) a uloží ji jako CSV."],
      ["15–20", "Nová databáze, import CSV, Zapsat změny."],
      ["20–38", "Pět vlastních otázek a dotazů (WHERE, ORDER BY, COUNT/AVG, GROUP BY, jeden volný) s odpovědí jednou větou."],
      ["38–45", "Výsledek dotazu s GROUP BY do Excelu a graf; Uložit kopii do počítače a odevzdat."],
    ],
  );
  Sl("Kdo nestihne tabulku v Excelu, vezme filmy.csv a pokračuje importem. Na čas stačí i dvě hodiny: první Excel a import, druhá dotazy a graf.");

  N("Co odevzdat a jak hodnotit", 1);
  B([
    "Soubor .db (Soubor → Uložit kopii do počítače) – do zadání v Teams hned po stažení, po odhlášení může ze Stažených souborů zmizet.",
    "Pět otázek, dotazů a odpovědí jednou větou (dokument nebo zpráva v Teams).",
    "Sešit Excelu s grafem z výsledku dotazu.",
  ]);
  T(
    [5638, 4000],
    [
      ["Kritérium", "Na co se dívat"],
      ["Tabulka je dobře připravená", "Čísla mají v databázi typ INTEGER nebo REAL, ne TEXT (karta Struktura databáze)."],
      ["Dotazy fungují a odpovídají na otázku", "Otevři .db v simulátoru nebo v DB Browser for SQLite a dotazy spusť."],
      ["Otázky dávají smysl", "Odpověď jednou větou je o datech, ne o SQL."],
      ["Výsledek je zpátky v Excelu", "Graf vychází z výsledku dotazu, ne z původní tabulky."],
    ],
  );

  N("Co program umí a co ne", 1);
  T(
    [3000, 6638],
    [
      ["Věc", "Jak to je"],
      ["Soubor z Excelu", "Jen CSV. Sešit .xlsx program odmítne s radou uložit ho jako CSV."],
      ["Druh CSV", "Oddělovač středník, čárku i tabulátor pozná sám (dá se přepnout). Kódování UTF-8 i Windows-1250 (český Excel) také – počítá s oběma druhy CSV, které Excel ukládá."],
      ["Názvy sloupců", "Upraví bez háčků, čárek a mezer, malými písmeny: „Známka z testu“ → `znamka_z_testu`. Stejně název tabulky podle souboru."],
      ["Typy sloupců", "Podle hodnot: samá celá čísla = INTEGER, čísla s desetinnou čárkou nebo tečkou = REAL, jinak TEXT. Prázdná buňka = NULL."],
      ["Datum", "Zůstane textem (12.03.2026) a neřadí se podle času. Když je potřeba, sloupec rok a měsíc jako čísla."],
      ["Prázdné řádky", "Přeskočí (i ty ;;;; na konci souboru z Excelu)."],
      ["Velikost", "Nejvýš 5 000 řádků z jednoho CSV, soubor i databáze do 2 MB, v prohlížeči nejvýš 12 databází."],
      ["Víc tabulek", "Každý list Excelu jako samostatné CSV, importovat postupně do téže databáze. Pak jde JOIN – úkol pro rychlé."],
      ["Kde data jsou", "Soubor zpracuje prohlížeč, na server nic nejde. Databáze zůstává v prohlížeči daného počítače, dokud ji žák nestáhne."],
      ["Zpátky do Excelu", "Uložit výsledek do CSV nad výsledkem dotazu, nebo Soubor → Exportovat tabulku do CSV. Výchozí nastavení pro český Excel: středník, desetinná čárka, UTF-8 s BOM."],
    ],
  );

  N("Časté potíže", 1);
  T(
    [3700, 5938],
    [
      ["Co se děje", "Co s tím"],
      ["Po Nová databáze se otevře okno Upravit definici tabulky.", "Tak to dělá i skutečný DB Browser. Zrušit – tabulka přijde z CSV."],
      ["Import se nenabízí nebo hlásí „Nejdřív otevři databázi“.", "Není otevřená databáze. Soubor → Nová databáze…"],
      ["Čísla jsou v náhledu TEXT.", "Jednotky („250 Kč“), mezera mezi tisíci, procenta nebo slovo ve sloupci. Opravit v Excelu, uložit CSV znovu."],
      ["„no such column“", "Název sloupce se při importu změnil. Karta Struktura databáze ukáže přesné názvy."],
      ["„Tabulka … už v databázi je“", "Druhý import téhož souboru. Přepsat název tabulky, nebo starou smazat (Struktura databáze → Smazat tabulku)."],
      ["Tabulka po příchodu zpět chybí.", "Nebyly zapsané změny (Ctrl+S), nebo jiný počítač. Proto na konci Uložit kopii do počítače."],
      ["Excel po otevření CSV z programu ukazuje čísla jako text.", "Při exportu nechat zaškrtnutou desetinnou čárku a středník (výchozí nastavení)."],
    ],
  );

  N("Vlastní data učitele a soukromí", 1);
  B([
    "Soubor se nikam neposílá, zpracuje ho prohlížeč. Databáze ale zůstane v prohlížeči počítače, dokud ji nesmažeš (Otevřít databázi → ikona koše).",
    "Na počítači v učebně nebo u projektoru proto nepracuj s daty, která nemají vidět další (známky se jmény). Tam radši data bez jmen, nebo vlastní počítač.",
    "Žákům zadávej témata bez osobních údajů spolužáků – filmy, hry, sport, měření.",
  ]);

  N("Před hodinou", 1);
  K([
    "Na školním počítači pod žákovským účtem otevři filmy.csv v Excelu, ulož ho jako CSV a zkus import v simulátoru. Ověříš tak Excel i přístup ke Staženým souborům.",
    "Spusť dotaz s GROUP BY, výsledek ulož do CSV a otevři v Excelu – čísla mají být čísla s desetinnou čárkou.",
    "Zjisti, kam se na školních počítačích ukládají stažené soubory a jestli po odhlášení zůstávají.",
  ]);
}

if (KDO === "zak") zak();
else ucitel();

const nazev = KDO === "zak" ? "Návod – vlastní databáze z Excelu" : "Návod pro učitele – vlastní databáze z Excelu";
const doc = new d.Document({
  creator: "Karel Hlas",
  title: nazev,
  styles: S.styly,
  numbering: S.cislovani,
  sections: [{ properties: S.vlastnostiStrany, footers: S.zapati(nazev), children: o }],
});

d.Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(VYSTUP, b);
  console.log("zapsáno", VYSTUP, b.length, "bajtů");
});
