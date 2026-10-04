/**
 * Klientský náhled .pptx – stejně jako Word se vykresluje přímo v prohlížeči.
 *
 * Snímky kreslí knihovna pptx-preview (lazy z CDN se SRI, soubor nikam
 * neodchází – cizí prohlížeč Microsoftu rada u Wordu zamítla). Karel chtěl
 * vidět, co na snímcích „skutečně je“, ne textový výpis (2. 10. 2026).
 * Pod každý snímek se přidají poznámky pro vyučujícího, které knihovna
 * neukazuje – ty čteme z OOXML sami (JSZip, uzly `<a:t>`).
 *
 * Když vykreslení selže, náhled spadne zpátky na textový přepis (`readPptx`).
 */

const JSZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const JSZIP_SRI = "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG";

export type Slide = {
  no: number;
  /** První řádek snímku – v praxi nadpis. */
  title: string;
  /** Zbytek textu snímku, po řádcích. */
  body: string[];
  /** Poznámky pro vyučujícího (pokud snímek nějaké má). */
  notes: string[];
};

type JsZipFile = { async(type: "string"): Promise<string> };
type JsZipInstance = {
  file(path: string): JsZipFile | null;
  file(path: string, data: string): JsZipInstance;
  files: Record<string, unknown>;
  generateAsync(opts: { type: "arraybuffer" }): Promise<ArrayBuffer>;
};
type JsZipGlobal = { loadAsync(data: ArrayBuffer): Promise<JsZipInstance> };

const PPTX_URL = "https://cdn.jsdelivr.net/npm/pptx-preview@1.0.7/dist/pptx-preview.umd.js";
const PPTX_SRI = "sha384-CwntHHT2FbwZXuCmbf6K93YaEB9xRVVLaqFJ7pdMykeQABb/3MA0sbt2lGbgi1Mr";

type PptxGlobal = {
  init(
    el: HTMLElement,
    opts: { width: number; height: number },
  ): { preview(data: ArrayBuffer): Promise<unknown> };
};

let scriptPromise: Promise<void> | undefined;
let pptxPromise: Promise<void> | undefined;

function loadPptxPreview(): Promise<void> {
  if (pptxPromise) return pptxPromise;
  pptxPromise = new Promise<void>((resolve, reject) => {
    if ((window as unknown as { pptxPreview?: unknown }).pptxPreview) return resolve();
    const s = document.createElement("script");
    s.src = PPTX_URL;
    s.async = true;
    s.integrity = PPTX_SRI;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => {
      pptxPromise = undefined;
      reject(new Error("Nepodařilo se načíst pptx-preview"));
    };
    document.head.appendChild(s);
  });
  return pptxPromise;
}

function loadJsZip(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if ((window as unknown as { JSZip?: unknown }).JSZip) return resolve();
    const s = document.createElement("script");
    s.src = JSZIP_URL;
    s.async = true;
    s.integrity = JSZIP_SRI;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("Nepodařilo se načíst JSZip"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Text z OOXML: každý `<a:t>` je kus textu, `<a:p>` odstavec (= řádek). */
function textLines(xml: string): string[] {
  return xml
    .split(/<a:p[ >]/)
    .map((para) => {
      const runs = [...para.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]);
      return runs
        .join("")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
}

/** Číslo snímku z cesty `ppt/slides/slide12.xml`. */
function slideNo(path: string): number {
  return Number(path.match(/(\d+)\.xml$/)?.[1] ?? 0);
}

/** Stáhne .pptx a vrátí text jednotlivých snímků včetně poznámek. */
export async function readPptx(url: string): Promise<Slide[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  return (await readPptxData(await res.arrayBuffer())).slides;
}

/** Text snímků, poznámky a poměr stran snímku (výška / šířka). */
async function readPptxData(data: ArrayBuffer): Promise<{ slides: Slide[]; ratio: number }> {
  await loadJsZip();
  const JSZip = (window as unknown as { JSZip?: JsZipGlobal }).JSZip;
  if (!JSZip) throw new Error("JSZip se nenačetlo");
  const zip = await JSZip.loadAsync(data);

  const paths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => slideNo(a) - slideNo(b));

  const slides: Slide[] = [];
  for (const path of paths) {
    const no = slideNo(path);
    const lines = textLines((await zip.file(path)!.async("string")) ?? "");

    // Poznámky přiřazujeme podle vztahu snímku, ne podle čísla – u ručně
    // přeskládaných prezentací notesSlideN neodpovídá slideN.
    let notes: string[] = [];
    const rels = zip.file(`ppt/slides/_rels/slide${no}.xml.rels`);
    const target = rels
      ? (await rels.async("string")).match(/Target="[^"]*(notesSlide\d+\.xml)"/)?.[1]
      : undefined;
    const notesFile = target ? zip.file(`ppt/notesSlides/${target}`) : null;
    if (notesFile) {
      // Poslední řádek poznámek bývá jen číslo snímku – zahodíme ho.
      notes = textLines(await notesFile.async("string")).filter((l) => !/^\d+$/.test(l));
    }

    slides.push({ no, title: lines[0] ?? "", body: lines.slice(1), notes });
  }

  let ratio = 9 / 16;
  const pres = zip.file("ppt/presentation.xml");
  const sz = pres ? (await pres.async("string")).match(/<p:sldSz cx="(\d+)" cy="(\d+)"/) : null;
  if (sz && Number(sz[1]) > 0) ratio = Number(sz[2]) / Number(sz[1]);
  return { slides, ratio };
}

const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";

/**
 * Přepíše výchozí formát odstavce (`a:pPr/a:defRPr`) do každého běhu textu
 * (`a:r/a:rPr`). Prezentace z jiných nástrojů (např. Internet a bezpečnost)
 * mají velikost, tučnost i barvu písma jen tam – pptx-preview to nečte a nadpis
 * pak vyšel drobný a netučný. Pro PowerPoint je to totéž, jen zapsané v běhu.
 */
async function normalizePptx(data: ArrayBuffer): Promise<ArrayBuffer> {
  await loadJsZip();
  const JSZip = (window as unknown as { JSZip?: JsZipGlobal }).JSZip;
  if (!JSZip) throw new Error("JSZip se nenačetlo");
  const zip = await JSZip.loadAsync(data);
  const parts = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  let changed = false;
  for (const path of parts) {
    const xml = await zip.file(path)!.async("string");
    if (!xml.includes("defRPr")) continue;
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) continue;
    let touched = false;
    for (const p of Array.from(doc.getElementsByTagNameNS(NS_A, "p"))) {
      const pPr = Array.from(p.children).find((c) => c.localName === "pPr");
      const def = pPr && Array.from(pPr.children).find((c) => c.localName === "defRPr");
      if (!def) continue;
      for (const r of Array.from(p.children).filter((c) => c.localName === "r" || c.localName === "fld")) {
        let rPr = Array.from(r.children).find((c) => c.localName === "rPr");
        if (!rPr) {
          rPr = doc.createElementNS(NS_A, "a:rPr");
          r.insertBefore(rPr, r.firstChild);
        }
        for (const at of Array.from(def.attributes)) {
          if (!rPr.hasAttribute(at.name)) rPr.setAttribute(at.name, at.value);
        }
        const ma = new Set(Array.from(rPr.children).map((c) => c.localName));
        for (const c of Array.from(def.children)) {
          if (!ma.has(c.localName)) rPr.appendChild(c.cloneNode(true));
        }
        touched = true;
      }
    }
    if (touched) {
      zip.file(path, new XMLSerializer().serializeToString(doc));
      changed = true;
    }
  }
  return changed ? zip.generateAsync({ type: "arraybuffer" }) : data;
}

/**
 * Vykreslí snímky do `container` a pod každý přidá poznámky pro vyučujícího.
 * Vrací úklid (odebrání vykreslených snímků).
 */
export async function renderPptx(
  url: string,
  container: HTMLElement,
  notesLabel: string,
): Promise<() => void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  const data = await res.arrayBuffer();
  const [{ slides, ratio }] = await Promise.all([readPptxData(data.slice(0)), loadPptxPreview()]);
  const g = (window as unknown as { pptxPreview?: PptxGlobal }).pptxPreview;
  if (!g) throw new Error("pptx-preview se nenačetlo");

  const width = Math.max(280, Math.min(container.clientWidth - 24, 960));
  const host = document.createElement("div");
  // Snímky bez vlastního písma by jinak dostaly výchozí patkové písmo prohlížeče.
  host.style.fontFamily = 'Calibri, "Segoe UI", Arial, sans-serif';
  container.appendChild(host);
  await g.init(host, { width, height: Math.round(width * ratio) }).preview(await normalizePptx(data.slice(0)));

  const wrapper = host.querySelector<HTMLElement>(".pptx-preview-wrapper");
  if (!wrapper || !wrapper.querySelector(".pptx-preview-slide-wrapper")) {
    host.remove();
    throw new Error("Prezentace se nevykreslila");
  }
  // Rolování obstará okno náhledu, ne knihovna (ta by měla vlastní posuvník).
  wrapper.style.height = "auto";
  wrapper.style.overflow = "visible";
  wrapper.style.background = "transparent";

  wrapper.querySelectorAll<HTMLElement>(".pptx-preview-slide-wrapper").forEach((el, i) => {
    el.style.boxShadow = "0 1px 4px rgba(0,0,0,.25)";
    const notes = slides[i]?.notes ?? [];
    if (!notes.length) return;
    const det = document.createElement("details");
    det.style.cssText = `width:${width}px;margin:-4px auto 14px;font:14px/1.5 system-ui,sans-serif;color:inherit`;
    const sum = document.createElement("summary");
    sum.textContent = notesLabel;
    sum.style.cssText = "cursor:pointer;font-size:12px;opacity:.8";
    det.appendChild(sum);
    for (const line of notes) {
      const p = document.createElement("p");
      p.textContent = line;
      p.style.cssText = "margin:4px 0 0;padding-left:10px;border-left:2px solid rgba(127,127,127,.4)";
      det.appendChild(p);
    }
    el.insertAdjacentElement("afterend", det);
  });
  return () => host.remove();
}
