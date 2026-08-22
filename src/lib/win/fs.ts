/**
 * Virtuální souborový systém pro simulaci Windows 11.
 *
 * Celý disk je jeden strom v paměti. Všechny operace jsou čisté funkce, které
 * vracejí NOVÝ kořen – nikdy nemění ten původní. Díky tomu stačí v Reactu
 * porovnat referenci a je jasné, jestli se má překreslit, a zpětné kroky
 * (koš, „vrátit zpět") jsou jen otázkou podržení starého kořene.
 *
 * Jména se porovnávají bez ohledu na velikost písmen, protože tak se chová
 * i skutečný Windows: `Dokumenty` a `dokumenty` je tentýž soubor. Žáky to
 * potká hned první hodinu, kdy si dva soubory pojmenují stejně.
 */

export interface Soubor {
  druh: "soubor";
  jmeno: string;
  /** Text, nebo `data:` URL u obrázků. Ukázky bez obsahu mají jen `velikost`. */
  obsah: string;
  /** Deklarovaná velikost v bajtech u ukázek, které skutečný obsah nenesou. */
  velikost?: number;
  zmeneno: number;
  /** Systémová položka – nejde smazat ani přejmenovat. */
  zamceno?: boolean;
  /** Skrytý soubor. Průzkumník ho ukáže až po zapnutí „Skryté položky". */
  skryty?: boolean;
}

export interface Slozka {
  druh: "slozka";
  jmeno: string;
  deti: Uzel[];
  zmeneno: number;
  zamceno?: boolean;
  skryty?: boolean;
}

export type Uzel = Soubor | Slozka;

/** Písmeno systémového disku. Jinde v kódu se na něj nesahá napřímo. */
export const DISK = "C:";

/** Domovská složka přihlášeného žáka. */
export const DOMOV = [DISK, "Users", "Zak"];

export const jeSlozka = (u: Uzel): u is Slozka => u.druh === "slozka";
export const jeSoubor = (u: Uzel): u is Soubor => u.druh === "soubor";

/* ───────────────────────── Cesty ───────────────────────── */

/**
 * Rozloží zapsanou cestu na části. Bere zpětné i dopředné lomítko – žáci
 * píšou obojí a v terminálu je zbytečné je za to trestat.
 */
export function rozloz(cesta: string): string[] {
  return cesta
    .split(/[\\/]+/)
    .filter((c) => c.length > 0 && c !== ".");
}

/** Složí části zpět do windowsáckého tvaru `C:\Users\Zak`. */
export function sloz(casti: string[]): string {
  if (casti.length === 0) return DISK;
  // Kořen sám o sobě se píše `C:\`, hlouběji už bez koncového lomítka.
  return casti.length === 1 ? `${casti[0]}\\` : casti.join("\\");
}

/** Cesta o úroveň výš. U kořene vrací kořen – nahoru z `C:\` se nedá. */
export function nadrazena(casti: string[]): string[] {
  return casti.length <= 1 ? casti : casti.slice(0, -1);
}

/**
 * Vyřeší `..` a `.` a případnou relativní cestu proti aktuální složce.
 * Vrací `null`, když cesta vyleze nad kořen disku.
 */
export function vyres(aktualni: string[], zadano: string): string[] | null {
  const casti = rozloz(zadano);
  const absolutni = /^[a-z]:/i.test(zadano.trim());
  const zacatek = /^[\\/]/.test(zadano) ? [DISK] : aktualni;
  let cesta = absolutni ? [DISK] : [...zacatek];
  const zbytek = absolutni ? casti.slice(1) : casti;
  for (const cast of zbytek) {
    if (cast === "..") {
      if (cesta.length <= 1) return null;
      cesta = cesta.slice(0, -1);
    } else {
      cesta = [...cesta, cast];
    }
  }
  return cesta;
}

/* ───────────────────────── Jména ───────────────────────── */

const stejne = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Přípona bez tečky, malými písmeny. Složky a soubory bez tečky vrací "". */
export function pripona(jmeno: string): string {
  const tecka = jmeno.lastIndexOf(".");
  return tecka > 0 ? jmeno.slice(tecka + 1).toLowerCase() : "";
}

/** Jméno bez přípony. `Úkol.txt` → `Úkol`. */
export function zaklad(jmeno: string): string {
  const tecka = jmeno.lastIndexOf(".");
  return tecka > 0 ? jmeno.slice(0, tecka) : jmeno;
}

/** Znaky, které Windows v názvu nedovolí. Chybová hláška to cituje. */
export const ZAKAZANE_ZNAKY = '\\/:*?"<>|';

export function jmenoJeVporadku(jmeno: string): string | null {
  const oriznute = jmeno.trim();
  if (!oriznute) return "Zadejte název souboru.";
  if ([...oriznute].some((z) => ZAKAZANE_ZNAKY.includes(z))) {
    return `Název nesmí obsahovat žádný z těchto znaků: ${ZAKAZANE_ZNAKY.split("").join(" ")}`;
  }
  if (oriznute.endsWith(".") || oriznute.endsWith(" ")) {
    return "Název nesmí končit tečkou ani mezerou.";
  }
  return null;
}

/**
 * Najde volné jméno ve složce ve stylu Windows: `Nová složka`,
 * `Nová složka (2)`, `Nová složka (3)`…
 */
export function volneJmeno(slozka: Slozka, navrh: string): string {
  if (!slozka.deti.some((d) => stejne(d.jmeno, navrh))) return navrh;
  const zak = zaklad(navrh);
  const pri = pripona(navrh);
  const konec = pri ? `.${pri}` : "";
  for (let i = 2; i < 1000; i += 1) {
    const pokus = `${zak} (${i})${konec}`;
    if (!slozka.deti.some((d) => stejne(d.jmeno, pokus))) return pokus;
  }
  return `${zak} (${Date.now()})${konec}`;
}

/* ───────────────────────── Čtení stromu ───────────────────────── */

/** Vrátí uzel na cestě, nebo `null`. První část cesty je vždy disk. */
export function najdi(koren: Slozka, casti: string[]): Uzel | null {
  if (casti.length === 0) return null;
  if (!stejne(casti[0], koren.jmeno)) return null;
  let uzel: Uzel = koren;
  for (const cast of casti.slice(1)) {
    if (!jeSlozka(uzel)) return null;
    const dite: Uzel | undefined = uzel.deti.find((d) => stejne(d.jmeno, cast));
    if (!dite) return null;
    uzel = dite;
  }
  return uzel;
}

export function najdiSlozku(koren: Slozka, casti: string[]): Slozka | null {
  const uzel = najdi(koren, casti);
  return uzel && jeSlozka(uzel) ? uzel : null;
}

export function najdiSoubor(koren: Slozka, casti: string[]): Soubor | null {
  const uzel = najdi(koren, casti);
  return uzel && jeSoubor(uzel) ? uzel : null;
}

export const existuje = (koren: Slozka, casti: string[]): boolean =>
  najdi(koren, casti) !== null;

/** Velikost v bajtech. U složky součet celého podstromu. */
export function velikost(uzel: Uzel): number {
  if (jeSoubor(uzel)) {
    if (typeof uzel.velikost === "number") return uzel.velikost;
    // `data:` URL nese base64 – skutečná velikost je asi tři čtvrtiny řetězce.
    if (uzel.obsah.startsWith("data:")) {
      const data = uzel.obsah.slice(uzel.obsah.indexOf(",") + 1);
      return Math.round((data.length * 3) / 4);
    }
    return new TextEncoder().encode(uzel.obsah).length;
  }
  return uzel.deti.reduce((soucet, d) => soucet + velikost(d), 0);
}

/** Kolik souborů a složek celkem je uvnitř (rekurzivně). */
export function pocetPolozek(slozka: Slozka): { souboru: number; slozek: number } {
  let souboru = 0;
  let slozek = 0;
  for (const dite of slozka.deti) {
    if (jeSlozka(dite)) {
      slozek += 1;
      const vnitrek = pocetPolozek(dite);
      souboru += vnitrek.souboru;
      slozek += vnitrek.slozek;
    } else {
      souboru += 1;
    }
  }
  return { souboru, slozek };
}

/* ───────────────────────── Zápis do stromu ───────────────────────── */

/**
 * Nahradí složku na cestě výsledkem `uprava`. Vrací nový kořen; když cesta
 * neexistuje nebo nevede na složku, vrací původní kořen beze změny.
 */
export function uprav(
  koren: Slozka,
  casti: string[],
  uprava: (slozka: Slozka) => Slozka,
): Slozka {
  if (casti.length === 0 || !stejne(casti[0], koren.jmeno)) return koren;
  const projdi = (slozka: Slozka, zbytek: string[]): Slozka => {
    if (zbytek.length === 0) return uprava(slozka);
    const [prvni, ...dal] = zbytek;
    const index = slozka.deti.findIndex((d) => stejne(d.jmeno, prvni));
    if (index === -1) return slozka;
    const dite = slozka.deti[index];
    if (!jeSlozka(dite)) return slozka;
    const deti = [...slozka.deti];
    deti[index] = projdi(dite, dal);
    return { ...slozka, deti };
  };
  return projdi(koren, casti.slice(1));
}

/** Vloží (nebo přepíše) položku do složky na cestě. */
export function vloz(koren: Slozka, kam: string[], uzel: Uzel): Slozka {
  return uprav(koren, kam, (slozka) => {
    const index = slozka.deti.findIndex((d) => stejne(d.jmeno, uzel.jmeno));
    const deti = [...slozka.deti];
    if (index === -1) deti.push(uzel);
    else deti[index] = uzel;
    return { ...slozka, deti, zmeneno: Date.now() };
  });
}

/** Odebere položku na cestě. Kořen ani zamčené položky nezmizí. */
export function odeber(koren: Slozka, cesta: string[]): Slozka {
  if (cesta.length <= 1) return koren;
  const jmeno = cesta[cesta.length - 1];
  return uprav(koren, nadrazena(cesta), (slozka) => ({
    ...slozka,
    deti: slozka.deti.filter((d) => !stejne(d.jmeno, jmeno)),
    zmeneno: Date.now(),
  }));
}

export function novaSlozka(jmeno: string): Slozka {
  return { druh: "slozka", jmeno, deti: [], zmeneno: Date.now() };
}

export function novySoubor(jmeno: string, obsah = ""): Soubor {
  return { druh: "soubor", jmeno, obsah, zmeneno: Date.now() };
}

/** Přejmenuje položku. Vrací nový kořen, nebo `null` při kolizi jmen. */
export function prejmenuj(
  koren: Slozka,
  cesta: string[],
  noveJmeno: string,
): Slozka | null {
  const uzel = najdi(koren, cesta);
  if (!uzel || uzel.zamceno) return null;
  const rodic = najdiSlozku(koren, nadrazena(cesta));
  if (!rodic) return null;
  const kolize = rodic.deti.some(
    (d) => stejne(d.jmeno, noveJmeno) && !stejne(d.jmeno, uzel.jmeno),
  );
  if (kolize) return null;
  const bezStareho = odeber(koren, cesta);
  return vloz(bezStareho, nadrazena(cesta), {
    ...uzel,
    jmeno: noveJmeno,
    zmeneno: Date.now(),
  });
}

/** Hluboká kopie uzlu (nové reference, aby se originál nezměnil zpětně). */
export function kopie(uzel: Uzel): Uzel {
  return jeSlozka(uzel)
    ? { ...uzel, deti: uzel.deti.map(kopie), zamceno: false }
    : { ...uzel, zamceno: false };
}

/** Je `cil` uvnitř `zdroj`? Brání přesunu složky do sebe sama. */
export function jeUvnitr(zdroj: string[], cil: string[]): boolean {
  if (cil.length < zdroj.length) return false;
  return zdroj.every((cast, i) => stejne(cast, cil[i]));
}
