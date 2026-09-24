"use client";

/**
 * Základ dialogů virtuálního DB Browseru – okno ve stylu Windows 11,
 * tlačítka a patička. Sdílí je všechny dialogy programu.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { IkonaProgramu } from "@/components/dbb/Okno";
import { t } from "@/lib/dbb/jazyk";

/* ─────────────────────────────── základ ─────────────────────────────── */

export function Okno({
  titulek,
  zavrit,
  sirka = 440,
  children,
}: {
  titulek: string;
  zavrit: () => void;
  sirka?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Zaměří označené tlačítko, jinak první pole – ne křížek v titulku, který
    // je v HTML první a psaní by šlo do prázdna.
    const obal = ref.current;
    const prvni =
      obal &&
      (obal.querySelector<HTMLElement>("[data-prvni]") ||
        obal.querySelector<HTMLElement>("input:not([type=checkbox]), select, textarea"));
    if (prvni) prvni.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        zavrit();
      }
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 z-[100] flex items-center justify-center bg-black/[0.12]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulek}
        className="flex max-h-[92%] max-w-[94%] select-text flex-col border border-[#9a9a9a] bg-dbb-povrch shadow-[0_14px_44px_rgba(0,0,0,0.3)]"
        style={{ width: sirka }}
      >
        <div className="flex h-[30px] shrink-0 items-center pl-3">
          <IkonaProgramu className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate text-[12px]">{titulek}</span>
          <button
            type="button"
            aria-label={t("Zavřít", "Close")}
            onClick={zavrit}
            className="flex h-full w-[46px] items-center justify-center hover:bg-[#c42b1c] hover:text-white"
          >
            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
              <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tlacitko({
  primarni,
  children,
  akce,
  zakazano,
  prvni,
}: {
  primarni?: boolean;
  children: ReactNode;
  akce: () => void;
  zakazano?: boolean;
  prvni?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={akce}
      disabled={zakazano}
      data-prvni={prvni ? "" : undefined}
      className={`ml-2 h-[28px] min-w-[84px] rounded-[4px] border px-3 text-[12px] disabled:opacity-45 ${
        primarni
          ? "border-dbb-akcent bg-dbb-akcent text-dbb-akcent-text enabled:hover:brightness-110"
          : "border-dbb-linka bg-dbb-povrch enabled:hover:bg-dbb-hover"
      }`}
    >
      {children}
    </button>
  );
}

export const Paticka = ({ children, vlevo }: { children: ReactNode; vlevo?: ReactNode }) => (
  <div className="flex shrink-0 items-center border-t border-dbb-linka bg-dbb-okno px-4 py-3">
    <div className="flex-1 text-[12px]">{vlevo}</div>
    {children}
  </div>
);

export function Zprava({ ikona, children }: { ikona: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start px-5 py-5 text-[12px] leading-relaxed">
      <span className="mr-3 mt-0.5 shrink-0">{ikona}</span>
      <div className="min-w-0 flex-1 whitespace-pre-wrap">{children}</div>
    </div>
  );
}
