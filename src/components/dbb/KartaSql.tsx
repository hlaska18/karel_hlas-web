"use client";

/**
 * Karta Spustit SQL – editor, výsledek a zpráva, pod sebou jako v programu.
 *
 * Editor je obyčejná textarea s průhledným písmem položená přesně nad
 * obarveným textem (<pre>). Obě vrstvy mají stejné písmo i odsazení
 * (`.dbb-kod`) a při rolování se posouvají spolu.
 */

import { useRef, type ReactNode } from "react";
import { Play, StepForward, Square, Printer, FolderOpen, Save, FileDown } from "lucide-react";
import { useDbb } from "@/components/dbb/kontext";
import { Mrizka } from "@/components/dbb/Mrizka";
import { zvyrazni } from "@/lib/dbb/zvyrazneni";
import { t } from "@/lib/dbb/jazyk";

const TRIDA: Record<string, string> = {
  slovo: "dbb-slovo",
  text: "dbb-text-hodnota",
  cislo: "dbb-cislo",
  komentar: "dbb-komentar",
  funkce: "dbb-funkce",
};

function Ikona({
  children,
  titulek,
  akce,
  zakazano,
}: {
  children: ReactNode;
  titulek: string;
  akce?: () => void;
  zakazano?: boolean;
}) {
  return (
    <button
      type="button"
      title={titulek}
      aria-label={titulek}
      onClick={akce}
      disabled={zakazano || !akce}
      className="flex h-[24px] w-[26px] items-center justify-center rounded-[3px] enabled:hover:bg-dbb-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Editor() {
  const api = useDbb();
  const preRef = useRef<HTMLPreElement>(null);
  const cislaRef = useRef<HTMLDivElement>(null);

  const srovnej = () => {
    const ta = api.editorRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (cislaRef.current) cislaRef.current.scrollTop = ta.scrollTop;
  };

  const pocet = Math.max(1, api.editor.split("\n").length);
  const cisla: number[] = [];
  for (let i = 1; i <= pocet; i++) cisla.push(i);

  return (
    <div className="flex min-h-0 flex-1 border border-dbb-linka bg-dbb-povrch">
      <div
        ref={cislaRef}
        aria-hidden="true"
        className="dbb-kod w-[42px] shrink-0 overflow-hidden border-r border-dbb-mrizka bg-dbb-hlavicka py-1 pr-2 text-right text-dbb-slaby"
      >
        {cisla.map((c) => (
          <div key={c}>{c}</div>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="dbb-kod pointer-events-none absolute bottom-0 left-0 right-0 top-0 m-0 overflow-hidden py-1 pl-2 pr-4"
        >
          {zvyrazni(api.editor).map((k, i) =>
            k.trida ? (
              <span key={i} className={TRIDA[k.trida]}>
                {k.text}
              </span>
            ) : (
              k.text
            ),
          )}
          {"\n"}
        </pre>
        <textarea
          ref={api.editorRef}
          value={api.editor}
          onChange={(e) => api.nastavEditor(e.target.value)}
          onScroll={srovnej}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label={t("Editor SQL", "SQL editor")}
          placeholder={t("Sem napiš dotaz SQL a spusť ho klávesou F5 (nebo Ctrl+Enter).", "Type an SQL query here and run it with F5 (or Ctrl+Enter).")}
          className="dbb-kod dbb-editor-vstup absolute left-0 top-0 m-0 h-full w-full select-text border-0 py-1 pl-2 pr-4 placeholder:text-dbb-slaby/70"
        />
      </div>
    </div>
  );
}

export function KartaSql() {
  const api = useDbb();
  const v = api.vystup;

  return (
    <div className="flex h-full flex-col p-1.5">
      <div className="flex h-[28px] shrink-0 items-center">
        <Ikona titulek={t("Otevřít soubor SQL", "Open SQL file")} zakazano>
          <FolderOpen className="h-4 w-4 text-[#c9901a]" />
        </Ikona>
        <Ikona titulek={t("Uložit soubor SQL", "Save SQL file")} zakazano>
          <Save className="h-4 w-4 text-[#2e75b6]" />
        </Ikona>
        <Ikona titulek={t("Tisk", "Print")} zakazano>
          <Printer className="h-4 w-4" />
        </Ikona>
        <span className="mx-1 h-5 w-px bg-dbb-linka" aria-hidden="true" />
        <Ikona titulek={t("Spustit vše / vybrané SQL (F5, Ctrl+Enter)", "Execute all/selected SQL (F5, Ctrl+Enter)")} akce={() => api.spustit("vse")}>
          <Play className="h-4 w-4 fill-[#2e9d4f] text-[#2e9d4f]" />
        </Ikona>
        <Ikona titulek={t("Spustit aktuální řádek (Shift+F5)", "Execute current line (Shift+F5)")} akce={() => api.spustit("radek")}>
          <StepForward className="h-4 w-4 text-[#2e9d4f]" />
        </Ikona>
        <Ikona titulek={t("Zastavit provádění SQL", "Stop SQL execution")} zakazano>
          <Square className="h-3.5 w-3.5 fill-[#c42b1c] text-[#c42b1c]" />
        </Ikona>
        <span className="ml-3 text-[11px] text-dbb-slaby">{t("F5 spustí vše, Shift+F5 jen řádek s kurzorem", "F5 runs everything, Shift+F5 only the line with the cursor")}</span>
      </div>

      {/* Záložka editoru – program jich umí víc, kurzu stačí jedna. */}
      <div className="flex h-[22px] shrink-0 items-end">
        <span className="-mb-px border border-b-0 border-dbb-linka bg-dbb-povrch px-3 py-[2px] text-[12px]">SQL 1</span>
      </div>

      <div className="flex min-h-0 flex-[4] flex-col">
        <Editor />
      </div>

      <div className="mt-1.5 flex min-h-0 flex-[5] flex-col border border-dbb-linka">
        {v && v.nahled && (
          <div className="shrink-0 border-b border-dbb-mrizka bg-[#fff8e1] px-2 py-1 text-[11px] text-[#6b5000]">
            {t(
              `Náhled tabulky ${v.nahled} – po spuštění dotazu se tu objeví jeho výsledek.`,
              `Preview of the ${v.nahled} table – the result of your query will appear here once you run it.`,
            )}
          </div>
        )}
        {v && v.vysledek && !v.nahled && (
          <div className="flex h-[24px] shrink-0 items-center justify-end border-b border-dbb-mrizka bg-dbb-okno px-1">
            <button
              type="button"
              onClick={() => api.otevritDialog({ druh: "exportCsv", zdroj: "vysledek" })}
              className="flex h-[20px] items-center rounded-[3px] px-1.5 text-[11px] hover:bg-dbb-hover"
            >
              <FileDown className="mr-1 h-3.5 w-3.5 text-[#2e75b6]" />
              {t("Uložit výsledek do CSV", "Save the Results to CSV")}
            </button>
          </div>
        )}
        {v && v.vysledek ? (
          <Mrizka sloupce={v.vysledek.columns} radky={v.vysledek.values} />
        ) : (
          <div className="flex-1 bg-dbb-povrch" />
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="dbb-posuv mt-1.5 h-[116px] shrink-0 select-text overflow-auto border border-dbb-linka bg-dbb-povrch px-2 py-1.5 text-[12px]"
      >
        {v && !v.nahled &&
          v.zprava.map((r, i) => (
            <div key={i} className={`whitespace-pre-wrap ${v.chyba && i < 2 ? "text-[#a4262c]" : ""}`}>
              {r}
            </div>
          ))}
        {v && v.nahled && <div className="text-dbb-slaby">{v.zprava[0]}</div>}
        {v && v.poznamka && (
          <div className="mt-1.5 border-l-[3px] border-dbb-akcent bg-dbb-hover px-2 py-1 text-dbb-text">
            <b>{t("Pozn.:", "Note:")}</b> {v.poznamka}
          </div>
        )}
        {v && v.cesky && (
          <div className="mt-1.5 border-l-[3px] border-[#e8a33d] bg-[#fff8e1] px-2 py-1 text-[#4a3500]">
            <b>{t("Po česku:", "In plain words:")}</b> {v.cesky}
          </div>
        )}
      </div>
    </div>
  );
}
