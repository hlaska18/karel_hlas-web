/**
 * Spouštění SQL ve virtuálním DB Browseru.
 *
 * Skutečný DB Browser pouští obsah editoru příkaz po příkazu: ukáže výsledek
 * posledního, který něco vrátil, a do zprávy napíše, na kterém řádku skončil.
 * Kvůli tomu tu text dělíme na příkazy sami – středník uvnitř textu
 * v apostrofech ani v komentáři příkaz nekončí.
 */

import type { SqlDbSoubor, SqlResult } from "@/lib/sqljs";

export type Prikaz = {
  /** Text příkazu bez úvodních mezer a komentářů. */
  text: string;
  /** Řádek editoru (od 1), na kterém příkaz začíná. */
  radek: number;
  /** Pozice začátku a konce v původním textu (konec je za středníkem). */
  od: number;
  do: number;
};

/** Rozdělí text editoru na příkazy. Prázdné kusy (jen komentář) vynechá. */
export function rozdelPrikazy(text: string): Prikaz[] {
  const vysledek: Prikaz[] = [];
  let zacatek = 0;
  let i = 0;
  const n = text.length;

  const pridej = (konec: number) => {
    const kus = text.slice(zacatek, konec);
    const bezUvodu = odstranUvod(kus);
    if (bezUvodu.trim() && bezUvodu.trim() !== ";") {
      const posun = zacatek + (kus.length - bezUvodu.length);
      vysledek.push({
        text: bezUvodu.trim(),
        radek: text.slice(0, posun).split("\n").length,
        od: posun,
        do: konec,
      });
    }
    zacatek = konec;
  };

  while (i < n) {
    const c = text[i];
    const dalsi = text[i + 1];
    if (c === "-" && dalsi === "-") {
      const konec = text.indexOf("\n", i);
      i = konec === -1 ? n : konec + 1;
    } else if (c === "/" && dalsi === "*") {
      const konec = text.indexOf("*/", i + 2);
      i = konec === -1 ? n : konec + 2;
    } else if (c === "'" || c === '"' || c === "`") {
      // Zdvojená uvozovka uvnitř textu ('Rock''n''roll') text nekončí.
      let j = i + 1;
      while (j < n) {
        if (text[j] === c) {
          if (text[j + 1] === c) j += 2;
          else break;
        } else j++;
      }
      i = j + 1;
    } else if (c === "[") {
      const konec = text.indexOf("]", i + 1);
      i = konec === -1 ? n : konec + 1;
    } else if (c === ";") {
      i++;
      pridej(i);
    } else {
      i++;
    }
  }
  pridej(n);
  return vysledek;
}

/** Odstraní z kusu textu úvodní mezery a komentáře. */
function odstranUvod(kus: string): string {
  let s = kus;
  for (;;) {
    const orez = s.replace(/^\s+/, "");
    if (orez.startsWith("--")) {
      const konec = orez.indexOf("\n");
      s = konec === -1 ? "" : orez.slice(konec + 1);
    } else if (orez.startsWith("/*")) {
      const konec = orez.indexOf("*/");
      s = konec === -1 ? "" : orez.slice(konec + 2);
    } else {
      return orez;
    }
  }
}

export type DruhPrikazu = "cteni" | "data" | "struktura" | "transakce" | "jiny";

/** Co příkaz dělá – podle prvního slova. */
export function druhPrikazu(text: string): DruhPrikazu {
  const slovo = (text.match(/^[A-Za-z]+/) || [""])[0].toUpperCase();
  if (["SELECT", "WITH", "VALUES", "PRAGMA", "EXPLAIN"].indexOf(slovo) !== -1) return "cteni";
  if (["INSERT", "UPDATE", "DELETE", "REPLACE"].indexOf(slovo) !== -1) return "data";
  if (["CREATE", "DROP", "ALTER"].indexOf(slovo) !== -1) return "struktura";
  if (["BEGIN", "COMMIT", "END", "ROLLBACK", "SAVEPOINT", "RELEASE", "VACUUM", "ATTACH", "DETACH"].indexOf(slovo) !== -1) {
    return "transakce";
  }
  return "jiny";
}

/** Příkaz, ve kterém stojí kurzor (pro „Spustit aktuální řádek“). */
export function prikazNaPozici(prikazy: Prikaz[], pozice: number): Prikaz | null {
  for (const p of prikazy) {
    if (pozice >= p.od - 1 && pozice <= p.do) return p;
  }
  // Kurzor za posledním středníkem na prázdném řádku – vezmi poslední příkaz.
  return prikazy.length ? prikazy[prikazy.length - 1] : null;
}

export type Beh = {
  ok: boolean;
  /** Výsledek posledního příkazu, který vracel řádky (i prázdný, se sloupci). */
  vysledek: SqlResult | null;
  /** Příkaz, na kterém běh skončil – úspěšně poslední, nebo ten s chybou. */
  posledni: Prikaz | null;
  /** Kolik řádků změnil poslední měnící příkaz. */
  zmenenoRadku: number;
  /** Změnil některý příkaz data nebo strukturu? (pak je co zapisovat) */
  zmenil: boolean;
  /** Úspěšně provedené příkazy, v pořadí. */
  provedene: Prikaz[];
  ms: number;
  /** Anglická hláška SQLite, když běh spadl. */
  chyba?: string;
  /** Příkaz, který DB Browser sám neprovede (transakce řídí on). */
  zakazano?: boolean;
};

/**
 * Provede příkazy jeden po druhém. Při chybě skončí – stejně jako DB Browser –
 * a co proběhlo před ní, v databázi zůstává.
 */
export function spust(db: SqlDbSoubor, prikazy: Prikaz[]): Beh {
  const beh: Beh = {
    ok: true,
    vysledek: null,
    posledni: null,
    zmenenoRadku: 0,
    zmenil: false,
    provedene: [],
    ms: 0,
  };
  const t0 = Date.now();
  for (const p of prikazy) {
    beh.posledni = p;
    const druh = druhPrikazu(p.text);
    if (druh === "transakce") {
      beh.ok = false;
      beh.zakazano = true;
      break;
    }
    try {
      const st = db.prepare(p.text);
      try {
        const sloupce = st.getColumnNames();
        const radky: unknown[][] = [];
        while (st.step()) radky.push(st.get());
        if (sloupce.length) beh.vysledek = { columns: sloupce, values: radky };
      } finally {
        st.free();
      }
      if (druh === "data") {
        beh.zmenenoRadku = db.getRowsModified();
        if (beh.zmenenoRadku > 0) beh.zmenil = true;
      } else if (druh === "struktura") {
        beh.zmenil = true;
      }
      beh.provedene.push(p);
    } catch (e) {
      beh.ok = false;
      beh.chyba = e instanceof Error ? e.message : String(e);
      break;
    }
  }
  beh.ms = Date.now() - t0;
  return beh;
}

/** „1 řádek vrácen“, „3 řádky vráceny“, „10 řádků vráceno“ – shoda jako v češtině. */
export function pocetRadku(n: number, sloveso: "vrácen" | "ovlivněn"): string {
  if (n === 1) return `1 řádek ${sloveso}`;
  if (n >= 2 && n <= 4) return `${n} řádky ${sloveso}y`;
  return `${n} řádků ${sloveso}o`;
}

/** Názvy tabulek v otevřené databázi, podle abecedy (bez interních sqlite_). */
export function tabulky(db: SqlDbSoubor): string[] {
  const r = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return r.length ? r[0].values.map((v) => String(v[0])) : [];
}
