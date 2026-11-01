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

import { DOMACI_WEBY, ROUTER, VEREJNA_ADRESA, diagnoza, jeIpv4, type SitStav } from "./sit";

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

/* ───────────────────── Cvičení „Síť a poruchy“ ─────────────────────
   Domácí počítač z `?scenar=sit`. Stránky mají adresy `.example` (vyhrazené
   pro ukázky) a jejich servery adresy z ukázkových rozsahů v `sit.ts`.
   Jestli se stránka otevře, záleží na nastavení sítě – tak jako doopravdy. */

export const DOMOVSKA_SIT = "skola.example";

const odkazySit = `<p style="color:#666">Stránky v tomhle cvičení:
  <a href="skola.example">skola.example</a> · <a href="zpravy.example">zpravy.example</a> ·
  <a href="mojeip.example">mojeip.example</a></p>`;

export const STRANKY_SIT: Stranka[] = [
  {
    adresa: "skola.example",
    titulek: "Ukázková škola",
    telo: `${styl}
      <div class="hlavicka">
        <h1>Ukázková škola</h1>
        <p>Web školy na serveru v internetu (${DOMACI_WEBY["skola.example"]})</p>
      </div>
      <main>
        <p>Když vidíš tuhle stránku, počítač se dostal až na server v internetu:
        název se přeložil na adresu (DNS) a data prošla přes router (výchozí bránu).</p>
        <div class="karta">
          <span class="stitek">Zkus</span>
          <p>Otevři <a href="mojeip.example">mojeip.example</a> a porovnej adresu s tím,
          co vypíše <code>ipconfig</code>.</p>
        </div>
        ${odkazySit}
      </main>`,
  },
  {
    adresa: "zpravy.example",
    titulek: "Zprávy",
    telo: `${styl}
      <main>
        <h1>Zprávy</h1>
        <p>Ukázkový zpravodajský web. Leží na jiném serveru než web školy
        (${DOMACI_WEBY["zpravy.example"]}), cesta k němu ale vede přes stejný router.</p>
        ${odkazySit}
      </main>`,
  },
  {
    adresa: "mojeip.example",
    titulek: "Moje IP adresa",
    telo: `${styl}
      <main>
        <h1>Tvoje veřejná adresa je ${VEREJNA_ADRESA}</h1>
        <p>Tuhle adresu vidí servery v internetu. Příkaz <code>ipconfig</code> ti ale ukáže
        jinou: <code>192.168.1.23</code>. Proč?</p>
        <h2>Vnitřní a veřejná adresa</h2>
        <p>Adresy <code>192.168.x.x</code> jsou vnitřní. Stejné má doma skoro každý
        a v internetu se nepoužívají. Router proto posílá data všech zařízení z domácnosti
        pod jednou veřejnou adresou a pamatuje si, která odpověď patří kterému zařízení.
        Tomu se říká překlad adres (NAT).</p>
        <p>Někteří poskytovatelé jdou ještě dál a jednu veřejnou adresu sdílí víc
        domácností najednou (CGNAT). Pak ani tahle adresa nepatří jen vám.</p>
        <p style="color:#666">Zjednodušeno. Adresa na téhle stránce je z rozsahu vyhrazeného pro ukázky.</p>
        ${odkazySit}
      </main>`,
  },
];

const bezZnacek = (text: string) => text.replace(/[<>&"]/g, "");

/**
 * Stránka v domácí síti: otevře se, jen když to nastavení sítě dovolí.
 * Server jde otevřít i přímo adresou (`203.0.113.10`) – to se hodí při
 * poruše DNS, kdy název nefunguje, ale cesta do internetu ano.
 */
export function strankaSit(
  adresa: string,
  sit: SitStav,
): { titulek: string; html: string; adresa: string | null; router?: true } {
  const cista = adresa.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const d = diagnoza(sit);
  // Správa routeru: interaktivní stránka (`SpravaRouteru.tsx`), dostupná jen z domácí sítě.
  if (cista === ROUTER) {
    if (d.lan) return { titulek: "Správa routeru", html: "", adresa: null, router: true };
    return {
      titulek: "Stránka není dostupná",
      adresa: null,
      html: `${styl}<main><h1>Tato stránka není dostupná</h1>
        <p>Počítač se k routeru <code>${ROUTER}</code> nedostal.</p>
        <p>Vede od počítače kabel do zapnutého routeru? Má počítač adresu z domácí sítě? Pomůže <code>ipconfig</code>.</p>
        <p style="color:#666">Zjednodušeno – skutečný prohlížeč tu ukáže kód chyby.</p></main>`,
    };
  }
  const jeAdresa = jeIpv4(cista);
  const nazev = jeAdresa ? Object.keys(DOMACI_WEBY).find((n) => DOMACI_WEBY[n] === cista) : cista;
  const stranka = STRANKY_SIT.find((s) => s.adresa === nazev);
  const chyba = (radky: string) => ({
    titulek: "Stránka není dostupná",
    adresa: null,
    html: `${styl}<main><h1>Tato stránka není dostupná</h1>${radky}${odkazySit}</main>`,
  });

  if (!d.internet) {
    return chyba(`<p>Počítač se k serveru <code>${bezZnacek(cista)}</code> nedostal. Data
      z domácí sítě nemají kudy odejít do internetu.</p>
      <p>Zkontroluj připojení. V Terminálu pomůže <code>ipconfig</code> a <code>ping</code>.</p>
      <p style="color:#666">Zjednodušeno – skutečný prohlížeč tu ukáže kód chyby.</p>`);
  }
  if (!jeAdresa && !d.dns) {
    return chyba(`<p>Adresu serveru <code>${bezZnacek(cista)}</code> se nepodařilo najít.</p>
      <p>Počítači nikdo nepřeložil název na adresu. V Terminálu pomůže <code>nslookup</code>.</p>
      <p style="color:#666">ERR_NAME_NOT_RESOLVED</p>`);
  }
  if (!stranka) {
    return chyba(`<p>Adresu <code>${bezZnacek(cista)}</code> se nepodařilo najít.</p>
      <p>Ve cvičení nejsi připojený k opravdovému internetu – existují jen tři stránky níže.</p>`);
  }
  return { titulek: stranka.titulek, html: stranka.telo, adresa: stranka.adresa };
}
