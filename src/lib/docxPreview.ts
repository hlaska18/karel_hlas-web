/**
 * Klientský náhled .docx souborů přes knihovnu docx-preview (render přímo
 * v prohlížeči – žádná externí služba nevidí soubor, na rozdíl od MS/Google
 * vieweru, který rada dřív zamítla). Načítá se lazy z CDN až při prvním
 * otevření náhledu Wordu.
 */

const JSZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const JSZIP_SRI = "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG";
const DOCX_URL = "https://cdn.jsdelivr.net/npm/docx-preview@0.3.2/dist/docx-preview.min.js";
const DOCX_SRI = "sha384-WbeDqP/pDz1XLGS3CK6UwoSPLG1dRLX4FQqEEWWBMc4j8KM3s5eojZQGdW9Of0xV";

type DocxGlobal = {
  renderAsync: (
    data: Blob | ArrayBuffer,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement | null,
    options?: Record<string, unknown>,
  ) => Promise<void>;
};

const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string, integrity: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.integrity = integrity;
    s.crossOrigin = "anonymous";
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

/** Stáhne .docx a vykreslí ho do zadaného kontejneru. */
export async function renderDocx(url: string, container: HTMLElement): Promise<void> {
  await loadScript(JSZIP_URL, JSZIP_SRI); // docx-preview potřebuje globální JSZip
  await loadScript(DOCX_URL, DOCX_SRI);
  const docx = (window as unknown as { docx?: DocxGlobal }).docx;
  if (!docx) throw new Error("docx-preview se nenačetlo");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  const blob = await res.blob();

  container.innerHTML = "";
  await docx.renderAsync(blob, container, null, {
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: true,
  });
}
