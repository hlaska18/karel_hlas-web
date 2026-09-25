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
    const Database = vi.fn(function () { return { run, exec: vi.fn() }; });
    const initSqlJs: InitSqlJs = vi.fn().mockResolvedValue({ Database });
    // The "loaded" CDN script is what exposes window.initSqlJs.
    const append = stubScriptLoading("load", () => {
      (window as Win).initSqlJs = initSqlJs;
    });

    const db = await createDb("CREATE TABLE t(x);");

    // Engine from the site's own copy, .wasm from the same place.
    expect(initSqlJs).toHaveBeenCalledTimes(1);
    const cfg = initSqlJs.mock.calls[0][0] as { locateFile: (f: string) => string };
    expect(cfg.locateFile("sql-wasm.wasm")).toMatch(/^\/sqljs\/[\d.]+\/sql-wasm\.wasm$/);
    expect((append.mock.calls[0][0] as HTMLScriptElement).src).toMatch(/\/sqljs\/[\d.]+\/sql-wasm\.js$/);
    expect(run).toHaveBeenCalledWith("CREATE TABLE t(x);");
    expect(typeof db.exec).toBe("function");
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("reuses an already-present global engine without appending a script", async () => {
    const createDb = await freshCreateDb();
    const run = vi.fn();
    const initSqlJs: InitSqlJs = vi
      .fn()
      .mockResolvedValue({ Database: vi.fn(function () { return { run, exec: vi.fn() }; }) });
    (window as Win).initSqlJs = initSqlJs;
    const append = stubScriptLoading("load");

    await createDb("SELECT 1;");

    expect(append).not.toHaveBeenCalled();
    expect(initSqlJs).toHaveBeenCalled();
  });

  it("falls back to the CDN when the site's own copy fails", async () => {
    const createDb = await freshCreateDb();
    const run = vi.fn();
    const initSqlJs: InitSqlJs = vi.fn().mockResolvedValue({ Database: vi.fn(function () { return { run, exec: vi.fn() }; }) });
    let pokus = 0;
    const append = vi.spyOn(document.head, "appendChild").mockImplementation(((node: Node) => {
      const s = node as HTMLScriptElement;
      pokus++;
      queueMicrotask(() => {
        if (pokus === 1) s.onerror?.(new Event("error"));
        else {
          (window as Win).initSqlJs = initSqlJs;
          s.onload?.(new Event("load"));
        }
      });
      return node;
    }) as typeof document.head.appendChild);

    await createDb("SELECT 1;");

    expect(append).toHaveBeenCalledTimes(2);
    const cdn = append.mock.calls[1][0] as HTMLScriptElement;
    expect(cdn.src).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/.+sql-wasm\.js$/);
    expect(cdn.integrity).toMatch(/^sha384-/);
    const cfg = initSqlJs.mock.calls[0][0] as { locateFile: (f: string) => string };
    expect(cfg.locateFile("sql-wasm.wasm")).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/.+sql-wasm\.wasm$/);
  });

  it("rejects when both the own copy and the CDN fail to download", async () => {
    const createDb = await freshCreateDb();
    const append = stubScriptLoading("error");

    await expect(createDb("SELECT 1;")).rejects.toThrow(/SQL engine/);
    expect(append).toHaveBeenCalledTimes(2);
  });

  it("rejects when the script loads but the global is missing", async () => {
    const createDb = await freshCreateDb();
    stubScriptLoading("load");
    // window.initSqlJs never set by the "loaded" script.

    await expect(createDb("SELECT 1;")).rejects.toThrow(/sql\.js se nenačetlo/);
  });
});
