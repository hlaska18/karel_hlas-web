/**
 * Vlastní kopie SQL enginu v public/sqljs/<verze>/ (scripts/sqljs-kopie.mjs).
 *
 * Hlídá, že kopie patří k verzi, kterou loader načítá, a že v ní nezůstala
 * syntaxe, kterou cíl webu (Chrome 64, Safari 12) nepřečte. Neznámá syntaxe
 * neshodí jednu funkci, ale celý soubor – kurz by vůbec nenaběhl.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SQLJS_VERSION } from "@/lib/sqljs";

const koren = process.cwd();
const kopie = join(koren, "public", "sqljs", SQLJS_VERSION);

describe("vlastní kopie sql.js", () => {
  it("odpovídá verzi v loaderu i v node_modules", () => {
    const balik = JSON.parse(readFileSync(join(koren, "node_modules", "sql.js", "package.json"), "utf8"));
    expect(balik.version).toBe(SQLJS_VERSION);
    expect(existsSync(join(kopie, "sql-wasm.js"))).toBe(true);
    expect(existsSync(join(kopie, "LICENSE"))).toBe(true);
  });

  it(".wasm je beze změny z balíku", () => {
    const nase = readFileSync(join(kopie, "sql-wasm.wasm"));
    const puvodni = readFileSync(join(koren, "node_modules", "sql.js", "dist", "sql-wasm.wasm"));
    expect(nase.equals(puvodni)).toBe(true);
  });

  it("neobsahuje ?. ani ?? (Chrome 64, Safari 12)", () => {
    const js = readFileSync(join(kopie, "sql-wasm.js"), "utf8");
    expect(/\?\.[A-Za-z_$([]/.test(js)).toBe(false);
    expect(/\?\?/.test(js)).toBe(false);
    // Loader čte globální initSqlJs – překlad ho nesmí přejmenovat.
    expect(/^var [^;]*\binitSqlJs=function/.test(js)).toBe(true);
  });
});
