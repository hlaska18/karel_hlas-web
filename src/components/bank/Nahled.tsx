"use client";

/**
 * Náhled souboru z banky: okno (`PreviewModal`) a vykreslení jednotlivých
 * typů – Word, Excel, PowerPoint, text a kód. Vyčleněno z BankBrowser.tsx
 * (audit 4. 10. 2026: soubor měl přes 2 300 řádků a změna náhledu
 * vyžadovala orientaci v logice hledání a témat). Chování se nezměnilo.
 */

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, X } from "lucide-react";
import type { Lang } from "@/lib/content";
import { CODE, DOCX, IMG, NAHLED_STR, PPTX, TEXT, XLSX, opensInBrowser } from "@/lib/nahled";
import type { BankItem } from "@/lib/materials";
import { zaznamenejStazeni } from "@/lib/mereni";

/** Vezme lokalizované pole {cs,en} (nebo prázdný řetězec, když chybí). */
function L(field: { cs: string; en: string } | undefined, lang: Lang): string {
  return field ? field[lang] : "";
}

/** Náhled .docx: vykreslení client-side přes docx-preview (knihovny z vlastní kopie, CDN je záloha). */
function DocxView({
  href,
  loadingText,
  errorText,
}: {
  href: string;
  loadingText: string;
  errorText: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    let dispose: (() => void) | undefined;
    // Zavření náhledu zruší i rozběhnuté stahování souboru (audit 4. 10. 2026)
    // – pomalý dokument pak nemůže dobíhat zbytečně ani přepsat novější náhled.
    const zruseni = new AbortController();
    setState("loading");
    import("@/lib/docxPreview")
      .then((m) => {
        if (!ref.current)
          throw new Error("Náhled byl zavřen před dokončením načítání");
        return m.renderDocx(href, ref.current, zruseni.signal);
      })
      .then((cleanup) => {
        // Náhled se mohl mezitím zavřít – sledování velikosti hned odpojíme.
        if (!alive) cleanup();
        else {
          dispose = cleanup;
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(
          `Náhled dokumentu se nepodařilo vykreslit (${href}):`,
          err,
        );
        setState("error");
      });
    return () => {
      alive = false;
      zruseni.abort();
      dispose?.();
    };
  }, [href]);

  return (
    <div className="relative h-[78vh] w-full overflow-auto rounded-ovladac bg-zinc-300 dark:bg-zinc-700">
      {state === "loading" && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-200">
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
        </p>
      )}
      {state === "error" && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-600 dark:text-zinc-200">
          {errorText}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}

/**
 * Náhled .xlsx – listy, textová pole, obrázky a grafy vykreslené přímo
 * v prohlížeči vlastním kódem (`xlsxPreview`). Soubor nikam neodchází.
 */
function XlsxView({ href, lang }: { href: string; lang: Lang }) {
  const n = NAHLED_STR[lang];
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    let dispose: (() => void) | undefined;
    const zruseni = new AbortController();
    setState("loading");
    import("@/lib/xlsxPreview")
      .then((m) => {
        if (!ref.current) throw new Error("Náhled byl zavřen před dokončením načítání");
        return m.renderXlsx(
          href,
          ref.current,
          { truncated: n.xlsxTruncated, sheetError: n.xlsxSheetError, sheetLabel: n.xlsxSheetLabel },
          zruseni.signal,
        );
      })
      .then((cleanup) => {
        if (!alive) cleanup();
        else {
          dispose = cleanup;
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Sešit se nepodařilo vykreslit (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
      zruseni.abort();
      dispose?.();
    };
  }, [href, n]);

  return (
    <div className="relative h-[78vh] w-full overflow-hidden rounded-ovladac bg-white">
      {state === "loading" && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" /> {n.xlsxLoading}
        </p>
      )}
      {state === "error" && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-600">
          {n.xlsxError}
        </p>
      )}
      <div ref={ref} className="h-full" />
    </div>
  );
}

/**
 * Náhled .pptx – snímky vykreslené přímo v prohlížeči (`renderPptx`, stejně
 * jako Word přes docx-preview), pod každým poznámky pro vyučujícího. Když
 * vykreslení selže (starý prohlížeč, nečekaný obsah), ukáže se textový přepis.
 */
function PptxView({
  href,
  lang,
  loadingText,
  errorText,
}: {
  href: string;
  lang: Lang;
  loadingText: string;
  errorText: string;
}) {
  const n = NAHLED_STR[lang];
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "text">("loading");

  useEffect(() => {
    let alive = true;
    let dispose: (() => void) | undefined;
    const zruseni = new AbortController();
    setState("loading");
    import("@/lib/pptxPreview")
      .then((m) => {
        if (!ref.current) throw new Error("Náhled byl zavřen před dokončením načítání");
        return m.renderPptx(href, ref.current, n.pptxNotes, zruseni.signal);
      })
      .then((cleanup) => {
        if (!alive) cleanup();
        else {
          dispose = cleanup;
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Prezentaci se nepodařilo vykreslit (${href}):`, err);
        setState("text");
      });
    return () => {
      alive = false;
      zruseni.abort();
      dispose?.();
    };
  }, [href, n.pptxNotes]);

  if (state === "text") {
    return <PptxTextView href={href} lang={lang} loadingText={loadingText} errorText={errorText} />;
  }
  return (
    <div className="relative h-[78vh] w-full overflow-auto rounded-ovladac bg-zinc-300 py-3 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100">
      {state === "loading" && (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-200">
          <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
        </p>
      )}
      <div ref={ref} />
    </div>
  );
}

/**
 * Záložní náhled .pptx – textový přepis snímků, když se snímky nepodaří
 * vykreslit. Ukazuje aspoň, CO na snímcích je.
 */
function PptxTextView({
  href,
  lang,
  loadingText,
  errorText,
}: {
  href: string;
  lang: Lang;
  loadingText: string;
  errorText: string;
}) {
  const n = NAHLED_STR[lang];
  const [slides, setSlides] = useState<
    import("@/lib/pptxPreview").Slide[] | null
  >(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    import("@/lib/pptxPreview")
      .then((m) => m.readPptx(href))
      .then((data) => {
        if (!alive) return;
        setSlides(data);
        setState("ready");
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Prezentaci se nepodařilo přečíst (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  if (state === "loading") {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  }
  if (state === "error" || !slides) {
    return (
      <p className="px-6 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
        {errorText}
      </p>
    );
  }

  return (
    <div className="h-[78vh] w-full overflow-auto">
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        {n.pptxNote}
      </p>
      <ol className="space-y-3">
        {slides.map((sl) => (
          <li key={sl.no} className="povrch rounded-karta p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-accent-700 dark:text-accent-400">
              {n.pptxSlide} {sl.no}
            </p>
            {sl.title && (
              <p className="mt-1 font-display font-semibold tracking-podnadpis text-zinc-900 dark:text-white">
                {sl.title}
              </p>
            )}
            {sl.body.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {sl.body.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {sl.notes.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600 hover:text-accent-700 dark:text-accent-400 dark:text-zinc-400 dark:hover:text-accent-400">
                  {n.pptxNotes}
                </summary>
                <div className="mt-2 space-y-1 border-l border-black/10 pl-3 text-sm leading-relaxed text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                  {sl.notes.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Náhled prostého textu (.txt, .csv). Soubor stáhneme a vypíšeme do <pre> –
 * <iframe src=".txt"> se na mobilním Safari kvůli text/plain vůbec nevykreslí.
 */
function TextView({
  href,
  loadingText,
  errorText,
}: {
  href: string;
  loadingText: string;
  errorText: string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    setState("loading");
    fetch(href)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
        return res.text();
      })
      .then((t) => {
        if (alive) {
          setText(t);
          setState("ready");
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`Náhled textu se nepodařilo načíst (${href}):`, err);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  if (state === "loading")
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  if (state === "error")
    return (
      <p className="px-6 py-16 text-center text-sm text-zinc-600 dark:text-zinc-300">
        {errorText}
      </p>
    );
  return (
    <div className="h-[78vh] w-full overflow-auto rounded-ovladac bg-white dark:bg-zinc-900">
      <pre className="whitespace-pre-wrap break-words p-5 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {text}
      </pre>
    </div>
  );
}

/**
 * Náhled souborů s kódem (.py, .sql, .js…). Text stáhneme fetchem (jako TextView)
 * a obarvíme přes highlight.js (lazy z CDN). Výsledek jde do scrollovatelného
 * monospace <pre>; téma se přepíná světlá/tmavá dle třídy .dark na <html>.
 */
function CodeView({
  href,
  ext,
  loadingText,
  errorText,
}: {
  href: string;
  ext: string;
  loadingText: string;
  errorText: string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [html, setHtml] = useState("");

  useEffect(() => {
    let alive = true;
    const zruseni = new AbortController();
    setState("loading");
    (async () => {
      try {
        const res = await fetch(href, { signal: zruseni.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const { highlightCode } = await import("@/lib/codePreview");
        const out = await highlightCode(text, ext);
        if (alive) {
          setHtml(out);
          setState("ready");
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
      zruseni.abort();
    };
  }, [href, ext]);

  if (state === "loading")
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600 dark:text-zinc-300">
        <Loader2 className="h-4 w-4 animate-spin" /> {loadingText}
      </p>
    );
  if (state === "error")
    return (
      <p className="px-6 py-16 text-center text-sm text-zinc-600 dark:text-zinc-300">
        {errorText}
      </p>
    );
  return (
    <div className="h-[78vh] w-full overflow-auto rounded-ovladac bg-white dark:bg-zinc-900">
      <pre className="p-5 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 sm:text-sm">
        <code
          className="hljs bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}

/**
 * Modální náhled materiálu.
 *
 * Exportovaný kvůli stohu ukázek v hlavičce webu, který materiál ukazoval
 * na místě. Stoh nahradila tlačítka na simulátory; export zůstal pro
 * případ, že by se ukázka vracela.
 */
export function PreviewModal({
  item,
  lang,
  onClose,
}: {
  item: BankItem;
  lang: Lang;
  onClose: () => void;
}) {
  const n = NAHLED_STR[lang];
  const isImg = IMG.includes(item.ext);
  const isDocx = DOCX.includes(item.ext);
  const isText = TEXT.includes(item.ext);
  const isCode = CODE.includes(item.ext);
  const isPptx = PPTX.includes(item.ext);
  const isXlsx = XLSX.includes(item.ext);
  const label = L(item.label, lang);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fokus musí zůstat uvnitř náhledu. Bez toho se Tabem propadne do
    // seznamu POD překryvem a po zavření začíná procházení od hlavičky.
    const vratitNa = document.activeElement as HTMLElement | null;
    const ohnisko = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          // `iframe` (náhled PDF) a `summary` (poznámky u prezentací) chyběly,
          // takže je Tab přeskakoval a vracel se na začátek (Codex 27. 9. 2026).
          'a[href], button:not([disabled]), textarea, input, select, iframe, summary, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const prvky = ohnisko();
      if (!prvky.length) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const prvni = prvky[0];
      const posledni = prvky[prvky.length - 1];
      const kde = document.activeElement;
      if (e.shiftKey && (kde === prvni || kde === panelRef.current)) {
        e.preventDefault();
        posledni.focus();
      } else if (!e.shiftKey && kde === posledni) {
        e.preventDefault();
        prvni.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // Fokus zpátky na tlačítko, ze kterého se náhled otevřel.
      vratitNa?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${n.previewTitle}: ${label}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-panel outline-none"
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-3.5 dark:border-white/10">
          <p className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-white">
            {label}
          </p>
          {opensInBrowser(item.ext) && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={n.openNewTab}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-accent-400 dark:text-zinc-300 dark:hover:text-accent-400"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
          <a
            href={item.href}
            download
            onClick={() => zaznamenejStazeni(item)}
            title={n.downloadTitle}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-800"
          >
            <Download className="h-4 w-4" /> {n.downloadTitle}
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label={n.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-white/40 p-3 dark:bg-black/20">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.href}
              alt={label}
              className="max-h-[78vh] max-w-full object-contain"
            />
          ) : isDocx ? (
            <DocxView
              href={item.href}
              loadingText={n.docxLoading}
              errorText={n.docxError}
            />
          ) : isText ? (
            <TextView
              href={item.href}
              loadingText={n.docxLoading}
              errorText={n.docxError}
            />
          ) : isPptx ? (
            <PptxView
              href={item.href}
              lang={lang}
              loadingText={n.pptxLoading}
              errorText={n.pptxError}
            />
          ) : isXlsx ? (
            <XlsxView href={item.href} lang={lang} />
          ) : isCode ? (
            <CodeView
              href={item.href}
              ext={item.ext}
              loadingText={n.codeLoading}
              errorText={n.codeError}
            />
          ) : (
            <iframe
              src={item.href}
              title={label}
              className="h-[78vh] w-full rounded-ovladac border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
