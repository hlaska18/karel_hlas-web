"use client";

import { useEffect, useRef, useState } from "react";
import { Play, CheckCircle2, XCircle, Lightbulb, Loader2, Database } from "lucide-react";
import { SCHEMA, SCHEMA_INFO, TASKS } from "@/lib/sqlExercise";
import { createDb, type SqlDb, type SqlResult } from "@/lib/sqljs";

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

export function SqlPlayground() {
  const dbRef = useRef<SqlDb | null>(null);
  const [dbState, setDbState] = useState<"loading" | "ready" | "error">("loading");
  const [taskId, setTaskId] = useState(1);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<SqlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);

  const task = TASKS.find((t) => t.id === taskId)!;

  useEffect(() => {
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

  function selectTask(id: number) {
    setTaskId(id);
    setSql("");
    setResult(null);
    setError(null);
    setStatus("idle");
    setShowHint(false);
  }

  /** Spustí dotaz; vrátí výsledek nebo nastaví chybu. */
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
      const ref = run(task.reference);
      setResult(mine);
      setError(null);
      const ordered = /order\s+by/i.test(task.reference);
      setStatus(sameResult(mine, ref, ordered) ? "correct" : "wrong");
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

  return (
    <div className="space-y-6">
      {/* Výběr úlohy */}
      <div className="flex flex-wrap gap-2">
        {TASKS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTask(t.id)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
              t.id === taskId
                ? "bg-accent-600 text-white"
                : "glass-soft text-zinc-700 hover:text-accent-600 dark:text-zinc-200"
            }`}
          >
            {t.id}
          </button>
        ))}
      </div>

      {/* Zadání */}
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
          Úloha {task.id} z {TASKS.length}
        </p>
        <p className="mt-2 text-lg text-zinc-900 dark:text-white">{task.zadani}</p>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-accent-600 dark:text-zinc-400"
        >
          <Lightbulb className="h-4 w-4" /> {showHint ? "Skrýt nápovědu" : "Nápověda"}
        </button>
        {showHint && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{task.hint}</p>}
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
          placeholder="Sem napiš svůj SQL dotaz, např. SELECT * FROM knihy;"
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
        <div className="flex items-center gap-2 rounded-2xl bg-accent-500/15 px-4 py-3 text-accent-700 dark:text-accent-300">
          <CheckCircle2 className="h-5 w-5" /> Správně! Výsledek přesně odpovídá zadání.
        </div>
      )}
      {status === "wrong" && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-3 text-amber-700 dark:text-amber-300">
          <XCircle className="h-5 w-5" /> Zatím to nesedí. Zkus nápovědu a porovnej, co ti vyšlo.
        </div>
      )}

      {/* Chyba z SQLite */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 px-4 py-3 font-mono text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Výsledná tabulka */}
      {result && !error && (
        <ResultTable result={result} />
      )}
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
