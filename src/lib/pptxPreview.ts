/**
 * Klientský náhled .pptx – textový přepis snímků.
 *
 * Skutečné vykreslení snímků by znamenalo tahat těžkou knihovnu (nebo poslat
 * soubor cizí službě, což rada u Wordu zamítla). Prezentace v bance ale nejsou
 * grafika, jsou to zadání a poznámky pro vyučujícího – a ty se dají vytáhnout
 * přímo z OOXML: rozbalíme .pptx (JSZip, stejná knihovna jako u Wordu) a ze
 * snímků i poznámek přečteme textové uzly `<a:t>`.
 *
 * Náhled tak řekne, co v prezentaci je, ještě než ji člověk stáhne.
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
type JsZipInstance = { file(path: string): JsZipFile | null; files: Record<string, unknown> };
type JsZipGlobal = { loadAsync(data: ArrayBuffer): Promise<JsZipInstance> };

let scriptPromise: Promise<void> | undefined;

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
  await loadJsZip();
  const JSZip = (window as unknown as { JSZip?: JsZipGlobal }).JSZip;
  if (!JSZip) throw new Error("JSZip se nenačetlo");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());

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
  return slides;
}
