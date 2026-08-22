/**
 * Obsah „internetu" ve výukovém prostředí.
 *
 * Prohlížeč nikam ven nesahá – všechny stránky jsou tady. Adresy jsou
 * schválně smyšlené (`skola.local`, `ucebnice.local`): žádná z nich se netváří
 * jako web skutečné organizace a nikdo si je nespletl se skutečnou stránkou.
 *
 * Stránky nejsou výplň. Každá dělá něco, co se v hodině hodí: intranet ukazuje
 * odkazy, učebnice nese text k přečtení, stahování opravdu položí soubor do
 * složky Stažené soubory a chybová stránka učí číst hlášku místo panikaření.
 */

export interface Stranka {
  adresa: string;
  titulek: string;
  /** Zjednodušené HTML – vykresluje se v odděleném rámu bez skriptů. */
  telo: string;
  /** Soubor, který stránka nabízí ke stažení. */
  kestazeni?: { jmeno: string; obsah: string; velikost?: number };
}

const styl = `
  <style>
    body { font-family: "Segoe UI", system-ui, sans-serif; margin: 0; color: #1a1a1a; background: #fff; }
    main { max-width: 720px; margin: 0 auto; padding: 32px 24px 64px; line-height: 1.65; }
    h1 { font-size: 30px; margin: 0 0 8px; letter-spacing: -0.02em; }
    h2 { font-size: 20px; margin: 28px 0 8px; }
    p { margin: 0 0 14px; }
    a { color: #0067c0; }
    ul { margin: 0 0 14px; padding-left: 22px; }
    li { margin-bottom: 6px; }
    .hlavicka { background: #0f4c81; color: #fff; padding: 22px 24px; }
    .hlavicka h1 { color: #fff; }
    .hlavicka p { margin: 0; opacity: 0.85; }
    .karta { border: 1px solid #e3e3e3; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .stitek { display: inline-block; background: #eef4fb; color: #0f4c81; border-radius: 999px;
              padding: 2px 10px; font-size: 12px; margin-bottom: 8px; }
    code { background: #f2f2f2; border-radius: 4px; padding: 1px 5px; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
    th, td { border: 1px solid #e3e3e3; padding: 8px 10px; text-align: left; font-size: 14px; }
    th { background: #f7f7f7; }
  </style>
`;

export const DOMOVSKA = "skola.local";

export const STRANKY: Stranka[] = [
  {
    adresa: "skola.local",
    titulek: "Školní intranet",
    telo: `${styl}
      <div class="hlavicka">
        <h1>Školní intranet</h1>
        <p>Vnitřní síť učebny — dostupné jen z počítačů ve škole</p>
      </div>
      <main>
        <p>Vítej. Tohle je ukázkový vnitřní web, který běží jen ve výukovém
        prostředí. Odkazy níž vedou na další stránky, které v něm existují.</p>
        <div class="karta">
          <span class="stitek">Učebnice</span>
          <h2 style="margin-top:0"><a href="ucebnice.local">Jak počítač ukládá soubory</a></h2>
          <p>Cesta, přípona, velikost a co z toho platí a co je jen domněnka.</p>
        </div>
        <div class="karta">
          <span class="stitek">Ke stažení</span>
          <h2 style="margin-top:0"><a href="stahovani.local">Materiály ke stažení</a></h2>
          <p>Vyzkoušej si, kam se stažený soubor v počítači uloží.</p>
        </div>
        <div class="karta">
          <span class="stitek">Zkouška</span>
          <h2 style="margin-top:0"><a href="neexistuje.local">Rozbitý odkaz</a></h2>
          <p>Schválně nefunguje. Podívej se, co prohlížeč hlásí.</p>
        </div>
      </main>`,
  },
  {
    adresa: "ucebnice.local",
    titulek: "Jak počítač ukládá soubory",
    telo: `${styl}
      <main>
        <h1>Jak počítač ukládá soubory</h1>
        <p>Soubor je pojmenovaný kus dat na disku. Všechno ostatní — ikona,
        náhled, to, že se po dvojkliku něco otevře — jsou nadstavby, které
        přidává Windows.</p>

        <h2>Cesta</h2>
        <p>Cesta říká, kde soubor leží. Absolutní cesta začíná písmenem disku
        a popisuje celou trasu:</p>
        <p><code>C:\\Users\\Zak\\Documents\\Referat.txt</code></p>
        <p>Relativní cesta se počítá od místa, kde právě jsi. Když stojíš
        v <code>C:\\Users\\Zak</code>, znamená <code>Documents\\Referat.txt</code>
        tentýž soubor.</p>

        <h2>Přípona</h2>
        <p>Přípona je jen konec názvu za poslední tečkou. Neurčuje, co je uvnitř
        souboru — určuje, kterou aplikaci Windows zkusí zavolat. Když příponu
        změníš, obsah zůstane úplně stejný. Změní se jen ta domněnka.</p>

        <h2>Velikost</h2>
        <table>
          <tr><th>Jednotka</th><th>Průzkumník</th><th>Výrobce disku</th></tr>
          <tr><td>1 kB</td><td>1 024 B</td><td>1 000 B</td></tr>
          <tr><td>1 MB</td><td>1 048 576 B</td><td>1 000 000 B</td></tr>
          <tr><td>1 GB</td><td>1 073 741 824 B</td><td>1 000 000 000 B</td></tr>
        </table>
        <p>Proto se u disku s nápisem 1 TB po připojení objeví jen asi 931 GB.
        Není to podvod ani chyba — jsou to dvě různé definice téhož slova.</p>

        <p><a href="skola.local">← Zpět na intranet</a></p>
      </main>`,
  },
  {
    adresa: "stahovani.local",
    titulek: "Materiály ke stažení",
    telo: `${styl}
      <main>
        <h1>Materiály ke stažení</h1>
        <p>Klikni na tlačítko v prohlížeči nad stránkou. Soubor se uloží do
        složky <code>C:\\Users\\Zak\\Downloads</code>, které Průzkumník říká
        Stažené soubory.</p>
        <div class="karta">
          <span class="stitek">Textový soubor</span>
          <h2 style="margin-top:0">Pracovní list — soustavy.txt</h2>
          <p>Pár úloh na převody mezi dvojkovou, desítkovou a šestnáctkovou
          soustavou. Otevřeš ho Poznámkovým blokem.</p>
        </div>
        <p><a href="skola.local">← Zpět na intranet</a></p>
      </main>`,
    kestazeni: {
      jmeno: "Pracovní list - soustavy.txt",
      obsah: `PRACOVNÍ LIST — ČÍSELNÉ SOUSTAVY

Převeď do dvojkové soustavy:
  a) 13     b) 25     c) 64     d) 100

Převeď do desítkové soustavy:
  a) 1011   b) 11001  c) 100000 d) 1111111

Převeď do šestnáctkové soustavy:
  a) 26     b) 255    c) 4096

Kontrola: použij Kalkulačku v programátorském režimu.
Zadej číslo v režimu DEC a přečti si řádek BIN a HEX.
`,
    },
  },
];

export const najdiStranku = (adresa: string): Stranka | null => {
  const cista = adresa.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return STRANKY.find((s) => s.adresa === cista) ?? null;
};

/** Stránka, kterou prohlížeč ukáže místo neexistující adresy. */
export function chybovaStranka(adresa: string): string {
  return `${styl}
    <main>
      <h1>Tato stránka není dostupná</h1>
      <p>Adresu <code>${adresa.replace(/[<>&]/g, "")}</code> se nepodařilo najít.</p>
      <p>Ve výukovém prostředí nejsi připojený k opravdovému internetu —
      existují jen stránky ve vnitřní síti. Zkus <a href="skola.local">skola.local</a>.</p>
      <p style="color:#666">ERR_NAME_NOT_RESOLVED</p>
    </main>`;
}

/** Náhled dokumentu PDF – prohlížeč je ve Windows 11 výchozí čtečkou PDF. */
export function nahledPdf(jmeno: string): string {
  return `${styl}
    <main>
      <div class="karta" style="text-align:center; padding:48px 24px">
        <h1 style="font-size:22px">${jmeno.replace(/[<>&]/g, "")}</h1>
        <p style="color:#666">Dokument PDF · 1 strana</p>
        <p>Ve výukovém prostředí se obsah PDF nevykresluje. Podstatné je,
        že PDF otevírá prohlížeč — ve Windows 11 je výchozí čtečkou PDF
        právě Microsoft Edge, ne zvláštní program.</p>
      </div>
    </main>`;
}
