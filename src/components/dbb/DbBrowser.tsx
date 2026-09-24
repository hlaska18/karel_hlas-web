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
import { KNIHOVNA, SLOZKA, nactiDisk, ulozDisk, type Disk } from "@/lib/dbb/soubory";
import { rozdelPrikazy, prikazNaPozici, spust, druhPrikazu, tabulky, pocetRadku, type Prikaz } from "@/lib/dbb/prikazy";
import { chybaCesky, TRANSAKCE_ZAKAZANE } from "@/lib/dbb/chyby";
import { KURZ, lekceHotova, type Kontext } from "@/lib/dbb/kurz";
import { vyhodnotDotaz, type SpusteniKontroly } from "@/lib/dbb/kontrola";
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
import { Titulek, NabidkaOkna, Lista, Karty, StavovyRadek } from "@/components/dbb/Okno";
import { KartaStruktura } from "@/components/dbb/KartaStruktura";
import { KartaData } from "@/components/dbb/KartaData";
import { KartaPragma } from "@/components/dbb/KartaPragma";
import { KartaSql } from "@/components/dbb/KartaSql";
import { Dok } from "@/components/dbb/Dok";
import { Dialogy } from "@/components/dbb/Dialogy";
import { Plocha } from "@/components/dbb/Plocha";

/* ───────────────────────── úložiště postupu v kurzu ─────────────────────────
 * Stejné klíče jako kurz na webu (`SqlPlayground`), aby se postup sčítal:
 * na telefonu běží pořád webový kurz, na počítači DB Browser. */
const KLIC_HOTOVO = "sql-kurz-hotovo";
const KLIC_NAVIC = "sql-kurz-navic";
const KLIC_OPSANO = "sql-kurz-opsano";
const KLIC_KURZ = "dbb-kurz";
const KLIC_EDITOR = "dbb-editor";
const KLIC_POSLEDNI = "dbb-posledni";

function nactiCisla(klic: string): number[] {
  try {
    const raw = localStorage.getItem(klic);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function uloz(klic: string, hodnota: unknown) {
  try {
    localStorage.setItem(klic, typeof hodnota === "string" ? hodnota : JSON.stringify(hodnota));
  } catch {
    /* bez úložiště jede kurz jen do zavření stránky */
  }
}

function prectiText(klic: string): string | null {
  try {
    return localStorage.getItem(klic);
  } catch {
    return null;
  }
}

type Otevrena = { nazev: string; db: SqlDbSoubor };

/** Vysvětlení chyby – jen když opravdu něco vysvětluje, ne když opakuje originál. */
function cesky(raw: string, seznam: string[]): string | undefined {
  const text = chybaCesky(raw, seznam);
  const holy = raw.trim().replace(/^Error:\s*/i, "");
  return text === holy ? undefined : text;
}

export function VirtualniDbBrowser({ domu = "/" }: { domu?: string }) {
  const [engine, nastavEngine] = useState<"nacita" | "hotovo" | "chyba">("nacita");
  const [disk, nastavDisk] = useState<Disk>({});
  const diskRef = useRef<Disk>({});
  const otevrenaRef = useRef<Otevrena | null>(null);
  const [otevrena, nastavOtevrenou] = useState<string | null>(null);
  const [zmeneno, nastavZmeneno] = useState(false);
  const [verze, nastavVerzi] = useState(0);
  const [karta, nastavKartu] = useState<Karta>("sql");
  const [dokKarta, nastavDokKartu] = useState<DokKarta>("kurz");
  const [editor, nastavEditorStav] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [vystup, nastavVystup] = useState<Vystup | null>(null);
  const [log, nastavLog] = useState<ZaznamLogu[]>([]);
  const [udalosti, nastavUdalosti] = useState<Set<string>>(new Set());
  const [prohlizeni, nastavProhlizeni] = useState<{ tabulka: string; id: string[] } | null>(null);
  const [dialog, otevritDialog] = useState<Dialog | null>(null);
  const [plocha, nastavPlochu] = useState<"ne" | "zavreno" | "minimalizovano">("ne");
  const [statusText, nastavStatusText] = useState("");
  const zahozenoRef = useRef<string | null>(null);
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

  const lekce = KURZ.find((l) => l.id === lekceId) || KURZ[0];

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

  const ulozNaDisk = useCallback((novy: Disk) => {
    diskRef.current = novy;
    nastavDisk(novy);
    ulozDisk(novy);
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
      if (zahozenoRef.current === nazev) {
        udalost("znovu-otevreno-po-zahozeni");
        zahozenoRef.current = null;
      }
      udalost(`otevreno:${nazev}`);
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
    ulozNaDisk({ ...diskRef.current, [o.nazev]: { bajty, zmeneno: Date.now() } });
    nastavZmeneno(false);
    pridejLog("aplikace", "RELEASE \"RESTOREPOINT\";");
    udalost("zapsano");
    status("Změny byly zapsány do souboru.");
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
    status("Změny byly vráceny – databáze je ve stavu po posledním zápisu.");
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
        zahozenoRef.current = o.nazev;
        udalost("zahozeno");
      }
      zavriInterne();
      potom();
    },
    [zapsat, zavriInterne, udalost],
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
    nastavLekceId(ulozeny.lekce && KURZ.some((l) => l.id === ulozeny.lekce) ? ulozeny.lekce : prvniNehotova ? prvniNehotova.id : 1);
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
        diskRef.current = d;
        nastavDisk(d);
        nastavEngine("hotovo");
        const posledni = prectiText(KLIC_POSLEDNI);
        otevri(posledni && d[posledni] ? posledni : KNIHOVNA);
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
    status(klice.length === 1 ? "Úkol splněn." : "Úkoly splněny.");
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
      nastavLekceId(id);
      nastavOdezvu(null);
      // Úkoly typu „rozbal tabulku“ nebo „vyzkoušej Vrátit změny“ se mají
      // udělat v téhle lekci – co žák udělal dřív, se nepočítá.
      nastavUdalosti(new Set());
    },
    [],
  );

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
    const t = lekce.tabulka;
    if (!o || !t || (lekce.knihovna && o.nazev !== KNIHOVNA) || tabulky(o.db).indexOf(t) === -1) {
      nastavVystup(null);
      return;
    }
    const r = precti(o.db, `SELECT * FROM ${uvoz(t)};`);
    nastavVystup({
      vysledek: r,
      zprava: [`Tady uvidíš výsledek svého dotazu. Zatím je tu obsah tabulky ${t}, ať víš, s čím pracuješ.`],
      chyba: false,
      nahled: t,
    });
    // Jen při změně lekce nebo otevřeného souboru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, lekceId, otevrena]);

  /* ─────────────────────────── spouštění SQL ─────────────────────────── */

  const spustit = useCallback(
    (rezim: "vse" | "radek") => {
      const o = otevrenaRef.current;
      const aktualni = lekce.ukoly.find((u) => !splnenoRef.current.has(u.klic));
      if (aktualni) pridejPokus(aktualni.klic);
      if (!o) {
        nastavVystup({
          vysledek: null,
          zprava: ["Není otevřená žádná databáze.", "Otevři ji přes Soubor → Otevřít databázi (Ctrl+O)."],
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
        nastavVystup({ vysledek: null, zprava: ["Editor je prázdný – napiš dotaz a spusť ho znovu."], chyba: false });
        return;
      }

      const beh = spust(o.db, prikazy);
      beh.provedene.forEach((p) => pridejLog("uzivatel", p.text));
      if (!beh.ok && beh.posledni) pridejLog("uzivatel", beh.posledni.text);
      if (beh.zmenil) nastavZmeneno(true);
      const posledni = beh.posledni;
      const naRadku = posledni ? [`Na řádku ${posledni.radek}:`, posledni.text] : [];

      if (!beh.ok) {
        nastavVystup({
          vysledek: null,
          zprava: beh.zakazano
            ? ["Příkaz nebyl proveden."].concat(naRadku)
            : ["Provádění skončilo s chybou.", `Výsledek: ${beh.chyba}`].concat(naRadku),
          chyba: true,
          cesky: beh.zakazano ? TRANSAKCE_ZAKAZANE : cesky(beh.chyba || "", tabulky(o.db)),
        });
        status("Provádění skončilo s chybou.");
      } else {
        const druh = posledni ? druhPrikazu(posledni.text) : "jiny";
        let vysledekText: string;
        if (druh === "cteni" && beh.vysledek) {
          const n = beh.vysledek.values.length;
          vysledekText = `Výsledek: ${pocetRadku(n, "vrácen")} za ${beh.ms} ms`;
        } else if (druh === "data") {
          vysledekText = `Výsledek: dotaz byl úspěšně proveden. Trvalo ${beh.ms} ms, ${pocetRadku(beh.zmenenoRadku, "ovlivněn")}.`;
        } else {
          vysledekText = `Výsledek: dotaz byl úspěšně proveden. Trvalo ${beh.ms} ms.`;
        }
        nastavVystup({
          vysledek: druh === "cteni" ? beh.vysledek : null,
          zprava: ["Provádění dokončeno bez chyb.", vysledekText].concat(naRadku),
          chyba: false,
        });
        status("Provádění dokončeno bez chyb.");

        // Vlastní SELECTy nad vlastní databází (lekce 19).
        if (o.nazev !== KNIHOVNA) {
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
          const h = vyhodnotDotaz(u, kb, { cista: () => forkDb(SCHEMA), ziva: o.db });
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
      if (!o) return "Není otevřená žádná databáze.";
      try {
        o.db.run(sql, params);
        pridejLog("uzivatel", zaznam || sql);
        nastavZmeneno(true);
        zmenaVerze();
        return null;
      } catch (e) {
        return chybaCesky(e instanceof Error ? e.message : String(e), tabulky(o.db));
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
    if (plocha !== "ne" || dialog) return;
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
      kurz: { lekceId, splneno, opsano, pokusy, odezva, vyberLekci, vlozReseni },
    }),
    [otevrena, verze, zmeneno, disk, karta, dokKarta, editor, nastavEditor, vystup, spustit, log, udalost,
      hlasProhlizeni, provedAplikaci, status, zapsat, vratit, lekceId, splneno, opsano, pokusy, odezva,
      vyberLekci, vlozReseni],
  );

  if (engine === "nacita") {
    return (
      <div className="dbb flex vyska-obrazovky w-full items-center justify-center">
        <p className="flex items-center text-[13px] text-dbb-slaby">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Spouštím DB Browser… (pár sekund, nic se neinstaluje)
        </p>
      </div>
    );
  }
  if (engine === "chyba") {
    return (
      <div className="dbb flex vyska-obrazovky w-full items-center justify-center p-6">
        <p className="max-w-md text-center text-[13px]">
          Program se nepodařilo spustit – nenačetl se SQL engine. Zkontroluj připojení k internetu a načti
          stránku znovu.
        </p>
      </div>
    );
  }

  const titulek = otevrena ? `DB Browser for SQLite - ${SLOZKA}\\${otevrena}` : "DB Browser for SQLite";

  return (
    <DbbKontext.Provider value={api}>
      <div className="dbb relative flex vyska-obrazovky w-full select-none flex-col overflow-hidden">
        {plocha !== "ne" ? (
          <Plocha
            minimalizovano={plocha === "minimalizovano"}
            spustit={(soubor) => {
              nastavPlochu("ne");
              if (soubor) otevri(soubor);
            }}
            obnovit={() => nastavPlochu("ne")}
          />
        ) : (
          <>
            <Titulek
              text={titulek}
              minimalizovat={() => nastavPlochu("minimalizovano")}
              zavrit={() => zavriDatabazi(() => nastavPlochu("zavreno"))}
            />
            <NabidkaOkna
              novaDatabaze={() => zavriDatabazi(() => otevritDialog({ druh: "nova" }))}
              otevritDatabazi={() => otevritDialog({ druh: "otevrit" })}
              zavritDatabazi={() => zavriDatabazi()}
              konec={() => zavriDatabazi(() => nastavPlochu("zavreno"))}
              zpetNaWeb={() => zavriDatabazi(() => window.location.assign(`${domu}#banka`))}
              obnovitKnihovnu={() =>
                otevritDialog({
                  druh: "potvrdit",
                  titulek: "Obnovit původní knihovna.db",
                  text: "Soubor knihovna.db se vrátí do stavu, v jakém byl na začátku kurzu. Všechno, co jsi do něj zapsal(a) – třeba tabulka hodnoceni – zmizí. Postup v kurzu zůstane.",
                  tlacitko: "Obnovit",
                  akce: () => {
                    const db = otevriDb();
                    db.exec(SCHEMA);
                    const bajty = db.export();
                    db.close();
                    const jeOtevrena = otevrenaRef.current && otevrenaRef.current.nazev === KNIHOVNA;
                    if (jeOtevrena) zavriInterne();
                    ulozNaDisk({ ...diskRef.current, [KNIHOVNA]: { bajty, zmeneno: Date.now() } });
                    if (jeOtevrena) otevri(KNIHOVNA);
                    status("Soubor knihovna.db je zpátky v původním stavu.");
                  },
                })
              }
              zacitZnovu={() =>
                otevritDialog({
                  druh: "potvrdit",
                  titulek: "Začít kurz znovu",
                  text: "Smaže se postup ve všech 19 lekcích (i v kurzu na webu v tomhle prohlížeči). Soubory databází zůstanou.",
                  tlacitko: "Začít znovu",
                  akce: () => {
                    nastavSplneno(new Set());
                    nastavOpsano(new Set());
                    nastavPokusy(new Set());
                    nastavLekceId(1);
                    nastavOdezvu(null);
                  },
                })
              }
            />
            <Lista
              novaDatabaze={() => zavriDatabazi(() => otevritDialog({ druh: "nova" }))}
              otevritDatabazi={() => otevritDialog({ druh: "otevrit" })}
              zavritDatabazi={() => zavriDatabazi()}
            />
            <Hlavni />
            <StavovyRadek text={statusText} />
          </>
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
  const { karta } = useDbb();
  const [sirkaDoku, nastavSirkuDoku] = useState(400);
  const tahRef = useRef<{ x: number; sirka: number } | null>(null);

  useEffect(() => {
    const pohyb = (e: MouseEvent) => {
      const t = tahRef.current;
      if (!t) return;
      nastavSirkuDoku(Math.max(300, Math.min(640, t.sirka - (e.clientX - t.x))));
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
