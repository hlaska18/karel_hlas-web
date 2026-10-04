/**
 * Klientský náhled .xlsx – vlastní vykreslovač (Karel 2. 10. 2026: „chci
 * vidět, co tam skutečně je“).
 *
 * Hotové knihovny ukázaly jen buňky. V bance ale v sešitech leží i zadání
 * v textových polích, obrázky a grafy (Sbírka úloh, cvičebnice), takže se
 * sešit čte tady: JSZip rozbalí OOXML a z něj se postaví
 *   - mřížka s formátem buněk (písmo, výplň, ohraničení, zarovnání, sloučení,
 *     šířky a výšky), hodnotami z uložené mezipaměti vzorců a formátem čísel
 *     přes SSF (SheetJS, Apache-2.0),
 *   - podmíněné formátování (hodnota, text, duplicity, barevná škála, ikony),
 *   - formátované tabulky (záhlaví a pruhy), komentáře (červený roh),
 *   - kresby: textová pole a tvary, obrázky a grafy (vlastní SVG).
 *
 * Nic se nikam neposílá, knihovny jdou z vlastní kopie (CDN je záloha) jako u Wordu.
 * Zjednodušeno: vzorce se nepočítají (bere se hodnota, kterou uložil Excel),
 * podmíněné formátování „vzorcem“ se vynechá a velké listy se oříznou.
 */

import { nactiKnihovnu } from "@/lib/knihovny";

const MAX_ROWS = 600;
const MAX_COLS = 60;
const SVG_NS = "http://www.w3.org/2000/svg";

type JsZipFile = { async(type: "string" | "uint8array"): Promise<string | Uint8Array> };
type JsZip = { file(path: string): JsZipFile | null; files: Record<string, unknown> };
type JsZipGlobal = { loadAsync(data: ArrayBuffer): Promise<JsZip> };
type SsfGlobal = { format(fmt: string, v: number, o?: Record<string, unknown>): string; is_date(fmt: string): boolean };

// ---------------------------------------------------------------- XML

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}
/** Přímí potomci podle lokálního jména (bez ohledu na jmenný prostor). */
function kids(el: Element | null | undefined, name?: string): Element[] {
  if (!el) return [];
  return Array.from(el.children).filter((c) => !name || c.localName === name);
}
function kid(el: Element | null | undefined, name: string): Element | null {
  return kids(el, name)[0] ?? null;
}
/** Potomek na cestě lokálních jmen, např. path(el, "spPr", "solidFill"). */
function path(el: Element | null | undefined, ...names: string[]): Element | null {
  let cur: Element | null = el ?? null;
  for (const n of names) {
    cur = kid(cur, n);
    if (!cur) return null;
  }
  return cur;
}
function all(el: Element | Document | null | undefined, name: string): Element[] {
  if (!el) return [];
  return Array.from(el.getElementsByTagNameNS("*", name));
}
function attr(el: Element | null | undefined, name: string): string | null {
  return el ? el.getAttribute(name) : null;
}
function num(el: Element | null | undefined, name: string, def = 0): number {
  const v = attr(el, name);
  return v == null || v === "" ? def : Number(v);
}

async function zipText(zip: JsZip, p: string): Promise<string | null> {
  const f = zip.file(p);
  return f ? ((await f.async("string")) as string) : null;
}

/** Cíle vztahů části (`xl/worksheets/sheet1.xml` → mapa rId → cesta). */
async function rels(zip: JsZip, part: string): Promise<Map<string, { type: string; target: string }>> {
  const dir = part.slice(0, part.lastIndexOf("/"));
  const relsPath = `${dir}/_rels/${part.slice(part.lastIndexOf("/") + 1)}.rels`;
  const out = new Map<string, { type: string; target: string }>();
  const xml = await zipText(zip, relsPath);
  if (!xml) return out;
  for (const r of all(parseXml(xml), "Relationship")) {
    const t = attr(r, "Target") ?? "";
    let target = t;
    if (attr(r, "TargetMode") !== "External") {
      if (t.startsWith("/")) target = t.slice(1);
      else {
        const parts = `${dir}/${t}`.split("/");
        const stack: string[] = [];
        for (const s of parts) {
          if (s === "..") stack.pop();
          else if (s !== ".") stack.push(s);
        }
        target = stack.join("/");
      }
    }
    out.set(attr(r, "Id") ?? "", { type: (attr(r, "Type") ?? "").split("/").pop() ?? "", target });
  }
  return out;
}

// ---------------------------------------------------------------- barvy

const INDEXED = [
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "C0C0C0", "808080",
  "9999FF", "993366", "FFFFCC", "CCFFFF", "660066", "FF8080", "0066CC", "CCCCFF",
  "000080", "FF00FF", "FFFF00", "00FFFF", "800080", "800000", "008080", "0000FF",
  "00CCFF", "CCFFFF", "CCFFCC", "FFFF99", "99CCFF", "FF99CC", "CC99FF", "FFCC99",
  "3366FF", "33CCCC", "99CC00", "FFCC00", "FF9900", "FF6600", "666699", "969696",
  "003366", "339966", "003300", "333300", "993300", "993366", "333399", "333333",
];

type Theme = { list: string[]; byName: Record<string, string>; minorFont: string; majorFont: string };

function parseTheme(xml: string | null): Theme {
  const def = ["FFFFFF", "000000", "E7E6E6", "44546A", "4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47", "0563C1", "954F72"];
  const t: Theme = { list: def, byName: {}, minorFont: "Calibri", majorFont: "Calibri" };
  if (xml) {
    const doc = parseXml(xml);
    const scheme = all(doc, "clrScheme")[0];
    if (scheme) {
      const val = (n: string) => {
        const e = kid(scheme, n);
        const c = kid(e, "srgbClr") ?? kid(e, "sysClr");
        return (attr(c, "val") === "windowText" ? attr(c, "lastClr") : attr(c, "lastClr") ?? attr(c, "val")) ?? "000000";
      };
      const names = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
      const v: Record<string, string> = {};
      for (const n of names) v[n] = val(n);
      t.list = [v.lt1, v.dk1, v.lt2, v.dk2, v.accent1, v.accent2, v.accent3, v.accent4, v.accent5, v.accent6, v.hlink, v.folHlink];
      t.byName = { ...v, tx1: v.dk1, bg1: v.lt1, tx2: v.dk2, bg2: v.lt2 };
    }
    const minor = all(doc, "minorFont")[0];
    const major = all(doc, "majorFont")[0];
    t.minorFont = attr(kid(minor, "latin"), "typeface") || "Calibri";
    t.majorFont = attr(kid(major, "latin"), "typeface") || "Calibri";
  }
  if (!Object.keys(t.byName).length) {
    const [lt1, dk1, lt2, dk2, a1, a2, a3, a4, a5, a6, h, fh] = t.list;
    t.byName = { lt1, dk1, lt2, dk2, accent1: a1, accent2: a2, accent3: a3, accent4: a4, accent5: a5, accent6: a6, hlink: h, folHlink: fh, tx1: dk1, bg1: lt1, tx2: dk2, bg2: lt2 };
  }
  return t;
}

function hexToRgb(h: string): [number, number, number] {
  const x = h.replace("#", "").slice(-6);
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `${c(r)}${c(g)}${c(b)}`.toUpperCase();
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
/** Odstín motivu podle `tint` (spreadsheetML, −1 tmavší … 1 světlejší). */
function tint(hex: string, t: number): string {
  if (!t) return hex;
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  const l2 = t < 0 ? l * (1 + t) : l * (1 - t) + (1 - (1 - t));
  return rgbToHex(...hslToRgb(h, s, Math.max(0, Math.min(1, l2))));
}
/** Barva spreadsheetML (`<color rgb|theme|indexed tint/>`). */
function ssColor(el: Element | null, theme: Theme): string | null {
  if (!el || attr(el, "auto") === "1") return null;
  let hex: string | null = null;
  const rgb = attr(el, "rgb");
  if (rgb) hex = rgb.slice(-6);
  else if (attr(el, "theme") != null) hex = theme.list[num(el, "theme")] ?? null;
  else if (attr(el, "indexed") != null) {
    const i = num(el, "indexed");
    hex = i === 64 ? null : INDEXED[i] ?? null;
  }
  if (!hex) return null;
  return "#" + tint(hex, num(el, "tint"));
}
/** Barva DrawingML (`srgbClr`, `schemeClr` + lumMod/lumOff/tint/shade/alpha). */
function dmlColor(fill: Element | null, theme: Theme): { color: string; alpha: number } | null {
  if (!fill) return null;
  const c = kids(fill).find((k) => /Clr$/.test(k.localName));
  if (!c) return null;
  let hex: string | null = null;
  if (c.localName === "srgbClr") hex = attr(c, "val");
  else if (c.localName === "schemeClr") hex = theme.byName[attr(c, "val") ?? ""] ?? null;
  else if (c.localName === "sysClr") hex = attr(c, "lastClr") ?? (attr(c, "val") === "window" ? "FFFFFF" : "000000");
  else if (c.localName === "prstClr") hex = ({ black: "000000", white: "FFFFFF", red: "FF0000", green: "00FF00", blue: "0000FF", yellow: "FFFF00" } as Record<string, string>)[attr(c, "val") ?? ""] ?? "000000";
  if (!hex) return null;
  let [h, s, l] = rgbToHsl(...hexToRgb(hex));
  let alpha = 1;
  for (const m of kids(c)) {
    const v = num(m, "val") / 100000;
    if (m.localName === "lumMod") l *= v;
    else if (m.localName === "lumOff") l += v;
    else if (m.localName === "tint") l = l + (1 - l) * (1 - v);
    else if (m.localName === "shade") l *= v;
    else if (m.localName === "alpha") alpha = v;
  }
  return { color: "#" + rgbToHex(...hslToRgb(h, s, Math.max(0, Math.min(1, l)))), alpha };
}
function css(c: { color: string; alpha: number } | null): string | null {
  if (!c) return null;
  if (c.alpha >= 1) return c.color;
  const [r, g, b] = hexToRgb(c.color);
  return `rgba(${r},${g},${b},${c.alpha})`;
}

// ---------------------------------------------------------------- styly buněk

const BUILTIN_FMT: Record<number, string> = {
  0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00", 9: "0%", 10: "0.00%", 11: "0.00E+00",
  12: "# ?/?", 13: "# ??/??", 14: "d.m.yyyy", 15: "d-mmm-yy", 16: "d-mmm", 17: "mmm-yy", 18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM", 20: "h:mm", 21: "h:mm:ss", 22: "d.m.yyyy h:mm", 37: "#,##0 ;(#,##0)",
  38: "#,##0 ;[Red](#,##0)", 39: "#,##0.00;(#,##0.00)", 40: "#,##0.00;[Red](#,##0.00)", 45: "mm:ss",
  46: "[h]:mm:ss", 47: "mmss.0", 48: "##0.0E+0", 49: "@",
};

type Font = { b: boolean; i: boolean; u: boolean; strike: boolean; sz: number; color: string | null; name: string };
type BorderSide = { style: string; color: string } | null;
type Xf = {
  fmt: string;
  font: Font;
  fill: string | null;
  border: { l: BorderSide; r: BorderSide; t: BorderSide; b: BorderSide };
  h: string;
  v: string;
  wrap: boolean;
  indent: number;
  rot: number;
};
type Dxf = { font?: Partial<Font>; fill?: string | null };
type Styles = { xfs: Xf[]; dxfs: Dxf[]; defaultFont: Font | null };

function parseFont(f: Element | null, theme: Theme): Font {
  return {
    b: !!kid(f, "b") && attr(kid(f, "b"), "val") !== "0",
    i: !!kid(f, "i") && attr(kid(f, "i"), "val") !== "0",
    u: !!kid(f, "u") && attr(kid(f, "u"), "val") !== "none",
    strike: !!kid(f, "strike") && attr(kid(f, "strike"), "val") !== "0",
    sz: num(kid(f, "sz"), "val", 11),
    color: ssColor(kid(f, "color"), theme),
    name: attr(kid(f, "name"), "val") ?? theme.minorFont,
  };
}
function parseFill(f: Element | null, theme: Theme): string | null {
  const pf = kid(f, "patternFill");
  if (pf) {
    const type = attr(pf, "patternType");
    if (!type || type === "none") return null;
    const fg = ssColor(kid(pf, "fgColor"), theme);
    const bg = ssColor(kid(pf, "bgColor"), theme);
    if (type === "solid") return fg ?? bg;
    return fg ?? bg ?? "#BFBFBF";
  }
  const gf = kid(f, "gradientFill");
  if (gf) return ssColor(kid(kid(gf, "stop"), "color"), theme);
  return null;
}
function parseBorder(b: Element | null, theme: Theme): Xf["border"] {
  const side = (n: string): BorderSide => {
    const e = kid(b, n);
    const st = attr(e, "style");
    if (!e || !st || st === "none") return null;
    return { style: st, color: ssColor(kid(e, "color"), theme) ?? "#000000" };
  };
  return { l: side("left"), r: side("right"), t: side("top"), b: side("bottom") };
}

function parseStyles(xml: string | null, theme: Theme): Styles {
  if (!xml) {
    const font: Font = { b: false, i: false, u: false, strike: false, sz: 11, color: null, name: theme.minorFont };
    return { xfs: [{ fmt: "General", font, fill: null, border: { l: null, r: null, t: null, b: null }, h: "general", v: "bottom", wrap: false, indent: 0, rot: 0 }], dxfs: [], defaultFont: font };
  }
  const doc = parseXml(xml);
  const fmts: Record<number, string> = { ...BUILTIN_FMT };
  for (const n of all(doc, "numFmt")) fmts[num(n, "numFmtId")] = attr(n, "formatCode") ?? "General";
  const fonts = kids(all(doc, "fonts")[0], "font").map((f) => parseFont(f, theme));
  const fills = kids(all(doc, "fills")[0], "fill").map((f) => parseFill(f, theme));
  const borders = kids(all(doc, "borders")[0], "border").map((b) => parseBorder(b, theme));
  const xfs = kids(all(doc, "cellXfs")[0], "xf").map((x): Xf => {
    const al = kid(x, "alignment");
    return {
      fmt: fmts[num(x, "numFmtId")] ?? "General",
      font: fonts[num(x, "fontId")] ?? fonts[0],
      fill: fills[num(x, "fillId")] ?? null,
      border: borders[num(x, "borderId")] ?? { l: null, r: null, t: null, b: null },
      h: attr(al, "horizontal") ?? "general",
      v: attr(al, "vertical") ?? "bottom",
      wrap: attr(al, "wrapText") === "1" || attr(al, "wrapText") === "true",
      indent: num(al, "indent"),
      rot: num(al, "textRotation"),
    };
  });
  const dxfs = kids(all(doc, "dxfs")[0], "dxf").map((d): Dxf => {
    const out: Dxf = {};
    const f = kid(d, "font");
    if (f) {
      const pf = parseFont(f, theme);
      out.font = {};
      if (kid(f, "b")) out.font.b = pf.b;
      if (kid(f, "i")) out.font.i = pf.i;
      if (kid(f, "u")) out.font.u = pf.u;
      if (kid(f, "strike")) out.font.strike = pf.strike;
      if (kid(f, "color")) out.font.color = pf.color;
    }
    const fl = kid(d, "fill");
    if (fl) {
      // V dxf je barva výplně v bgColor (u plné výplně), jinak fgColor.
      const pf = kid(fl, "patternFill");
      out.fill = ssColor(kid(pf, "bgColor"), theme) ?? ssColor(kid(pf, "fgColor"), theme);
    }
    return out;
  });
  return { xfs: xfs.length ? xfs : parseStyles(null, theme).xfs, dxfs, defaultFont: fonts[0] ?? null };
}

// ---------------------------------------------------------------- hodnoty

const MESICE: Record<string, string> = {
  January: "leden", February: "únor", March: "březen", April: "duben", May: "květen", June: "červen",
  July: "červenec", August: "srpen", September: "září", October: "říjen", November: "listopad", December: "prosinec",
};
const DNY: Record<string, string> = {
  Monday: "pondělí", Tuesday: "úterý", Wednesday: "středa", Thursday: "čtvrtek", Friday: "pátek", Saturday: "sobota", Sunday: "neděle",
};
const MES3: Record<string, string> = { Jan: "led", Feb: "úno", Mar: "bře", Apr: "dub", Jun: "čvn", Jul: "čvc", Aug: "srp", Sep: "zář", Oct: "říj", Nov: "lis", Dec: "pro" };
const DNY3: Record<string, string> = { Mon: "po", Tue: "út", Wed: "st", Thu: "čt", Fri: "pá", Sat: "so", Sun: "ne" };

/** Formát čísla jako v českém Excelu (čárka, mezera mezi tisíci, česká jména měsíců). */
function formatNumber(v: number, fmt: string, ssf: SsfGlobal): string {
  // Lokalizační předpona [$-405] a [$-x-sysdate] SSF nezná – jen ji odstraníme.
  let f = fmt.replace(/\[\$-[0-9A-Fa-f]+\]/g, "").replace(/\[\$([^\]-]*)-[0-9A-Fa-f]+\]/g, '"$1"');
  if (/\[\$-x-sys(date|time)\]/i.test(fmt)) f = "d.m.yyyy";
  // Excel ukládá výchozí datum jako americké m/d/yyyy – český Excel ho ukáže jako d.m.yyyy.
  if (/^m\/d\/yy(yy)?(;@)?$/i.test(f.trim())) f = "d.m.yyyy";
  // V datu je tečka oddělovač, ne desetinná čárka sekund (SSF by spadlo na „bad second format“).
  const bezUvozovek = f.replace(/"[^"]*"/g, "");
  if (/[dy]/i.test(bezUvozovek) && !/[0#?]/.test(bezUvozovek)) f = f.replace(/(^|[^\\])\./g, "$1\\.");
  let out: string;
  try {
    out = ssf.format(f, v);
  } catch {
    out = String(v);
  }
  let date = false;
  try {
    date = ssf.is_date(f);
  } catch {
    date = false;
  }
  if (date) {
    out = out.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g, (m) => MESICE[m])
      .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g, (m) => DNY[m])
      .replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => MES3[m])
      .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (m) => DNY3[m]);
    return out;
  }
  // Číslo: anglické oddělovače → české (tisíce mezerou, desetinná čárka).
  return out.replace(/(\d),(?=\d{3}\b)/g, "$1 ").replace(/(\d)\.(\d)/g, "$1,$2").replace(/^\.(\d)/, "0,$1");
}

// ---------------------------------------------------------------- list

type Cell = {
  r: number;
  c: number;
  xf: Xf;
  raw: string | number | boolean | null;
  text: string;
  isNum: boolean;
  isBool: boolean;
  isErr: boolean;
};
type CfRule = {
  type: string;
  op: string | null;
  formulas: string[];
  text: string | null;
  dxf: Dxf | null;
  priority: number;
  stop: boolean;
  colors: string[];
  cfvos: { type: string; val: string | null }[];
  iconSet: string | null;
  showValue: boolean;
  reverse: boolean;
};
type Cf = { ranges: [number, number, number, number][]; rules: CfRule[] };

function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function colName(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function parseRef(ref: string): [number, number] {
  const m = ref.replace(/\$/g, "").match(/^([A-Z]+)(\d+)$/);
  return m ? [Number(m[2]), colIndex(m[1])] : [0, 0];
}
function parseRange(ref: string): [number, number, number, number] {
  const [a, b] = ref.replace(/\$/g, "").split(":");
  const [r1, c1] = parseRef(a);
  const [r2, c2] = b ? parseRef(b) : [r1, c1];
  return [Math.min(r1, r2), Math.min(c1, c2), Math.max(r1, r2), Math.max(c1, c2)];
}

type Anchor = { x: number; y: number; w: number; h: number };
type Drawn =
  | { kind: "shape"; a: Anchor; el: Element }
  | { kind: "pic"; a: Anchor; src: string | null }
  | { kind: "chart"; a: Anchor; xml: string | null; chartPath: string }
  | { kind: "group"; a: Anchor; el: Element };

type Sheet = {
  name: string;
  cells: Map<string, Cell>;
  maxR: number;
  maxC: number;
  colPx: number[];
  rowPx: number[];
  hiddenCols: Set<number>;
  hiddenRows: Set<number>;
  merges: [number, number, number, number][];
  cfs: Cf[];
  drawn: Drawn[];
  comments: Map<string, string>;
  tables: { range: [number, number, number, number]; style: string; header: boolean; stripes: boolean }[];
  pivots: { range: [number, number, number, number]; firstDataRow: number; style: string; grandRow: boolean }[];
  gridlines: boolean;
  truncatedRows: number;
  truncatedCols: number;
};

async function loadSheet(
  zip: JsZip,
  sheetPath: string,
  name: string,
  shared: string[],
  styles: Styles,
  theme: Theme,
  ssf: SsfGlobal,
): Promise<Sheet> {
  const xml = (await zipText(zip, sheetPath)) ?? "";
  const doc = parseXml(xml);
  const ws = doc.documentElement;
  const sheetRels = await rels(zip, sheetPath);

  const fmtPr = kid(ws, "sheetFormatPr");
  const defRowPx = num(fmtPr, "defaultRowHeight", 15) * (4 / 3);
  const defColW = attr(fmtPr, "defaultColWidth");
  const defColPx = defColW ? Math.round(Number(defColW) * 7 + 5) : Math.round(num(fmtPr, "baseColWidth", 8) * 7 + 9);

  const colW = new Map<number, number>();
  const hiddenCols = new Set<number>();
  for (const c of all(kid(ws, "cols"), "col")) {
    const mn = num(c, "min");
    const mx = Math.min(num(c, "max"), 16384);
    const px = Math.round(num(c, "width", 8.43) * 7);
    for (let i = mn; i <= Math.min(mx, 2000); i++) {
      colW.set(i, px);
      if (attr(c, "hidden") === "1" || attr(c, "hidden") === "true") hiddenCols.add(i);
    }
  }

  const cells = new Map<string, Cell>();
  const rowH = new Map<number, number>();
  const hiddenRows = new Set<number>();
  let maxR = 0, maxC = 0;
  for (const row of all(kid(ws, "sheetData"), "row")) {
    const rn = num(row, "r");
    if (attr(row, "ht")) rowH.set(rn, num(row, "ht") * (4 / 3));
    if (attr(row, "hidden") === "1" || attr(row, "hidden") === "true") hiddenRows.add(rn);
    for (const c of kids(row, "c")) {
      const [r, cc] = parseRef(attr(c, "r") ?? "");
      const xf = styles.xfs[num(c, "s")] ?? styles.xfs[0];
      const t = attr(c, "t");
      const v = kid(c, "v")?.textContent ?? null;
      let raw: Cell["raw"] = null;
      let text = "";
      let isNum = false, isBool = false, isErr = false;
      if (t === "s") raw = text = shared[Number(v)] ?? "";
      else if (t === "inlineStr") raw = text = all(kid(c, "is"), "t").map((x) => x.textContent ?? "").join("");
      else if (t === "str") raw = text = v ?? "";
      else if (t === "b") {
        isBool = true;
        raw = v === "1";
        text = v === "1" ? "PRAVDA" : "NEPRAVDA";
      } else if (t === "e") {
        isErr = true;
        raw = text = v ?? "";
      } else if (v != null && v !== "") {
        isNum = true;
        raw = Number(v);
        text = formatNumber(raw, xf.fmt, ssf);
      }
      const styled = !!xf.fill || !!(xf.border.l || xf.border.r || xf.border.t || xf.border.b);
      if (raw === null && !styled) continue;
      cells.set(`${r},${cc}`, { r, c: cc, xf, raw, text, isNum, isBool, isErr });
      if (r > maxR) maxR = r;
      if (cc > maxC) maxC = cc;
    }
  }

  // Řádky se zalomeným textem bez vlastní výšky: Excel výšku dopočítá při otevření, tady odhadem.
  const customRows = new Set<number>();
  for (const row of all(kid(ws, "sheetData"), "row")) if (attr(row, "customHeight") === "1") customRows.add(num(row, "r"));
  for (const cell of cells.values()) {
    if (!cell.xf.wrap || !cell.text || customRows.has(cell.r) || hiddenRows.has(cell.r)) continue;
    const fontPx = (cell.xf.font.sz * 4) / 3;
    const colPxW = Math.max(10, (colW.get(cell.c) ?? defColPx) - 6);
    const lines = cell.text.split("\n").reduce((n, part) => n + Math.max(1, Math.ceil((part.length * fontPx * 0.52) / colPxW)), 0);
    const need = lines * fontPx * 1.22 + 4;
    if (need > (rowH.get(cell.r) ?? defRowPx)) rowH.set(cell.r, need);
  }

  const merges = all(kid(ws, "mergeCells"), "mergeCell").map((m) => parseRange(attr(m, "ref") ?? "A1"));
  for (const m of merges) {
    maxR = Math.max(maxR, m[2]);
    maxC = Math.max(maxC, m[3]);
  }

  // podmíněné formátování (základní typy)
  const cfs: Cf[] = [];
  const cfEls = [...kids(ws, "conditionalFormatting"), ...all(kid(ws, "extLst"), "conditionalFormatting")];
  for (const cf of cfEls) {
    const sq = attr(cf, "sqref") ?? kid(cf, "sqref")?.textContent ?? "";
    const ranges = sq.split(/\s+/).filter(Boolean).map(parseRange);
    const rules: CfRule[] = kids(cf, "cfRule").map((r) => {
      const scale = kid(r, "colorScale");
      const icons = kid(r, "iconSet");
      const db = kid(r, "dataBar");
      const holder = scale ?? icons ?? db;
      return {
        type: attr(r, "type") ?? "",
        op: attr(r, "operator"),
        formulas: kids(r, "formula").map((f) => f.textContent ?? "").concat(kids(r, "f").map((f) => f.textContent ?? "")),
        text: attr(r, "text"),
        dxf: attr(r, "dxfId") != null ? styles.dxfs[num(r, "dxfId")] ?? null : null,
        priority: num(r, "priority", 99),
        stop: attr(r, "stopIfTrue") === "1",
        colors: kids(scale, "color").map((c) => ssColor(c, theme) ?? "#FFFFFF"),
        cfvos: kids(holder, "cfvo").map((v) => ({ type: attr(v, "type") ?? "", val: attr(v, "val") ?? kid(v, "f")?.textContent ?? null })),
        iconSet: icons ? attr(icons, "iconSet") ?? "3TrafficLights1" : null,
        showValue: attr(icons, "showValue") !== "0",
        reverse: attr(icons, "reverse") === "1",
      };
    });
    if (ranges.length && rules.length) cfs.push({ ranges, rules });
  }

  // formátované tabulky
  const tables: Sheet["tables"] = [];
  const pivots: Sheet["pivots"] = [];
  for (const tp of all(kid(ws, "tableParts"), "tablePart")) {
    const rel = sheetRels.get(attr(tp, "r:id") ?? attr(tp, "id") ?? "");
    const txml = rel ? await zipText(zip, rel.target) : null;
    if (!txml) continue;
    const t = parseXml(txml).documentElement;
    const si = kid(t, "tableStyleInfo");
    tables.push({
      range: parseRange(attr(t, "ref") ?? "A1"),
      style: attr(si, "name") ?? "TableStyleMedium2",
      header: attr(t, "headerRowCount") !== "0",
      stripes: attr(si, "showRowStripes") !== "0",
    });
  }

  // kontingenční tabulky: oblast, řádky záhlaví a styl (vykreslí se přes tables)
  for (const rel of sheetRels.values()) {
    if (rel.type !== "pivotTable") continue;
    const px = await zipText(zip, rel.target);
    if (!px) continue;
    const pt = parseXml(px).documentElement;
    const loc = kid(pt, "location");
    const range = parseRange(attr(loc, "ref") ?? "A1");
    pivots.push({ range, firstDataRow: num(loc, "firstDataRow", 1), style: attr(kid(pt, "pivotTableStyleInfo"), "name") ?? "PivotStyleLight16", grandRow: attr(pt, "rowGrandTotals") !== "0" });
  }

  // komentáře (starý formát)
  const comments = new Map<string, string>();
  for (const rel of sheetRels.values()) {
    if (rel.type !== "comments") continue;
    const cx = await zipText(zip, rel.target);
    if (!cx) continue;
    const cd = parseXml(cx);
    const authors = all(cd, "author").map((a) => a.textContent ?? "");
    for (const c of all(cd, "comment")) {
      const [r, cc] = parseRef(attr(c, "ref") ?? "A1");
      const who = authors[num(c, "authorId")] ?? "";
      let t = all(c, "t").map((x) => x.textContent ?? "").join("");
      if (who && t.startsWith(who + ":")) t = t.slice(who.length + 1).trim();
      comments.set(`${r},${cc}`, t);
    }
  }

  // velikost listu a oříznutí
  const sv = all(kid(ws, "sheetViews"), "sheetView")[0];
  const gridlines = attr(sv, "showGridLines") !== "0";

  // rozměry
  const drawingRel = [...sheetRels.values()].find((r) => r.type === "drawing");
  const colPxAt = (i: number) => (hiddenCols.has(i) ? 0 : colW.get(i) ?? defColPx);
  const rowPxAt = (i: number) => (hiddenRows.has(i) ? 0 : rowH.get(i) ?? defRowPx);

  // kresby potřebují znát pozice; nejdřív spočítáme pole pro dost velký rozsah
  const anchorsXml = drawingRel ? await zipText(zip, drawingRel.target) : null;
  let drawMaxR = 0, drawMaxC = 0;
  const anchorEls: Element[] = [];
  if (anchorsXml) {
    const d = parseXml(anchorsXml).documentElement;
    for (const a of kids(d)) {
      if (!/Anchor$/.test(a.localName)) continue;
      anchorEls.push(a);
      const to = kid(a, "to") ?? kid(a, "from");
      drawMaxR = Math.max(drawMaxR, Number(kid(to, "row")?.textContent ?? 0) + 1);
      drawMaxC = Math.max(drawMaxC, Number(kid(to, "col")?.textContent ?? 0) + 1);
    }
  }
  const fullR = Math.max(maxR, drawMaxR, 1);
  const fullC = Math.max(maxC, drawMaxC, 1);
  const showR = Math.min(fullR + 2, MAX_ROWS);
  const showC = Math.min(fullC + 1, MAX_COLS);
  const colPx = [0];
  const rowPx = [0];
  for (let i = 1; i <= showC; i++) colPx.push(colPxAt(i));
  for (let i = 1; i <= showR; i++) rowPx.push(rowPxAt(i));
  const colX = (i: number) => {
    let x = 0;
    for (let k = 1; k < i; k++) x += k <= showC ? colPx[k] : colPxAt(k);
    return x;
  };
  const rowY = (i: number) => {
    let y = 0;
    for (let k = 1; k < i; k++) y += k <= showR ? rowPx[k] : rowPxAt(k);
    return y;
  };
  const EMU = 9525;

  const drawn: Drawn[] = [];
  if (anchorsXml && drawingRel) {
    const dRels = await rels(zip, drawingRel.target);
    for (const a of anchorEls) {
      let an: Anchor;
      const from = kid(a, "from");
      const pos = (m: Element | null) => ({
        x: colX(Number(kid(m, "col")?.textContent ?? 0) + 1) + Number(kid(m, "colOff")?.textContent ?? 0) / EMU,
        y: rowY(Number(kid(m, "row")?.textContent ?? 0) + 1) + Number(kid(m, "rowOff")?.textContent ?? 0) / EMU,
      });
      if (a.localName === "twoCellAnchor") {
        const p1 = pos(from);
        const p2 = pos(kid(a, "to"));
        an = { x: p1.x, y: p1.y, w: Math.max(1, p2.x - p1.x), h: Math.max(1, p2.y - p1.y) };
      } else if (a.localName === "oneCellAnchor") {
        const p1 = pos(from);
        const ext = kid(a, "ext");
        an = { x: p1.x, y: p1.y, w: num(ext, "cx") / EMU, h: num(ext, "cy") / EMU };
      } else {
        const p = kid(a, "pos");
        const ext = kid(a, "ext");
        an = { x: num(p, "x") / EMU, y: num(p, "y") / EMU, w: num(ext, "cx") / EMU, h: num(ext, "cy") / EMU };
      }
      for (const el of kids(a)) {
        if (el.localName === "sp" || el.localName === "cxnSp") drawn.push({ kind: "shape", a: an, el });
        else if (el.localName === "grpSp") drawn.push({ kind: "group", a: an, el });
        else if (el.localName === "pic") {
          const rid = attr(all(el, "blip")[0] ?? null, "r:embed") ?? "";
          const rel = dRels.get(rid);
          let src: string | null = null;
          const f = rel ? zip.file(rel.target) : null;
          if (f && rel) {
            const bytes = (await f.async("uint8array")) as Uint8Array;
            const ext = rel.target.split(".").pop()?.toLowerCase() ?? "png";
            const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : ext === "svg" ? "image/svg+xml" : "image/png";
            src = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
          }
          drawn.push({ kind: "pic", a: an, src });
        } else if (el.localName === "graphicFrame") {
          const ch = all(el, "chart")[0];
          const rid = attr(ch ?? null, "r:id") ?? "";
          const rel = dRels.get(rid);
          drawn.push({ kind: "chart", a: an, xml: rel ? await zipText(zip, rel.target) : null, chartPath: rel?.target ?? "" });
        }
      }
    }
  }

  return {
    name,
    cells,
    maxR: showR,
    maxC: showC,
    colPx,
    rowPx,
    hiddenCols,
    hiddenRows,
    merges,
    cfs,
    drawn,
    comments,
    tables,
    pivots,
    gridlines,
    truncatedRows: Math.max(0, fullR - showR),
    truncatedCols: Math.max(0, fullC - showC),
  };
}

// ---------------------------------------------------------------- podmíněné formátování

function cfApply(sheet: Sheet): Map<string, { dxf?: Dxf; fill?: string; icon?: { color: string; hideValue: boolean; sym: string } }> {
  const out = new Map<string, { dxf?: Dxf; fill?: string; icon?: { color: string; hideValue: boolean; sym: string } }>();
  const val = (ref: string): number | string | null => {
    const s = ref.trim().replace(/^=/, "");
    if (/^".*"$/.test(s)) return s.slice(1, -1);
    if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(",", "."));
    const m = s.replace(/\$/g, "").match(/^([A-Z]+)(\d+)$/);
    if (m) {
      const c = sheet.cells.get(`${m[2]},${colIndex(m[1])}`);
      return c ? (typeof c.raw === "boolean" ? Number(c.raw) : (c.raw as number | string | null)) : 0;
    }
    return null;
  };
  const rules = sheet.cfs.flatMap((cf) => cf.rules.map((rule) => ({ rule, ranges: cf.ranges }))).sort((a, b) => a.rule.priority - b.rule.priority);
  const done = new Set<string>();
  for (const { rule, ranges } of rules) {
    const cellsIn: Cell[] = [];
    for (const [r1, c1, r2, c2] of ranges) {
      for (const c of sheet.cells.values()) if (c.r >= r1 && c.r <= r2 && c.c >= c1 && c.c <= c2) cellsIn.push(c);
    }
    const nums = cellsIn.filter((c) => c.isNum).map((c) => c.raw as number);
    const lo = nums.length ? Math.min(...nums) : 0;
    const hi = nums.length ? Math.max(...nums) : 1;
    const thr = (v: { type: string; val: string | null }): number => {
      const n = Number(v.val ?? 0);
      if (v.type === "min") return lo;
      if (v.type === "max") return hi;
      if (v.type === "percent") return lo + ((hi - lo) * n) / 100;
      if (v.type === "percentile") {
        const s = [...nums].sort((a, b) => a - b);
        return s.length ? s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * n / 100)))] : 0;
      }
      return n;
    };
    const counts = new Map<string, number>();
    if (rule.type === "duplicateValues" || rule.type === "uniqueValues") {
      for (const c of cellsIn) if (c.text !== "") counts.set(c.text.toLowerCase(), (counts.get(c.text.toLowerCase()) ?? 0) + 1);
    }
    for (const c of cellsIn) {
      const key = `${c.r},${c.c}`;
      if (done.has(key)) continue;
      let hit = false;
      const cur = out.get(key) ?? {};
      if (rule.type === "cellIs" && c.raw !== null) {
        const v = typeof c.raw === "boolean" ? Number(c.raw) : c.raw;
        const a = val(rule.formulas[0] ?? "");
        const b = val(rule.formulas[1] ?? "");
        const cmp = (x: number | string | null, y: number | string | null) =>
          typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "cs");
        if (a !== null) {
          switch (rule.op) {
            case "greaterThan": hit = cmp(v, a) > 0; break;
            case "greaterThanOrEqual": hit = cmp(v, a) >= 0; break;
            case "lessThan": hit = cmp(v, a) < 0; break;
            case "lessThanOrEqual": hit = cmp(v, a) <= 0; break;
            case "equal": hit = cmp(v, a) === 0; break;
            case "notEqual": hit = cmp(v, a) !== 0; break;
            case "between": hit = b !== null && cmp(v, a) >= 0 && cmp(v, b) <= 0; break;
            case "notBetween": hit = b !== null && (cmp(v, a) < 0 || cmp(v, b) > 0); break;
          }
        }
      } else if (rule.type === "containsText" && rule.text) hit = c.text.toLowerCase().includes(rule.text.toLowerCase());
      else if (rule.type === "notContainsText" && rule.text) hit = !c.text.toLowerCase().includes(rule.text.toLowerCase());
      else if (rule.type === "beginsWith" && rule.text) hit = c.text.toLowerCase().startsWith(rule.text.toLowerCase());
      else if (rule.type === "endsWith" && rule.text) hit = c.text.toLowerCase().endsWith(rule.text.toLowerCase());
      else if (rule.type === "duplicateValues") hit = c.text !== "" && (counts.get(c.text.toLowerCase()) ?? 0) > 1;
      else if (rule.type === "uniqueValues") hit = c.text !== "" && (counts.get(c.text.toLowerCase()) ?? 0) === 1;
      else if (rule.type === "colorScale" && c.isNum && rule.colors.length >= 2) {
        const v = c.raw as number;
        const t = rule.cfvos.map(thr);
        const mix = (c1: string, c2: string, f: number) => {
          const a = hexToRgb(c1), b = hexToRgb(c2);
          return "#" + rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
        };
        let fill: string;
        if (rule.colors.length === 2) fill = mix(rule.colors[0], rule.colors[1], t[1] > t[0] ? Math.max(0, Math.min(1, (v - t[0]) / (t[1] - t[0]))) : 0);
        else if (v <= t[1]) fill = mix(rule.colors[0], rule.colors[1], t[1] > t[0] ? Math.max(0, (v - t[0]) / (t[1] - t[0])) : 0);
        else fill = mix(rule.colors[1], rule.colors[2], t[2] > t[1] ? Math.min(1, (v - t[1]) / (t[2] - t[1])) : 1);
        cur.fill = fill;
        out.set(key, cur);
        continue;
      } else if (rule.type === "iconSet" && c.isNum) {
        const v = c.raw as number;
        const t = rule.cfvos.map(thr);
        let idx = 0;
        for (let i = 1; i < t.length; i++) if (v >= t[i]) idx = i;
        const n = t.length;
        const palette = n === 3 ? ["#E53935", "#F9C02B", "#2E9D4A"] : n === 4 ? ["#E53935", "#F28C28", "#F9C02B", "#2E9D4A"] : ["#E53935", "#F28C28", "#F9C02B", "#8BC34A", "#2E9D4A"];
        if (rule.reverse) palette.reverse();
        const set = rule.iconSet ?? "";
        const sym = /Arrows/.test(set) ? (n === 3 ? ["↓", "→", "↑"] : n === 4 ? ["↓", "↘", "↗", "↑"] : ["↓", "↘", "→", "↗", "↑"])[idx] : /Flags/.test(set) ? "⚑" : /Symbols/.test(set) ? ["✖", "!", "✔"][idx] ?? "●" : "●";
        cur.icon = { color: palette[idx] ?? "#999", hideValue: !rule.showValue, sym: rule.reverse && /Arrows/.test(set) ? (n === 3 ? ["↑", "→", "↓"] : ["↑", "↗", "↘", "↓"])[idx] ?? sym : sym };
        out.set(key, cur);
        continue;
      }
      if (hit && rule.dxf) {
        cur.dxf = { ...(cur.dxf ?? {}), ...rule.dxf, font: { ...(cur.dxf?.font ?? {}), ...(rule.dxf.font ?? {}) } };
        out.set(key, cur);
        if (rule.stop) done.add(key);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- vykreslení listu

function borderCss(b: BorderSide): string {
  if (!b) return "";
  const w = /medium/i.test(b.style) ? 2 : b.style === "thick" ? 3 : b.style === "double" ? 3 : 1;
  const st = b.style === "double" ? "double" : /dash|dot/i.test(b.style) ? (/dot/i.test(b.style) ? "dotted" : "dashed") : "solid";
  return `${w}px ${st} ${b.color}`;
}

function tableColors(style: string, theme: Theme): { head: string; headText: string; band: string } {
  const m = style.match(/TableStyle(Light|Medium|Dark)(\d+)/);
  const kind = m?.[1] ?? "Medium";
  const n = Number(m?.[2] ?? 2);
  const accents = [theme.byName.dk1, theme.byName.accent1, theme.byName.accent2, theme.byName.accent3, theme.byName.accent4, theme.byName.accent5, theme.byName.accent6];
  const base = accents[(n - 1) % 7] ?? theme.byName.accent1;
  if (kind === "Light") return { head: "transparent", headText: "#" + base, band: "#" + tint(base, 0.8) };
  if (kind === "Dark") return { head: "#" + tint(base, -0.5), headText: "#FFFFFF", band: "#" + tint(base, 0.4) };
  return { head: "#" + base, headText: "#FFFFFF", band: "#" + tint(base, 0.8) };
}

/**
 * Když prohlížeč nemá písmo ze sešitu (Calibri na Macu a Linuxu), náhradní
 * Arial je širší a čísla by se do sloupců nevešla. Zmenšíme ho na šířku Calibri.
 */
const fontScaleCache = new Map<string, number>();
function fontScale(name: string): number {
  const hit = fontScaleCache.get(name);
  if (hit !== undefined) return hit;
  let k = 1;
  try {
    // document.fonts.check() systémová písma nepozná – měří se šířka textu proti záložnímu písmu.
    const narrow = /calibri|candara|corbel/i.test(name);
    const ctx = narrow ? document.createElement("canvas").getContext("2d") : null;
    if (ctx) {
      const w = (f: string) => {
        ctx.font = f;
        return ctx.measureText("0123456789 abcdefgh").width;
      };
      const has = (n: string) => w(`20px "${n}", monospace`) !== w("20px monospace");
      if (!has(name) && !has("Carlito")) k = 0.9;
    }
  } catch {
    k = 1;
  }
  fontScaleCache.set(name, k);
  return k;
}

function renderSheet(sheet: Sheet, theme: Theme, defaultFont: Font | null): HTMLElement {
  const HEAD_W = 40, HEAD_H = 20;
  const colX: number[] = [0];
  for (let i = 1; i <= sheet.maxC + 1; i++) colX.push(colX[i - 1] + (sheet.colPx[i - 1] ?? 0));
  const rowY: number[] = [0];
  for (let i = 1; i <= sheet.maxR + 1; i++) rowY.push(rowY[i - 1] + (sheet.rowPx[i - 1] ?? 0));
  // colX[i] = začátek sloupce i (1-based): colX[1] = 0
  const X = (c: number) => colX[c] ?? colX[colX.length - 1];
  const Y = (r: number) => rowY[r] ?? rowY[rowY.length - 1];
  const totalW = X(sheet.maxC + 1);
  const totalH = Y(sheet.maxR + 1);

  const grid = document.createElement("div");
  grid.style.cssText = `position:relative;flex:none;width:${totalW}px;height:${totalH}px;overflow:hidden;background:#fff;color:#000;font-family:${theme.minorFont},Calibri,Arial,sans-serif`;

  // mřížka
  if (sheet.gridlines) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", String(totalW));
    svg.setAttribute("height", String(totalH));
    svg.style.cssText = "position:absolute;left:0;top:0";
    let d = "";
    for (let c = 2; c <= sheet.maxC + 1; c++) if (sheet.colPx[c - 1] || c === sheet.maxC + 1) d += `M${X(c) - 0.5} 0V${totalH}`;
    for (let r = 2; r <= sheet.maxR + 1; r++) if (sheet.rowPx[r - 1] || r === sheet.maxR + 1) d += `M0 ${Y(r) - 0.5}H${totalW}`;
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke", "#E1E1E1");
    p.setAttribute("stroke-width", "1");
    svg.appendChild(p);
    grid.appendChild(svg);
  }

  // sloučené buňky
  const mergeAt = new Map<string, [number, number, number, number]>();
  const covered = new Set<string>();
  for (const m of sheet.merges) {
    mergeAt.set(`${m[0]},${m[1]}`, m);
    for (let r = m[0]; r <= m[2]; r++) for (let c = m[1]; c <= m[3]; c++) if (r !== m[0] || c !== m[1]) covered.add(`${r},${c}`);
  }

  // tabulky (záhlaví + pruhy, jen kde buňka nemá vlastní výplň)
  const tableFill = new Map<string, { fill?: string; color?: string; bold?: boolean }>();
  for (const t of sheet.tables) {
    const col = tableColors(t.style, theme);
    const [r1, c1, r2, c2] = t.range;
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (t.header && r === r1) tableFill.set(`${r},${c}`, { fill: col.head, color: col.headText, bold: true });
        else if (t.stripes && (r - r1 - (t.header ? 1 : 0)) % 2 === 0) tableFill.set(`${r},${c}`, { fill: col.band });
      }
    }
  }

  for (const pv of sheet.pivots) {
    // Zjednodušeno: světlý styl kontingenční tabulky – záhlaví a celkový součet tučně s podbarvením.
    const [r1, c1, r2, c2] = pv.range;
    const tintC = "#" + tint(theme.byName.accent1, 0.8);
    for (let c = c1; c <= c2; c++) {
      for (let r = r1; r < r1 + pv.firstDataRow; r++) tableFill.set(`${r},${c}`, { fill: tintC, bold: true });
      if (pv.grandRow) tableFill.set(`${r2},${c}`, { fill: tintC, bold: true });
    }
  }

  const cf = cfApply(sheet);
  const occupied = (r: number, c: number) => {
    const x = sheet.cells.get(`${r},${c}`);
    return !!x && x.text !== "";
  };

  const keys = new Set<string>([...sheet.cells.keys(), ...tableFill.keys()]);
  for (const key of keys) {
    const [r, c] = key.split(",").map(Number);
    if (r > sheet.maxR || c > sheet.maxC || covered.has(key)) continue;
    if (sheet.hiddenRows.has(r) || sheet.hiddenCols.has(c)) continue;
    const cell = sheet.cells.get(key);
    const m = mergeAt.get(key);
    const x = X(c), y = Y(r);
    let wEnd = m ? X(Math.min(m[3], sheet.maxC) + 1) : X(c + 1);
    if (!m && cell?.xf.h === "centerContinuous" && cell.text !== "") {
      let cc = c + 1;
      while (cc <= sheet.maxC) {
        const n = sheet.cells.get(`${r},${cc}`);
        if (!n || n.text !== "" || n.xf.h !== "centerContinuous") break;
        cc++;
      }
      wEnd = X(cc);
    }
    const w = wEnd - x;
    const h = (m ? Y(Math.min(m[2], sheet.maxR) + 1) : Y(r + 1)) - y;
    if (w <= 0 || h <= 0) continue;
    const xf = cell?.xf;
    const tf = tableFill.get(key);
    const rule = cf.get(key);
    const div = document.createElement("div");
    const font = { ...(xf?.font ?? { b: false, i: false, u: false, strike: false, sz: 11, color: null, name: theme.minorFont }), ...(rule?.dxf?.font ?? {}) };
    const fill = rule?.fill ?? (rule?.dxf?.fill !== undefined ? rule.dxf.fill : null) ?? xf?.fill ?? tf?.fill ?? null;
    let s = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;padding:0 3px;display:flex;overflow:hidden;`;
    if (fill) s += `background:${fill};`;
    if (xf) {
      const b = xf.border;
      if (b.l) s += `border-left:${borderCss(b.l)};`;
      if (b.r) s += `border-right:${borderCss(b.r)};`;
      if (b.t) s += `border-top:${borderCss(b.t)};`;
      if (b.b) s += `border-bottom:${borderCss(b.b)};`;
    }
    // Výchozí (automatická) barva písma nechá vyniknout barvu ze stylu tabulky – jako v Excelu.
    const autoColor = !font.color || (xf && xf.font === defaultFont && !rule?.dxf?.font?.color);
    const color = (autoColor ? tf?.color : null) ?? font.color ?? "#000";
    s += `color:${color};font-family:"${font.name}",${theme.minorFont},Calibri,Carlito,Arial,sans-serif;font-size:${((font.sz * 4) / 3) * fontScale(font.name)}px;line-height:1.2;`;
    if (font.b || tf?.bold) s += "font-weight:700;";
    if (font.i) s += "font-style:italic;";
    const deco = [font.u ? "underline" : "", font.strike ? "line-through" : ""].filter(Boolean).join(" ");
    if (deco) s += `text-decoration:${deco};`;
    let hAl = xf?.h ?? "general";
    if (hAl === "general") hAl = cell?.isNum ? "right" : cell?.isBool || cell?.isErr ? "center" : "left";
    if (hAl === "centerContinuous") hAl = "center";
    const vAl = xf?.v ?? "bottom";
    s += `align-items:${vAl === "top" ? "flex-start" : vAl === "center" ? "center" : vAl === "justify" ? "stretch" : "flex-end"};`;
    s += `justify-content:${hAl === "right" ? "flex-end" : hAl === "center" ? "center" : "flex-start"};text-align:${hAl === "right" ? "right" : hAl === "center" ? "center" : hAl === "justify" ? "justify" : "left"};`;
    div.style.cssText = s;

    if (cell && cell.text !== "") {
      const span = document.createElement("span");
      let text = cell.text;
      if (rule?.icon) {
        const dot = document.createElement("span");
        if (rule.icon.sym === "●") dot.style.cssText = `display:inline-block;width:0.8em;height:0.8em;border-radius:50%;background:${rule.icon.color};margin-right:auto;align-self:center;flex:none`;
        else {
          dot.textContent = rule.icon.sym;
          dot.style.cssText = `color:${rule.icon.color};font-weight:700;margin-right:auto;align-self:center;flex:none`;
        }
        div.style.justifyContent = "space-between";
        div.appendChild(dot);
        if (rule.icon.hideValue) text = "";
      }
      span.textContent = text;
      if (xf?.wrap) span.style.cssText = "white-space:pre-wrap;word-break:break-word;width:100%";
      else {
        span.style.cssText = `white-space:pre;${xf && xf.indent ? `padding-left:${xf.indent * 9}px;` : ""}`;
        // Text přeteče do prázdných sousedů jako v Excelu (jen doleva zarovnaný a bez výplně za ním).
        if (!cell.isNum && hAl === "left" && !m) {
          let cc = c + 1;
          let extra = 0;
          while (cc <= sheet.maxC && !occupied(r, cc) && !covered.has(`${r},${cc}`) && extra < 1200) {
            extra += sheet.colPx[cc] ?? 0;
            cc++;
          }
          if (extra) {
            div.style.overflow = "visible";
            div.style.zIndex = "1";
            span.style.maxWidth = `${w + extra - 6}px`;
            span.style.overflow = "hidden";
            span.style.flex = "none";
          }
        }
        if (cell.isNum && span.textContent && w < 30 + span.textContent.length * 4) {
          // úzký sloupec: Excel ukáže ### – tady aspoň ořízneme
          span.style.overflow = "hidden";
        }
      }
      if (xf?.rot) {
        // 255 = písmena pod sebou, 90 = zdola nahoru, 180 = shora dolů, jinak šikmo.
        span.style.whiteSpace = "pre";
        if (xf.rot === 255) {
          span.style.writingMode = "vertical-rl";
          span.style.textOrientation = "upright";
          span.style.letterSpacing = "-1px";
        } else if (xf.rot === 90) {
          span.style.writingMode = "vertical-rl";
          span.style.transform = "rotate(180deg)";
        } else if (xf.rot === 180) {
          span.style.writingMode = "vertical-rl";
        } else {
          span.style.transform = `rotate(${xf.rot > 90 ? xf.rot - 90 : -xf.rot}deg)`;
          span.style.flex = "none";
        }
        span.style.maxHeight = `${h - 2}px`;
        span.style.overflow = "hidden";
      }
      div.appendChild(span);
    }
    if (sheet.comments.has(key)) {
      div.title = sheet.comments.get(key) ?? "";
      const tri = document.createElement("span");
      tri.style.cssText = "position:absolute;right:0;top:0;border-left:6px solid transparent;border-top:6px solid #E00";
      div.style.overflow = "visible";
      div.appendChild(tri);
    }
    grid.appendChild(div);
  }
  // komentáře u prázdných buněk
  for (const [key, t] of sheet.comments) {
    if (sheet.cells.has(key)) continue;
    const [r, c] = key.split(",").map(Number);
    if (r > sheet.maxR || c > sheet.maxC) continue;
    const tri = document.createElement("span");
    tri.title = t;
    tri.style.cssText = `position:absolute;left:${X(c + 1) - 7}px;top:${Y(r)}px;border-left:7px solid transparent;border-top:7px solid #E00`;
    grid.appendChild(tri);
  }

  // kresby
  for (const d of sheet.drawn) {
    const box = document.createElement("div");
    box.style.cssText = `position:absolute;left:${d.a.x}px;top:${d.a.y}px;width:${d.a.w}px;height:${d.a.h}px;z-index:3`;
    if (d.kind === "pic") {
      if (d.src) {
        const img = document.createElement("img");
        img.src = d.src;
        img.alt = "";
        img.style.cssText = "width:100%;height:100%;object-fit:fill;display:block";
        box.appendChild(img);
      }
    } else if (d.kind === "shape") {
      renderShape(d.el, box, d.a.w, d.a.h, theme);
    } else if (d.kind === "group") {
      renderGroup(d.el, box, d.a, theme);
    } else if (d.kind === "chart") {
      if (d.xml) box.appendChild(renderChart(d.xml, d.a.w, d.a.h, theme));
    }
    grid.appendChild(box);
  }

  // záhlaví sloupců a řádků (lepivé, jako v Excelu)
  const frame = document.createElement("div");
  frame.style.cssText = `width:${totalW + HEAD_W}px`;
  const colHead = document.createElement("div");
  colHead.style.cssText = `position:sticky;top:0;z-index:5;height:${HEAD_H}px;width:${totalW + HEAD_W}px;background:#F3F3F3;border-bottom:1px solid #C8C8C8;box-sizing:border-box;font:11px system-ui,sans-serif;color:#555`;
  const corner = document.createElement("div");
  corner.style.cssText = `position:sticky;left:0;z-index:6;width:${HEAD_W}px;height:${HEAD_H - 1}px;background:#E9E9E9;border-right:1px solid #C8C8C8;box-sizing:border-box`;
  colHead.appendChild(corner);
  for (let c = 1; c <= sheet.maxC; c++) {
    if (!sheet.colPx[c]) continue;
    const h = document.createElement("div");
    h.textContent = colName(c);
    h.style.cssText = `position:absolute;left:${HEAD_W + X(c)}px;top:0;width:${sheet.colPx[c]}px;height:${HEAD_H - 1}px;line-height:${HEAD_H - 1}px;text-align:center;border-right:1px solid #D4D4D4;box-sizing:border-box;overflow:hidden`;
    colHead.appendChild(h);
  }
  const body = document.createElement("div");
  body.style.cssText = "display:flex";
  const rowHead = document.createElement("div");
  rowHead.style.cssText = `position:sticky;left:0;z-index:4;flex:none;width:${HEAD_W}px;height:${totalH}px;background:#F3F3F3;border-right:1px solid #C8C8C8;box-sizing:border-box;font:11px system-ui,sans-serif;color:#555`;
  rowHead.style.position = "sticky";
  const rowInner = document.createElement("div");
  rowInner.style.cssText = "position:relative;width:100%;height:100%";
  for (let r = 1; r <= sheet.maxR; r++) {
    if (!sheet.rowPx[r]) continue;
    const h = document.createElement("div");
    h.textContent = String(r);
    h.style.cssText = `position:absolute;left:0;top:${Y(r)}px;width:100%;height:${sheet.rowPx[r]}px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #D4D4D4;box-sizing:border-box;overflow:hidden`;
    rowInner.appendChild(h);
  }
  rowHead.appendChild(rowInner);
  body.append(rowHead, grid);
  frame.append(colHead, body);
  return frame;
}

// ---------------------------------------------------------------- tvary a text

function runCss(rPr: Element | null, defRPr: Element | null, theme: Theme, scale: number, fontRefColor: string | null): string {
  const pick = (n: string) => attr(rPr, n) ?? attr(defRPr, n);
  let s = "";
  const sz = pick("sz");
  s += `font-size:${sz ? (Number(sz) / 100) * (4 / 3) * scale : 11 * (4 / 3) * scale}px;`;
  if (pick("b") === "1") s += "font-weight:700;";
  if (pick("i") === "1") s += "font-style:italic;";
  const u = pick("u");
  if (u && u !== "none") s += "text-decoration:underline;";
  const fill = kid(rPr, "solidFill") ?? kid(defRPr, "solidFill");
  const col = css(dmlColor(fill, theme)) ?? fontRefColor;
  if (col) s += `color:${col};`;
  const latin = attr(kid(rPr, "latin") ?? kid(defRPr, "latin"), "typeface");
  if (latin && !latin.startsWith("+")) s += `font-family:"${latin}",${theme.minorFont},Calibri,Arial,sans-serif;`;
  return s;
}

function renderTextBody(txBody: Element | null, box: HTMLElement, theme: Theme, fontRefColor: string | null) {
  if (!txBody) return;
  const bodyPr = kid(txBody, "bodyPr");
  const ins = (n: string, d: number) => num(bodyPr, n, d) / 9525;
  const anchor = attr(bodyPr, "anchor") ?? "t";
  const vert = attr(bodyPr, "vert");
  const inner = document.createElement("div");
  inner.style.cssText = `position:absolute;inset:0;padding:${ins("tIns", 45720)}px ${ins("rIns", 91440)}px ${ins("bIns", 45720)}px ${ins("lIns", 91440)}px;display:flex;flex-direction:column;justify-content:${anchor === "ctr" ? "center" : anchor === "b" ? "flex-end" : "flex-start"};overflow:hidden;box-sizing:border-box;line-height:1.2;color:${fontRefColor ?? "#000"};font-family:${theme.minorFont},Calibri,Arial,sans-serif`;
  if (vert === "vert" || vert === "eaVert") inner.style.writingMode = "vertical-rl";
  const fontScale = num(kid(bodyPr, "normAutofit"), "fontScale", 100000) / 100000;
  for (const p of kids(txBody, "p")) {
    const pPr = kid(p, "pPr");
    const para = document.createElement("div");
    const algn = attr(pPr, "algn");
    para.style.textAlign = algn === "ctr" ? "center" : algn === "r" ? "right" : algn === "just" ? "justify" : "left";
    para.style.whiteSpace = "pre-wrap";
    para.style.wordBreak = "break-word";
    const defRPr = kid(pPr, "defRPr");
    const bu = kid(pPr, "buChar");
    if (bu) {
      const b = document.createElement("span");
      b.textContent = (attr(bu, "char") ?? "•") + " ";
      para.appendChild(b);
    }
    let any = false;
    for (const r of kids(p)) {
      if (r.localName === "r" || r.localName === "fld") {
        const span = document.createElement("span");
        span.textContent = kid(r, "t")?.textContent ?? "";
        span.style.cssText = runCss(kid(r, "rPr"), defRPr, theme, fontScale, fontRefColor);
        para.appendChild(span);
        any = true;
      } else if (r.localName === "br") para.appendChild(document.createElement("br"));
    }
    if (!any) {
      const end = kid(p, "endParaRPr");
      para.style.cssText += runCss(end, defRPr, theme, fontScale, fontRefColor);
      para.innerHTML += "&nbsp;";
    }
    inner.appendChild(para);
  }
  box.appendChild(inner);
}

function renderShape(el: Element, box: HTMLElement, w: number, h: number, theme: Theme) {
  const spPr = kid(el, "spPr");
  const style = kid(el, "style");
  const geom = attr(kid(spPr, "prstGeom"), "prst") ?? "rect";
  let fill: string | null = null;
  if (kid(spPr, "noFill")) fill = null;
  else if (kid(spPr, "solidFill")) fill = css(dmlColor(kid(spPr, "solidFill"), theme));
  else if (kid(spPr, "gradFill")) fill = css(dmlColor(all(kid(spPr, "gradFill"), "gs")[0] ?? null, theme));
  else if (style && el.localName === "sp") fill = css(dmlColor(kid(style, "fillRef"), theme));
  const ln = kid(spPr, "ln");
  let stroke: string | null = null;
  let sw = ln ? num(ln, "w", 9525) / 12700 * (4 / 3) : 1;
  if (ln && kid(ln, "noFill")) stroke = null;
  else if (ln && kid(ln, "solidFill")) stroke = css(dmlColor(kid(ln, "solidFill"), theme));
  else if (style) stroke = css(dmlColor(kid(style, "lnRef"), theme));
  if (el.localName === "cxnSp") {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.style.overflow = "visible";
    const xf = kid(spPr, "xfrm");
    const flipH = attr(xf, "flipH") === "1", flipV = attr(xf, "flipV") === "1";
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(flipH ? w : 0));
    line.setAttribute("y1", String(flipV ? h : 0));
    line.setAttribute("x2", String(flipH ? 0 : w));
    line.setAttribute("y2", String(flipV ? 0 : h));
    line.setAttribute("stroke", stroke ?? "#000");
    line.setAttribute("stroke-width", String(Math.max(1, sw)));
    svg.appendChild(line);
    box.appendChild(svg);
    return;
  }
  if (!stroke) sw = 0;
  const shape = document.createElement("div");
  shape.style.cssText = `position:absolute;inset:0;box-sizing:border-box;${fill ? `background:${fill};` : ""}${stroke ? `border:${Math.max(1, sw)}px solid ${stroke};` : ""}`;
  if (geom === "ellipse") shape.style.borderRadius = "50%";
  else if (geom === "roundRect") shape.style.borderRadius = `${Math.min(w, h) * 0.16}px`;
  else if (geom === "triangle") shape.style.clipPath = "polygon(50% 0,100% 100%,0 100%)";
  else if (/Arrow/.test(geom)) shape.style.clipPath = "polygon(0 30%,65% 30%,65% 0,100% 50%,65% 100%,65% 70%,0 70%)";
  box.appendChild(shape);
  const fontRefColor = style ? css(dmlColor(kid(style, "fontRef"), theme)) : null;
  renderTextBody(kid(el, "txBody"), box, theme, fontRefColor);
}

function renderGroup(el: Element, box: HTMLElement, a: Anchor, theme: Theme) {
  const xf = kid(kid(el, "grpSpPr"), "xfrm");
  const chOff = kid(xf, "chOff"), chExt = kid(xf, "chExt");
  const cx = num(chExt, "cx", 1) || 1, cy = num(chExt, "cy", 1) || 1;
  const sx = a.w / (cx / 9525), sy = a.h / (cy / 9525);
  for (const ch of kids(el)) {
    if (!["sp", "cxnSp", "pic", "grpSp"].includes(ch.localName)) continue;
    const cxf = kid(kid(ch, ch.localName === "grpSp" ? "grpSpPr" : "spPr"), "xfrm");
    const off = kid(cxf, "off"), ext = kid(cxf, "ext");
    const sub: Anchor = {
      x: ((num(off, "x") - num(chOff, "x")) / 9525) * sx,
      y: ((num(off, "y") - num(chOff, "y")) / 9525) * sy,
      w: (num(ext, "cx") / 9525) * sx,
      h: (num(ext, "cy") / 9525) * sy,
    };
    const b = document.createElement("div");
    b.style.cssText = `position:absolute;left:${sub.x}px;top:${sub.y}px;width:${sub.w}px;height:${sub.h}px`;
    if (ch.localName === "grpSp") renderGroup(ch, b, sub, theme);
    else if (ch.localName !== "pic") renderShape(ch, b, sub.w, sub.h, theme);
    box.appendChild(b);
  }
}

// ---------------------------------------------------------------- grafy (SVG)

type Ser = {
  name: string;
  cats: string[];
  vals: (number | null)[];
  xs: (number | null)[] | null;
  color: string | null;
  lineColor: string | null;
  noFill: boolean;
  noLine: boolean;
  marker: string | null;
  markerSize: number;
  fmt: string;
  el: Element;
  smooth: boolean;
};
type Group = {
  type: string;
  bar: "col" | "bar";
  grouping: string;
  gap: number;
  overlap: number;
  vary: boolean;
  series: Ser[];
  axIds: string[];
  holeSize: number;
};

function cacheVals(el: Element | null): { vals: (number | null)[]; fmt: string } {
  const cache = all(el, "numCache")[0] ?? all(el, "numLit")[0];
  if (!cache) return { vals: [], fmt: "General" };
  const n = num(kid(cache, "ptCount"), "val");
  const vals: (number | null)[] = Array(n).fill(null);
  for (const pt of kids(cache, "pt")) {
    const v = kid(pt, "v")?.textContent;
    vals[num(pt, "idx")] = v == null || v === "" ? null : Number(v);
  }
  return { vals, fmt: kid(cache, "formatCode")?.textContent ?? "General" };
}
function cacheStrs(el: Element | null): string[] {
  const cache = all(el, "strCache")[0] ?? all(el, "strLit")[0];
  if (cache) {
    const n = num(kid(cache, "ptCount"), "val");
    const out: string[] = Array(n).fill("");
    for (const pt of kids(cache, "pt")) out[num(pt, "idx")] = kid(pt, "v")?.textContent ?? "";
    return out;
  }
  const nc = cacheVals(el);
  return nc.vals.map((v) => (v == null ? "" : String(v)));
}

function niceTicks(lo: number, hi: number, major?: number, count = 6): { min: number; max: number; step: number } {
  if (lo === hi) {
    hi = lo + 1;
    lo = lo - (lo > 0 ? 0 : 1);
  }
  let step = major ?? 0;
  if (!step) {
    const raw = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  return { min: Math.floor(lo / step + 1e-9) * step, max: Math.ceil(hi / step - 1e-9) * step, step };
}

function fit(type: string, order: number, xs: number[], ys: number[]): { f: (x: number) => number; r2: number } | null {
  const n = xs.length;
  if (n < 2) return null;
  const solve = (X: number[][], Y: number[]): number[] | null => {
    // nejmenší čtverce: (XᵀX)b = XᵀY, Gaussova eliminace
    const k = X[0].length;
    const A = Array.from({ length: k }, (_, i) => Array.from({ length: k + 1 }, (_, j) => (j < k ? X.reduce((s, row) => s + row[i] * row[j], 0) : X.reduce((s, row, r) => s + row[i] * Y[r], 0))));
    for (let i = 0; i < k; i++) {
      let p = i;
      for (let r = i + 1; r < k; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]];
      if (Math.abs(A[i][i]) < 1e-12) return null;
      for (let r = 0; r < k; r++) {
        if (r === i) continue;
        const f = A[r][i] / A[i][i];
        for (let c = i; c <= k; c++) A[r][c] -= f * A[i][c];
      }
    }
    return A.map((row, i) => row[k] / row[i]);
  };
  const r2of = (pred: number[], obs: number[]) => {
    const mean = obs.reduce((a, b) => a + b, 0) / obs.length;
    const ssr = obs.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0);
    const sst = obs.reduce((s, y) => s + (y - mean) ** 2, 0);
    return sst ? 1 - ssr / sst : 1;
  };
  if (type === "poly" || type === "linear") {
    const o = type === "linear" ? 1 : Math.max(2, order);
    const b = solve(xs.map((x) => Array.from({ length: o + 1 }, (_, i) => x ** i)), ys);
    if (!b) return null;
    const f = (x: number) => b.reduce((s, c, i) => s + c * x ** i, 0);
    return { f, r2: r2of(xs.map(f), ys) };
  }
  if (type === "exp" && ys.every((y) => y > 0)) {
    const ly = ys.map(Math.log);
    const b = solve(xs.map((x) => [1, x]), ly);
    if (!b) return null;
    return { f: (x) => Math.exp(b[0] + b[1] * x), r2: r2of(xs.map((x) => b[0] + b[1] * x), ly) };
  }
  if (type === "log" && xs.every((x) => x > 0)) {
    const b = solve(xs.map((x) => [1, Math.log(x)]), ys);
    if (!b) return null;
    const f = (x: number) => b[0] + b[1] * Math.log(x);
    return { f, r2: r2of(xs.map(f), ys) };
  }
  if (type === "power" && xs.every((x) => x > 0) && ys.every((y) => y > 0)) {
    const ly = ys.map(Math.log);
    const b = solve(xs.map((x) => [1, Math.log(x)]), ly);
    if (!b) return null;
    return { f: (x) => Math.exp(b[0]) * x ** b[1], r2: r2of(xs.map((x) => b[0] + b[1] * Math.log(x)), ly) };
  }
  return null;
}

function svgEl<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}
function svgText(parent: Element, x: number, y: number, text: string, opts: Record<string, string | number> = {}) {
  const t = svgEl("text", { x, y, "font-size": 11, fill: "#595959", ...opts }, parent);
  t.textContent = text;
  return t;
}

function richText(el: Element | null): string {
  return all(el, "p").map((p) => all(p, "t").map((t) => t.textContent ?? "").join("")).filter(Boolean).join(" ");
}

function renderChart(xml: string, W: number, H: number, theme: Theme): Element {
  const doc = parseXml(xml);
  const chart = all(doc, "chart")[0];
  const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "font-family": `${theme.minorFont},Calibri,Arial,sans-serif` });
  const space = doc.documentElement;
  const csp = kid(space, "spPr");
  const bg = kid(csp, "noFill") ? "none" : css(dmlColor(kid(csp, "solidFill"), theme)) ?? "#FFFFFF";
  const bd = kid(kid(csp, "ln"), "noFill") ? "none" : css(dmlColor(kid(kid(csp, "ln"), "solidFill"), theme)) ?? "#D9D9D9";
  svgEl("rect", { x: 0.5, y: 0.5, width: W - 1, height: H - 1, fill: bg, stroke: bd }, svg);
  if (!chart) return svg;

  const plot = kid(chart, "plotArea");
  const palette = [theme.byName.accent1, theme.byName.accent2, theme.byName.accent3, theme.byName.accent4, theme.byName.accent5, theme.byName.accent6].map((c) => "#" + c);
  const seriesColor = (i: number) => (i < 6 ? palette[i] : "#" + tint(palette[i % 6].slice(1), i < 12 ? -0.4 : 0.4));

  const groups: Group[] = [];
  let sIdx = 0;
  for (const g of kids(plot)) {
    if (!/Chart$/.test(g.localName)) continue;
    const type = g.localName.replace(/3D/, "");
    const series: Ser[] = kids(g, "ser").map((s) => {
      const sp = kid(s, "spPr");
      const noFill = !!kid(sp, "noFill");
      const ln = kid(sp, "ln");
      const own = css(dmlColor(kid(sp, "solidFill"), theme));
      const lineOwn = css(dmlColor(kid(ln, "solidFill"), theme));
      const mk = kid(s, "marker");
      const sym = attr(kid(mk, "symbol"), "val");
      const val = cacheVals(kid(s, "val") ?? kid(s, "yVal"));
      const xv = kid(s, "xVal");
      const idx = sIdx++;
      const fallback = seriesColor(num(kid(s, "idx"), "val", idx));
      return {
        name: richText(kid(s, "tx")) || kid(kid(s, "tx"), "v")?.textContent || cacheStrs(kid(s, "tx"))[0] || `Řada ${idx + 1}`,
        cats: cacheStrs(kid(s, "cat") ?? xv),
        vals: val.vals,
        xs: xv && all(xv, "numCache").length ? cacheVals(xv).vals : null,
        color: noFill ? null : own ?? fallback,
        lineColor: kid(ln, "noFill") ? null : lineOwn ?? (type === "lineChart" || type === "scatterChart" ? own ?? fallback : null),
        noFill,
        noLine: !!kid(ln, "noFill"),
        marker: sym === "none" ? null : sym ?? (type === "scatterChart" || type === "lineChart" ? "auto" : null),
        markerSize: num(kid(mk, "size"), "val", 5),
        fmt: val.fmt,
        el: s,
        smooth: attr(kid(s, "smooth"), "val") === "1",
      };
    });
    groups.push({
      type,
      bar: attr(kid(g, "barDir"), "val") === "bar" ? "bar" : "col",
      grouping: attr(kid(g, "grouping"), "val") ?? "clustered",
      gap: num(kid(g, "gapWidth"), "val", 150),
      overlap: num(kid(g, "overlap"), "val", 0),
      vary: attr(kid(g, "varyColors"), "val") === "1",
      series,
      axIds: kids(g, "axId").map((a) => attr(a, "val") ?? ""),
      holeSize: num(kid(g, "holeSize"), "val", 0),
    });
  }

  // nadpis
  let top = 8;
  const titleEl = kid(chart, "title");
  const autoDel = attr(kid(chart, "autoTitleDeleted"), "val") === "1";
  let title = titleEl ? richText(kid(titleEl, "tx")) : "";
  if (!title && titleEl && !autoDel && groups.length === 1 && groups[0].series.length === 1) title = groups[0].series[0].name;
  if (!title && !titleEl && !autoDel && groups.length === 1 && groups[0].series.length === 1) title = groups[0].series[0].name;
  if (title) {
    svgText(svg, W / 2, 24, title, { "text-anchor": "middle", "font-size": 15, fill: "#404040" });
    top = 36;
  }

  // legenda
  const legend = kid(chart, "legend");
  const legendPos = legend ? attr(kid(legend, "legendPos"), "val") ?? "r" : null;
  const pieLike = groups.some((g) => g.type === "pieChart" || g.type === "doughnutChart" || g.type === "ofPieChart");
  const legItems: { name: string; color: string; line: boolean }[] = [];
  if (legend) {
    for (const g of groups) {
      if (g.type === "pieChart" || g.type === "doughnutChart" || (g.vary && g.series.length === 1 && g.type === "barChart")) {
        const s = g.series[0];
        s?.cats.forEach((c, i) => legItems.push({ name: c, color: dataPointColor(s, i, seriesColor(i), theme), line: false }));
      } else for (const s of g.series) legItems.push({ name: s.name, color: s.color ?? s.lineColor ?? "#999", line: g.type === "lineChart" || g.type === "scatterChart" });
    }
  }
  let left = 10, right = W - 10, bottom = H - 10;
  const ml = path(legend, "layout", "manualLayout");
  if (legend && legItems.length && ml && kid(ml, "x") && kid(ml, "y")) {
    // Legenda ručně posunutá v Excelu: pozice v podílu velikosti grafu.
    const lx = num(kid(ml, "x"), "val") * W, ly = num(kid(ml, "y"), "val") * H;
    let y = ly + 12;
    for (const l of legItems) {
      drawLegendKey(svg, lx, y - 4, l);
      svgText(svg, lx + 14, y, l.name);
      y += 18;
    }
    if (lx > W / 2) right = Math.min(right, lx - 8);
    else if (ly > H / 2) bottom = Math.min(bottom, ly - 4);
  } else if (legend && legItems.length) {
    if (legendPos === "b" || legendPos === "t") {
      const rowH = 18;
      const y = legendPos === "b" ? H - 14 : top + 6;
      let x = 0;
      const widths = legItems.map((l) => 22 + l.name.length * 6.2);
      const totalW = widths.reduce((a, b) => a + b, 0);
      x = Math.max(8, (W - totalW) / 2);
      legItems.forEach((l, i) => {
        drawLegendKey(svg, x, y - 4, l);
        svgText(svg, x + 14, y, l.name);
        x += widths[i];
      });
      if (legendPos === "b") bottom -= rowH + 4;
      else top += rowH + 4;
    } else {
      const maxW = Math.min(W * 0.35, 18 + Math.max(...legItems.map((l) => l.name.length * 6.2)));
      const x = legendPos === "l" ? 10 : W - maxW - 6;
      let y = (top + bottom) / 2 - (legItems.length * 18) / 2 + 12;
      for (const l of legItems) {
        drawLegendKey(svg, x, y - 4, l);
        svgText(svg, x + 14, y, l.name.length > maxW / 6 ? l.name.slice(0, Math.floor(maxW / 6)) + "…" : l.name);
        y += 18;
      }
      if (legendPos === "l") left += maxW + 6;
      else right -= maxW + 8;
    }
  }

  if (pieLike) {
    const g = groups.find((x) => x.type === "pieChart" || x.type === "doughnutChart" || x.type === "ofPieChart")!;
    renderPie(svg, g, left, top, right, bottom, theme, seriesColor);
    return svg;
  }

  // osy
  const axes = new Map<string, Element>();
  for (const a of kids(plot)) if (/Ax$/.test(a.localName)) axes.set(attr(kid(a, "axId"), "val") ?? "", a);
  const valAxes = [...axes.values()].filter((a) => a.localName === "valAx");
  const horizontal = groups.some((g) => g.type === "barChart" && g.bar === "bar");
  const scatter = groups.some((g) => g.type === "scatterChart");
  // Primární = osa první skupiny; sekundární = druhá sada os
  const prim = groups[0]?.axIds ?? [];
  const secGroup = groups.find((g) => g.axIds.some((id) => !prim.includes(id)));
  const sec = secGroup?.axIds ?? [];
  const valAxOf = (ids: string[]) => ids.map((id) => axes.get(id)).find((a) => a?.localName === "valAx" && (scatter ? attr(kid(a, "axPos"), "val") === "l" || attr(kid(a, "axPos"), "val") === "r" : true)) ?? null;
  const catAxOf = (ids: string[]) =>
    ids.map((id) => axes.get(id)).find((a) => a && a !== valAxOf(ids) && (a.localName !== "valAx" || scatter)) ?? null;

  const valuesOf = (g: Group) => {
    if (g.grouping === "stacked" || g.grouping === "percentStacked") {
      const n = Math.max(...g.series.map((s) => s.vals.length), 0);
      const pos: number[] = [], neg: number[] = [];
      for (let i = 0; i < n; i++) {
        let p = 0, q = 0;
        for (const s of g.series) {
          const v = s.vals[i] ?? 0;
          if (v >= 0) p += v;
          else q += v;
        }
        pos.push(g.grouping === "percentStacked" ? 1 : p);
        neg.push(q);
      }
      return [...pos, ...neg, 0];
    }
    return g.series.flatMap((s) => s.vals.filter((v): v is number => v != null)).concat(g.type === "barChart" || g.type === "areaChart" ? [0] : []);
  };
  const rangeFor = (ax: Element | null, gs: Group[]) => {
    const vs = gs.flatMap(valuesOf).concat(gs.flatMap(errExtents));
    let lo = vs.length ? Math.min(...vs) : 0;
    let hi = vs.length ? Math.max(...vs) : 1;
    const sc = kid(ax, "scaling");
    const fixedMin = kid(sc, "min") ? num(kid(sc, "min"), "val") : null;
    const fixedMax = kid(sc, "max") ? num(kid(sc, "max"), "val") : null;
    if (fixedMin == null && lo > 0 && !scatter && gs.every((g) => g.type !== "lineChart" || lo < hi * 0.84)) lo = 0;
    if (fixedMin == null && lo > 0 && lo < hi * 0.84) lo = Math.min(lo, 0);
    const major = kid(ax, "majorUnit") ? num(kid(ax, "majorUnit"), "val") : undefined;
    const t = niceTicks(fixedMin ?? lo, fixedMax ?? hi, major);
    return { min: fixedMin ?? t.min, max: fixedMax ?? t.max, step: t.step, rev: attr(kid(sc, "orientation"), "val") === "maxMin" };
  };
  const primGroups = groups.filter((g) => !secGroup || g.axIds.join() !== sec.join() || sec.join() === prim.join());
  const secGroups = secGroup && sec.join() !== prim.join() ? groups.filter((g) => g.axIds.join() === sec.join()) : [];
  const pv = valAxOf(prim);
  const sv = secGroups.length ? valAxOf(sec) : null;
  const pr = rangeFor(pv, primGroups);
  const sr = sv ? rangeFor(sv, secGroups) : null;
  const pc = catAxOf(prim);

  // kategorie / x
  const cats = groups.find((g) => g.series[0]?.cats.length)?.series[0]?.cats ?? [];
  const nCat = Math.max(cats.length, ...groups.map((g) => Math.max(0, ...g.series.map((s) => s.vals.length))));
  let xr: { min: number; max: number; step: number; rev: boolean } | null = null;
  if (scatter) {
    const xs = groups.flatMap((g) => g.series.flatMap((s) => (s.xs ?? s.vals.map((_, i) => i + 1)).filter((v): v is number => v != null)));
    const xs2 = xs.concat(groups.flatMap((g) => g.series.flatMap(trendExtentX)));
    const sc = kid(pc, "scaling");
    const t = niceTicks(Math.min(0, ...xs2), Math.max(...xs2), kid(pc, "majorUnit") ? num(kid(pc, "majorUnit"), "val") : undefined);
    xr = { min: kid(sc, "min") ? num(kid(sc, "min"), "val") : t.min, max: kid(sc, "max") ? num(kid(sc, "max"), "val") : t.max, step: t.step, rev: false };
  }

  const fmtAxis = (ax: Element | null, gs: Group[], v: number) => {
    const nf = kid(ax, "numFmt");
    let code = attr(nf, "formatCode") ?? "General";
    const zRady = gs[0]?.series[0]?.fmt;
    if ((attr(nf, "sourceLinked") === "1" || code === "General") && zRady && zRady !== "General") code = zRady;
    const units = attr(kid(kid(ax, "dispUnits"), "builtInUnit"), "val");
    const div = units === "thousands" ? 1e3 : units === "millions" ? 1e6 : units === "hundreds" ? 100 : units === "tenThousands" ? 1e4 : units === "hundredThousands" ? 1e5 : units === "billions" ? 1e9 : 1;
    const ssf = (window as unknown as { SSF?: SsfGlobal }).SSF;
    const val = v / div;
    if (!ssf) return String(Math.round(val * 100) / 100);
    if (code === "General") return formatNumber(Math.round(val * 1e6) / 1e6, "General", ssf);
    return formatNumber(val, code, ssf);
  };

  // místo pro popisky os
  const maxLabel = (r: typeof pr, ax: Element | null, gs: Group[]) => {
    let m = 0;
    for (let v = r.min; v <= r.max + r.step / 2; v += r.step) m = Math.max(m, fmtAxis(ax, gs, v).length);
    return m * 6.5 + 10;
  };
  const deleted = (ax: Element | null) => attr(kid(ax, "delete"), "val") === "1";
  const lblPos = (ax: Element | null) => attr(kid(ax, "tickLblPos"), "val") ?? "nextTo";
  const valLabelSpace = deleted(pv) || lblPos(pv) === "none" ? 6 : horizontal ? 0 : maxLabel(pr, pv, primGroups);
  const secLabelSpace = sr && sv && !deleted(sv) ? maxLabel(sr, sv, secGroups) : 0;
  const catLabelSpace = deleted(pc) ? 6 : horizontal ? Math.min(W * 0.35, Math.max(...cats.map((c) => c.length), 1) * 6.2 + 10) : 22;
  const axTitle = (ax: Element | null) => (ax && !deleted(ax) ? richText(kid(kid(ax, "title"), "tx")) : "");
  const catTitle = axTitle(pc), valTitle = axTitle(pv), secTitle = sv ? axTitle(sv) : "";
  const bottomTitle = horizontal ? valTitle : catTitle;
  const leftTitle = horizontal ? catTitle : valTitle;
  const px0 = left + (horizontal ? catLabelSpace : valLabelSpace) + (leftTitle ? 18 : 0);
  const px1 = right - secLabelSpace - 4 - (secTitle ? 18 : 0);
  const py0 = top + 6;
  const py1 = bottom - (horizontal ? 20 : catLabelSpace) - (bottomTitle ? 18 : 0);
  if (bottomTitle) svgText(svg, (px0 + px1) / 2, bottom - 4, bottomTitle, { "text-anchor": "middle", "font-size": 12 });
  if (leftTitle) svgText(svg, 0, 0, leftTitle, { "text-anchor": "middle", "font-size": 12, transform: `translate(${left + 10},${(py0 + py1) / 2}) rotate(-90)` });
  if (secTitle) svgText(svg, 0, 0, secTitle, { "text-anchor": "middle", "font-size": 12, transform: `translate(${right - 6},${(py0 + py1) / 2}) rotate(90)` });
  const pw = Math.max(10, px1 - px0), ph = Math.max(10, py1 - py0);

  const plotSp = kid(plot, "spPr");
  const plotFill = css(dmlColor(kid(plotSp, "solidFill"), theme));
  if (plotFill) svgEl("rect", { x: px0, y: py0, width: pw, height: ph, fill: plotFill }, svg);

  // mapování hodnot
  const vMap = (r: typeof pr) => (v: number) => {
    const f = (v - r.min) / (r.max - r.min || 1);
    const ff = r.rev ? 1 - f : f;
    return horizontal ? px0 + ff * pw : py1 - ff * ph;
  };
  const pV = vMap(pr);
  const sV = sr ? vMap(sr) : pV;
  const catRev = attr(kid(kid(pc, "scaling"), "orientation"), "val") === "maxMin";
  const band = (horizontal ? ph : pw) / Math.max(1, nCat);
  const lineOnly = groups.every((g) => g.type === "lineChart" || g.type === "areaChart");
  const crossBetween = attr(kid(pv, "crossBetween"), "val") ?? (lineOnly ? "between" : "between");
  const catPos = (i: number) => {
    const k = catRev ? nCat - 1 - i : i;
    if (horizontal) return py1 - (k + 0.5) * band;
    if (crossBetween === "midCat" && nCat > 1) return px0 + (k / (nCat - 1)) * pw;
    return px0 + (k + 0.5) * band;
  };
  const xMap = (x: number) => px0 + ((x - (xr?.min ?? 0)) / ((xr?.max ?? 1) - (xr?.min ?? 0) || 1)) * pw;

  // mřížka a popisky hodnotové osy
  const gridColor = "#D9D9D9";
  const drawValAxis = (ax: Element | null, r: typeof pr, map: (v: number) => number, gs: Group[], side: "main" | "sec") => {
    if (!ax) return;
    const showGrid = !!kid(ax, "majorGridlines") && side === "main";
    for (let v = r.min, i = 0; v <= r.max + r.step / 2 && i < 200; v += r.step, i++) {
      const p = map(v);
      if (showGrid) {
        if (horizontal) svgEl("line", { x1: p, y1: py0, x2: p, y2: py1, stroke: gridColor }, svg);
        else svgEl("line", { x1: px0, y1: p, x2: px1, y2: p, stroke: gridColor }, svg);
      }
      if (deleted(ax) || lblPos(ax) === "none") continue;
      const label = fmtAxis(ax, gs, Math.abs(v) < r.step / 1e6 ? 0 : v);
      if (horizontal) svgText(svg, p, py1 + 14, label, { "text-anchor": "middle" });
      else if (side === "main") svgText(svg, px0 - 5, p + 4, label, { "text-anchor": "end" });
      else svgText(svg, px1 + 5, p + 4, label, { "text-anchor": "start" });
    }
    const units = attr(kid(kid(ax, "dispUnits"), "builtInUnit"), "val");
    if (units && kid(kid(ax, "dispUnits"), "dispUnitsLbl")) {
      const label = ({ thousands: "Tisíce", millions: "Miliony", hundreds: "Stovky" } as Record<string, string>)[units] ?? "";
      if (label) svgText(svg, side === "main" ? px0 - 5 : px1 + 5, py0 - 2, label, { "text-anchor": side === "main" ? "end" : "start", "font-size": 10 });
    }
  };
  if (scatter && xr) {
    // vodorovná hodnotová osa scatteru
    const showGrid = !!kid(pc, "majorGridlines");
    for (let v = xr.min, i = 0; v <= xr.max + xr.step / 2 && i < 200; v += xr.step, i++) {
      const p = xMap(v);
      if (showGrid) svgEl("line", { x1: p, y1: py0, x2: p, y2: py1, stroke: gridColor }, svg);
      if (!deleted(pc)) svgText(svg, p, py1 + 15, fmtAxis(pc, [], v), { "text-anchor": "middle" });
    }
  }
  drawValAxis(pv, pr, pV, primGroups, "main");
  if (sv && sr) drawValAxis(sv, sr, sV, secGroups, "sec");

  // osa kategorií
  const zeroV = pV(Math.max(pr.min, Math.min(pr.max, 0)));
  if (!scatter) {
    if (horizontal) svgEl("line", { x1: zeroV, y1: py0, x2: zeroV, y2: py1, stroke: "#BFBFBF" }, svg);
    else svgEl("line", { x1: px0, y1: zeroV, x2: px1, y2: zeroV, stroke: "#BFBFBF" }, svg);
    if (!deleted(pc) && lblPos(pc) !== "none") {
      const low = lblPos(pc) === "low";
      const every = Math.max(1, Math.ceil(nCat / Math.max(1, (horizontal ? ph : pw) / 30)));
      for (let i = 0; i < nCat; i += horizontal ? 1 : every) {
        const c = cats[i] ?? String(i + 1);
        const label = c.length > 18 ? c.slice(0, 17) + "…" : c;
        if (horizontal) svgText(svg, px0 - 5, catPos(i) + 4, label, { "text-anchor": "end" });
        else svgText(svg, catPos(i), (low ? py1 : zeroV) + 15, label, { "text-anchor": "middle" });
      }
    }
  } else {
    svgEl("line", { x1: px0, y1: zeroV, x2: px1, y2: zeroV, stroke: "#BFBFBF" }, svg);
  }

  // řady
  for (const g of groups) {
    const map = secGroups.includes(g) ? sV : pV;
    if (g.type === "barChart") {
      const stacked = g.grouping === "stacked" || g.grouping === "percentStacked";
      const n = stacked ? 1 : g.series.length;
      const ov = stacked ? 0 : g.overlap / 100;
      const barW = band / (n - (n - 1) * ov + g.gap / 100);
      const posAcc: number[] = [], negAcc: number[] = [];
      g.series.forEach((s, si) => {
        for (let i = 0; i < s.vals.length; i++) {
          let v = s.vals[i];
          if (v == null) continue;
          if (g.grouping === "percentStacked") {
            const tot = g.series.reduce((a, t) => a + Math.abs(t.vals[i] ?? 0), 0) || 1;
            v = v / tot;
          }
          let b0 = 0;
          if (stacked) {
            b0 = v >= 0 ? posAcc[i] ?? 0 : negAcc[i] ?? 0;
            if (v >= 0) posAcc[i] = b0 + v;
            else negAcc[i] = b0 + v;
          }
          const start = catPos(i) - (n * barW - (n - 1) * ov * barW) / 2 + (stacked ? 0 : si * barW * (1 - ov));
          const a = map(b0), b = map(b0 + v);
          const color = g.vary && g.series.length === 1 ? dataPointColor(s, i, seriesColor(i), theme) : dataPointColor(s, i, s.color ?? "", theme);
          if (!color || s.noFill) continue;
          if (horizontal) svgEl("rect", { x: Math.min(a, b), y: start, width: Math.abs(b - a), height: barW, fill: color }, svg);
          else svgEl("rect", { x: start, y: Math.min(a, b), width: barW, height: Math.abs(b - a), fill: color }, svg);
          drawErrBars(svg, s, i, v, horizontal ? Math.min(a, b) : start + barW / 2, map, horizontal);
          drawLabel(svg, s, g, i, v, horizontal ? Math.max(a, b) + 4 : start + barW / 2, horizontal ? start + barW / 2 + 4 : Math.min(a, b) - 4, horizontal);
        }
      });
    } else if (g.type === "lineChart" || g.type === "areaChart" || g.type === "scatterChart") {
      const acc: number[] = [];
      for (const s of g.series) {
        const pts: [number, number][] = [];
        for (let i = 0; i < s.vals.length; i++) {
          let v = s.vals[i];
          if (v == null) continue;
          if (g.grouping === "stacked") {
            v = (acc[i] ?? 0) + v;
            acc[i] = v;
          }
          const x = g.type === "scatterChart" ? xMap((s.xs ? s.xs[i] : i + 1) ?? i + 1) : catPos(i);
          pts.push([x, map(v)]);
        }
        const color = s.lineColor ?? s.color ?? "#4472C4";
        if (g.type === "areaChart" && pts.length) {
          const d = `M${pts[0][0]} ${map(0)}L` + pts.map((p) => p.join(" ")).join("L") + `L${pts[pts.length - 1][0]} ${map(0)}Z`;
          svgEl("path", { d, fill: s.color ?? color, opacity: 0.85 }, svg);
        } else if (!s.noLine && !(g.type === "scatterChart" && attr(all(doc, "scatterStyle")[0] ?? null, "val") === "marker") && pts.length > 1 && s.lineColor !== null) {
          svgEl("polyline", { points: pts.map((p) => p.join(",")).join(" "), fill: "none", stroke: color, "stroke-width": 2.25, "stroke-linejoin": "round" }, svg);
        }
        if (s.marker) {
          const mfill = css(dmlColor(kid(kid(kid(s.el, "marker"), "spPr"), "solidFill"), theme)) ?? color;
          for (const [x, y] of pts) {
            if (s.marker === "square") svgEl("rect", { x: x - s.markerSize / 2, y: y - s.markerSize / 2, width: s.markerSize, height: s.markerSize, fill: mfill }, svg);
            else svgEl("circle", { cx: x, cy: y, r: s.markerSize / 2 + 0.5, fill: mfill }, svg);
          }
        }
        pts.forEach(([x], i) => {
          const v = s.vals[i];
          if (v != null) drawErrBars(svg, s, i, v, x, map, false);
        });
        s.vals.forEach((v, i) => {
          if (v != null && pts[i]) drawLabel(svg, s, g, i, v, pts[i][0], pts[i][1] - 6, false);
        });
        drawTrend(svg, s, g, map, xMap, catPos, color, px1);
      }
    }
  }
  return svg;

  // --- pomocníci uvnitř grafu ---
  function errExtents(g: Group): number[] {
    const out: number[] = [];
    for (const s of g.series) {
      const eb = kid(s.el, "errBars");
      if (!eb) continue;
      s.vals.forEach((v, i) => {
        if (v == null) return;
        const d = errAmount(eb, v, s.vals, i);
        out.push(v + d, v - d);
      });
    }
    return out;
  }
  function trendExtentX(s: Ser): number[] {
    const tl = kid(s.el, "trendline");
    if (!tl) return [];
    const xs = (s.xs ?? s.vals.map((_, i) => i + 1)).filter((v): v is number => v != null);
    if (!xs.length) return [];
    return [Math.max(...xs) + num(kid(tl, "forward"), "val"), Math.min(...xs) - num(kid(tl, "backward"), "val")];
  }
  function drawLabel(parent: Element, s: Ser, g: Group, i: number, v: number, x: number, y: number, hor: boolean) {
    const dl = kid(s.el, "dLbls") ?? kid(all(doc, g.type)[0] ?? null, "dLbls");
    if (attr(kid(dl, "showVal"), "val") !== "1") return;
    const ssf = (window as unknown as { SSF?: SsfGlobal }).SSF;
    const text = ssf ? formatNumber(v, s.fmt, ssf) : String(v);
    svgText(parent, x, y, text, { "text-anchor": hor ? "start" : "middle", fill: "#404040" });
  }
  function drawErrBars(parent: Element, s: Ser, i: number, v: number, x: number, map: (v: number) => number, hor: boolean) {
    const eb = kid(s.el, "errBars");
    if (!eb) return;
    const d = errAmount(eb, v, s.vals, i);
    const type = attr(kid(eb, "errBarType"), "val") ?? "both";
    const hi = type === "minus" ? v : v + d;
    const lo = type === "plus" ? v : v - d;
    const col = css(dmlColor(kid(kid(kid(eb, "spPr"), "ln"), "solidFill"), theme)) ?? "#404040";
    const cap = attr(kid(eb, "noEndCap"), "val") !== "1";
    if (hor) return;
    svgEl("line", { x1: x, y1: map(lo), x2: x, y2: map(hi), stroke: col, "stroke-width": 1.25 }, parent);
    if (cap) {
      svgEl("line", { x1: x - 4, y1: map(lo), x2: x + 4, y2: map(lo), stroke: col }, parent);
      svgEl("line", { x1: x - 4, y1: map(hi), x2: x + 4, y2: map(hi), stroke: col }, parent);
    }
  }
  function drawTrend(parent: Element, s: Ser, g: Group, map: (v: number) => number, xm: (x: number) => number, cp: (i: number) => number, color: string, maxX: number) {
    for (const tl of kids(s.el, "trendline")) {
      const type = attr(kid(tl, "trendlineType"), "val") ?? "linear";
      const order = num(kid(tl, "order"), "val", 2);
      const xs: number[] = [], ys: number[] = [];
      s.vals.forEach((v, i) => {
        if (v == null) return;
        xs.push(g.type === "scatterChart" ? (s.xs?.[i] ?? i + 1) : i + 1);
        ys.push(v);
      });
      const tcol = css(dmlColor(kid(kid(kid(tl, "spPr"), "ln"), "solidFill"), theme)) ?? color;
      if (type === "movingAvg") {
        const per = num(kid(tl, "period"), "val", 2);
        const pts: string[] = [];
        for (let i = per - 1; i < ys.length; i++) {
          const avg = ys.slice(i - per + 1, i + 1).reduce((a, b) => a + b, 0) / per;
          const x = g.type === "scatterChart" ? xm(xs[i]) : cp(xs[i] - 1);
          pts.push(`${x},${map(avg)}`);
        }
        svgEl("polyline", { points: pts.join(" "), fill: "none", stroke: tcol, "stroke-width": 1.75, "stroke-dasharray": "2 3" }, parent);
        continue;
      }
      const model = fit(type, order, xs, ys);
      if (!model) continue;
      const fwd = num(kid(tl, "forward"), "val"), bwd = num(kid(tl, "backward"), "val");
      const x0 = Math.min(...xs) - bwd, x1 = Math.max(...xs) + fwd;
      const pts: string[] = [];
      for (let k = 0; k <= 60; k++) {
        const x = x0 + ((x1 - x0) * k) / 60;
        const sx = g.type === "scatterChart" ? xm(x) : cp(0) + (x - 1) * ((cp(1) - cp(0)) || 0);
        if (sx > maxX + 1) break;
        pts.push(`${sx},${map(model.f(x))}`);
      }
      svgEl("polyline", { points: pts.join(" "), fill: "none", stroke: tcol, "stroke-width": 1.75, "stroke-dasharray": "2 3" }, parent);
      if (attr(kid(tl, "dispRSqr"), "val") === "1") {
        const last = pts[pts.length - 1]?.split(",").map(Number) ?? [maxX, py0];
        svgText(parent, Math.min(last[0], maxX) - 4, Math.max(py0 + 12, last[1] - 8), `R² = ${model.r2.toFixed(4).replace(".", ",")}`, { "text-anchor": "end", fill: "#404040" });
      }
    }
  }
}

function errAmount(eb: Element, v: number, vals: (number | null)[], _i: number): number {
  const t = attr(kid(eb, "errValType"), "val") ?? "fixedVal";
  const val = num(kid(eb, "val"), "val", t === "percentage" ? 5 : 1);
  if (t === "percentage") return Math.abs(v) * val / 100;
  if (t === "fixedVal") return val;
  const xs = vals.filter((x): x is number => x != null);
  const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, xs.length - 1));
  if (t === "stdDev") return sd * val;
  if (t === "stdErr") return sd / Math.sqrt(xs.length || 1);
  return 0;
}

function dataPointColor(s: Ser, i: number, fallback: string, theme: Theme): string {
  for (const dp of kids(s.el, "dPt")) {
    if (num(kid(dp, "idx"), "val") === i) {
      const sp = kid(dp, "spPr");
      if (kid(sp, "noFill")) return "";
      const c = css(dmlColor(kid(sp, "solidFill"), theme));
      if (c) return c;
    }
  }
  return fallback;
}

function drawLegendKey(svg: Element, x: number, y: number, l: { color: string; line: boolean }) {
  if (l.line) svgEl("line", { x1: x, y1: y, x2: x + 10, y2: y, stroke: l.color, "stroke-width": 2.5 }, svg);
  else svgEl("rect", { x, y: y - 4, width: 9, height: 9, fill: l.color || "none", stroke: l.color ? "none" : "#999" }, svg);
}

function renderPie(svg: Element, g: Group, left: number, top: number, right: number, bottom: number, theme: Theme, seriesColor: (i: number) => string) {
  const s = g.series[0];
  if (!s) return;
  const vals = s.vals.map((v) => Math.max(0, v ?? 0));
  const tot = vals.reduce((a, b) => a + b, 0) || 1;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  const r = Math.max(10, Math.min(right - left, bottom - top) / 2 - 12);
  let a = -Math.PI / 2;
  const dl = kid(s.el, "dLbls") ?? kid(s.el.parentElement, "dLbls");
  const showPct = attr(kid(dl, "showPercent"), "val") === "1";
  const showVal = attr(kid(dl, "showVal"), "val") === "1";
  const showCat = attr(kid(dl, "showCatName"), "val") === "1";
  vals.forEach((v, i) => {
    const sweep = (v / tot) * Math.PI * 2;
    const color = dataPointColor(s, i, seriesColor(i), theme);
    const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
    const x2 = cx + r * Math.cos(a + sweep), y2 = cy + r * Math.sin(a + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    if (v > 0) {
      if (sweep >= Math.PI * 2 - 1e-6) svgEl("circle", { cx, cy, r, fill: color, stroke: "#fff" }, svg);
      else svgEl("path", { d: `M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}Z`, fill: color, stroke: "#fff", "stroke-width": 1 }, svg);
    }
    if (g.holeSize) svgEl("circle", { cx, cy, r: (r * g.holeSize) / 100, fill: "#fff" }, svg);
    if ((showPct || showVal || showCat) && v > 0) {
      const mid = a + sweep / 2;
      const parts: string[] = [];
      if (showCat) parts.push(s.cats[i] ?? "");
      if (showVal) parts.push(String(v).replace(".", ","));
      if (showPct) parts.push(`${Math.round((v / tot) * 100)}%`);
      const pos = attr(kid(dl, "dLblPos"), "val") ?? "bestFit";
      const out = pos === "outEnd" || pos === "bestFit";
      const rr = out ? r + 16 : r * 0.62;
      const lx = cx + rr * Math.cos(mid), ly = cy + rr * Math.sin(mid);
      const anchor = out ? (Math.cos(mid) > 0.2 ? "start" : Math.cos(mid) < -0.2 ? "end" : "middle") : "middle";
      parts.forEach((t, k) => {
        svgText(svg, lx, ly + 4 + (k - (parts.length - 1) / 2) * 13, t, { "text-anchor": anchor, fill: out ? "#404040" : "#fff", "font-weight": out ? 400 : 700 });
      });
    }
    a += sweep;
  });
}

// ---------------------------------------------------------------- vstupní bod

/**
 * Stáhne sešit a vykreslí ho do `container` (záložky listů + aktivní list).
 * Vrací úklid (uvolní obrázky).
 */
export async function renderXlsx(
  url: string,
  container: HTMLElement,
  strings: { truncated: (rows: number, cols: number) => string; sheetError: string; sheetLabel: string },
  signal?: AbortSignal,
): Promise<() => void> {
  await Promise.all([nactiKnihovnu("jszip"), nactiKnihovnu("ssf")]);
  const JSZip = (window as unknown as { JSZip?: JsZipGlobal }).JSZip;
  const ssf = (window as unknown as { SSF?: SsfGlobal }).SSF;
  if (!JSZip || !ssf) throw new Error("Knihovny pro náhled se nenačetly");
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());

  const wbRels = await rels(zip, "xl/workbook.xml");
  const theme = parseTheme(await zipText(zip, [...wbRels.values()].find((r) => r.type === "theme")?.target ?? "xl/theme/theme1.xml"));
  const styles = parseStyles(await zipText(zip, "xl/styles.xml"), theme);
  const sstXml = await zipText(zip, "xl/sharedStrings.xml");
  const shared = sstXml ? kids(parseXml(sstXml).documentElement, "si").map((si) => all(si, "t").filter((t) => t.parentElement?.localName !== "rPh").map((t) => t.textContent ?? "").join("")) : [];
  const wb = parseXml((await zipText(zip, "xl/workbook.xml")) ?? "<workbook/>");
  const sheets = all(wb, "sheet")
    .filter((s) => (attr(s, "state") ?? "visible") === "visible")
    .map((s) => ({ name: attr(s, "name") ?? "", path: wbRels.get(attr(s, "r:id") ?? "")?.target ?? "" }))
    .filter((s) => s.path && zip.file(s.path));
  const activeTab = num(all(wb, "workbookView")[0] ?? null, "activeTab");
  const allSheets = all(wb, "sheet");
  const activeName = attr(allSheets[activeTab] ?? null, "name");

  const blobUrls: string[] = [];
  const host = document.createElement("div");
  host.style.cssText = "display:flex;flex-direction:column;height:100%";
  const tabs = document.createElement("div");
  tabs.setAttribute("role", "tablist");
  tabs.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px;background:#E7E7E7;border-bottom:1px solid #C8C8C8;font:13px system-ui,sans-serif;position:sticky;top:0;z-index:10";
  const view = document.createElement("div");
  view.style.cssText = "flex:1;overflow:auto;background:#fff;position:relative";
  // Posuvníky vidět vždy (globals.css) a list jde po kliknutí posouvat šipkami.
  view.className = "nahled-posuv";
  view.tabIndex = 0;
  view.setAttribute("aria-label", strings.sheetLabel);
  const note = document.createElement("p");
  note.style.cssText = "margin:0;padding:6px 10px;font:12px system-ui,sans-serif;color:#555;background:#FFF8E1;display:none";
  host.append(tabs, note, view);
  container.appendChild(host);

  const cache = new Map<string, HTMLElement>();
  const show = async (i: number) => {
    const s = sheets[i];
    Array.from(tabs.children).forEach((b, k) => {
      const on = k === i;
      (b as HTMLElement).setAttribute("aria-selected", on ? "true" : "false");
      (b as HTMLElement).style.background = on ? "#fff" : "transparent";
      (b as HTMLElement).style.fontWeight = on ? "600" : "400";
      (b as HTMLElement).style.color = on ? "#107C41" : "#333";
    });
    let el = cache.get(s.path);
    let sh: Sheet | null = null;
    if (!el) {
      view.textContent = "…";
      try {
        sh = await loadSheet(zip, s.path, s.name, shared, styles, theme, ssf);
        for (const d of sh.drawn) if (d.kind === "pic" && d.src) blobUrls.push(d.src);
        el = renderSheet(sh, theme, styles.defaultFont);
        el.dataset.trR = String(sh.truncatedRows);
        el.dataset.trC = String(sh.truncatedCols);
      } catch (err) {
        console.error(`List „${s.name}“ se nepodařilo vykreslit:`, err);
        el = document.createElement("p");
        el.dataset.chyba = "1";
        el.style.cssText = "padding:24px;font:14px system-ui,sans-serif;color:#555";
        el.textContent = strings.sheetError;
      }
      cache.set(s.path, el);
    }
    view.textContent = "";
    view.scrollTo(0, 0);
    view.appendChild(el);
    const tr = Number(el.dataset.trR ?? 0), tc = Number(el.dataset.trC ?? 0);
    note.style.display = tr || tc ? "block" : "none";
    note.textContent = tr || tc ? strings.truncated(tr, tc) : "";
  };
  sheets.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = s.name;
    b.style.cssText = "border:1px solid #C8C8C8;border-radius:4px;padding:3px 10px;cursor:pointer;background:transparent";
    b.onclick = () => void show(i);
    tabs.appendChild(b);
  });
  const start = Math.max(0, sheets.findIndex((s) => s.name === activeName));
  await show(start);
  return () => {
    host.remove();
    for (const u of blobUrls) URL.revokeObjectURL(u);
  };
}
