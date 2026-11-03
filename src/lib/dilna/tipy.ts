/**
 * „Kde je podle tebe chyba?“ Žák klikne na část schématu a dozví se, jestli to
 * sedí a jestli to má čím doložit. Správný tip bez důkazu je jen „možná“.
 * Tip není povinný: zakázka se počítá až podle opravy a jejího ověření.
 */

import { ROUTER, type Porucha } from "@/lib/win/sit";

export type CastSite = "pc" | "kabel" | "router" | "vedeni" | "internet";

/** Co žák v terminálu zjistil. Zapisuje se po každém příkazu. */
export type Dukaz = "ipconfig" | "ping-router" | "ping-adresa" | "ping-nazev" | "nslookup" | "tracert-adresa";

export interface VysledekTipu {
  spravne: boolean;
  text: string;
}

const LOKALNI_ZADNY = "Telefon přes Wi-Fi internet má a jde touhle cestou taky. Tady to nebude.";
const NEDOLOZENO = "Možná. Zatím to ale nemáš čím doložit. Podívej se, s jakými údaji počítač pracuje.";

/** Co žák po opravě a ověření čte v zeleném pruhu. */
export const VYSVETLENI: Record<Porucha, string> = {
  kabel: "Hotovo. Kabel od počítače nikam nevedl, proto ipconfig hlásil Médium odpojeno. Telefon jde přes Wi-Fi, a tak mu to nevadilo.",
  dhcp: "Hotovo. Router nerozdával adresy (server DHCP byl vypnutý), a tak si počítač dal sám adresu 169.254. S tou se nikam nedostane.",
  brana: "Hotovo. Počítač posílal obálky na bránu 192.168.1.254, kde žádná třídírna není. Telefon měl od routeru správné údaje automaticky, proto chodil.",
  wan: "Hotovo. Router běžel, ale kabel od poskytovatele nebyl v portu WAN. Obálky proto nemohly ven z domu, a to platilo pro všechna zařízení doma.",
  dns: "Hotovo. Cesta do internetu byla v pořádku, ale počítač se ptal na názvy serveru DNS, který v síti není. Telefonní seznam musí někdo zvednout.",
};

export function vyhodnotTip(porucha: Porucha, cast: CastSite, dukazy: string[]): VysledekTipu {
  const je = (d: Dukaz) => dukazy.includes(d);
  const spatne = (text: string): VysledekTipu => ({ spravne: false, text });
  switch (porucha) {
    case "kabel":
      if (cast === "kabel") {
        return je("ipconfig")
          ? { spravne: true, text: "Správně. ipconfig hlásí Médium odpojeno: z počítače kabel nikam nevede. Podívej se na router zezadu." }
          : spatne(NEDOLOZENO);
      }
      if (cast === "pc") {
        return spatne(je("ipconfig") ? "Počítač sám hlásí, že do něj nic nevede. Kde obálka končí ještě před routerem?" : "Zatím nevíš. Podívej se, co počítač o síti hlásí.");
      }
      if (cast === "router") return spatne("Telefon přes router na internet chodí. Router je v pořádku.");
      return spatne(LOKALNI_ZADNY);
    case "dhcp":
      if (cast === "router") {
        return je("ipconfig")
          ? { spravne: true, text: "Správně. Adresa 169.254 znamená, že počítači nikdo adresu nepřidělil. Doma je přiděluje router (server DHCP)." }
          : spatne(NEDOLOZENO);
      }
      if (!je("ipconfig")) return spatne("Zatím nevíš. Podívej se, jakou adresu počítač má.");
      if (cast === "pc") return spatne("Počítač si o adresu říká, jak má, jen mu nikdo žádnou nepřidělil. Kdo v domácí síti adresy rozdává?");
      if (cast === "kabel") return spatne("Kabel je v pořádku: ipconfig nehlásí Médium odpojeno.");
      return spatne("Počítač nemá platnou adresu ani v domácí síti. K přípojce se obálka vůbec nedostane.");
    case "brana":
      if (cast === "pc") {
        return je("ipconfig")
          ? { spravne: true, text: `Správně. Výchozí brána je 192.168.1.254, ale router má ${ROUTER}. Počítač nosí obálky do třídírny, která neexistuje. Oprav to v Nastavení počítače.` }
          : spatne(NEDOLOZENO);
      }
      if (cast === "kabel") {
        return spatne(je("ping-router") ? "Router na ping odpověděl, kabel tedy obálky přenáší. Hledej jinde." : "Zatím nevíš. Ověř, jestli se počítač dostane k routeru.");
      }
      if (cast === "router") {
        return spatne(je("ping-router") ? "Router odpovídá a telefon přes něj chodí na internet. Router je v pořádku." : "Telefon přes router na internet chodí. Ověř ještě, jestli router odpovídá i počítači.");
      }
      return spatne(LOKALNI_ZADNY);
    case "wan": {
      const doloženo = je("tracert-adresa") || (je("ping-router") && je("ping-adresa"));
      if (cast === "vedeni") {
        return doloženo
          ? { spravne: true, text: "Správně. Router odpovídá a dál se obálka nedostane. Přerušená je cesta od routeru ven. Podívej se na router zezadu." }
          : spatne("Možná. Doložit to zatím nemáš. Dojde obálka k routeru? A dál?");
      }
      if (cast === "pc") return spatne("Telefon nejde taky, a ten tenhle počítač nepotřebuje. Chyba bude na společné cestě.");
      if (cast === "kabel") return spatne("Telefon jde přes Wi-Fi, ne tímhle kabelem, a stejně nejde. Hledej na společné cestě.");
      if (cast === "router") {
        return spatne(je("ping-router") ? "Router odpovídá, takže běží. Kam ale obálky posílá dál?" : "Možné to je, telefon i počítač jdou přes něj. Ověř, jestli router odpovídá.");
      }
      return spatne("Že by spadl celý internet, je nepravděpodobné. Zjisti, kam až obálka dojde.");
    }
    case "dns": {
      const doloženo = je("nslookup") || je("ping-adresa");
      if (cast === "pc") {
        return doloženo
          ? { spravne: true, text: "Správně. Obálky na adresu projdou, ale telefonní seznam neodpovídá. Počítač má ručně nastavený server DNS, který v síti není. Oprav to v Nastavení počítače." }
          : spatne("Možná. Doložit to zatím nemáš. Zkus ping na adresu a ping na název.");
      }
      if (!je("ping-adresa")) return spatne("Zatím nevíš. Zkus ping na adresu, ne na název.");
      if (cast === "internet") return spatne("Server na adresu odpovídá. Problém je v tom, jak se název změní na adresu.");
      return spatne("Obálky na adresu v internetu projdou, tahle cesta tedy funguje.");
    }
  }
}
