/**
 * „Disk“ virtuálního DB Browseru: soubory .db uložené v prohlížeči.
 *
 * Zapsané změny musí přežít zavření databáze i nové načtení stránky, jinak by
 * lekce o Zapsat změny neměla co ukázat. Neuložené změny naopak žijí jen
 * v paměti programu – přesně jako u opravdového souboru na disku.
 */

export const KNIHOVNA = "knihovna.db";
/** Složka, kterou ukazuje titulek okna a dialog pro otevření souboru. */
export const SLOZKA = "C:\\Users\\zak\\Downloads";
/** Víc souborů si žák nepotřebuje založit; strop hlídá místo v prohlížeči. */
export const MAX_SOUBORU = 12;

const KLIC = "dbb-soubory";

export type Soubor = { bajty: Uint8Array; zmeneno: number };
export type Disk = Record<string, Soubor>;

export function naBase64(bajty: Uint8Array): string {
  let s = "";
  const KUS = 0x8000;
  for (let i = 0; i < bajty.length; i += KUS) {
    s += String.fromCharCode.apply(null, Array.prototype.slice.call(bajty, i, i + KUS) as number[]);
  }
  return btoa(s);
}

export function zBase64(text: string): Uint8Array {
  const s = atob(text);
  const bajty = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bajty[i] = s.charCodeAt(i);
  return bajty;
}

/** Načte disk z prohlížeče. Poškozený záznam přeskočí, ne celý disk. */
export function nactiDisk(): Disk {
  const disk: Disk = {};
  try {
    const raw = localStorage.getItem(KLIC);
    if (!raw) return disk;
    const data = JSON.parse(raw) as Record<string, { b: string; t: number }>;
    for (const nazev of Object.keys(data)) {
      try {
        disk[nazev] = { bajty: zBase64(data[nazev].b), zmeneno: data[nazev].t };
      } catch {
        /* jeden rozbitý soubor nesmí shodit ostatní */
      }
    }
  } catch {
    /* bez úložiště (anonymní okno) jede disk jen v paměti */
  }
  return disk;
}

/**
 * Uloží disk do prohlížeče. Vrací false, když se to nepovedlo (plné nebo
 * zakázané úložiště) – volající to musí žákovi říct, jinak by „Zapsat změny“
 * vypadalo jako úspěch a práce by se po zavření stránky ztratila.
 */
export function ulozDisk(disk: Disk): boolean {
  try {
    const data: Record<string, { b: string; t: number }> = {};
    for (const nazev of Object.keys(disk)) {
      data[nazev] = { b: naBase64(disk[nazev].bajty), t: disk[nazev].zmeneno };
    }
    localStorage.setItem(KLIC, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Název souboru, jak ho zadá žák: doplní .db a odmítne znaky, které Windows nedovolí. */
export function upravNazev(zadano: string): { nazev: string } | { chyba: string } {
  let n = zadano.trim();
  if (!n) return { chyba: "Napiš název souboru." };
  if (/[\\/:*?"<>|]/.test(n)) {
    return { chyba: "Název souboru nesmí obsahovat žádný z těchto znaků: \\ / : * ? \" < > |" };
  }
  if (!/\.(db|sqlite|sqlite3|db3)$/i.test(n)) n += ".db";
  if (n.length > 60) return { chyba: "Název je moc dlouhý." };
  return { nazev: n };
}

/** Velikost souboru, jak ji ukazuje dialog Windows („12 kB“). */
export function velikost(bajtu: number): string {
  return `${Math.max(1, Math.ceil(bajtu / 1024))} kB`;
}
