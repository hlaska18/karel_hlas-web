"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { SCHEMA, SCHEMA_INFO, LESSONS } from "@/lib/sqlExercise";
import { createDb, type SqlDb, type SqlResult } from "@/lib/sqljs";

const STORAGE_KEY = "sql-kurz-hotovo";

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

function loadDone(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function SqlPlayground() {
  const dbRef = useRef<SqlDb | null>(null);
  const [dbState, setDbState] = useState<"loading" | "ready" | "error">("loading");
  const [lessonId, setLessonId] = useState(1);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);

  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const allDone = done.size === LESSONS.length;

  useEffect(() => {
    // progres kurzu přežije reload (localStorage); začni první nehotovou lekcí
    const d = loadDone();
    setDone(d);
    const firstOpen = LESSONS.find((l) => !d.has(l.id));
    if (firstOpen) setLessonId(firstOpen.id);

    let alive = true;
    createDb(SCHEMA)
      .then((db) => {
        if (!alive) return;
        dbRef.current = db;
        setDbState("ready");
      })
      .catch(() => alive && setDbState("error"));
    return () => {
      alive = false;
    };
  }, []);

  function markDone(id: number) {
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function selectLesson(id: number) {
    setLessonId(id);
    setSql("");
    setResult(null);
    setError(null);
    setStatus("idle");
    setShowHint(false);
  }

  /** Spustí dotaz; vrátí výsledek nebo vyhodí chybu. */
  function run(query: string): SqlResult | null {
    const db = dbRef.current;
    if (!db) return null;
    const res = db.exec(query);
    return res.length ? res[res.length - 1] : { columns: [], values: [] };
  }

  function onRun() {
    setStatus("idle");
    if (!sql.trim()) return;
    try {
      setResult(run(sql));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    }
  }

  function onCheck() {
    if (!sql.trim()) return;
    try {
      const mine = run(sql);
      const ref = run(lesson.reference);
      setResult(mine);
      setError(null);
      const ordered = /order\s+by/i.test(lesson.reference);
      if (sameResult(mine, ref, ordered)) {
        setStatus("correct");
        markDone(lesson.id);
      } else {
        setStatus("wrong");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
      setStatus("idle");
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
              onClick={() => selectLesson(l.id)}
              title={l.title}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                l.id === lessonId
                  ? "bg-accent-600 text-white"
                  : done.has(l.id)
                    ? "bg-accent-500/15 text-accent-700 dark:text-accent-300"
                    : "glass-soft text-zinc-700 hover:text-accent-600 dark:text-zinc-200"
              }`}
            >
              {done.has(l.id) && l.id !== lessonId ? <Check className="h-4 w-4" /> : l.id}
            </button>
          ))}
        </div>
      </div>

      {/* Kurz dokončen */}
      {allDone && (
        <div className="glass-accent rounded-2xl p-5">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900 dark:text-white">
            <PartyPopper className="h-5 w-5 text-accent-600 dark:text-accent-300" /> Kurz dokončen —
            všech {LESSONS.length} lekcí!
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            Umíš základní SQL dotazy. Teď pokračuj do praxe: ta samá databáze v opravdovém
            programu.
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
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tvůj úkol
        </p>
        <p className="mt-2 text-lg text-zinc-900 dark:text-white">{lesson.zadani}</p>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400"
        >
          <Lightbulb className="h-4 w-4" /> {showHint ? "Skrýt nápovědu" : "Nápověda"}
        </button>
        {showHint && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{lesson.hint}</p>}
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
          spellCheck={false}
          rows={4}
          placeholder="Sem napiš svůj SQL dotaz…"
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 font-mono text-sm text-zinc-900 shadow-inner outline-none transition focus:border-accent-400 dark:border-white/15 dark:bg-black/30 dark:text-zinc-100"
        />
        <div className="mt-3 flex flex-wrap gap-2.5">
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
        </div>
      </div>

      {/* Vyhodnocení */}
      {status === "correct" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent-500/15 px-4 py-3 text-accent-700 dark:text-accent-300">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Správně!
          </span>
          {nextLesson ? (
            <button
              type="button"
              onClick={() => selectLesson(nextLesson.id)}
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
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-3 text-amber-700 dark:text-amber-300">
          <XCircle className="h-5 w-5" /> Zatím to nesedí. Mrkni na výklad a nápovědu výš a porovnej
          svůj výsledek.
        </div>
      )}

      {/* Chyba z SQLite */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 font-mono text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Výsledná tabulka */}
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
                  {cell === null ? "—" : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-zinc-400">{result.values.length} řádků</p>
    </div>
  );
}
