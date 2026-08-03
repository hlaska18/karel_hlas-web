"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  Database,
  Check,
  ArrowRight,
  BookOpen,
  PartyPopper,
  KeyRound,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { SCHEMA, SCHEMA_INFO, LESSONS, diffMessage, radky, sqlErrorCs } from "@/lib/sqlExercise";
import { createDb, forkDb, type SqlDb, type SqlResult } from "@/lib/sqljs";

/** Příkaz, který data mění – nic nevrací a živou databázi po sobě přepíše. */
const isMutation = (q: string) => /^\s*(insert|update|delete)\b/i.test(q);

const STORAGE_KEY = "sql-kurz-hotovo";
/** Rozepsané dotazy podle úkolu – ať se práce neztratí přepnutím lekce ani reloadem. */
const DRAFT_KEY = "sql-kurz-dotazy";
/** Splněné úlohy navíc – vedou se zvlášť, do postupu kurzu se nepočítají. */
const BONUS_KEY = "sql-kurz-navic";
/**
 * Lekce došlápnuté vloženým řešením. Nic to nezakazuje – kdo se zasekne doma
 * v devět večer, ať se odblokuje – ale postup pak neříká „umím to“ ani žákovi,
 * ani učiteli, který obchází třídu.
 */
const COPIED_KEY = "sql-kurz-opsano";

/** Porovná dva výsledky. Když má reference ORDER BY, záleží i na pořadí. */
function sameResult(a: SqlResult | null, b: SqlResult | null, ordered: boolean): boolean {
  const av = a?.values ?? [];
  const bv = b?.values ?? [];
  if (av.length !== bv.length) return false;
  const key = (rows: unknown[][]) => rows.map((r) => JSON.stringify(r.map((c) => String(c))));
  let ka = key(av);
  let kb = key(bv);
  if (!ordered) {
    ka = [...ka].sort();
    kb = [...kb].sort();
  }
  return ka.every((x, i) => x === kb[i]);
}

function loadSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveSet(key: string, value: Set<number>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
  } catch {
    /* ignore */
  }
}

function loadDrafts(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    /* ignore */
  }
  return {};
}

export function SqlPlayground() {
  const dbRef = useRef<SqlDb | null>(null);
  const [dbState, setDbState] = useState<"loading" | "ready" | "error">("loading");
  const [lessonId, setLessonId] = useState(1);
  const [mode, setMode] = useState<"main" | "bonus">("main");
  const [done, setDone] = useState<Set<number>>(new Set());
  const [doneBonus, setDoneBonus] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [why, setWhy] = useState("");
  const [changed, setChanged] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  /** Řešení se nabídne až po prvním pokusu o kontrolu, ne rovnou u zadání. */
  const [checked, setChecked] = useState(false);
  const [inserted, setInserted] = useState(false);

  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const bonus = mode === "bonus" ? lesson.bonus : undefined;
  const task = bonus ?? lesson;
  const allDone = done.size === LESSONS.length;
  const draftKey = bonus ? `${lessonId}b` : String(lessonId);
  const sql = drafts[draftKey] ?? "";

  useEffect(() => {
    // progres kurzu i rozepsané dotazy přežijí reload; začni první nehotovou lekcí
    const d = loadSet(STORAGE_KEY);
    setDone(d);
    setDoneBonus(loadSet(BONUS_KEY));
    setCopied(loadSet(COPIED_KEY));
    setDrafts(loadDrafts());
    const firstOpen = LESSONS.find((l) => !d.has(l.id));
    if (firstOpen) setLessonId(firstOpen.id);

    let alive = true;
    createDb(SCHEMA)
      .then((db) => {
        if (!alive) return;
        dbRef.current = db;
        setDbState("ready");
      })
      .catch((err) => {
        if (!alive) return;
        console.error("SQL engine se nepodařilo načíst:", err);
        setDbState("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  function addTo(key: string, setter: Dispatch<SetStateAction<Set<number>>>, id: number) {
    setter((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(key, next);
      return next;
    });
  }

  function setSql(value: string) {
    setDrafts((prev) => {
      const next = { ...prev, [draftKey]: value };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  /** Přepne úkol (jiná lekce, nebo úloha navíc v té stejné) a zahodí stav pokusu. */
  function selectTask(id: number, next: "main" | "bonus" = "main") {
    setLessonId(id);
    setMode(next);
    setResult(null);
    setError(null);
    setStatus("idle");
    setWhy("");
    setChanged("");
    setShowHint(false);
    setShowSolution(false);
    setChecked(false);
    setInserted(false);
  }

  /** Spustí dotaz; vrátí výsledek nebo vyhodí chybu. */
  function run(query: string): SqlResult | null {
    const db = dbRef.current;
    if (!db) return null;
    const res = db.exec(query);
    return res.length ? res[res.length - 1] : { columns: [], values: [] };
  }

  /** Vrátí knihovnu do výchozího stavu – po INSERT/UPDATE/DELETE od žáka. */
  function resetDb() {
    try {
      dbRef.current?.close();
      dbRef.current = forkDb(SCHEMA);
      setResult(null);
      setError(null);
      setStatus("idle");
      setChanged("Databáze je zpátky ve výchozím stavu.");
    } catch (e) {
      setError(sqlErrorCs(e instanceof Error ? e.message : String(e)));
    }
  }

  function onRun() {
    setStatus("idle");
    if (!sql.trim()) return;
    try {
      const res = run(sql);
      setError(null);
      // INSERT/UPDATE/DELETE nevrací řádky – místo prázdna ukaž, kolik se jich
      // změnilo, a rovnou stav tabulky, aby byl efekt příkazu vidět.
      if (isMutation(sql) && dbRef.current) {
        const n = dbRef.current.getRowsModified();
        setChanged(`Změněno ${n} ${radky(n)}. Takhle tabulka vypadá teď:`);
        setResult(task.check ? run(task.check) : res);
      } else {
        setChanged("");
        setResult(res);
      }
    } catch (e) {
      setError(sqlErrorCs(e instanceof Error ? e.message : String(e)));
      setResult(null);
      setChanged("");
    }
  }

  /**
   * U lekcí, které data mění, se porovnává stav tabulky po příkazu – a to
   * stranou, na dvou odložených kopiích. Kdyby referenční příkaz běžel na
   * živé databázi, samotná kontrola by data měnila.
   */
  function checkMutation(): [SqlResult | null, SqlResult | null] {
    const mineDb = forkDb(SCHEMA);
    const refDb = forkDb(SCHEMA);
    try {
      const last = (r: SqlResult[]) => (r.length ? r[r.length - 1] : { columns: [], values: [] });
      mineDb.exec(sql);
      refDb.exec(task.reference);
      return [last(mineDb.exec(task.check!)), last(refDb.exec(task.check!))];
    } finally {
      mineDb.close();
      refDb.close();
    }
  }

  function onCheck() {
    if (!sql.trim()) return;
    try {
      const [mine, ref] = task.check ? checkMutation() : [run(sql), run(task.reference)];
      setResult(mine);
      setError(null);
      setChecked(true);
      // Kontrola měnících úkolů běží nad čistou kopií, „Spustit" nad živou
      // databází – bez téhle věty se tabulka mezi dvěma kliknutími záhadně mění.
      setChanged(task.check ? "Stav tabulky po tvém příkazu (kontrola běží nad čistou databází):" : "");
      const ordered = /order\s+by/i.test(task.reference);
      if (sameResult(mine, ref, ordered)) {
        setStatus("correct");
        setWhy("");
        addTo(bonus ? BONUS_KEY : STORAGE_KEY, bonus ? setDoneBonus : setDone, lesson.id);
        if (inserted && !bonus) addTo(COPIED_KEY, setCopied, lesson.id);
      } else {
        setStatus("wrong");
        setWhy(diffMessage(mine, ref, ordered, Boolean(task.check)));
      }
    } catch (e) {
      setError(sqlErrorCs(e instanceof Error ? e.message : String(e)));
      setResult(null);
      setStatus("idle");
      setChanged("");
      setChecked(true);
    }
  }

  if (dbState === "loading") {
    return (
      <div className="glass flex items-center gap-3 rounded-2xl p-6 text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-5 w-5 animate-spin text-accent-600" />
        Spouštím SQL engine v prohlížeči… (pár vteřin, nic se nestahuje do počítače)
      </div>
    );
  }
  if (dbState === "error") {
    return (
      <div className="glass rounded-2xl p-6 text-red-600 dark:text-red-400">
        SQL engine se nepodařilo načíst. Zkontroluj připojení a načti stránku znovu.
      </div>
    );
  }

  const nextLesson = LESSONS.find((l) => l.id === lessonId + 1);

  return (
    <div className="space-y-6">
      {/* Průběh kurzu */}
      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <p className="font-semibold text-zinc-700 dark:text-zinc-200">
            Lekce {lesson.id} z {LESSONS.length}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            Hotovo {done.size}/{LESSONS.length}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${(done.size / LESSONS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {LESSONS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => selectTask(l.id)}
              title={copied.has(l.id) ? `${l.title} (splněno s pomocí řešení)` : l.title}
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                l.id === lessonId
                  ? "bg-accent-600 text-white"
                  : copied.has(l.id)
                    ? "bg-black/[0.06] text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                    : done.has(l.id)
                      ? "bg-accent-500/15 text-accent-700 dark:text-accent-300"
                      : "glass-soft text-zinc-700 hover:text-accent-600 dark:text-zinc-200"
              }`}
            >
              {done.has(l.id) && l.id !== lessonId ? <Check className="h-4 w-4" /> : l.id}
              {doneBonus.has(l.id) && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Kurz dokončen */}
      {allDone && (
        <div className="glass-accent rounded-2xl p-5">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-white">
            <PartyPopper className="h-5 w-5 text-accent-600 dark:text-accent-300" /> Kurz dokončen –
            všech {LESSONS.length} lekcí!
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            Umíš data z databáze vybrat i změnit. Teď pokračuj do praxe: ta samá databáze v
            opravdovém programu.
          </p>
          <a
            href="#praxe"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
          >
            Pokračovat do praxe <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Výklad lekce */}
      <div className="glass rounded-2xl p-5">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
          <BookOpen className="h-4 w-4" /> Lekce {lesson.id} · {lesson.title}
        </p>
        <p className="mt-3 leading-relaxed text-zinc-700 dark:text-zinc-200">{lesson.teach}</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/5 px-4 py-3 font-mono text-sm text-zinc-800 dark:bg-white/5 dark:text-zinc-100">
          {lesson.example}
        </pre>
      </div>

      {/* Úkol */}
      <div className="glass rounded-2xl p-5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {bonus ? "Úloha navíc" : "Tvůj úkol"}
          {bonus && (
            <button
              type="button"
              onClick={() => selectTask(lessonId)}
              className="rounded-full px-2 py-0.5 text-xs font-semibold normal-case tracking-normal text-accent-700 transition hover:underline dark:text-accent-300"
            >
              zpět na hlavní úkol
            </button>
          )}
        </p>
        <p className="mt-2 text-lg text-zinc-900 dark:text-white">{task.zadani}</p>
        {/* Dva stupně: nejdřív postrčení, řešení až když ani to nestačí.
            Dřív byl v nápovědě rovnou celý dotaz, takže se nedalo „jen trochu“
            poradit – a kdo se zasekl, neměl se jak odblokovat jinak než opsáním. */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400"
          >
            <Lightbulb className="h-4 w-4" /> {showHint ? "Skrýt nápovědu" : "Nápověda"}
          </button>
          {showHint && checked && (
            <button
              type="button"
              onClick={() => setShowSolution((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400"
            >
              <KeyRound className="h-4 w-4" /> {showSolution ? "Skrýt řešení" : "Ukázat řešení"}
            </button>
          )}
        </div>
        {showHint && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{task.hint}</p>}
        {showHint && !checked && (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Řešení se nabídne, až jednou zkusíš Zkontrolovat.
          </p>
        )}
        {showSolution && (
          <div className="mt-3">
            <pre className="overflow-x-auto rounded-xl bg-black/5 px-4 py-3 font-mono text-sm text-zinc-800 dark:bg-white/5 dark:text-zinc-100">
              {task.reference}
            </pre>
            <button
              type="button"
              onClick={() => {
                setSql(task.reference);
                setInserted(true);
              }}
              className="mt-2 text-sm font-medium text-accent-700 transition hover:underline dark:text-accent-300"
            >
              Vložit do editoru
            </button>
          </div>
        )}
      </div>

      {/* Struktura tabulek */}
      <div className="glass-soft flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
        <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-500 dark:text-zinc-400">
          <Database className="h-3.5 w-3.5" /> Tabulky:
        </span>
        {SCHEMA_INFO.map((s) => (
          <span key={s.table}>
            <b className="font-semibold text-zinc-800 dark:text-zinc-100">{s.table}</b> ({s.columns})
          </span>
        ))}
      </div>

      {/* Editor */}
      <div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter spustí dotaz – jinak se musí pokaždé sáhnout po myši.
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              onRun();
            }
          }}
          spellCheck={false}
          rows={4}
          placeholder="Sem napiš svůj SQL dotaz…"
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 font-mono text-sm text-zinc-900 shadow-inner outline-none transition focus:border-accent-400 dark:border-white/15 dark:bg-black/30 dark:text-zinc-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRun}
            className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
          >
            <Play className="h-4 w-4" /> Spustit
          </button>
          <button
            type="button"
            onClick={onCheck}
            className="glass-soft inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
          >
            <CheckCircle2 className="h-4 w-4" /> Zkontrolovat
          </button>
          {/* Od lekce s INSERTem si žák databázi mění pod rukama – musí mít
              jak ji vrátit, jinak si po jednom DELETE rozbije zbytek kurzu. */}
          <button
            type="button"
            onClick={resetDb}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400"
          >
            <RotateCcw className="h-4 w-4" /> Obnovit databázi
          </button>
          <span className="hidden text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            Ctrl+Enter spustí dotaz
          </span>
        </div>
      </div>

      {/* Vyhodnocení */}
      {status === "correct" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-500/15 px-4 py-3 text-accent-700 dark:text-accent-300">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Správně!
          </span>
          {/* Úloha navíc se nabízí až po vyřešení hlavní – kdo spěchá, jde dál. */}
          {!bonus && lesson.bonus && !doneBonus.has(lesson.id) && (
            <button
              type="button"
              onClick={() => selectTask(lesson.id, "bonus")}
              className="glass-soft inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:text-accent-600 dark:text-zinc-200"
            >
              <Sparkles className="h-4 w-4" /> Úloha navíc
            </button>
          )}
          {nextLesson ? (
            <button
              type="button"
              onClick={() => selectTask(nextLesson.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              Další lekce: {nextLesson.title} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <a
              href="#praxe"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-500"
            >
              Pokračovat do praxe <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
      {status === "wrong" && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-500/15 px-4 py-3 text-amber-700 dark:text-amber-300">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="leading-relaxed">{why}</span>
        </div>
      )}

      {/* Chyba z SQLite */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 font-mono text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Výsledná tabulka */}
      {changed && !error && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{changed}</p>
      )}
      {result && !error && <ResultTable result={result} />}
    </div>
  );
}

function ResultTable({ result }: { result: SqlResult }) {
  if (result.values.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Dotaz nevrátil žádné řádky.</p>;
  }
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10">
            {result.columns.map((c, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-4 py-2.5 text-left font-semibold text-zinc-700 dark:text-zinc-200"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.values.map((row, ri) => (
            <tr key={ri} className="border-b border-black/5 last:border-0 dark:border-white/5">
              {row.map((cell, ci) => (
                <td key={ci} className="whitespace-nowrap px-4 py-2 text-zinc-600 dark:text-zinc-300">
                  {cell === null ? "–" : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-zinc-400">
        {result.values.length} {radky(result.values.length)}
      </p>
    </div>
  );
}
