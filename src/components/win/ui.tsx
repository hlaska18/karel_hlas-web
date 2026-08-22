"use client";

/**
 * Ovládací prvky ve stylu Windows 11 (Fluent).
 *
 * Drží se rozměrů, které systém opravdu používá – tlačítko 32 px vysoké,
 * přepínač 40 × 20, položka nabídky 32 px. Bez toho by prostředí „skoro"
 * vypadalo jako Windows, což je horší než nevypadat vůbec: žák by si zvykal
 * na proporce, které pak na školním počítači nenajde.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

/* ───────────────────────── Tlačítka ───────────────────────── */

type Vzhled = "obvykly" | "akcent" | "tichy";

const VZHLEDY: Record<Vzhled, string> = {
  obvykly:
    "border border-win-linka bg-win-povrch hover:bg-win-zvyrazneny active:opacity-70 shadow-[0_1px_0_rgba(0,0,0,0.05)]",
  akcent:
    "border border-transparent bg-win-akcent text-win-akcent-text hover:opacity-90 active:opacity-80",
  tichy: "border border-transparent hover:bg-win-zvyrazneny active:opacity-70",
};

export function Tlacitko({
  children,
  vzhled = "obvykly",
  className = "",
  ...zbytek
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { vzhled?: Vzhled }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 items-center justify-center gap-2 rounded px-3 text-[13px] transition-colors disabled:opacity-40 ${VZHLEDY[vzhled]} ${className}`}
      {...zbytek}
    >
      {children}
    </button>
  );
}

/** Čtvercové tlačítko jen s ikonou – lišty Průzkumníku, Malování, okna. */
export function IkonoveTlacitko({
  children,
  aktivni = false,
  className = "",
  ...zbytek
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { aktivni?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors disabled:opacity-30 ${
        aktivni ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
      } ${className}`}
      {...zbytek}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Přepínač ───────────────────────── */

export function Prepinac({
  zapnuto,
  onZmena,
  popis,
}: {
  zapnuto: boolean;
  onZmena: (hodnota: boolean) => void;
  popis: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={zapnuto}
      aria-label={popis}
      onClick={() => onZmena(!zapnuto)}
      className={`relative h-5 w-10 shrink-0 rounded-full border transition-colors ${
        zapnuto
          ? "border-win-akcent bg-win-akcent"
          : "border-win-slaby bg-transparent hover:bg-win-zvyrazneny"
      }`}
    >
      <span
        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all ${
          zapnuto ? "left-[22px] bg-win-akcent-text" : "left-[4px] bg-win-slaby"
        }`}
      />
    </button>
  );
}

/* ───────────────────────── Posuvník ───────────────────────── */

export function Posuvnik({
  hodnota,
  onZmena,
  min = 0,
  max = 100,
  popis,
  className = "",
}: {
  hodnota: number;
  onZmena: (h: number) => void;
  min?: number;
  max?: number;
  popis: string;
  className?: string;
}) {
  // Vyplněnou část dráhy kreslí CSS v `globals.css` podle proměnné `--podil`.
  const podil = ((hodnota - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={hodnota}
      aria-label={popis}
      onChange={(e) => onZmena(Number(e.target.value))}
      className={`win-posuvnik ${className}`}
      style={{ ["--podil" as string]: `${podil}%` }}
    />
  );
}

/* ───────────────────────── Zaškrtávátko ───────────────────────── */

export function Zaskrtavatko({
  zapnuto,
  onZmena,
  children,
}: {
  zapnuto: boolean;
  onZmena: (h: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border transition-colors ${
          zapnuto ? "border-win-akcent bg-win-akcent" : "border-win-slaby"
        }`}
      >
        {zapnuto && <Check className="h-3 w-3 text-win-akcent-text" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={zapnuto}
        onChange={(e) => onZmena(e.target.checked)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/* ───────────────────────── Rozbalovací seznam ───────────────────────── */

export function Rozbalovac<T extends string>({
  hodnota,
  moznosti,
  onZmena,
  popis,
  sirka = "w-56",
}: {
  hodnota: T;
  moznosti: { id: T; nazev: string }[];
  onZmena: (h: T) => void;
  popis: string;
  sirka?: string;
}) {
  const [otevreno, nastavOtevreno] = useState(false);
  const obal = useRef<HTMLDivElement>(null);
  useVenkovniKlik(obal, () => nastavOtevreno(false));
  const vybrana = moznosti.find((m) => m.id === hodnota);

  return (
    <div ref={obal} className={`relative ${sirka}`}>
      <button
        type="button"
        aria-label={popis}
        aria-expanded={otevreno}
        onClick={() => nastavOtevreno((o) => !o)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded border border-win-linka bg-win-povrch px-3 text-[13px] hover:bg-win-zvyrazneny"
      >
        <span className="truncate">{vybrana?.nazev ?? ""}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-win-slaby" />
      </button>
      {otevreno && (
        <div className="win-vyjezd absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)]">
          {moznosti.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onZmena(m.id);
                nastavOtevreno(false);
              }}
              className={`flex h-8 w-full items-center gap-2 rounded px-2 text-left text-[13px] hover:bg-win-zvyrazneny ${
                m.id === hodnota ? "bg-win-akcent/20" : ""
              }`}
            >
              <span className="w-3.5">
                {m.id === hodnota && <Check className="h-3.5 w-3.5" />}
              </span>
              {m.nazev}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Kontextová nabídka ───────────────────────── */

export interface PolozkaNabidky {
  id: string;
  nazev?: string;
  ikona?: ReactNode;
  zkratka?: string;
  /** Oddělovací čára – nemá název ani akci. */
  cara?: boolean;
  nedostupne?: boolean;
  zaskrtnuto?: boolean;
  podnabidka?: PolozkaNabidky[];
  akce?: () => void;
}

export interface MistoNabidky {
  x: number;
  y: number;
  polozky: PolozkaNabidky[];
}

/**
 * Kontextová nabídka. Sama se odsune tak, aby se vešla do plochy – ve
 * Windows nabídka nikdy nevyleze z obrazovky, i když na její okraj kliknete.
 */
export function KontextovaNabidka({
  misto,
  zavri,
}: {
  misto: MistoNabidky;
  zavri: () => void;
}) {
  const obal = useRef<HTMLDivElement>(null);
  const [poloha, nastavPolohu] = useState({ x: misto.x, y: misto.y, pripraveno: false });
  const [otevrenaPodnabidka, nastavPodnabidku] = useState<string | null>(null);

  useLayoutEffect(() => {
    const prvek = obal.current;
    if (!prvek) return;
    const { width, height } = prvek.getBoundingClientRect();
    const rodic = prvek.offsetParent as HTMLElement | null;
    const maxX = rodic?.clientWidth ?? window.innerWidth;
    const maxY = rodic?.clientHeight ?? window.innerHeight;
    nastavPolohu({
      x: Math.max(4, Math.min(misto.x, maxX - width - 4)),
      y: Math.max(4, Math.min(misto.y, maxY - height - 4)),
      pripraveno: true,
    });
  }, [misto.x, misto.y]);

  useVenkovniKlik(obal, zavri);

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.key === "Escape") zavri();
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  }, [zavri]);

  return (
    <div
      ref={obal}
      role="menu"
      className="win-vyjezd win-bezvyberu absolute z-[900] min-w-[220px] rounded-lg border border-win-linka bg-win-povrch p-1 text-win-text shadow-[var(--win-stin-nabidka)]"
      style={{ left: poloha.x, top: poloha.y, visibility: poloha.pripraveno ? "visible" : "hidden" }}
    >
      {misto.polozky.map((p) =>
        p.cara ? (
          <div key={p.id} className="my-1 h-px bg-win-linka" />
        ) : (
          <div
            key={p.id}
            className="relative"
            onMouseEnter={() => nastavPodnabidku(p.podnabidka ? p.id : null)}
          >
            <button
              type="button"
              role="menuitem"
              disabled={p.nedostupne}
              onClick={() => {
                if (p.podnabidka) return;
                p.akce?.();
                zavri();
              }}
              className="flex h-8 w-full items-center gap-3 rounded px-2 text-left text-[13px] enabled:hover:bg-win-zvyrazneny disabled:opacity-40"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-win-slaby">
                {p.zaskrtnuto ? <Check className="h-3.5 w-3.5" /> : p.ikona}
              </span>
              <span className="flex-1 truncate">{p.nazev}</span>
              {p.zkratka && <span className="text-[12px] text-win-slaby">{p.zkratka}</span>}
              {p.podnabidka && <ChevronRight className="h-3.5 w-3.5 text-win-slaby" />}
            </button>
            {p.podnabidka && otevrenaPodnabidka === p.id && (
              <div className="win-vyjezd absolute left-full top-0 z-10 ml-1 min-w-[200px] rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)]">
                {p.podnabidka.map((s) =>
                  s.cara ? (
                    <div key={s.id} className="my-1 h-px bg-win-linka" />
                  ) : (
                    <button
                      key={s.id}
                      type="button"
                      disabled={s.nedostupne}
                      onClick={() => {
                        s.akce?.();
                        zavri();
                      }}
                      className="flex h-8 w-full items-center gap-3 rounded px-2 text-left text-[13px] enabled:hover:bg-win-zvyrazneny disabled:opacity-40"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-win-slaby">
                        {s.ikona}
                      </span>
                      <span className="flex-1 truncate">{s.nazev}</span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}

/** Stav kontextové nabídky – otevřít pravým tlačítkem, zavřít kliknutím jinam. */
export function useNabidka() {
  const [misto, nastavMisto] = useState<MistoNabidky | null>(null);
  const otevri = useCallback(
    (e: React.MouseEvent, polozky: PolozkaNabidky[], obal?: HTMLElement | null) => {
      e.preventDefault();
      e.stopPropagation();
      const ram = obal?.getBoundingClientRect();
      nastavMisto({
        x: e.clientX - (ram?.left ?? 0),
        y: e.clientY - (ram?.top ?? 0),
        polozky,
      });
    },
    [],
  );
  const zavri = useCallback(() => nastavMisto(null), []);
  return { misto, otevri, zavri };
}

/* ───────────────────────── Dialog ───────────────────────── */

/**
 * Modální dialog uvnitř okna aplikace. Ve Windows 11 je to karta uprostřed,
 * pod ní ztmavená aplikace – ne systémové okno navíc.
 */
export function Dialog({
  nadpis,
  children,
  tlacitka,
  onZavrit,
  sirka = "max-w-md",
}: {
  nadpis: string;
  children: ReactNode;
  tlacitka: ReactNode;
  onZavrit?: () => void;
  sirka?: string;
}) {
  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZavrit?.();
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  }, [onZavrit]);

  return (
    <div className="absolute inset-0 z-[600] flex items-center justify-center bg-black/35 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={nadpis}
        className={`win-vjezd w-full ${sirka} overflow-hidden rounded-lg border border-win-linka bg-win-povrch shadow-[var(--win-stin)]`}
      >
        <div className="px-6 pb-4 pt-5">
          <h2 className="text-[18px] font-semibold">{nadpis}</h2>
          <div className="mt-3 text-[13px] leading-relaxed text-win-text">{children}</div>
        </div>
        <div className="flex justify-end gap-2 border-t border-win-linka bg-win-plocha px-6 py-4">
          {tlacitka}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Pomůcky ───────────────────────── */

/** Zavře cokoli, na co se kliklo mimo. Používá `pointerdown`, ne `click`. */
export function useVenkovniKlik(
  odkaz: React.RefObject<HTMLElement>,
  akce: () => void,
) {
  useEffect(() => {
    const naKlik = (e: PointerEvent) => {
      if (odkaz.current && !odkaz.current.contains(e.target as Node)) akce();
    };
    // Zpoždění o snímek: bez něj by nabídku zavřel tentýž klik, co ji otevřel.
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", naKlik);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", naKlik);
    };
  }, [odkaz, akce]);
}

/** Textové pole ve stylu Windows – podtržení zvýrazňovací barvou při psaní. */
export function Pole({
  className = "",
  ...zbytek
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-8 rounded border border-win-linka bg-win-povrch px-3 text-[13px] outline-none transition-[border-color] placeholder:text-win-slaby focus:border-b-2 focus:border-b-win-akcent ${className}`}
      {...zbytek}
    />
  );
}
