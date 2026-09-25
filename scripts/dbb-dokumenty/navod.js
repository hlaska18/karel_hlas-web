// Návod pro učitele k simulátoru DB Browser (kurz SQL na /sql).
const fs = require("fs");
const path = require("path");
const S = require("./spolecne");
const { d } = S;

const LEKCE = JSON.parse(fs.readFileSync(path.join(__dirname, "lekce.json"), "utf8"));
const VYSTUP = process.argv[2];

const o = [];
const N = (t, u) => o.push(S.nadpis(t, u));
const P = (t) => o.push(S.odstavec(t));
const B = (seznam) => seznam.forEach((t) => o.push(S.odrazka(t)));
const K = (seznam) => {
  const inst = S.novyCislovanySeznam();
  seznam.forEach((t) => o.push(S.krok(t, inst)));
};
const T = (sloupce, radky, volby) => {
  o.push(S.tabulka(sloupce, radky, volby));
  o.push(S.mezera());
};

o.push(
  new d.Paragraph({
    children: [new d.TextRun({ text: "Návod pro učitele", bold: true, size: 44, color: "17365D" })],
    spacing: { after: 60 },
  }),
  new d.Paragraph({
    children: [new d.TextRun({ text: "Kurz SQL ve virtuálním DB Browseru · karelhlas.vercel.app/sql", size: 24, color: "595959" })],
    spacing: { after: 240 },
  }),
);
P(
  "Jak program ovládat a co v něm najdeš. Jak téma rozvrhnout do hodin, je v souboru Jak toto téma učit; řešení a postup každé úlohy v souboru Řešení a postup – DB Browser.",
);

/* ───────── 1 ───────── */
N("Co to je", 1);
B([
  "Napodobenina programu DB Browser for SQLite, ve které běží kurz SQL o 22 lekcích. Pod ní je skutečné SQLite, přímo v prohlížeči – nic se neinstaluje.",
  "Databáze i postup žáka zůstávají v prohlížeči počítače, na kterém pracuje. Na server nejde nic.",
  "Na počítači s myší a obrazovkou aspoň 1024 px se otevře program. Na telefonu a tabletu webová podoba kurzu (lekce 1–13, jen česky). Postup se v obou sčítá.",
  "Anglická verze: karelhlas.vercel.app/sql?z=en – program, lekce i hlášky anglicky, data zůstávají česká a panel ukazuje slovníček.",
  "Odkaz do Teams posílej bez www, s www prohlížeč hlásí chybu certifikátu.",
]);

/* ───────── 2 ───────── */
N("Jak program vypadá", 1);
T(
  [2300, 7338],
  [
    ["Část", "Co v ní je"],
    ["Hlavička nahoře", "Název otevřené databáze a tlačítko Zpět na web. Když žák zapne Potřebuji pomoc, zčervená."],
    ["Nabídky", "Soubor, Úpravy, Zobrazit, Nástroje, Nápověda – rozepsané níž."],
    ["Lišta s tlačítky", "Nová databáze, Otevřít databázi, Zapsat změny, Vrátit změny, Zavřít databázi."],
    ["Karty vlevo", "Struktura databáze (tabulky a sloupce), Prohlížet data (tabulka jako v Excelu, filtr, úprava buněk dvojklikem), Upravit pragma, Spustit SQL (editor, výsledek, zpráva)."],
    ["Panel vpravo", "Kurz SQL (lekce a úkoly), Schéma DB, Log SQL (co program poslal databázi). Panel jde rozšířit tažením za jeho levý okraj."],
    ["Stavový řádek dole", "Co se právě stalo – „Úkol splněn.“, „Změny zapsány…“."],
  ],
);
N("Karta Spustit SQL", 2);
B([
  "F5 nebo Ctrl+Enter spustí všechno v editoru (nebo označený kus). Shift+F5 spustí jen příkaz, ve kterém stojí kurzor.",
  "Nad editorem je lišta znaků ' * ; = < > ( ) % – klepnutím se vloží na místo kurzoru. Prváci je na klávesnici hledají.",
  "Pod výsledkem je zpráva programu a pod ní vysvětlení „Po česku“. Když žák místo apostrofu napíše ´ nebo uvozovky z Wordu, vysvětlení to pozná a nabídne tlačítko Nahradit apostrofem.",
  "Nad výsledkem je tlačítko Uložit výsledek do CSV (pro Excel).",
]);
N("Nabídky", 2);
T(
  [2000, 7638],
  [
    ["Nabídka", "Položky"],
    ["Soubor", "Nová databáze, Otevřít databázi (Ctrl+O), Zavřít databázi, Zapsat změny (Ctrl+S), Vrátit změny, Nahrát databázi z počítače, Uložit kopii do počítače, Importovat tabulku z CSV, Importovat databázi ze SQL, Exportovat tabulku do CSV, Exportovat databázi do SQL, Konec"],
    ["Úpravy", "Vytvořit tabulku (okno pro naklikání sloupců)"],
    ["Zobrazit", "Kurz SQL, Schéma DB, Log SQL"],
    ["Nástroje", "Kontrola integrity, Kontrola cizích klíčů"],
    ["Nápověda", "Moje výsledky, Stáhnout knihovna.db do počítače, Obnovit původní knihovna.db, O kurzu a pro učitele, Přehled třídy, Vytvořit úlohu pro třídu, Režim předvádění, O programu, English version, Přepnout na webovou podobu kurzu, Zpět na web a úplně dole za čarou Nový žák (smaže postup)"],
  ],
  { prvniSloupecTucne: false },
);

/* ───────── 3 ───────── */
N("Lekce", 1);
P("Lekce 1–13 jsou první hodina (SQL), 14–19 druhá (práce v programu). Lekce 20 je detektivka pro rychlé, 21 a 22 procvičování na jiných datech, obě varianty postavené stejně – hodí se na písemku ve dvou skupinách.");
const radky = [["Lekce", "Název", "Databáze", "Úkoly"]];
for (const l of LEKCE) {
  const povinne = l.ukoly.filter((u) => !u.navic).length;
  const navic = l.ukoly.length - povinne;
  radky.push([String(l.id), l.title, l.soubor || "vlastní", `${povinne}${navic ? ` + ${navic} navíc` : ""}`]);
}
T([900, 5338, 1800, 1600], radky);
P("Lekci žák vybírá v rozbalovacím seznamu nahoře v panelu nebo šipkami vedle něj. Lekce s vlastní databází (detektivka, procvičování) si ji při vstupu sama otevře, a když ještě není, založí ji.");

/* ───────── 4 ───────── */
N("Jak se úkoly odškrtávají", 1);
B([
  "Tlačítko Zkontrolovat tu není. Úkol se odškrtne sám: po F5, když výsledek sedí, nebo když žák v programu udělá, co úkol chce (rozbalí tabulku, zapíše změny…). Pod aktuálním úkolem je napsané, na co program čeká.",
  "Když výsledek nesedí, objeví se „Ještě ne:“ s tím, čím se liší (řádků je víc, sloupců méně…).",
  "Lekce 1–13, detektivka a procvičování se kontrolují nad původními daty – nerozhodí je, co si žák v databázi změnil nebo smazal.",
  "Nápověda je u každého úkolu hned. Řešení SQL se nabídne až po prvním pokusu, u práce v programu rovnou. V procvičování A a B se řešení neukazuje nikdy.",
  "Šedá fajfka znamená, že si žák zobrazil řešení (stačí zobrazit, nemusí ho vložit). Zelená = zvládl sám.",
  "Úlohy označené „navíc“ se do hotové lekce nepočítají.",
]);

/* ───────── 5 ───────── */
N("Během hodiny", 1);
B([
  "Nahoře v panelu je velký štítek „Lekce 6 · úkol 3/4“ – přečteš ho z uličky.",
  "Kdo uvízne, klikne vedle štítku na Potřebuji pomoc a horní lišta mu zčervená, dokud ji nevypne.",
  "Při změně lekce program zakomentuje (--) v editoru příkazy, které měnily data, ať se v nové lekci nespustí znovu.",
  "Při přechodu z lekcí 1–13 do lekce 14+ program potichu zahodí nezapsané změny v knihovně. Zapsané změny nabídne vrátit do původního stavu.",
  "Když má žák kurz otevřený ve dvou kartách prohlížeče, starší karta se zastaví a řekne mu to – postup se tak nepřepíše.",
]);

/* ───────── 6 ───────── */
N("Výsledky a kód postupu", 1);
P("Kód postupu nahrazuje účty žáků: na server nejde nic, žák výsledek pošle sám.");
K([
  "Žák otevře Moje výsledky (tlačítko nahoře v panelu kurzu). Uvidí „Dotazy X/13 · Program X/6“, dlaždice lekcí (zelená = sám, šedá = viděl řešení) a u procvičování „12/16 (3 s řešením)“.",
  "Napíše jméno a klikne na Kopírovat. Do schránky jde „Jméno · Dotazy X/13 · Program X/6 · SQLKURZ1-…“ – vloží to do Teams. Když Teams nejde, vyfotí celé okno.",
  "Ty otevřeš Nápověda → Přehled třídy a vložíš kódy – klidně celé vlákno z Teams, kódy se v textu najdou samy.",
  "Přehled sečte kódy téhož žáka (z domu i ze školy), ukáže tabulku, pod ní kolik žáků má kterou lekci, a červeně orámuje první lekci, kterou má méně než polovina třídy – „Příště začni lekcí N“ i se jmény, komu chybí. Tabulka jde stáhnout do Excelu (CSV).",
]);
B([
  "Na jiném počítači žák vloží svůj kód do Moje výsledky → Pokračovat z kódu a hotové lekce se mu odškrtnou. Rozpracované lekce kód nenese. Procvičování A a B se z kódu neobnovuje (slouží jako písemka).",
  "Kód je shrnutí, ne důkaz: vzniká v prohlížeči žáka a dá se upravit. Důkazem práce je soubor z lekce 19 a otázka „Přečti nahlas, co tvůj dotaz dělá.“",
  "Když si na počítač sedne někdo jiný: v nové kartě se program zeptá „Kdo sedí u počítače?“ (s posledním časem práce a skóre). Pokud se na počítači dnes nepracovalo, žádné tlačítko není předvybrané. „Ne, jsem nový žák“ smaže postup předchozího.",
]);

/* ───────── 7 ───────── */
N("Písemka", 1);
B([
  "Odkaz karelhlas.vercel.app/sql?pisemka=A (druhé skupině ?pisemka=B) otevře jen procvičování A nebo B, výběr lekcí je skrytý.",
  "Žák u úlohy, která sedí, vidí fajfku. Nápověda, řešení, „Ještě ne“ ani vysvětlení chyb po česku se neukazují – výjimka je jen rada k ´ místo apostrofu (to je klávesnice, ne SQL).",
  "Postup z kódu se v písemce nepřenáší. Písemka se ukládá zvlášť od kurzu i od druhé varianty.",
  "Na konci žák otevře Moje výsledky, napíše jméno a zkopíruje kód. V Přehledu třídy mají písemky vlastní tabulku (body a splněné úlohy).",
  "Jen na počítači – na telefonu se místo písemky ukáže vysvětlení.",
  "Klíč k písemce je v souboru Řešení a postup – DB Browser (lekce 21 a 22).",
]);

/* ───────── 8 ───────── */
N("Vlastní úloha pro třídu", 1);
K([
  "Nápověda → Vytvořit úlohu pro třídu.",
  "Vyber databázi (knihovna, dílna, stavebniny nebo detektivka), napiš zadání, případně nápovědu, a správný SELECT.",
  "Vyzkoušet dotaz – program ho pustí nad původními daty a ukáže, co musí vyjít i žákovi. Dotaz musí vracet aspoň jeden řádek.",
  "Zkopíruj odkaz do Teams. Žákovi se po otevření objeví lekce „Úloha od učitele“ a kontroluje se sama; v Přehledu třídy ji uvidíš u těch, kdo ji splnili.",
]);
B([
  "Když správný dotaz používá LIKE nebo LOWER s háčky a čárkami, program varuje: SQLite rozlišuje velká a malá písmena jen u písmen bez diakritiky.",
  "Správný dotaz je v odkazu zakódovaný, ne zašifrovaný – na procvičení a domácí úkol ano, na test ne. Na test je písemka.",
]);

/* ───────── 9 ───────── */
N("U projektoru: režim předvádění", 1);
B([
  "Nápověda → Režim předvádění: program se zvětší, řešení jde ukázat hned bez pokusu a tvoje ukázka se ukládá zvlášť – nesmíchá se s postupem žáka, který u počítače sedí jindy.",
  "Nahoře svítí fialový pruh s tlačítkem Ukončit předvádění. Režim platí do zavření karty.",
  "Konec hodiny stojí za to ukázat jednou na projektoru: Moje výsledky → jméno → Kopírovat → Teams.",
]);

/* ───────── 10 ───────── */
N("Soubory a data", 1);
B([
  "Databáze je soubor. Změny (INSERT, UPDATE, úprava buňky) jsou nejdřív jen v paměti programu – Zapsat změny (Ctrl+S) je uloží do souboru, Vrátit změny je zahodí. Zavření databáze s nezapsanými změnami se zeptá, jako skutečný program.",
  "Soubory žije v prohlížeči daného počítače, nejvýš 12 databází. Okno Otevřít databázi ukazuje, kolik místa zabírají; starou databázi smaže ikona koše.",
  "Nápověda → Obnovit původní knihovna.db vrátí knihovnu do stavu ze začátku kurzu (zmizí i tabulka hodnoceni). Procvičování a detektivka mají odkaz „Obnovit původní …“ přímo v lekci.",
  "Soubor → Nahrát databázi z počítače: soubor .db do 2 MB. Soubor jde do programu i přetáhnout myší.",
  "Soubor → Importovat tabulku z CSV: tabulka z Excelu (Uložit jako → CSV) do otevřené databáze. Český Excel se středníkem a kódováním Windows-1250 zvládne, názvy sloupců upraví bez háčků a mezer. Nejvýš 5 000 řádků.",
  "Soubor → Importovat databázi ze SQL založí novou databázi ze skriptu; Exportovat databázi do SQL skript vytvoří.",
  "Soubor → Exportovat tabulku do CSV (nebo tlačítko nad výsledkem dotazu): výchozí nastavení sedí na český Excel – středník, desetinná čárka, UTF-8 s BOM.",
  "Soubor → Uložit kopii do počítače stáhne otevřenou databázi (lekce 19). Stažený soubor ať žák hned nahraje do Teams – po odhlášení může ze Stažených souborů zmizet.",
  "Nápověda → Nový žák smaže postup, rozepsaný dotaz i všechny databáze; zůstane jen původní knihovna.",
]);

/* ───────── 11 ───────── */
N("Když něco nejde", 1);
T(
  [3400, 6238],
  [
    ["Co se děje", "Co s tím"],
    ["Kurz se ve škole nenačte (síť, filtr).", "Plán B: pracovní list na papíře, nebo kurz v telefonu přes mobilní data (lekce 1–13)."],
    ["„Kurz máš otevřený v jiné kartě“", "Pracovat v novější kartě, starší zavřít. Tlačítko v hlášce kurz v téhle kartě načte znovu."],
    ["„Změny se nepodařilo uložit“", "Úložiště prohlížeče je plné nebo zakázané (anonymní okno). Program nabídne stažení souboru; staré databáze smazat v okně Otevřít databázi."],
    ["„Knihovna není v původním stavu“", "Zbyla z minulé hodiny nebo po jiném žákovi, případně jsou v ní zapsané změny z lekcí 1–13. Obnovit – postup žáka zůstane."],
    ["V lekci 15 nejsou knihy po roce 1900.", "Někdo je smazal a zapsal. Nápověda → Obnovit původní knihovna.db."],
    ["V lekci 18 chybí tabulka hodnoceni.", "Zavřeno bez zápisu nebo jiný počítač. Panel lekce nabídne tlačítko Založit hodnoceni znovu."],
    ["V lekci 11 chyba UNIQUE.", "Kniha s id 11 tam je z minulého pokusu. Vrátit změny a spustit opravený příkaz znovu."],
    ["„already exists“ v lekci 17", "CREATE TABLE podruhé. CREATE z editoru smazat, nebo spustit jen INSERT přes Shift+F5."],
    ["„no such column“ u textu", "Chybí apostrofy kolem textu, nebo je místo nich ´ či uvozovky z Wordu – program nabídne Nahradit apostrofem."],
    ["Okno je na program úzké.", "Roztáhnout okno prohlížeče, nebo Přepnout na webovou podobu (lekce 1–13)."],
    ["Stránka se po F5 načetla znovu.", "F5 v editoru program chytá sám; F5 v adresním řádku nebo zavření karty ne. Nezapsané změny se pak ztratí – proto Zapsat změny."],
  ],
);

/* ───────── 12 ───────── */
N("Klávesové zkratky", 1);
T(
  [2600, 7038],
  [
    ["Zkratka", "Co udělá"],
    ["F5, Ctrl+Enter", "Spustí SQL v editoru (na kartě Prohlížet data F5 obnoví data)."],
    ["Shift+F5", "Spustí jen příkaz, ve kterém stojí kurzor."],
    ["Ctrl+S", "Zapíše změny do souboru."],
    ["Ctrl+O", "Otevře okno Otevřít databázi."],
    ["Esc", "Zavře otevřené okno (dialog)."],
    ["Dvojklik do buňky", "Na kartě Prohlížet data buňku přepíše; Enter potvrdí, Esc úpravu zruší."],
  ],
);

/* ───────── 13 ───────── */
N("Před první hodinou", 1);
P("Na jednom počítači v učebně pod žákovským účtem a na počítači u projektoru:");
K([
  "Otevři karelhlas.vercel.app/sql a spusť dotaz v lekci 1. SQL engine se stahuje z tohoto webu, záložně z cdn.jsdelivr.net.",
  "Splň úkol a přihlas se na jiném počítači v učebně. Když tam postup není, žáci si na konci hodiny zkopírují kód postupu do Teams a příště ho vloží v Moje výsledky → Pokračovat z kódu.",
  "Na školní klávesnici napiš ' * ; < > = a zjisti, kde je apostrof – ukaž to žákům. Znaky jdou i naklikat nad editorem.",
  "Vyzkoušej F5 v editoru (spustí dotaz, stránka se nenačte znovu), Ctrl+S a dvojklik do buňky na kartě Prohlížet data.",
  "Zapni Režim předvádění a zkus, jestli je písmo čitelné ze zadní lavice.",
]);

const doc = new d.Document({
  creator: "Karel Hlas",
  title: "Návod pro učitele – DB Browser",
  styles: S.styly,
  numbering: S.cislovani,
  sections: [{ properties: S.vlastnostiStrany, footers: S.zapati("Návod pro učitele – DB Browser"), children: o }],
});

d.Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(VYSTUP, b);
  console.log("zapsáno", VYSTUP, b.length, "bajtů");
});
