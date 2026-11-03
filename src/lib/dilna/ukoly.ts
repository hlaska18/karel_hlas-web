/**
 * Zakázky Síťové dílny (`/sitova-dilna`).
 *
 * Dřív to byly síťové úlohy v simulátoru Windows, Karel je 3. 11. 2026 vyndal
 * do vlastního prostředí. Id zůstala (`sit-…`), protože je nesou už odevzdané
 * kódy postupu WSIT1- a WIN1-. Kód WSIT1- zůstává kódem dílny.
 *
 * `kroky` jsou nápovědy po jedné. Počet otevřených zná jen žák, do kódu nejde.
 */

import { CIZI, DOMACI_WEBY, ROUTER, STITEK, sitFunguje, type Porucha, type Situace } from "@/lib/win/sit";
import type { StavDilny } from "./stav";

export type Zalozka = "terminal" | "nastaveni" | "router" | "prohlizec";

export interface Zakazka {
  id: string;
  skupina: string;
  nazev: string;
  popis: string;
  kroky: string[];
  /** Zakázka začíná poruchou, kterou spustí tlačítko. */
  porucha?: Porucha;
  /** Zakázka patří do scénáře, který začíná tlačítkem. */
  situace?: Situace;
  /** Kde se zakázka otevře. Bez údaje Terminál. */
  zalozka?: Zalozka;
  hotovo: (stav: StavDilny) => boolean;
}

export const SKUPINY_SIT = ["Jak je počítač připojený", "Nový router", "Poruchy", "Cizí zařízení ve Wi-Fi"] as const;

/** Úvod scénáře: co se stane po kliknutí na tlačítko. */
export const SITUACE: Record<Situace, { popis: string; tlacitko: string }> = {
  router: {
    popis: "Od poskytovatele přišel nový router. Je v krabici, nic není zapojené. Údaje k němu jsou na štítku.",
    tlacitko: "Vybalit nový router",
  },
  cizi: {
    popis: "Doma je pomalý internet. Wi-Fi má slabé heslo a v síti je zařízení, které nikdo z rodiny nezná.",
    tlacitko: "Začít: pomalý internet",
  },
};

const stopa = (s: StavDilny, co: string) => s.stopy.includes(co);
/** Úlohy scénáře se počítají až po jeho spuštění, výchozí síť je už zapojená. */
const vSituaci = (s: StavDilny, situace: Situace) => stopa(s, `situace:${situace}:spustena`);
const silneHeslo = (heslo: string) => heslo.length >= 12;
const dobreZabezpeceni = (s: StavDilny) =>
  s.sit.router.wifi.zabezpeceni === "wpa3" || s.sit.router.wifi.zabezpeceni === "wpa2-wpa3";

/** Porucha je hotová, když ji žák opravil a opravu ověřil, a síť pořád jede. */
const opraveno = (s: StavDilny, porucha: Porucha) => stopa(s, `porucha:${porucha}:overena`) && sitFunguje(s.sit);

export const UKOLY_SIT: Zakazka[] = [
  {
    id: "sit-ipconfig",
    skupina: "Jak je počítač připojený",
    nazev: "Zjisti adresu, bránu a DNS",
    popis: "Příkaz ipconfig /all vypíše, jakou adresu má počítač, přes který router jde do internetu a kdo mu překládá názvy webů.",
    kroky: [
      "Do Terminálu napiš ipconfig /all a zmáčkni Enter.",
      "Najdi řádek Adresa IPv4. To je adresa tohohle počítače v domácí síti.",
      "Výchozí brána je router: přes něj jdou všechna data do internetu.",
      "Servery DNS překládají názvy webů na adresy. Doma to obvykle dělá taky router.",
    ],
    hotovo: (s) => stopa(s, "prikaz:ipconfig-all"),
  },
  {
    id: "sit-ping-brana",
    skupina: "Jak je počítač připojený",
    nazev: "Ověř spojení s routerem",
    popis: "Příkaz ping pošle na adresu krátkou zprávu a čeká na odpověď. Zkus to s adresou výchozí brány.",
    kroky: [
      "Ve výpisu ipconfig najdi Výchozí brána.",
      `Napiš ping a tu adresu, tady ping ${ROUTER}, a zmáčkni Enter.`,
      "Čtyři řádky „Odpověď od…“ znamenají, že počítač s routerem mluví. Čas říká, jak dlouho cesta tam a zpátky trvala.",
    ],
    hotovo: (s) => stopa(s, "ping:brana:ok"),
  },
  {
    id: "sit-ping-internet",
    skupina: "Jak je počítač připojený",
    nazev: "Ověř spojení se serverem v internetu",
    popis: "Teď ping na server mimo domácí síť, třeba ping skola.example.",
    kroky: [
      "V Terminálu napiš ping skola.example a zmáčkni Enter.",
      "V hranatých závorkách je adresa, na kterou se název přeložil.",
      "Porovnej čas s pingem na router: do internetu je cesta delší.",
    ],
    hotovo: (s) => stopa(s, "ping:internet:ok"),
  },
  {
    id: "sit-nslookup",
    skupina: "Jak je počítač připojený",
    nazev: "Přelož název webu na adresu",
    popis: "Příkaz nslookup se zeptá serveru DNS, jaká adresa patří k názvu. Zkus nslookup skola.example.",
    kroky: [
      "V Terminálu napiš nslookup skola.example a zmáčkni Enter.",
      "Server a Address nahoře je server DNS, kterého se počítač ptal.",
      `Dole je odpověď: název a jeho adresa (${DOMACI_WEBY["skola.example"]}). Stejnou adresu ukázal ping v hranatých závorkách.`,
    ],
    hotovo: (s) => stopa(s, "nslookup:ok"),
  },
  {
    id: "sit-tracert",
    skupina: "Jak je počítač připojený",
    nazev: "Projdi cestu k serveru",
    popis: "Příkaz tracert vypíše routery, přes které data cestou k serveru projdou.",
    kroky: [
      "V Terminálu napiš tracert skola.example a zmáčkni Enter.",
      `První řádek je tvůj router (${ROUTER}), další jsou routery poskytovatele internetu.`,
      "Poslední řádek je samotný server.",
    ],
    hotovo: (s) => stopa(s, "tracert:ok"),
  },
  {
    id: "sit-verejna",
    skupina: "Jak je počítač připojený",
    nazev: "Porovnej vnitřní a veřejnou adresu",
    popis: "Otevři v záložce Prohlížeč stránku mojeip.example. Ukáže adresu, pod kterou tě vidí weby. Je stejná jako v ipconfig?",
    zalozka: "prohlizec",
    kroky: [
      "Do adresního řádku prohlížeče napiš mojeip.example a zmáčkni Enter.",
      "Porovnej adresu na stránce s Adresou IPv4 z ipconfig a přečti si, proč se liší.",
    ],
    hotovo: (s) => stopa(s, "web:mojeip.example"),
  },
  {
    id: "sit-router-zapoj",
    skupina: "Nový router",
    situace: "router",
    zalozka: "router",
    nazev: "Zapoj router",
    popis: "Nic není zapojené. Zapoj router tak, aby měl proud a internet. Kontrolky ti řeknou, jak na tom jsi.",
    kroky: [
      "Porty nemají stejný úkol. Jeden vede ven z domu, ostatní zůstávají doma.",
      "LAN je síť doma, WAN je všechno mimo dům.",
      "Kabel od poskytovatele přivádí internet zvenku.",
    ],
    hotovo: (s) => vSituaci(s, "router") && s.sit.kabely.napajeni && s.sit.kabely.wan,
  },
  {
    id: "sit-router-pc",
    skupina: "Nový router",
    situace: "router",
    zalozka: "router",
    nazev: "Připoj počítač a ověř adresu",
    popis: "Připoj počítač kabelem k routeru. Pak v Terminálu ověř, že od něj dostal adresu.",
    kroky: [
      "Počítač je doma. Který port vede k zařízením doma?",
      "V Terminálu napiš ipconfig.",
      `Adresa začínající 192.168.1. a Výchozí brána ${ROUTER} znamenají, že adresu přidělil router (DHCP).`,
      "Kdyby tam stálo Médium odpojeno, kabel nikam nevede.",
    ],
    hotovo: (s) => vSituaci(s, "router") && stopa(s, "overeno:ipconfig-adresa"),
  },
  {
    id: "sit-router-sprava",
    skupina: "Nový router",
    situace: "router",
    zalozka: "prohlizec",
    nazev: "Přihlas se do správy routeru",
    popis: `Router se nastavuje přes webovou stránku na své adrese. Otevři v Prohlížeči ${ROUTER} a přihlas se údaji ze štítku.`,
    kroky: [
      `Do adresního řádku prohlížeče napiš ${ROUTER}.`,
      "Uživatelské jméno a heslo jsou na štítku routeru (záložka Router zezadu).",
      "Správa routeru je vidět jen z domácí sítě. Z internetu se na ni nikdo nedostane.",
    ],
    hotovo: (s) => vSituaci(s, "router") && stopa(s, "overeno:router-prihlaseni"),
  },
  {
    id: "sit-router-heslo",
    skupina: "Nový router",
    situace: "router",
    zalozka: "prohlizec",
    nazev: "Změň heslo ke správě routeru",
    popis: "Heslo ze štítku si přečte každý, kdo vezme router do ruky, třeba návštěva. Nastav vlastní.",
    kroky: [
      "Ve správě routeru otevři Správa.",
      "Zadej nové heslo (aspoň 8 znaků) a ulož.",
      "Nové heslo si zapamatuj. Bez něj se do správy dostaneš jen obnovením továrního nastavení.",
    ],
    hotovo: (s) => vSituaci(s, "router") && s.sit.router.adminHeslo !== STITEK.adminHeslo && s.sit.router.adminHeslo.length >= 8,
  },
  {
    id: "sit-router-wifi",
    skupina: "Nový router",
    situace: "router",
    zalozka: "prohlizec",
    nazev: "Nastav Wi-Fi",
    popis: "Vlastní název sítě, zabezpečení WPA3 a heslo aspoň 12 znaků.",
    kroky: [
      "Ve správě routeru otevři Wi-Fi.",
      "Dej síti vlastní název. Nemusí prozrazovat, čí je (ne Novakovi-Tabor-12).",
      "Zabezpečení WPA3, nebo WPA2/WPA3, když doma máte i starší zařízení. Otevřená síť znamená, že se připojí kdokoli.",
      "Heslo aspoň 12 znaků. Delší heslo je silnější než krátké se speciálními znaky.",
    ],
    hotovo: (s) =>
      vSituaci(s, "router") &&
      s.sit.router.wifi.nazev !== STITEK.wifiNazev &&
      s.sit.router.wifi.heslo !== STITEK.wifiHeslo &&
      silneHeslo(s.sit.router.wifi.heslo) &&
      dobreZabezpeceni(s),
  },
  {
    id: "sit-porucha-kabel",
    skupina: "Poruchy",
    nazev: "Počítač nemá síť",
    popis: "„Počítač je úplně bez sítě. Telefon přes Wi-Fi jede.“ Najdi příčinu a oprav ji.",
    kroky: [
      "Začni příkazem ipconfig. Co stojí u adaptéru Ethernet místo adresy?",
      "Médium odpojeno znamená, že kabel nikam nevede. Podívej se na router: svítí kontrolka u některého portu LAN?",
      "V záložce Router zezadu zapoj kabel od počítače.",
    ],
    porucha: "kabel",
    hotovo: (s) => opraveno(s, "kabel"),
  },
  {
    id: "sit-porucha-dhcp",
    skupina: "Poruchy",
    nazev: "Počítač nedostal adresu",
    popis: "„Kabel je zapojený a stejně nic nejde.“ Najdi příčinu a oprav ji.",
    kroky: [
      "V ipconfig se podívej na adresu. Začíná 169.254?",
      "Adresu 169.254.x.x si počítač dá sám, když mu nikdo žádnou nepřidělil. Doma adresy přiděluje router (server DHCP).",
      `S adresou 169.254 se do správy routeru nedostaneš. Dej počítači v Nastavení dočasně ručně adresu mimo rozsah DHCP, třeba 192.168.1.200, masku 255.255.255.0 a bránu ${ROUTER}. Pak se přihlas do správy routeru, v části Síť LAN zapni server DHCP a v počítači vrať Automaticky (DHCP). Ruční adresa by jinak pomohla jen tomuhle počítači, ostatní zařízení doma by adresu pořád nedostala.`,
    ],
    porucha: "dhcp",
    hotovo: (s) => opraveno(s, "dhcp"),
  },
  {
    id: "sit-porucha-brana",
    skupina: "Poruchy",
    nazev: "Nejde internet",
    popis: "„Počítač na stole se na internet nedostane. Telefon přes Wi-Fi jede bez problému.“ Najdi příčinu a oprav ji.",
    kroky: [
      "Telefon jde přes stejný router a internet má. Co z cesty tím můžeš vyloučit?",
      "Zjisti, kam počítač posílá obálky určené mimo domácí síť. Hledej výchozí bránu.",
      "Výchozí bránu ukáže ipconfig. Adresu routeru máš ve schématu.",
    ],
    porucha: "brana",
    hotovo: (s) => opraveno(s, "brana"),
  },
  {
    id: "sit-porucha-wan",
    skupina: "Poruchy",
    nazev: "Router nemá internet",
    popis: "„Nejde internet nikomu doma, telefon taky ne.“ Zjisti, kde cesta končí, a oprav to.",
    kroky: [
      `Ping na router (${ROUTER}) projde? A ping ${DOMACI_WEBY["skola.example"]}?`,
      `Když router odpovídá a dál nic, je chyba mezi routerem a poskytovatelem. Zkus i tracert ${DOMACI_WEBY["skola.example"]}. Kde trasa skončí?`,
      "Podívej se na router zezadu a na kontrolku Internet.",
    ],
    porucha: "wan",
    hotovo: (s) => opraveno(s, "wan"),
  },
  {
    id: "sit-porucha-dns",
    skupina: "Poruchy",
    nazev: "Weby podle názvu nejdou",
    popis: "„Weby podle názvu nejdou.“ Najdi příčinu a oprav ji.",
    kroky: [
      `Zkus ping ${DOMACI_WEBY["skola.example"]} (adresa serveru skola.example) a pak ping skola.example. Co z toho projde?`,
      "Když projde adresa a název ne, internet funguje, ale nikdo nepřeloží název na adresu. Podívej se na Servery DNS v ipconfig /all.",
      "Oprav to v Nastavení počítače. Doma bývá správně Automaticky (DHCP).",
    ],
    porucha: "dns",
    hotovo: (s) => opraveno(s, "dns"),
  },
  {
    id: "sit-cizi-zablokuj",
    skupina: "Cizí zařízení ve Wi-Fi",
    situace: "cizi",
    zalozka: "prohlizec",
    nazev: "Najdi cizí zařízení a zablokuj ho",
    popis: "Ve správě routeru je seznam všeho, co je v síti připojené. Které zařízení k vám nepatří?",
    kroky: [
      `Přihlas se do správy routeru (${ROUTER}) a otevři Připojená zařízení. Údaje jsou na štítku.`,
      "Porovnej seznam s tím, co doma máte: tento počítač, telefon, televize.",
      "Cizí zařízení zablokuj. Pozor: blokování podle MAC adresy obejde každý, kdo si adresu změní, proto patří ke zablokování i nové heslo.",
    ],
    hotovo: (s) => vSituaci(s, "cizi") && s.sit.router.blokovane.includes(CIZI.mac),
  },
  {
    id: "sit-cizi-heslo",
    skupina: "Cizí zařízení ve Wi-Fi",
    situace: "cizi",
    zalozka: "prohlizec",
    nazev: "Změň heslo k Wi-Fi",
    popis: "Heslo 12345678 uhodne každý za pár vteřin. Nastav heslo aspoň 12 znaků a lepší zabezpečení.",
    kroky: [
      "Ve správě routeru otevři Wi-Fi.",
      "Heslo aspoň 12 znaků, zabezpečení WPA3 nebo WPA2/WPA3.",
      "Po změně hesla se odpojí všechna zařízení v domě a musí se připojit znovu s novým heslem. Cizí zařízení už heslo nezná.",
    ],
    hotovo: (s) =>
      vSituaci(s, "cizi") && s.sit.router.wifi.heslo !== "12345678" && silneHeslo(s.sit.router.wifi.heslo) && dobreZabezpeceni(s),
  },
  {
    id: "sit-cizi-wps",
    skupina: "Cizí zařízení ve Wi-Fi",
    situace: "cizi",
    zalozka: "prohlizec",
    nazev: "Vypni WPS",
    popis: "WPS připojí zařízení bez hesla, tlačítkem na routeru nebo osmimístným PINem. PIN se dá uhodnout.",
    kroky: ["Ve správě routeru otevři Wi-Fi.", "Vypni WPS a ulož. Zařízení se pak připojují jen heslem."],
    hotovo: (s) => vSituaci(s, "cizi") && s.sit.router.wps === false,
  },
  {
    id: "sit-cizi-host",
    skupina: "Cizí zařízení ve Wi-Fi",
    situace: "cizi",
    zalozka: "prohlizec",
    nazev: "Zřiď síť pro hosty",
    popis: "Návštěva dostane vlastní Wi-Fi s vlastním heslem. Do internetu se dostane, k vašim zařízením ne.",
    kroky: [
      "Ve správě routeru otevři Síť pro hosty.",
      "Zapni ji a nastav heslo (aspoň 8 znaků), jiné než od hlavní Wi-Fi.",
      "Heslo pro hosty můžeš klidně dát návštěvě. Heslo k hlavní síti zůstane jen rodině.",
    ],
    hotovo: (s) =>
      vSituaci(s, "cizi") && s.sit.router.host.zapnuto && s.sit.router.host.heslo.length >= 8 && s.sit.router.host.heslo !== s.sit.router.wifi.heslo,
  },
];

/** Ids zakázek, které jsou podle aktuálního stavu splněné. */
export function vyhodnotDilnu(stav: StavDilny): string[] {
  return UKOLY_SIT.filter((u) => {
    try {
      return u.hotovo(stav);
    } catch {
      return false;
    }
  }).map((u) => u.id);
}
