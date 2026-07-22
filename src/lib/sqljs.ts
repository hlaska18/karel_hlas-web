/**
 * Klientský loader pro sql.js (SQLite zkompilované do WebAssembly).
 * Načítá se lazy z CDN – nezdržuje zbytek webu a nic se neinstaluje u žáka.
 */

const SQLJS_VERSION = "1.10.3";
const CDN = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;
const SQLJS_SRI = "sha384-8D3Rsfo535FqoC1pHCCQMrNf75UgzyoG/HQm9zOzITRrz3QKzecc2E7JXKGCXoWu";

export type SqlResult = { columns: string[]; values: unknown[][] };
export type SqlDb = { exec(sql: string): SqlResult[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InitSqlJs = (cfg: { locateFile: (f: string) => string }) => Promise<any>;

let scriptPromise: Promise<InitSqlJs> | null = null;

function loadScript(): Promise<InitSqlJs> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const w = window as unknown as { initSqlJs?: InitSqlJs };
    if (w.initSqlJs) return resolve(w.initSqlJs);
    const s = document.createElement("script");
    s.src = `${CDN}sql-wasm.js`;
    s.async = true;
    s.integrity = SQLJS_SRI;
    s.crossOrigin = "anonymous";
    s.onload = () =>
      w.initSqlJs ? resolve(w.initSqlJs) : reject(new Error("sql.js se nenačetlo"));
    s.onerror = () => reject(new Error("Nepodařilo se stáhnout SQL engine"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Načte engine, vytvoří DB v paměti a naplní ji zadaným schématem. */
export async function createDb(schema: string): Promise<SqlDb> {
  const initSqlJs = await loadScript();
  const SQL = await initSqlJs({ locateFile: (f: string) => `${CDN}${f}` });
  const db = new SQL.Database();
  db.run(schema);
  return db as SqlDb;
}
