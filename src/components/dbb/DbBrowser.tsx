"use client";

/**
 * Virtuální DB Browser for SQLite – kurz SQL jako třetí simulátor.
 *
 * Napodobuje program, se kterým se na databáze sahá doopravdy: databáze je
 * soubor na disku, změny se do něj musí zapsat a zavřením bez zápisu se
 * ztratí. Kurz běží v panelu vpravo (jako SQLBolt: úkoly se odškrtnou samy,
 * jakmile výsledek sedí) a navazuje na něj šest lekcí o programu samotném.
 *
 * Disk = soubory v prohlížeči (`lib/dbb/soubory`). Otevřená databáze žije
 * v paměti; „Zapsat změny“ ji vyexportuje zpátky do souboru, „Vrátit změny“
 * ji ze souboru načte znovu.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { nactiEngine, otevriDb, forkDb, type SqlDbSoubor } from "@/lib/sqljs";
import { SCHEMA } from "@/lib/sqlExercise";
import {
  KNIHOVNA,
  MAX_SOUBORU,
  MAX_NAHRANI,
  nactiDisk,
  ulozDisk,
  jeSqlite,
  volnyNazev,
  type Disk,
} from "@/lib/dbb/soubory";
import { stahni } from "@/lib/dbb/stahni";
import { cist, zapsat, smazat as smazatKlic, jePredvadeni, nastavPredvadeni } from "@/lib/dbb/uloziste";
import {
  rozdelPrikazy,
  prikazNaPozici,
  spust,
  druhPrikazu,
  tabulky,
  pocetRadku,
  tabulkyDotazu,
  poznamkaKRazeni,
  zakomentujZmeny,
  sloupceDb,
  type Prikaz,
} from "@/lib/dbb/prikazy";
import { otisk } from "@/lib/dbb/otisk";
import { chybaCesky, TRANSAKCE_ZAKAZANE, type KontextChyby } from "@/lib/dbb/chyby";
import {
  KURZ,
  VSECHNY_LEKCE,
  lekceHotova,
  souborLekce,
  udalostiPoZnovuotevreni,
  coSKnihovnou,
  type Databaze,
  type Kontext,
  type LekceKurzu,
} from "@/lib/dbb/kurz";
import { vyhodnotDotaz, type SpusteniKontroly } from "@/lib/dbb/kontrola";
import { dekodujUlohu, lekceZOdkazu, ID_ULOHY } from "@/lib/dbb/odkazUlohy";
import { t, jeAnglicky, adresaVJazyce } from "@/lib/dbb/jazyk";
import { dekodujText, sqlVytvoreni, sqlVlozeni, type PripravenaTabulka } from "@/lib/dbb/csv";
import { sqlSkript } from "@/lib/dbb/export";
import {
  DbbKontext,
  useDbb,
  precti,
  uvoz,
  type DbbApi,
  type Dialog,
  type DokKarta,
  type Karta,
  type Vystup,
  type ZaznamLogu,
} from "@/components/dbb/kontext";
import { Hlavicka, NabidkaOkna, Lista, Karty, StavovyRadek } from "@/components/dbb/Okno";
import { KartaStruktura } from "@/components/dbb/KartaStruktura";
import { KartaData } from "@/components/dbb/KartaData";
import { KartaPragma } from "@/components/dbb/KartaPragma";
import { KartaSql } from "@/components/dbb/KartaSql";
import { Dok } from "@/components/dbb/Dok";
import { Dialogy } from "@/components/dbb/Dialogy";
import { usePodoba } from "@/components/dbb/PodleSirky";

/* ───────────────────────── úložiště postupu v kurzu ─────────────────────────
 * Stejné klíče jako kurz na webu (`SqlPlayground`), aby se postup sčítal:
 * na telefonu běží pořád webový kurz, na počítači DB Browser. */
const KLIC_HOTOVO = "sql-kurz-hotovo";
const KLIC_NAVIC = "sql-kurz-navic";
const KLIC_OPSANO = "sql-kurz-opsano";
const KLIC_KURZ = "dbb-kurz";
const KLIC_EDITOR = "dbb-editor";
const KLIC_POSLEDNI = "dbb-posledni";
/** Otisk změněné knihovny, u kterého žák řekl „Pokračovat se svou“ – znovu se neptáme. */
const KLIC_ODMITNUTO = "dbb-odmitnuto";
/** V téhle kartě už žák o knihovně rozhodl – znovu se neptáme (sessionStorage). */
const KLIC_RELACE_KNIHOVNA = "dbb-knihovna-vyreseno";
/** Karta prohlížeče už byla otevřená – nová relace = možná nový žák u počítače. */
const KLIC_RELACE = "dbb-relace";

function relace(klic: string): boolean {
  try {
    return sessionStorage.getItem(klic) === "1";
  } catch {
    return false;
  }
}

function oznacRelaci(klic: string) {
  try {
    sessionStorage.setItem(klic, "1");
  } catch {
    /* bez sessionStorage se zeptáme znovu po obnovení stránky */
  }
}

function nactiCisla(klic: string): number[] {
  try {
    const raw = cist(klic);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

/** Zapíše do úložiště kurzu (v režimu předvádění do odděleného). */
function uloz(klic: string, hodnota: unknown) {
  zapsat(klic, typeof hodnota === "string" ? hodnota : JSON.stringify(hodnota));
}

const prectiText = (klic: string): string | null => cist(klic);

type Otevrena = { nazev: string; db: SqlDbSoubor };

/** Vysvětlení chyby – jen když opravdu něco vysvětluje, ne když opakuje originál. */
function cesky(raw: string, seznam: string[], kontext: KontextChyby): string | undefined {
  const text = chybaCesky(raw, seznam, kontext);
  const holy = raw.trim().replace(/^Error:\s*/i, "");
  return text === holy ? undefined : text;
}

export function VirtualniDbBrowser({ domu = "/" }: { domu?: string }) {
  const { prepni: prepniPodobu } = usePodoba();
  // Režim předvádění se zapíná jen s novým načtením stránky – za běhu se nemění.
  const [predvadeni] = useState(jePredvadeni);
  const [meritko, nastavMeritko] = useState(1);
  // Úzké okno program nepřepne (to dělalo potíže u projektoru a Win+←), jen
  // nabídne roztažení nebo webovou podobu.
  const [uzke, nastavUzke] = useState(false);
  useEffect(() => {
    const zmer = () => {
      // Při předvádění se program zvětší, aby byl čitelný ze zadní lavice –
      // ale jen tolik, aby se na plátno pořád vešel (aspoň 1100 px šířky).
      const m = predvadeni ? Math.max(1, Math.min(1.35, window.innerWidth / 1100)) : 1;
      nastavMeritko(m);
      nastavUzke(window.innerWidth / m < 900);
    };
    zmer();
    window.addEventListener("resize", zmer);
    return () => window.removeEventListener("resize", zmer);
  }, [predvadeni]);
  const [engine, nastavEngine] = useState<"nacita" | "hotovo" | "chyba">("nacita");
  const [disk, nastavDisk] = useState<Disk>({});
  const diskRef = useRef<Disk>({});
  const otevrenaRef = useRef<Otevrena | null>(null);
  const [otevrena, nastavOtevrenou] = useState<string | null>(null);
  const [zmeneno, nastavZmeneno] = useState(false);
  const [verze, nastavVerzi] = useState(0);
  /** Roste při každém otevření souboru – náhled lekce se pak překreslí i po obnovení knihovny. */
  const [otevreni, nastavOtevreni] = useState(0);
  const [karta, nastavKartu] = useState<Karta>("sql");
  const [dokKarta, nastavDokKartu] = useState<DokKarta>("kurz");
  const [editor, nastavEditorStav] = useState("");
  const editorTextRef = useRef(editor);
  editorTextRef.current = editor;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [vystup, nastavVystup] = useState<Vystup | null>(null);
  const [log, nastavLog] = useState<ZaznamLogu[]>([]);
  const [udalosti, nastavUdalosti] = useState<Set<string>>(new Set());
  const [prohlizeni, nastavProhlizeni] = useState<{ tabulka: string; id: string[] } | null>(null);
  const [dialog, otevritDialog] = useState<Dialog | null>(null);
  const [statusText, nastavStatusText] = useState("");
  /** Co se zahodilo při „Neukládat“ – podle toho lekce 16 pozná, že změna opravdu zmizela. */
  const zahozenoRef = useRef<{ nazev: string; temno: string | null } | null>(null);
  /** Otisk původní knihovny (spočítá se jednou po startu). */
  const cistyOtiskRef = useRef<string | null>(null);
  /** Otisk knihovny při načtení stránky, když už tehdy nebyla původní. */
  const otiskPriNacteniRef = useRef<string | null>(null);
  const vlastniSelectyRef = useRef<Set<string>>(new Set());
  const [vlastniSelecty, nastavVlastniSelecty] = useState(0);

  // Kurz
  const [nacteno, nastavNacteno] = useState(false);
  const [lekceId, nastavLekceId] = useState(1);
  const [splneno, nastavSplneno] = useState<Set<string>>(new Set());
  const [opsano, nastavOpsano] = useState<Set<string>>(new Set());
  const [pokusy, nastavPokusy] = useState<Set<string>>(new Set());
  const [odezva, nastavOdezvu] = useState<{ klic: string; text: string } | null>(null);
  const vlozenoRef = useRef<Set<string>>(new Set());
  const splnenoRef = useRef(splneno);
  splnenoRef.current = splneno;
  const lekceIdRef = useRef(lekceId);
  lekceIdRef.current = lekceId;
  const zmenenoRef = useRef(zmeneno);
  zmenenoRef.current = zmeneno;

  /** Úloha od učitele z odkazu (/sql?ukol=…) – jako lekce navíc za procvičováním. */
  const [uloha, nastavUlohu] = useState<LekceKurzu | null>(null);
  const ulohaRef = useRef<LekceKurzu | null>(null);
  const najdiLekci = useCallback(
    (id: number): LekceKurzu | undefined =>
      id === ID_ULOHY && ulohaRef.current ? ulohaRef.current : VSECHNY_LEKCE.find((l) => l.id === id),
    [],
  );
  const vsechnyLekce = useMemo(() => (uloha ? VSECHNY_LEKCE.concat(uloha) : VSECHNY_LEKCE), [uloha]);

  const lekce = (lekceId === ID_ULOHY && uloha) || VSECHNY_LEKCE.find((l) => l.id === lekceId) || KURZ[0];

  const zmenaVerze = useCallback(() => nastavVerzi((v) => v + 1), []);
  const pridejLog = useCallback((kdo: ZaznamLogu["kdo"], text: string) => {
    nastavLog((l) => l.concat({ kdo, text }).slice(-300));
  }, []);
  const status = useCallback((text: string) => nastavStatusText(text), []);
  const udalost = useCallback((nazev: string) => {
    nastavUdalosti((u) => {
      if (u.has(nazev)) return u;
      const n = new Set(u);
      n.add(nazev);
      return n;
    });
  }, []);

  /** Uloží disk; vrací false, když se to v prohlížeči nepovedlo. */
  const ulozNaDisk = useCallback((novy: Disk): boolean => {
    diskRef.current = novy;
    nastavDisk(novy);
    return ulozDisk(novy);
  }, []);

  /* ─────────────────────────── otevírání a zavírání ─────────────────────────── */

  const zavriInterne = useCallback(() => {
    const o = otevrenaRef.current;
    if (o) {
      try {
        o.db.close();
      } catch {
        /* už zavřená */
      }
    }
    otevrenaRef.current = null;
    nastavOtevrenou(null);
    nastavZmeneno(false);
    nastavProhlizeni(null);
  }, []);

  const otevri = useCallback(
    (nazev: string) => {
      const soubor = diskRef.current[nazev];
      if (!soubor) return;
      zavriInterne();
      const db = otevriDb(soubor.bajty);
      // DB Browser má kontrolu cizích klíčů zapnutou – sqlite ji sám nezapne.
      db.exec("PRAGMA foreign_keys = ON;");
      otevrenaRef.current = { nazev, db };
      nastavOtevrenou(nazev);
      nastavZmeneno(false);
      pridejLog("aplikace", "PRAGMA foreign_keys = ON;");
      pridejLog("aplikace", "SELECT type, name, sql, tbl_name FROM sqlite_master;");
      uloz(KLIC_POSLEDNI, nazev);
      const zahozeno = zahozenoRef.current;
      if (zahozeno && zahozeno.nazev === nazev) {
        // Lekce 16: změna Temna musí po „Neukládat“ opravdu zmizet.
        const po = precti(db, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'");
        const temnoPo = po && po.values[0] ? String(po.values[0][0]) : null;
        udalostiPoZnovuotevreni(zahozeno.temno, temnoPo).forEach(udalost);
        zahozenoRef.current = null;
      }
      udalost(`otevreno:${nazev}`);
      nastavOtevreni((n) => n + 1);
      zmenaVerze();
    },
    [zavriInterne, pridejLog, udalost, zmenaVerze],
  );

  const zapsat = useCallback(() => {
    const o = otevrenaRef.current;
    if (!o) return;
    const bajty = o.db.export();
    // export() databázi v sql.js zavře a znovu otevře – pragma se tím ztratí.
    o.db.exec("PRAGMA foreign_keys = ON;");
    const ulozeno = ulozNaDisk({ ...diskRef.current, [o.nazev]: { bajty, zmeneno: Date.now() } });
    nastavZmeneno(false);
    pridejLog("aplikace", "RELEASE \"RESTOREPOINT\";");
    udalost("zapsano");
    if (ulozeno) {
      status(t("Změny zapsány – soubor je uložený v tomhle prohlížeči na tomhle počítači.", "Changes written – the file is saved in this browser on this computer."));
    } else {
      // Úložiště je plné nebo zakázané: v paměti zápis proběhl, ale po zavření
      // stránky by se ztratil. Radši to říct a nabídnout stažení.
      otevritDialog({ druh: "chybaZapisu", nazev: o.nazev, bajty });
      status(t("Soubor se nepodařilo uložit v prohlížeči.", "The file could not be saved in the browser."));
    }
    zmenaVerze();
  }, [ulozNaDisk, pridejLog, udalost, status, zmenaVerze]);

  const vratit = useCallback(() => {
    const o = otevrenaRef.current;
    if (!o) return;
    const nazev = o.nazev;
    zavriInterne();
    const soubor = diskRef.current[nazev];
    if (!soubor) return;
    const db = otevriDb(soubor.bajty);
    db.exec("PRAGMA foreign_keys = ON;");
    otevrenaRef.current = { nazev, db };
    nastavOtevrenou(nazev);
    pridejLog("aplikace", "ROLLBACK TO SAVEPOINT \"RESTOREPOINT\";");
    udalost("vraceno");
    status(t("Změny byly vráceny – databáze je ve stavu po posledním zápisu.", "Changes reverted – the database is as it was after the last write."));
    zmenaVerze();
  }, [zavriInterne, pridejLog, udalost, status, zmenaVerze]);

  /** Zavře databázi; s neuloženými změnami se nejdřív zeptá, jako program. */
  const zavriDatabazi = useCallback(
    (potom?: () => void) => {
      const o = otevrenaRef.current;
      if (!o) {
        if (potom) potom();
        return;
      }
      if (!zmenenoRef.current) {
        zavriInterne();
        zmenaVerze();
        if (potom) potom();
        return;
      }
      otevritDialog({
        druh: "ulozit",
        nazev: o.nazev,
        potom: () => {
          zmenaVerze();
          if (potom) potom();
        },
      });
    },
    [zavriInterne, zmenaVerze],
  );
  /** Volba v dialogu „Uložit změny?“. */
  const rozhodnutiUlozit = useCallback(
    (volba: "ulozit" | "neukladat" | "zrusit", potom: () => void) => {
      otevritDialog(null);
      if (volba === "zrusit") return;
      const o = otevrenaRef.current;
      if (volba === "ulozit") zapsat();
      else if (o) {
        const temno = o.nazev === KNIHOVNA ? precti(o.db, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'") : null;
        zahozenoRef.current = { nazev: o.nazev, temno: temno && temno.values[0] ? String(temno.values[0][0]) : null };
        udalost("zahozeno");
      }
      zavriInterne();
      potom();
    },
    [zapsat, zavriInterne, udalost],
  );

  /**
   * Soubor → Uložit kopii do počítače: stáhne soubor do skutečné složky
   * Stažené soubory. S nezapsanými změnami se zeptá, jestli je zapsat.
   */
  const ulozKopii = useCallback(() => {
    const o = otevrenaRef.current;
    if (!o) return;
    const nazev = o.nazev;
    const stahniSoubor = () => {
      const s = diskRef.current[nazev];
      if (!s) return;
      stahni(nazev, s.bajty);
      udalost(`stazeno:${nazev}`);
      status(t(`Kopie souboru ${nazev} je ve složce Stažené soubory tvého počítače.`, `A copy of ${nazev} is in the Downloads folder of your computer.`));
    };
    if (!zmenenoRef.current) {
      stahniSoubor();
      return;
    }
    otevritDialog({
      druh: "potvrdit",
      titulek: t("Uložit kopii do počítače", "Save a Copy to This Computer"),
      text: t("Některé změny ještě nejsou zapsané v souboru. Zapsat je a stáhnout soubor i s nimi?", "Some changes are not written to the file yet. Write them and download the file with them?"),
      tlacitko: t("Zapsat a stáhnout", "Write and Download"),
      akce: () => {
        zapsat();
        stahniSoubor();
      },
      zrusit: t("Stáhnout bez nich", "Download Without Them"),
      priZruseni: stahniSoubor,
    });
  }, [zapsat, udalost, status]);

  /** Soubor nahraný ze skutečného počítače (dialog Otevřít → Z tohoto počítače…). */
  const nahrajSoubor = useCallback(
    (puvodniNazev: string, bajty: Uint8Array): string | null => {
      if (bajty.length > MAX_NAHRANI) return t("Soubor je moc velký – do prohlížeče se vejde databáze nejvýš do 2 MB.", "The file is too big – the browser can hold a database of up to 2 MB.");
      if (!jeSqlite(bajty)) return t("Tohle není databáze SQLite. Vyber soubor .db, který jsi třeba dřív stáhl(a) z kurzu.", "This is not an SQLite database. Choose a .db file – one you downloaded from the course earlier, for example.");
      const nazvy = Object.keys(diskRef.current);
      if (nazvy.length >= MAX_SOUBORU) return t("Databází je moc. Nějakou starou smaž ikonou koše v okně Otevřít databázi.", "There are too many databases. Delete an old one with the bin icon in the Open Database window.");
      const cisty = puvodniNazev.replace(/[\\/:*?"<>|]/g, "_");
      const nazev = volnyNazev(cisty.toLowerCase() === KNIHOVNA ? t("knihovna z počítače.db", "knihovna from computer.db") : cisty, nazvy);
      ulozNaDisk({ ...diskRef.current, [nazev]: { bajty, zmeneno: Date.now() } });
      otevritDialog(null);
      zavriDatabazi(() => otevri(nazev));
      status(t(`Soubor ${nazev} je nahraný z počítače.`, `The file ${nazev} has been uploaded from your computer.`));
      return null;
    },
    [ulozNaDisk, zavriDatabazi, otevri, status],
  );

  /** Tabulka z CSV do otevřené databáze – na Zapsat změny čeká jako každá jiná změna. */
  const importujTabulku = useCallback(
    (nazev: string, tab: PripravenaTabulka): string | null => {
      const o = otevrenaRef.current;
      if (!o) return t("Nejdřív otevři nebo založ databázi.", "Open or create a database first.");
      if (tabulky(o.db).some((x) => x.toLowerCase() === nazev.toLowerCase())) {
        return t(`Tabulka ${nazev} už v databázi je – zvol jiný název.`, `The table ${nazev} is already in the database – choose a different name.`);
      }
      const vytvoreni = sqlVytvoreni(nazev, tab);
      const vlozeni = sqlVlozeni(nazev, tab);
      try {
        o.db.run(vytvoreni);
        tab.data.forEach((r) => o.db.run(vlozeni, r));
      } catch (e) {
        const chyba = chybaCesky(e instanceof Error ? e.message : String(e), tabulky(o.db));
        try {
          o.db.run(`DROP TABLE IF EXISTS ${uvoz(nazev)}`);
        } catch {
          /* tabulka nevznikla */
        }
        return chyba;
      }
      pridejLog("aplikace", vytvoreni);
      pridejLog("aplikace", `${vlozeni} -- ${tab.data.length}×`);
      nastavZmeneno(true);
      zmenaVerze();
      udalost(`import:${nazev}`);
      status(
        t(
          `Tabulka ${nazev} má ${tab.data.length} řádků z CSV. Nezapomeň změny zapsat (Ctrl+S).`,
          `The table ${nazev} has ${tab.data.length} rows from the CSV file. Don't forget to write the changes (Ctrl+S).`,
        ),
      );
      return null;
    },
    [pridejLog, zmenaVerze, udalost, status],
  );

  /** Nová databáze ze skriptu SQL (třeba knihovna.sql z banky) – vytvoří soubor a otevře ho. */
  const importujSql = useCallback(
    (nazevDb: string, text: string): string | null => {
      if (nazevDb.toLowerCase() === KNIHOVNA) {
        return t("Soubor knihovna.db potřebuje kurz – zvol jiný název.", "The course needs the knihovna.db file – choose a different name.");
      }
      if (diskRef.current[nazevDb]) {
        return t(`Databáze ${nazevDb} už existuje – zvol jiný název.`, `The database ${nazevDb} already exists – choose a different name.`);
      }
      if (Object.keys(diskRef.current).length >= MAX_SOUBORU) {
        return t("Databází je moc. Nějakou starou smaž ikonou koše v okně Otevřít databázi.", "There are too many databases. Delete an old one with the bin icon in the Open Database window.");
      }
      const db = otevriDb();
      let bajty: Uint8Array;
      try {
        db.exec(text);
        if (!tabulky(db).length) {
          return t("Soubor nevytvořil žádnou tabulku – je to opravdu skript s CREATE TABLE?", "The file created no table – is it really a script with CREATE TABLE?");
        }
        bajty = db.export();
      } catch (e) {
        return chybaCesky(e instanceof Error ? e.message : String(e), tabulky(db));
      } finally {
        db.close();
      }
      ulozNaDisk({ ...diskRef.current, [nazevDb]: { bajty, zmeneno: Date.now() } });
      otevritDialog(null);
      zavriDatabazi(() => otevri(nazevDb));
      status(t(`Databáze ${nazevDb} je vytvořená ze souboru SQL.`, `The database ${nazevDb} has been created from the SQL file.`));
      return null;
    },
    [ulozNaDisk, zavriDatabazi, otevri, status],
  );

  /**
   * Soubor ze skutečného počítače – z nabídky Soubor nebo přetažený myší.
   * Druh se pozná podle přípony: .db otevře databázi, .csv přidá tabulku,
   * .sql založí databázi ze skriptu.
   */
  const zpracujSoubor = useCallback(
    (f: File, ucel?: "db" | "csv" | "sql") => {
      const pripona = (f.name.match(/\.([^.]+)$/) || ["", ""])[1].toLowerCase();
      const podlePripony: "db" | "csv" | "sql" | null =
        ["db", "sqlite", "sqlite3", "db3"].indexOf(pripona) !== -1
          ? "db"
          : ["csv", "tsv", "txt"].indexOf(pripona) !== -1
            ? "csv"
            : pripona === "sql"
              ? "sql"
              : null;
      const druh = podlePripony || ucel || null;
      const zprava = (titulek: string, text: string) => otevritDialog({ druh: "zprava", titulek, text });
      if (!druh) {
        zprava(
          t("Tenhle soubor program neumí", "The program can't open this file"),
          t(
            "Program umí databázi .db (.sqlite), tabulku z CSV (z Excelu přes Uložit jako → CSV) a databázi ze souboru .sql.",
            "The program can open a .db (.sqlite) database, a table from a CSV file (from Excel via Save As → CSV) and a database from an .sql file.",
          ),
        );
        return;
      }
      if (f.size > MAX_NAHRANI) {
        zprava(
          t("Soubor je moc velký", "The file is too big"),
          t("Do prohlížeče se vejde soubor nejvýš do 2 MB.", "The browser can hold a file of up to 2 MB."),
        );
        return;
      }
      if (druh === "csv" && !otevrenaRef.current) {
        zprava(
          t("Nejdřív otevři databázi", "Open a database first"),
          t(
            "Tabulka z CSV se přidá do otevřené databáze. Otevři nebo založ databázi (Soubor → Nová databáze) a zkus to znovu.",
            "The table from the CSV file is added to the open database. Open or create a database (File → New Database) and try again.",
          ),
        );
        return;
      }
      const cteni = new FileReader();
      cteni.onload = () => {
        const bajty = new Uint8Array(cteni.result as ArrayBuffer);
        if (druh === "db") {
          const chyba = nahrajSoubor(f.name, bajty);
          if (chyba) zprava(t("Soubor se nepodařilo nahrát", "The file could not be uploaded"), chyba);
        } else if (druh === "csv") {
          otevritDialog({ druh: "importCsv", soubor: f.name, bajty });
        } else {
          otevritDialog({ druh: "importSql", soubor: f.name, text: dekodujText(bajty).text });
        }
      };
      cteni.onerror = () => zprava(t("Soubor se nepodařilo přečíst", "The file could not be read"), f.name);
      cteni.readAsArrayBuffer(f);
    },
    [nahrajSoubor],
  );

  /** Otevřená databáze jako skript SQL (i s nezapsanými změnami, jak ji program právě ukazuje). */
  const exportujSql = useCallback(() => {
    const o = otevrenaRef.current;
    if (!o) return;
    const nazev = `${o.nazev.replace(/\.[^.]*$/, "")}.sql`;
    stahni(nazev, new TextEncoder().encode(sqlSkript(o.db)), "application/sql");
    udalost(`export:sql:${o.nazev}`);
    status(
      t(
        `Soubor ${nazev} je ve složce Stažené soubory tvého počítače. Zpátky ho nahraješ přes Soubor → Importovat databázi ze SQL.`,
        `The file ${nazev} is in your computer's Downloads folder. Upload it back with File → Import Database from SQL File.`,
      ),
    );
  }, [udalost, status]);

  const souborRef = useRef<HTMLInputElement>(null);
  const ucelRef = useRef<"db" | "csv" | "sql">("db");
  const vyberSoubor = useCallback((ucel: "db" | "csv" | "sql") => {
    ucelRef.current = ucel;
    const vstup = souborRef.current;
    if (!vstup) return;
    vstup.accept = ucel === "db" ? ".db,.sqlite,.sqlite3,.db3" : ucel === "csv" ? ".csv,.tsv,.txt" : ".sql,.txt";
    vstup.click();
  }, []);
  const [pretahovani, nastavPretahovani] = useState(false);

  /** Vrátí knihovna.db do původního stavu (neuložené změny v ní zahodí) a otevře ji. */
  const obnovKnihovnu = useCallback(() => {
    const db = otevriDb();
    db.exec(SCHEMA);
    const bajty = db.export();
    db.close();
    const jeOtevrena = otevrenaRef.current && otevrenaRef.current.nazev === KNIHOVNA;
    if (jeOtevrena) zavriInterne();
    ulozNaDisk({ ...diskRef.current, [KNIHOVNA]: { bajty, zmeneno: Date.now() } });
    if (jeOtevrena) otevri(KNIHOVNA);
    else zavriDatabazi(() => otevri(KNIHOVNA));
    status(t("Soubor knihovna.db je zpátky v původním stavu.", "The knihovna.db file is back in its original state."));
  }, [zavriInterne, ulozNaDisk, otevri, zavriDatabazi, status]);

  /** Založí (nebo vrátí do původního stavu) databázi sady – procvičování, detektivka. */
  const obnovDatabazi = useCallback(
    (d: Databaze, otevritPotom: boolean) => {
      const db = otevriDb();
      db.exec(d.schema);
      const bajty = db.export();
      db.close();
      const jeOtevrena = otevrenaRef.current && otevrenaRef.current.nazev === d.soubor;
      if (jeOtevrena) zavriInterne();
      ulozNaDisk({ ...diskRef.current, [d.soubor]: { bajty, zmeneno: Date.now() } });
      if (jeOtevrena || otevritPotom) zavriDatabazi(() => otevri(d.soubor));
    },
    [zavriInterne, ulozNaDisk, zavriDatabazi, otevri],
  );

  /** Hodnota dostupna u Temna tak, jak je zapsaná v souboru knihovna.db. */
  const temnoVSouboru = useCallback((): string | null => {
    const s = diskRef.current[KNIHOVNA];
    if (!s) return null;
    const d = otevriDb(s.bajty);
    try {
      const r = precti(d, "SELECT dostupna FROM knihy WHERE nazev = 'Temno'");
      return r && r.values[0] ? String(r.values[0][0]) : null;
    } finally {
      d.close();
    }
  }, []);

  /**
   * Stav knihovny při vstupu do lekce – kdy se ptát, kdy obnovit potichu
   * a kdy nechat být, rozhoduje `coSKnihovnou` (kurz.ts).
   */
  const zkontrolujVychozi = useCallback(
    (id: number) => {
      const lekce16 = najdiLekci(16);
      const rozhodnuti = coSKnihovnou(id, {
        zmenenaPriNacteni: otiskPriNacteniRef.current,
        vyresenoVRelaci: relace(KLIC_RELACE_KNIHOVNA),
        odmitnutyOtisk: prectiText(KLIC_ODMITNUTO),
        temnoVSouboru: id === 16 ? temnoVSouboru() : null,
        lekce16Hotova: !!lekce16 && lekceHotova(lekce16, splnenoRef.current),
      });
      if (rozhodnuti === "obnovit") {
        obnovKnihovnu();
        pridejLog("aplikace", t("-- Knihovna vrácena do původního stavu – lekce 16 s ní počítá.", "-- Library restored to its original state – lesson 16 needs it."));
        status(
          t(
            "Knihovna je zpátky v původním stavu – lekce 16 potřebuje, aby Temno bylo v souboru nedostupné.",
            "The library is back in its original state – lesson 16 needs Temno to be unavailable in the file.",
          ),
        );
        return;
      }
      if (rozhodnuti !== "zeptat") return;
      const otiskPriNacteni = otiskPriNacteniRef.current;
      otevritDialog({
        druh: "potvrdit",
        titulek: t("Knihovna není v původním stavu", "The library is not in its original state"),
        text: t(
          "Soubor knihovna.db nebyl v původním stavu už při otevření kurzu – nejspíš z minulé hodiny, nebo po někom, kdo u počítače seděl před tebou. Některé úkoly by se pak mohly odškrtnout samy, nebo by nešly splnit. Obnovit původní knihovnu? Tvůj postup v kurzu zůstane.",
          "The knihovna.db file was not in its original state when you opened the course – probably from a previous lesson, or from someone who sat at this computer before you. Some tasks could then tick themselves off, or be impossible to complete. Restore the original library? Your progress in the course stays.",
        ),
        tlacitko: t("Obnovit", "Restore"),
        akce: () => {
          oznacRelaci(KLIC_RELACE_KNIHOVNA);
          obnovKnihovnu();
        },
        zrusit: t("Pokračovat se svou", "Keep Mine"),
        priZruseni: () => {
          oznacRelaci(KLIC_RELACE_KNIHOVNA);
          if (otiskPriNacteni) uloz(KLIC_ODMITNUTO, otiskPriNacteni);
        },
      });
    },
    [najdiLekci, temnoVSouboru, obnovKnihovnu, pridejLog, status],
  );

  /* ─────────────────────────────── start ─────────────────────────────── */

  useEffect(() => {
    let zije = true;
    // Postup v kurzu – nový i ten z webového kurzu.
    let ulozeny: { splneno?: string[]; opsano?: string[]; lekce?: number } = {};
    try {
      ulozeny = JSON.parse(prectiText(KLIC_KURZ) || "{}");
    } catch {
      ulozeny = {};
    }
    const s = new Set<string>(ulozeny.splneno || []);
    nactiCisla(KLIC_HOTOVO).forEach((id) => {
      if (id <= 13) s.add(String(id));
    });
    nactiCisla(KLIC_NAVIC).forEach((id) => s.add(`${id}b`));
    const o = new Set<string>(ulozeny.opsano || []);
    nactiCisla(KLIC_OPSANO).forEach((id) => o.add(String(id)));
    nastavSplneno(s);
    nastavOpsano(o);
    const prvniNehotova = KURZ.find((l) => !lekceHotova(l, s));
    // Odkaz s úlohou od učitele má přednost před lekcí, kde žák skončil.
    let odkaz: LekceKurzu | null = null;
    try {
      const u = dekodujUlohu(new URLSearchParams(window.location.search).get("ukol"));
      odkaz = u ? lekceZOdkazu(u) : null;
    } catch {
      odkaz = null;
    }
    ulohaRef.current = odkaz;
    nastavUlohu(odkaz);
    nastavLekceId(
      odkaz
        ? ID_ULOHY
        : ulozeny.lekce && VSECHNY_LEKCE.some((l) => l.id === ulozeny.lekce)
          ? ulozeny.lekce
          : prvniNehotova
            ? prvniNehotova.id
            : 1,
    );
    nastavEditorStav(prectiText(KLIC_EDITOR) || "");
    nastavNacteno(true);

    nactiEngine()
      .then(() => {
        if (!zije) return;
        const d = nactiDisk();
        if (!d[KNIHOVNA]) {
          const db = otevriDb();
          db.exec(SCHEMA);
          d[KNIHOVNA] = { bajty: db.export(), zmeneno: Date.now() };
          db.close();
          ulozDisk(d);
        }
        // Úloha z odkazu nad procvičováním: soubor se založí, když ještě není.
        const dbUlohy = odkaz && odkaz.databaze;
        if (dbUlohy && !d[dbUlohy.soubor]) {
          const db = otevriDb();
          db.exec(dbUlohy.schema);
          d[dbUlohy.soubor] = { bajty: db.export(), zmeneno: Date.now() };
          db.close();
          ulozDisk(d);
        }
        diskRef.current = d;
        nastavDisk(d);
        const cista = forkDb(SCHEMA);
        cistyOtiskRef.current = otisk(cista);
        cista.close();
        // Byla knihovna původní už při načtení? Podle toho se lekce 14–17 ptají.
        const soubor = otevriDb(d[KNIHOVNA].bajty);
        try {
          const o = otisk(soubor);
          otiskPriNacteniRef.current = o === cistyOtiskRef.current ? null : o;
        } finally {
          soubor.close();
        }
        nastavEngine("hotovo");
        const posledni = prectiText(KLIC_POSLEDNI);
        const souborUlohy = odkaz ? souborLekce(odkaz) : null;
        otevri(souborUlohy || (posledni && d[posledni] ? posledni : KNIHOVNA));
        // Nová karta a v kurzu je jméno: sedí tu pořád týž žák? Jinak by kód
        // postupu odešel do Teams pod cizím jménem (rada 24. 9. 2026).
        const jmeno = (prectiText("dbb-jmeno") || "").trim().slice(0, 40);
        const novaRelace = !relace(KLIC_RELACE);
        oznacRelaci(KLIC_RELACE);
        if (novaRelace && jmeno && !predvadeni) {
          otevritDialog({
            druh: "potvrdit",
            titulek: t("Kdo sedí u počítače?", "Who is at this computer?"),
            text: t(
              `Naposledy tu v kurzu pracoval(a) ${jmeno}. Jsi to ty? Když ne, postup předchozího žáka se na tomhle počítači smaže a začneš od lekce 1.`,
              `${jmeno} was the last to work on the course here. Is that you? If not, the previous pupil's progress on this computer is deleted and you start from lesson 1.`,
            ),
            // Výchozí (zaměřené) tlačítko je to bezpečné – Enter nic nesmaže.
            tlacitko: t("Ne, jsem nový žák", "No, I'm a New Pupil"),
            akce: () => provedNovyZakRef.current(),
            zrusit: t(`Ano, jsem ${jmeno}`, `Yes, I'm ${jmeno}`),
            priZruseni: () => zkontrolujVychozi(lekceIdRef.current),
          });
        } else {
          zkontrolujVychozi(lekceIdRef.current);
        }
      })
      .catch((e) => {
        console.error("SQL engine se nepodařilo načíst:", e);
        if (zije) nastavEngine("chyba");
      });
    return () => {
      zije = false;
      const o = otevrenaRef.current;
      if (o) o.db.close();
      otevrenaRef.current = null;
    };
    // Jen jednou při startu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Postup se ukládá po každé změně – nový klíč i ty staré pro webový kurz.
  useEffect(() => {
    if (!nacteno) return;
    uloz(KLIC_KURZ, { splneno: Array.from(splneno), opsano: Array.from(opsano), lekce: lekceId });
    const hotove: number[] = [];
    const navic: number[] = [];
    const opsane: number[] = [];
    KURZ.forEach((l) => {
      if (lekceHotova(l, splneno)) hotove.push(l.id);
      if (splneno.has(`${l.id}b`)) navic.push(l.id);
      if (opsano.has(String(l.id))) opsane.push(l.id);
    });
    uloz(KLIC_HOTOVO, hotove);
    uloz(KLIC_NAVIC, navic);
    uloz(KLIC_OPSANO, opsane);
  }, [nacteno, splneno, opsano, lekceId]);

  const nastavEditor = useCallback((text: string) => {
    nastavEditorStav(text);
    uloz(KLIC_EDITOR, text);
  }, []);

  /* ───────────────────────────── kurz ───────────────────────────── */

  const oznacSplnene = useCallback((klice: string[]) => {
    if (!klice.length) return;
    nastavSplneno((s) => {
      const n = new Set(s);
      klice.forEach((k) => n.add(k));
      return n;
    });
    nastavOpsano((o) => {
      const vlozene = klice.filter((k) => vlozenoRef.current.has(k));
      if (!vlozene.length) return o;
      const n = new Set(o);
      vlozene.forEach((k) => n.add(k));
      return n;
    });
    nastavOdezvu((od) => (od && klice.indexOf(od.klic) !== -1 ? null : od));
    status(klice.length === 1 ? t("Úkol splněn.", "Task completed.") : t("Úkoly splněny.", "Tasks completed."));
  }, [status]);

  const pridejPokus = useCallback((klic: string) => {
    nastavPokusy((p) => {
      if (p.has(klic)) return p;
      const n = new Set(p);
      n.add(klic);
      return n;
    });
  }, []);

  const vyberLekci = useCallback(
    (id: number) => {
      // Příkazy, které měnily data, se v nové lekci nesmí spustit znovu.
      if (id !== lekceIdRef.current) {
        const z = zakomentujZmeny(editorTextRef.current);
        if (z.pocet) {
          nastavEditor(z.text);
          status(
            t(
              "Příkazy, které měnily data, jsou v editoru zakomentované (--), ať se v nové lekci nespustí znovu.",
              "Commands that changed data are commented out (--) in the editor so they don't run again in the new lesson.",
            ),
          );
        }
      }
      nastavLekceId(id);
      nastavOdezvu(null);
      // Úkoly typu „rozbal tabulku“ nebo „vyzkoušej Vrátit změny“ se mají
      // udělat v téhle lekci – co žák udělal dřív, se nepočítá.
      nastavUdalosti(new Set());
      // Lekce 1–13 jsou jen o SQL: začínají na kartě Spustit SQL. Karty se
      // nezamykají (skutečný program nic nezamyká), jen se na ně nezačíná.
      if (id <= 13) nastavKartu("sql");
      // Lekce s vlastní databází (procvičování, detektivka) ji otevře sama –
      // a když ještě není na disku, založí ji. Lekce knihovny vrátí knihovnu.
      const l = najdiLekci(id);
      const soubor = l ? souborLekce(l) : null;
      if (l && l.databaze && !diskRef.current[l.databaze.soubor]) {
        obnovDatabazi(l.databaze, true);
      } else if (soubor && (!otevrenaRef.current || otevrenaRef.current.nazev !== soubor)) {
        zavriDatabazi(() => otevri(soubor));
      }
      zkontrolujVychozi(id);
    },
    [zkontrolujVychozi, obnovDatabazi, zavriDatabazi, otevri, najdiLekci, nastavEditor, status],
  );

  /** Nový žák: smaže postup, rozepsaný dotaz, jméno i všechny soubory a vrátí původní knihovnu. */
  const provedNovyZak = useCallback(() => {
    nastavSplneno(new Set());
    nastavOpsano(new Set());
    nastavPokusy(new Set());
    nastavUdalosti(new Set());
    nastavLekceId(1);
    nastavOdezvu(null);
    nastavEditor("");
    nastavLog([]);
    vlozenoRef.current = new Set();
    vlastniSelectyRef.current = new Set();
    nastavVlastniSelecty(0);
    zahozenoRef.current = null;
    zavriInterne();
    const db = otevriDb();
    db.exec(SCHEMA);
    const bajty = db.export();
    db.close();
    ulozNaDisk({ [KNIHOVNA]: { bajty, zmeneno: Date.now() } });
    smazatKlic(KLIC_ODMITNUTO);
    smazatKlic("dbb-jmeno");
    otiskPriNacteniRef.current = null;
    smazatKlic(KLIC_POSLEDNI);
    smazatKlic("sql-kurz-dotazy");
    nastavKartu("sql");
    otevri(KNIHOVNA);
    status(t("Začínáš jako nový žák – lekce 1.", "You are starting as a new pupil – lesson 1."));
  }, [nastavEditor, zavriInterne, ulozNaDisk, otevri, status]);
  const provedNovyZakRef = useRef(provedNovyZak);
  provedNovyZakRef.current = provedNovyZak;

  const novyZak = useCallback(() => {
    otevritDialog({
      druh: "potvrdit",
      titulek: t("Nový žák", "New Pupil"),
      text: t("Smaže se postup ve všech lekcích, rozepsaný dotaz i všechny databáze – zůstane jen původní knihovna.db. Hodí se, když si u počítače sedá někdo jiný.", "This deletes the progress in all lessons, the unfinished query and all databases – only the original knihovna.db stays. Useful when someone else sits down at this computer."),
      tlacitko: t("Začít jako nový žák", "Start as a New Pupil"),
      akce: provedNovyZak,
    });
  }, [provedNovyZak]);

  /** Zapne nebo vypne režim předvádění – s novým načtením stránky, ať se nic nesmíchá. */
  const prepniPredvadeni = useCallback(() => {
    const prepnout = () => {
      nastavPredvadeni(!predvadeni);
      window.location.reload();
    };
    if (predvadeni) {
      zavriDatabazi(prepnout);
      return;
    }
    otevritDialog({
      druh: "potvrdit",
      titulek: t("Režim předvádění", "Presentation Mode"),
      text:
        t(
          "Pro učitele u projektoru. Program se zvětší, řešení půjdou ukázat hned bez pokusu a postup i soubory se budou ukládat zvlášť – postup žáka na tomhle počítači se nezmění.\n\nRežim platí, dokud nezavřeš kartu prohlížeče nebo ho neukončíš v nabídce Nápověda.",
          "For teachers at the projector. The program gets bigger, solutions can be shown straight away without an attempt, and progress and files are saved separately – the progress of the pupil who uses this computer doesn't change.\n\nThe mode lasts until you close the browser tab or end it in the Help menu.",
        ),
      tlacitko: t("Zapnout předvádění", "Turn On Presentation Mode"),
      akce: () => zavriDatabazi(prepnout),
    });
  }, [predvadeni, zavriDatabazi]);

  // Zavření nebo obnovení stránky s neuloženými změnami: prohlížeč se zeptá.
  // F5 a Ctrl+R zachytí program, ale ne křížek karty, Ctrl+W ani F5 v adresním řádku.
  useEffect(() => {
    const priOdchodu = (e: BeforeUnloadEvent) => {
      if (!zmenenoRef.current) return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", priOdchodu);
    return () => window.removeEventListener("beforeunload", priOdchodu);
  }, []);

  const vlozReseni = useCallback(
    (klic: string) => {
      const ukol = lekce.ukoly.find((u) => u.klic === klic);
      if (!ukol || !ukol.reseniJeSql) return;
      vlozenoRef.current.add(klic);
      nastavEditor(ukol.reseni);
      nastavKartu("sql");
      setTimeout(() => editorRef.current && editorRef.current.focus(), 0);
    },
    [lekce, nastavEditor],
  );

  /** Kontext pro úkoly, které se ověřují stavem programu nebo souboru. */
  const kontext = useCallback(
    (): Kontext => ({
      otevreny: otevrenaRef.current ? otevrenaRef.current.nazev : null,
      dotazZive: (sql) => precti(otevrenaRef.current ? otevrenaRef.current.db : null, sql),
      dotazSoubor: (nazev, sql) => {
        const s = diskRef.current[nazev];
        if (!s) return null;
        const d = otevriDb(s.bajty);
        try {
          return precti(d, sql);
        } finally {
          d.close();
        }
      },
      soubory: Object.keys(diskRef.current),
      udalosti,
      prohlizeni,
      vlastniSelecty: vlastniSelectyRef.current.size,
    }),
    [udalosti, prohlizeni],
  );

  // Úkoly „stavové“ se vyhodnotí po každé změně čehokoli, co můžou sledovat.
  useEffect(() => {
    if (engine !== "hotovo" || !nacteno) return;
    const nesplnene = lekce.ukoly.filter((u) => !splnenoRef.current.has(u.klic));
    const aktualni = nesplnene[0];
    const nove: string[] = [];
    const k = kontext();
    for (const u of nesplnene) {
      if (u.kontrola.druh !== "stav") continue;
      const h = u.kontrola.test(k);
      if (h.ok) nove.push(u.klic);
      else if (u === aktualni && h.proc && pokusy.has(u.klic)) nastavOdezvu({ klic: u.klic, text: h.proc });
    }
    oznacSplnene(nove);
  }, [engine, nacteno, lekce, verze, udalosti, prohlizeni, disk, otevrena, zmeneno, vlastniSelecty, pokusy, kontext, oznacSplnene]);

  // Náhled tabulky lekce na kartě Spustit SQL, než žák něco spustí (jako SQLBolt).
  useEffect(() => {
    if (engine !== "hotovo") return;
    const o = otevrenaRef.current;
    const tab = lekce.tabulka;
    const soubor = souborLekce(lekce);
    if (!o || !tab || (soubor && o.nazev !== soubor) || tabulky(o.db).indexOf(tab) === -1) {
      nastavVystup(null);
      return;
    }
    const r = precti(o.db, `SELECT * FROM ${uvoz(tab)};`);
    nastavVystup({
      vysledek: r,
      zprava: [
        t(
          `Tady uvidíš výsledek svého dotazu. Zatím je tu obsah tabulky ${tab}, ať víš, s čím pracuješ.`,
          `The result of your query will appear here. For now it shows the ${tab} table, so you know what you are working with.`,
        ),
      ],
      chyba: false,
      nahled: tab,
    });
    // Jen při změně lekce nebo otevření souboru (i téhož – po obnovení).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, lekceId, otevrena, otevreni]);

  /* ─────────────────────────── spouštění SQL ─────────────────────────── */

  const spustit = useCallback(
    (rezim: "vse" | "radek") => {
      const o = otevrenaRef.current;
      const aktualni = lekce.ukoly.find((u) => !splnenoRef.current.has(u.klic));
      if (!o) {
        nastavVystup({
          vysledek: null,
          zprava: [t("Není otevřená žádná databáze.", "No database is open."), t("Otevři ji přes Soubor → Otevřít databázi (Ctrl+O).", "Open one with File → Open Database (Ctrl+O).")],
          chyba: true,
        });
        return;
      }
      const ta = editorRef.current;
      const text = editor;
      let prikazy: Prikaz[];
      if (rezim === "radek") {
        const p = prikazNaPozici(rozdelPrikazy(text), ta ? ta.selectionStart : text.length);
        prikazy = p ? [p] : [];
      } else if (ta && ta.selectionEnd > ta.selectionStart) {
        // Označený kus se spustí sám, řádky se počítají od začátku editoru.
        const posun = text.slice(0, ta.selectionStart).split("\n").length - 1;
        prikazy = rozdelPrikazy(text.slice(ta.selectionStart, ta.selectionEnd)).map((p) => ({
          ...p,
          radek: p.radek + posun,
        }));
      } else {
        prikazy = rozdelPrikazy(text);
      }
      if (!prikazy.length) {
        nastavVystup({ vysledek: null, zprava: [t("Editor je prázdný – napiš dotaz a spusť ho znovu.", "The editor is empty – write a query and run it again.")], chyba: false });
        return;
      }

      // Za pokus (který odemkne řešení) se počítá jen dotaz, který pracuje
      // s tabulkou z úkolu – „SELECT 1“ řešení neodemkne. U vlastní databáze
      // (lekce 19) tabulky předem neznáme, tam se počítá každý dotaz.
      if (aktualni && aktualni.reseniJeSql) {
        const potreba = tabulkyDotazu(aktualni.reseni);
        const pouzite = tabulkyDotazu(prikazy.map((p) => p.text).join("\n"));
        if (!souborLekce(lekce) || potreba.some((x) => pouzite.indexOf(x) !== -1)) pridejPokus(aktualni.klic);
      }

      const beh = spust(o.db, prikazy);
      beh.provedene.forEach((p) => pridejLog("uzivatel", p.text));
      if (!beh.ok && beh.posledni) pridejLog("uzivatel", beh.posledni.text);
      if (beh.zmenil) nastavZmeneno(true);
      const posledni = beh.posledni;
      const naRadku = posledni ? [t(`Na řádku ${posledni.radek}:`, `At line ${posledni.radek}:`), posledni.text] : [];

      if (!beh.ok) {
        nastavVystup({
          vysledek: null,
          zprava: beh.zakazano
            ? [t("Příkaz nebyl proveden.", "The statement was not executed.")].concat(naRadku)
            : [t("Provádění skončilo s chybou.", "Execution finished with errors."), `${t("Výsledek", "Result")}: ${beh.chyba}`].concat(naRadku),
          chyba: true,
          cesky: beh.zakazano
            ? TRANSAKCE_ZAKAZANE
            : cesky(beh.chyba || "", tabulky(o.db), {
                sloupce: sloupceDb(o.db),
                sql: beh.posledni ? beh.posledni.text : undefined,
              }),
        });
        status(t("Provádění skončilo s chybou.", "Execution finished with errors."));
      } else {
        const druh = posledni ? druhPrikazu(posledni.text) : "jiny";
        let vysledekText: string;
        if (druh === "cteni" && beh.vysledek) {
          const n = beh.vysledek.values.length;
          vysledekText = t(`Výsledek: ${pocetRadku(n, "vrácen")} za ${beh.ms} ms`, `Result: ${pocetRadku(n, "vrácen")} in ${beh.ms}ms`);
        } else if (druh === "data") {
          vysledekText = t(
            `Výsledek: dotaz byl úspěšně proveden. Trvalo ${beh.ms} ms, ${pocetRadku(beh.zmenenoRadku, "ovlivněn")}.`,
            `Result: query executed successfully. Took ${beh.ms}ms, ${pocetRadku(beh.zmenenoRadku, "ovlivněn")}`,
          );
        } else {
          vysledekText = t(
            `Výsledek: dotaz byl úspěšně proveden. Trvalo ${beh.ms} ms.`,
            `Result: query executed successfully. Took ${beh.ms}ms`,
          );
        }
        nastavVystup({
          vysledek: druh === "cteni" ? beh.vysledek : null,
          zprava: [t("Provádění dokončeno bez chyb.", "Execution finished without errors."), vysledekText].concat(naRadku),
          chyba: false,
          poznamka: druh === "cteni" && posledni ? poznamkaKRazeni(posledni.text, beh.vysledek) : undefined,
        });
        status(t("Provádění dokončeno bez chyb.", "Execution finished without errors."));

        // Vlastní SELECTy nad vlastní databází (lekce 19).
        if (o.nazev !== KNIHOVNA && !VSECHNY_LEKCE.some((l) => !!l.databaze && l.databaze.soubor === o.nazev)) {
          beh.provedene.forEach((p) => {
            if (druhPrikazu(p.text) === "cteni" && /\bfrom\b/i.test(p.text)) {
              vlastniSelectyRef.current.add(p.text.toLowerCase().replace(/\s+/g, " ").replace(/;$/, ""));
            }
          });
          nastavVlastniSelecty(vlastniSelectyRef.current.size);
        }

        // Kontrola úkolů lekce, které se ověřují dotazem.
        const kb: SpusteniKontroly = {
          text: beh.provedene.map((p) => p.text).join("\n"),
          vysledek: beh.vysledek,
          soubor: o.nazev,
          menilData: beh.provedene.some((p) => druhPrikazu(p.text) === "data"),
          konciCtenim: druh === "cteni",
        };
        const nesplnene = lekce.ukoly.filter((u) => !splnenoRef.current.has(u.klic));
        const nove: string[] = [];
        let text2: { klic: string; text: string } | null = null;
        for (const u of nesplnene) {
          if (u.kontrola.druh === "stav") continue;
          const h = vyhodnotDotaz(u, kb, { cista: (schema) => forkDb(schema), ziva: o.db });
          if (!h) continue;
          if (h.ok) nove.push(u.klic);
          else if (aktualni && u.klic === aktualni.klic && h.proc) text2 = { klic: u.klic, text: h.proc };
        }
        oznacSplnene(nove);
        if (text2) nastavOdezvu(text2);
        else if (nove.length === 0 && aktualni && aktualni.kontrola.druh !== "stav") nastavOdezvu(null);
      }
      zmenaVerze();
    },
    [editor, lekce, pridejLog, pridejPokus, status, oznacSplnene, zmenaVerze],
  );

  /** Příkaz, který pošle program sám (mřížka, dialog tabulky…). */
  const provedAplikaci = useCallback(
    (sql: string, params?: unknown[], zaznam?: string): string | null => {
      const o = otevrenaRef.current;
      if (!o) return t("Není otevřená žádná databáze.", "No database is open.");
      try {
        o.db.run(sql, params);
        pridejLog("uzivatel", zaznam || sql);
        nastavZmeneno(true);
        zmenaVerze();
        return null;
      } catch (e) {
        return chybaCesky(e instanceof Error ? e.message : String(e), tabulky(o.db), { sloupce: sloupceDb(o.db) });
      }
    },
    [pridejLog, zmenaVerze],
  );

  const hlasProhlizeni = useCallback((tabulka: string, id: string[]) => {
    nastavProhlizeni((p) =>
      p && p.tabulka === tabulka && p.id.join(",") === id.join(",") ? p : { tabulka, id },
    );
  }, []);

  /* ─────────────────────────── klávesové zkratky ─────────────────────────── */

  const zkratky = useRef<(e: KeyboardEvent) => void>(() => undefined);
  zkratky.current = (e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const spousteci = e.key === "F5" || (ctrl && (e.key === "r" || e.key === "R")) || (ctrl && e.key === "Enter");
    // F5 a Ctrl+R by jinak znovu načetly stránku a neuložené změny by
    // zmizely – blokují se vždycky, i nad dialogem.
    if (spousteci) e.preventDefault();
    if (dialog) return;
    if (spousteci) {
      // Na kartě Prohlížet data F5 data obnoví, jinde mimo Spustit SQL nedělá nic.
      if (karta === "data" && e.key === "F5") zmenaVerze();
      else if (karta === "sql") spustit(e.shiftKey && e.key === "F5" ? "radek" : "vse");
    } else if (ctrl && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (zmenenoRef.current) zapsat();
    } else if (ctrl && (e.key === "o" || e.key === "O")) {
      e.preventDefault();
      otevritDialog({ druh: "otevrit" });
    }
  };
  useEffect(() => {
    const posluchac = (e: KeyboardEvent) => zkratky.current(e);
    window.addEventListener("keydown", posluchac, true);
    return () => window.removeEventListener("keydown", posluchac, true);
  }, []);

  /* ─────────────────────────────── API ─────────────────────────────── */

  const api: DbbApi = useMemo(
    () => ({
      otevrena,
      db: () => (otevrenaRef.current ? otevrenaRef.current.db : null),
      verze,
      zmeneno,
      disk,
      karta,
      nastavKartu,
      dokKarta,
      nastavDokKartu,
      editor,
      nastavEditor,
      editorRef,
      vystup,
      spustit,
      log,
      vymazLog: () => nastavLog([]),
      udalost,
      hlasProhlizeni,
      provedAplikaci,
      otevritDialog,
      status,
      zapsat,
      vratit,
      kurz: { lekceId, lekce: vsechnyLekce, splneno, opsano, pokusy, odezva, vyberLekci, vlozReseni, novyZak, obnovDatabazi },
      vyberSoubor,
      importujTabulku,
      importujSql,
      exportujSql,
      predvadeni,
      meritko,
    }),
    [otevrena, verze, zmeneno, disk, karta, dokKarta, editor, nastavEditor, vystup, spustit, log, udalost,
      hlasProhlizeni, provedAplikaci, status, zapsat, vratit, lekceId, splneno, opsano, pokusy, odezva,
      vyberLekci, vlozReseni, novyZak, obnovDatabazi, predvadeni, meritko, vsechnyLekce, vyberSoubor, importujTabulku,
      importujSql, exportujSql],
  );

  if (engine === "nacita") {
    return (
      <div className="dbb flex vyska-obrazovky w-full items-center justify-center">
        <p className="flex items-center text-[13px] text-dbb-slaby">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
          {t("Spouštím DB Browser… (pár sekund, nic se neinstaluje)", "Starting DB Browser… (a few seconds, nothing gets installed)")}
        </p>
      </div>
    );
  }
  if (engine === "chyba") {
    return (
      <div className="dbb flex vyska-obrazovky w-full items-center justify-center p-6">
        <p className="max-w-md text-center text-[13px]">
          {t(
            "Program se nepodařilo spustit – nenačetl se SQL engine. Zkontroluj připojení k internetu a načti stránku znovu.",
            "The program could not start – the SQL engine did not load. Check your internet connection and reload the page.",
          )}
        </p>
      </div>
    );
  }

  const zpetNaWeb = () => zavriDatabazi(() => window.location.assign(`${domu}#banka`));

  return (
    <DbbKontext.Provider value={api}>
      <div
        onDragOver={(e) => {
          // Jen soubory z počítače – ne přetahování textu v editoru.
          if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types, "Files") === -1) return;
          e.preventDefault();
          if (!pretahovani) nastavPretahovani(true);
        }}
        lang={jeAnglicky() ? "en" : undefined}
        className={`dbb relative flex select-none flex-col overflow-hidden ${meritko === 1 ? "vyska-obrazovky w-full" : ""}`}
        style={
          meritko === 1
            ? undefined
            : {
                width: `${100 / meritko}vw`,
                height: `${100 / meritko}vh`,
                transform: `scale(${meritko})`,
                transformOrigin: "0 0",
              }
        }
      >
        {predvadeni && (
          <div className="flex shrink-0 items-center bg-[#5b3fa0] px-3 py-1 text-[12px] text-white">
            <span className="flex-1">
              <b>{t("Režim předvádění", "Presentation mode")}</b>
              {t(
                " – postup a soubory se ukládají zvlášť, postup žáků na tomhle počítači se nemění. Řešení jdou ukázat hned.",
                " – progress and files are saved separately; the pupils' progress on this computer doesn't change. Solutions can be shown straight away.",
              )}
            </span>
            <button
              type="button"
              onClick={prepniPredvadeni}
              className="ml-3 border border-white/60 px-2.5 py-0.5 hover:bg-white/15"
            >
              {t("Ukončit předvádění", "End Presentation")}
            </button>
          </div>
        )}
        <>
            {uzke && (
              <div className="flex shrink-0 items-center bg-[#fff4ce] px-3 py-1.5 text-[12px] text-[#4a3500]">
                <span className="flex-1">
                  {t(
                    "Okno je na program úzké. Roztáhni ho, nebo přepni na webovou podobu kurzu (lekce 1–13).",
                    "The window is too narrow for the program. Make it wider, or switch to the web version of the course (lessons 1–13, in Czech).",
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => zavriDatabazi(() => prepniPodobu("web"))}
                  className="ml-3 border border-[#c9a227] bg-white px-2.5 py-0.5 hover:bg-[#fff8e1]"
                >
                  {t("Přepnout na webovou podobu", "Switch to the Web Version")}
                </button>
              </div>
            )}
            <Hlavicka soubor={otevrena} zpet={zpetNaWeb} />
            <NabidkaOkna
              novaDatabaze={() => zavriDatabazi(() => otevritDialog({ druh: "nova" }))}
              otevritDatabazi={() => otevritDialog({ druh: "otevrit" })}
              zavritDatabazi={() => zavriDatabazi()}
              konec={zpetNaWeb}
              zpetNaWeb={zpetNaWeb}
              webovaPodoba={() => zavriDatabazi(() => prepniPodobu("web"))}
              obnovitKnihovnu={() =>
                otevritDialog({
                  druh: "potvrdit",
                  titulek: t("Obnovit původní knihovna.db", "Restore Original knihovna.db"),
                  text: t("Soubor knihovna.db se vrátí do stavu, v jakém byl na začátku kurzu. Všechno, co jsi do něj zapsal(a) – třeba tabulka hodnoceni – zmizí. Postup v kurzu zůstane.", "The knihovna.db file goes back to how it was at the start of the course. Everything you wrote into it – the hodnoceni table, for example – disappears. Your progress in the course stays."),
                  tlacitko: t("Obnovit", "Restore"),
                  akce: obnovKnihovnu,
                })
              }
              novyZak={novyZak}
              ulozKopii={ulozKopii}
              predvadeni={prepniPredvadeni}
              jazyk={() => zavriDatabazi(() => window.location.assign(adresaVJazyce(jeAnglicky() ? "cs" : "en")))}
            />
            <Lista
              novaDatabaze={() => zavriDatabazi(() => otevritDialog({ druh: "nova" }))}
              otevritDatabazi={() => otevritDialog({ druh: "otevrit" })}
              zavritDatabazi={() => zavriDatabazi()}
            />
            <Hlavni />
            <StavovyRadek text={statusText} />
        </>
        <input
          ref={souborRef}
          type="file"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) zpracujSoubor(f, ucelRef.current);
            e.target.value = "";
          }}
        />
        {pretahovani && (
          <div
            className="absolute bottom-0 left-0 right-0 top-0 z-[150] flex items-center justify-center bg-dbb-akcent/10 p-6"
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => nastavPretahovani(false)}
            onDrop={(e) => {
              e.preventDefault();
              nastavPretahovani(false);
              const f = e.dataTransfer.files && e.dataTransfer.files[0];
              if (f) zpracujSoubor(f);
            }}
          >
            <div className="pointer-events-none rounded-[8px] border-2 border-dashed border-dbb-akcent bg-dbb-povrch px-8 py-6 text-center text-[13px] shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <p className="text-[15px] font-semibold">{t("Pusť soubor sem", "Drop the file here")}</p>
              <p className="mt-1.5 text-dbb-slaby">
                {t(
                  ".db otevře databázi · .csv přidá tabulku do otevřené databáze · .sql založí databázi",
                  ".db opens a database · .csv adds a table to the open database · .sql creates a database",
                )}
              </p>
            </div>
          </div>
        )}
        <Dialogy
          dialog={dialog}
          zavrit={() => otevritDialog(null)}
          rozhodnutiUlozit={rozhodnutiUlozit}
          otevritSoubor={(nazev) => {
            otevritDialog(null);
            zavriDatabazi(() => otevri(nazev));
          }}
          vytvoritSoubor={(nazev) => {
            const db = otevriDb();
            const bajty = db.export();
            db.close();
            ulozNaDisk({ ...diskRef.current, [nazev]: { bajty, zmeneno: Date.now() } });
            otevri(nazev);
            udalost("nova-databaze");
            otevritDialog({ druh: "tabulka" });
          }}
          nahratSoubor={nahrajSoubor}
          smazatSoubor={(nazev) => {
            const novy = { ...diskRef.current };
            delete novy[nazev];
            ulozNaDisk(novy);
          }}
        />
      </div>
    </DbbKontext.Provider>
  );
}

/** Karty vlevo a panel s kurzem vpravo. */
function Hlavni() {
  const { karta, meritko } = useDbb();
  const [sirkaDoku, nastavSirkuDoku] = useState(400);
  const tahRef = useRef<{ x: number; sirka: number } | null>(null);
  // Při předvádění je program zvětšený – pohyb myši se musí přepočítat.
  const meritkoRef = useRef(meritko);
  meritkoRef.current = meritko;

  useEffect(() => {
    const pohyb = (e: MouseEvent) => {
      const tah = tahRef.current;
      if (!tah) return;
      nastavSirkuDoku(Math.max(300, Math.min(640, tah.sirka - (e.clientX - tah.x) / meritkoRef.current)));
    };
    const konec = () => {
      tahRef.current = null;
    };
    window.addEventListener("mousemove", pohyb);
    window.addEventListener("mouseup", konec);
    return () => {
      window.removeEventListener("mousemove", pohyb);
      window.removeEventListener("mouseup", konec);
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col px-1.5 pb-1.5 pt-1">
        <Karty />
        <div className="relative min-h-0 flex-1 border border-t-0 border-dbb-linka bg-dbb-lista">
          {/* Všechny karty zůstávají připojené, jen skryté – jinak by se
              přepnutím karty zapomněl filtr v Prohlížet data i pozice v editoru. */}
          <div className={karta === "struktura" ? "h-full" : "hidden"}>
            <KartaStruktura />
          </div>
          <div className={karta === "data" ? "h-full" : "hidden"}>
            <KartaData />
          </div>
          <div className={karta === "pragma" ? "h-full" : "hidden"}>
            <KartaPragma />
          </div>
          <div className={karta === "sql" ? "h-full" : "hidden"}>
            <KartaSql />
          </div>
        </div>
      </div>
      {/* Táhlo mezi kartami a panelem – panel s kurzem jde rozšířit. */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={(e) => {
          tahRef.current = { x: e.clientX, sirka: sirkaDoku };
          e.preventDefault();
        }}
        className="w-1 shrink-0 cursor-col-resize hover:bg-dbb-akcent/30"
      />
      <div className="flex shrink-0 flex-col pb-1.5 pr-1.5 pt-1" style={{ width: sirkaDoku }}>
        <Dok />
      </div>
    </div>
  );
}
