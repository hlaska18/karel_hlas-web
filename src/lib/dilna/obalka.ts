/**
 * Kudy jde obálka ve schématu a co k tomu říct.
 *
 * Musí sedět s tím, co vypíšou příkazy v `win/sit.ts` (hlídá `dilna.test.ts`):
 * obálka nesmí dojít na server, když ping skončil chybou.
 */

import { MAC_PC, ROUTER, diagnoza, jeIpv4, soukroma, ucinne, type SitStav } from "@/lib/win/sit";

export type Zastavka = "pc" | "pul" | "router" | "net";

export interface CestaObalky {
  /** Zastávky za počítačem. Prázdné = obálka z počítače vůbec nevyšla. */
  zastavky: Zastavka[];
  /** Cesta skončila neúspěchem: poslední dva úseky jsou červené. */
  selhala: boolean;
  /** Věta do pruhu pod schématem. Popisuje cestu, opravu neprozrazuje. */
  zprava: string;
}

const TAM_A_ZPET_ROUTER: Zastavka[] = ["pul", "router", "pul", "pc"];
const NEDOSLA: Zastavka[] = ["pul", "pc"];
const NA_SERVER: Zastavka[] = ["pul", "router", "net", "router", "pul", "pc"];

const NEVYSLA: CestaObalky = {
  zastavky: [],
  selhala: true,
  zprava: "Obálka z počítače vůbec nevyšla. Co k tomu říká ipconfig?",
};

function cestaNaAdresu(sit: SitStav, ip: string): CestaObalky {
  const d = diagnoza(sit);
  const u = ucinne(sit);
  if (ip === "127.0.0.1" || ip === u.adresa) {
    return { zastavky: [], selhala: false, zprava: "Tohle je adresa tohohle počítače. Obálka nikam neodešla." };
  }
  if (!d.lan) return NEVYSLA;
  if (/^192\.168\.1\.\d+$/.test(ip)) {
    const je = ip === ROUTER || sit.router.zarizeni.some((z) => z.adresa === ip && z.mac !== MAC_PC && !sit.router.blokovane.includes(z.mac));
    return je
      ? {
          zastavky: TAM_A_ZPET_ROUTER,
          selhala: false,
          zprava: ip === ROUTER ? "Obálka došla k routeru a zpátky. Až k routeru je cesta v pořádku." : "Obálka došla přes router k zařízení a zpátky.",
        }
      : { zastavky: NEDOSLA, selhala: true, zprava: `Na adrese ${ip} obálku nikdo nepřevzal. V domácí síti tam nic není.` };
  }
  if (u.brana !== ROUTER) {
    return { zastavky: NEDOSLA, selhala: true, zprava: "Obálka se vrátila k počítači: cestou do internetu ji nikdo nepřevzal." };
  }
  if (!d.wan) {
    return { zastavky: TAM_A_ZPET_ROUTER, selhala: true, zprava: "Router obálku převzal, ale dál ji nedostal." };
  }
  if (soukroma(ip)) {
    return { zastavky: TAM_A_ZPET_ROUTER, selhala: true, zprava: "Router obálku poslal dál, ale nikdo neodpověděl. Tahle adresa v internetu neexistuje." };
  }
  return { zastavky: NA_SERVER, selhala: false, zprava: "Obálka došla na server a zpátky." };
}

/** Dotaz do telefonního seznamu: k serveru DNS a zpátky. */
function cestaKDns(sit: SitStav, nasel: boolean): CestaObalky {
  const d = diagnoza(sit);
  const u = ucinne(sit);
  if (!d.lan) return NEVYSLA;
  if (d.dns) {
    return {
      zastavky: u.dns === ROUTER ? TAM_A_ZPET_ROUTER : NA_SERVER,
      selhala: !nasel,
      zprava: nasel ? "Telefonní seznam odpověděl. Název se přeložil na adresu." : "Telefonní seznam odpověděl, ale takový název nezná.",
    };
  }
  const zprava = "Telefonní seznam neodpověděl. Název se na adresu nepřeložil.";
  // Router názvy jen předává dál: bez spojení s poskytovatelem nepomůže.
  if (u.dns === ROUTER) return { zastavky: TAM_A_ZPET_ROUTER, selhala: true, zprava };
  return { zastavky: NEDOSLA, selhala: true, zprava };
}

/**
 * Cesta obálky pro `ping`, `tracert` a `nslookup`. Přeložený cíl se čte přímo
 * z výpisu příkazu, takže se obojí nemůže rozejít. Vrací `null`, když se nic
 * neposílá (žádný cíl nebo jiný příkaz).
 */
export function cestaObalky(sit: SitStav, prikaz: string, kam: string | undefined, vystup: string[]): CestaObalky | null {
  if (!kam) return null;
  if (prikaz === "nslookup") return cestaKDns(sit, vystup.some((r) => r.startsWith("Název:")));
  if (prikaz !== "ping" && prikaz !== "tracert") return null;
  if (jeIpv4(kam)) return cestaNaAdresu(sit, kam);
  const adresa = vystup.join("\n").match(/\[(\d+\.\d+\.\d+\.\d+)\]/);
  return adresa ? cestaNaAdresu(sit, adresa[1]) : cestaKDns(sit, false);
}
