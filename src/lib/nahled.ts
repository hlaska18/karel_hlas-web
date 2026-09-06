import type { Lang } from "@/lib/content";

/**
 * Co umíme ukázat v náhledu a jak se to jmenuje.
 *
 * Vytaženo z `BankBrowser.tsx`, protože náhled přestal patřit jen bance:
 * po kliknutí na ukázku v hlavičce se otevírá i odtamtud. Kdyby si každé
 * místo drželo vlastní seznam přípon, rozešly by se — a rozejít se můžou
 * TIŠE: karta by šla otevřít, ale modal by neuměl nic vykreslit.
 *
 * Soubor je schválně bez Reactu a bez `fs`, aby šel importovat i z knihovny
 * (`heroPick.ts` ho potřebuje při filtrování nabídky do hlavičky).
 */

/** Typy, které umíme spolehlivě zobrazit přímo (bez cizí služby). */
export const IMG = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
/** PDF ukážeme v <iframe> (prohlížeč má vestavěný prohlížeč PDF). */
export const PDF = ["pdf"];
/** Prostý text: stáhneme a vypíšeme do <pre> (iframe s text/plain se na mobilu nevykreslí). */
export const TEXT = ["txt", "csv"];
/** Word: vykreslujeme client-side přes docx-preview (jen moderní .docx, ne starý .doc). */
export const DOCX = ["docx"];
/** Zdrojový kód: obarvíme přes highlight.js (lazy z CDN) a vypíšeme do <pre>. */
export const CODE = [
  "py",
  "sql",
  "js",
  "ts",
  "tsx",
  "jsx",
  "json",
  "html",
  "css",
  "java",
  "c",
  "cpp",
  "sh",
  "xml",
];
/** PowerPoint: vypíšeme text snímků a poznámky (viz `pptxPreview`). */
export const PPTX = ["pptx"];

/**
 * Otevře prohlížeč tenhle typ přímo v záložce? U .docx, .pptx nebo .zip ne –
 * jen se stáhnou, takže tlačítko „Otevřít v nové záložce" by dělalo totéž
 * co „Stáhnout" a v hlavičce náhledu by byla dvě tlačítka s jedním účinkem.
 */
export function opensInBrowser(ext: string): boolean {
  return PDF.includes(ext) || IMG.includes(ext) || ["txt", "csv", "html"].includes(ext);
}

export function canPreview(ext: string): boolean {
  return (
    IMG.includes(ext) ||
    PDF.includes(ext) ||
    TEXT.includes(ext) ||
    DOCX.includes(ext) ||
    PPTX.includes(ext) ||
    CODE.includes(ext)
  );
}

/**
 * Popisky náhledu. Bydlí tady, ne v `STR` uvnitř banky, ze stejného důvodu
 * jako seznamy přípon: „Náhled" potřebuje řádek materiálu v bance, hlavička
 * modálu i karta v hlavičce webu. Tři ručně psané kopie téhož slova se dřív
 * nebo později rozejdou.
 */
export const NAHLED_STR: Record<Lang, {
  previewTitle: string;
  downloadTitle: string;
  openNewTab: string;
  close: string;
  docxLoading: string;
  docxError: string;
  pptxLoading: string;
  pptxError: string;
  pptxNote: string;
  pptxSlide: string;
  pptxNotes: string;
  codeLoading: string;
  codeError: string;
}> = {
  cs: {
    previewTitle: "Náhled",
    downloadTitle: "Stáhnout",
    openNewTab: "Otevřít v nové záložce",
    close: "Zavřít",
    docxLoading: "Načítám náhled dokumentu…",
    docxError: "Náhled se nepodařilo vykreslit – stáhni si dokument tlačítkem výše.",
    pptxLoading: "Načítám prezentaci…",
    pptxError: "Prezentaci se nepodařilo přečíst – stáhni si ji tlačítkem výše.",
    pptxNote: "Textový přehled snímků. Obrázky a rozvržení uvidíš po stažení.",
    pptxSlide: "Snímek",
    pptxNotes: "Poznámky pro vyučujícího",
    codeLoading: "Načítám náhled kódu…",
    codeError: "Náhled kódu se nepodařilo vykreslit – stáhni si soubor tlačítkem výše.",
  },
  en: {
    previewTitle: "Preview",
    downloadTitle: "Download",
    openNewTab: "Open in new tab",
    close: "Close",
    docxLoading: "Loading document preview…",
    docxError: "Preview failed to render – use the download button above.",
    pptxLoading: "Loading presentation…",
    pptxError: "Could not read the presentation – use the download button above.",
    pptxNote: "Text overview of the slides. Images and layout appear after download.",
    pptxSlide: "Slide",
    pptxNotes: "Speaker notes",
    codeLoading: "Loading code preview…",
    codeError: "Code preview failed to render – use the download button above.",
  },
};
