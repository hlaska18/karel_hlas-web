/**
 * Klientský loader pro sql.js (SQLite zkompilované do WebAssembly).
 * Načítá se lazy z CDN – nezdržuje zbytek webu a nic se neinstaluje u žáka.
 */

const SQLJS_VERSION = "1.10.3";
const CDN = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;
const SQLJS_SRI = "sha384-8D3Rsfo535FqoC1pHCCQMrNf75UgzyoG/HQm9zOzITRrz3QKzecc2E7JXKGCXoWu";

export type SqlResult = { columns: string[]; values: unknown[][] };
export type SqlDb = {
  exec(sql: string): SqlResult[];
  /** Počet řádků, které změnil poslední INSERT / UPDATE / DELETE. */
  getRowsModified(): number;
  /** Uvolní paměť – u odložených kopií databáze při kontrole. */
  close(): void;
};

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
  // Neúspěch nekešujeme: jinak by každý další pokus (i po obnovení sítě) dostal
  // tu samou starou chybu a engine by se už nikdy nenačetl.
  scriptPromise.catch(() => {
    scriptPromise = null;
  });
  return scriptPromise;
}

/** Hotový engine – držíme ho, aby další databáze šly vyrobit i synchronně. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let engine: any = null;

/** Načte engine, vytvoří DB v paměti a naplní ji zadaným schématem. */
export async function createDb(schema: string): Promise<SqlDb> {
  const initSqlJs = await loadScript();
  const SQL = await initSqlJs({ locateFile: (f: string) => `${CDN}${f}` });
  engine = SQL;
  const db = new SQL.Database();
  db.run(schema);
  return db as SqlDb;
}

/**
 * Další čistá databáze ze stejného schématu, bez čekání na síť.
 *
 * Kontrola lekcí s INSERT/UPDATE/DELETE musí běžet stranou: kdyby se
 * referenční příkaz pustil na živé databázi žáka, samotné „Zkontrolovat“ by
 * data měnilo (a druhé kliknutí by spadlo na duplicitním klíči).
 * Volat až potom, co createDb jednou doběhlo.
 */
export function forkDb(schema: string): SqlDb {
  if (!engine) throw new Error("SQL engine ještě není načtený");
  const db = new engine.Database();
  db.run(schema);
  return db as SqlDb;
}
