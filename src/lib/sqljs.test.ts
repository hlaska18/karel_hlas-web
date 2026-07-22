// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type InitSqlJs = ReturnType<typeof vi.fn>;
type Win = typeof window & { initSqlJs?: InitSqlJs };

function stubScriptLoading(mode: "load" | "error", onBeforeLoad?: () => void) {
  return vi.spyOn(document.head, "appendChild").mockImplementation(((node: Node) => {
    const s = node as HTMLScriptElement;
    queueMicrotask(() => {
      if (mode === "error") s.onerror?.(new Event("error"));
      else {
        onBeforeLoad?.();
        s.onload?.(new Event("load"));
      }
    });
    return node;
  }) as typeof document.head.appendChild);
}

async function freshCreateDb() {
  vi.resetModules();
  return (await import("@/lib/sqljs")).createDb;
}

describe("createDb", () => {
  beforeEach(() => {
    delete (window as Win).initSqlJs;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the engine, builds an in-memory DB and runs the schema", async () => {
    const createDb = await freshCreateDb();
    const run = vi.fn();
    const Database = vi.fn(() => ({ run, exec: vi.fn() }));
    const initSqlJs: InitSqlJs = vi.fn().mockResolvedValue({ Database });
    // The "loaded" CDN script is what exposes window.initSqlJs.
    const append = stubScriptLoading("load", () => {
      (window as Win).initSqlJs = initSqlJs;
    });

    const db = await createDb("CREATE TABLE t(x);");

    // Engine located from the same CDN base as the loader script.
    expect(initSqlJs).toHaveBeenCalledTimes(1);
    const cfg = initSqlJs.mock.calls[0][0] as { locateFile: (f: string) => string };
    expect(cfg.locateFile("sql-wasm.wasm")).toMatch(/^https:\/\/.+sql-wasm\.wasm$/);
    expect(run).toHaveBeenCalledWith("CREATE TABLE t(x);");
    expect(typeof db.exec).toBe("function");
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("reuses an already-present global engine without appending a script", async () => {
    const createDb = await freshCreateDb();
    const run = vi.fn();
    const initSqlJs: InitSqlJs = vi
      .fn()
      .mockResolvedValue({ Database: vi.fn(() => ({ run, exec: vi.fn() })) });
    (window as Win).initSqlJs = initSqlJs;
    const append = stubScriptLoading("load");

    await createDb("SELECT 1;");

    expect(append).not.toHaveBeenCalled();
    expect(initSqlJs).toHaveBeenCalled();
  });

  it("rejects when the engine script fails to download", async () => {
    const createDb = await freshCreateDb();
    stubScriptLoading("error");

    await expect(createDb("SELECT 1;")).rejects.toThrow(/SQL engine/);
  });

  it("rejects when the script loads but the global is missing", async () => {
    const createDb = await freshCreateDb();
    stubScriptLoading("load");
    // window.initSqlJs never set by the "loaded" script.

    await expect(createDb("SELECT 1;")).rejects.toThrow(/sql\.js se nenačetlo/);
  });
});
