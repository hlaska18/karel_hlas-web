/**
 * Stránky prohlížeče v Síťové dílně. Mají adresy `.example` (vyhrazené pro
 * ukázky) a jejich servery adresy z ukázkových rozsahů v `win/sit.ts`.
 * Jestli se stránka otevře, záleží na nastavení sítě – tak jako doopravdy.
 */

import { DOMACI_WEBY, ROUTER, VEREJNA_ADRESA, diagnoza, jeIpv4, type SitStav } from "@/lib/win/sit";
import { styl, type Stranka } from "@/lib/win/web";

export const DOMOVSKA_SIT = "skola.example";

const odkazySit = `<p style="color:#666">Stránky v téhle dílně:
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
      <p>V dílně nejsi připojený k opravdovému internetu – existují jen tři stránky níže.</p>`);
  }
  return { titulek: stranka.titulek, html: stranka.telo, adresa: stranka.adresa };
}
