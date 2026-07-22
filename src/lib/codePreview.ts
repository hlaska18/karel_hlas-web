/**
 * Klientský náhled souborů s kódem: zvýraznění syntaxe přes highlight.js
 * (lazy z CDN, stejně jako docx-preview u Wordu). Nic se neposílá na cizí službu –
 * soubor si stáhne prohlížeč a obarví ho lokálně.
 *
 * Pozn. k tématu: highlight.js CSS téma z CDN je vždy jen JEDNO (buď světlé, nebo
 * tmavé). Protože web přepíná světlý/tmavý režim třídou `.dark` na <html>, načítáme
 * místo CDN CSS vlastní inline styl s OBĚMA variantami – barvy tokenů jsou v CSS
 * proměnných a pod `.dark` se přepnou na tmavou paletu (GitHub light/dark).
 */

// Oficiální browser-build highlight.js (vystaví globální `window.hljs` a obsahuje
// „common" sadu jazyků: python, sql, javascript, typescript, json, xml/html, css,
// java, c, cpp, bash… – tedy vše, co v bance potřebujeme).
const HLJS_URL = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js";

type HljsGlobal = {
  highlight: (
    code: string,
    options: { language: string; ignoreIllegals?: boolean },
  ) => { value: string };
  highlightAuto: (code: string) => { value: string };
  getLanguage: (name: string) => unknown;
};

/** Přípona souboru → název jazyka v highlight.js (jinak necháme auto-detekci). */
const LANG_BY_EXT: Record<string, string> = {
  py: "python",
  sql: "sql",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "xml",
  xml: "xml",
  css: "css",
  java: "java",
  c: "c",
  cpp: "cpp",
  sh: "bash",
};

const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptCache.delete(src);
      reject(new Error(`Nepodařilo se načíst ${src}`));
    };
    document.head.appendChild(s);
  });
  scriptCache.set(src, p);
  return p;
}

const STYLE_ID = "hljs-dual-theme";

/**
 * Vloží (jednou) inline CSS téma pro zvýraznění. Barvy tokenů jsou v proměnných;
 * `.dark .hljs` je přepíše na tmavou paletu. Základní barvu textu a pozadí řídí
 * Tailwind na obalu (`<pre>`), aby náhled ladil s modalem – proto tady záměrně
 * nenastavujeme `.hljs { background/color }`.
 */
function ensureStyles(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.hljs {
  --hl-comment: #6a737d;
  --hl-keyword: #d73a49;
  --hl-string: #032f62;
  --hl-number: #005cc5;
  --hl-title: #6f42c1;
  --hl-type: #6f42c1;
  --hl-tag: #22863a;
  --hl-attr: #005cc5;
  --hl-built_in: #e36209;
  --hl-meta: #6a737d;
  --hl-symbol: #e36209;
  --hl-regexp: #032f62;
}
.dark .hljs {
  --hl-comment: #8b949e;
  --hl-keyword: #ff7b72;
  --hl-string: #a5d6ff;
  --hl-number: #79c0ff;
  --hl-title: #d2a8ff;
  --hl-type: #ff7b72;
  --hl-tag: #7ee787;
  --hl-attr: #79c0ff;
  --hl-built_in: #ffa657;
  --hl-meta: #8b949e;
  --hl-symbol: #ffa657;
  --hl-regexp: #a5d6ff;
}
.hljs-comment, .hljs-quote { color: var(--hl-comment); font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-subst { color: var(--hl-keyword); }
.hljs-number, .hljs-literal { color: var(--hl-number); }
.hljs-variable, .hljs-template-variable, .hljs-tag .hljs-attr { color: var(--hl-attr); }
.hljs-string, .hljs-doctag, .hljs-addition { color: var(--hl-string); }
.hljs-title, .hljs-section, .hljs-selector-id, .hljs-function .hljs-title { color: var(--hl-title); }
.hljs-type, .hljs-class .hljs-title, .hljs-title.class_ { color: var(--hl-type); }
.hljs-tag, .hljs-name, .hljs-attribute { color: var(--hl-tag); }
.hljs-regexp, .hljs-link { color: var(--hl-regexp); }
.hljs-symbol, .hljs-bullet { color: var(--hl-symbol); }
.hljs-built_in, .hljs-builtin-name, .hljs-params { color: var(--hl-built_in); }
.hljs-meta, .hljs-meta .hljs-keyword { color: var(--hl-meta); }
.hljs-attr { color: var(--hl-attr); }
.hljs-deletion { color: var(--hl-keyword); }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: 700; }
`.trim();
  document.head.appendChild(style);
}

/**
 * Vrátí HTML se zvýrazněným kódem (tokeny obalené do <span class="hljs-…">).
 * highlight.js escapuje `<`, `>`, `&`, takže výstup je bezpečné vložit přes
 * dangerouslySetInnerHTML. Zároveň zajistí načtení inline tématu.
 */
export async function highlightCode(code: string, ext: string): Promise<string> {
  await loadScript(HLJS_URL);
  ensureStyles();
  const hljs = (window as unknown as { hljs?: HljsGlobal }).hljs;
  if (!hljs) throw new Error("highlight.js se nenačetlo");

  const lang = LANG_BY_EXT[ext];
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  }
  // Neznámá přípona → nech knihovnu jazyk odhadnout.
  return hljs.highlightAuto(code).value;
}
