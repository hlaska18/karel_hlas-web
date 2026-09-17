"use client";

/**
 * Dock.
 *
 * Proti windowsovému hlavnímu panelu tu je jeden podstatný rozdíl, a je to
 * přesně ten, kvůli kterému tahle simulace vznikla: TEČKA POD IKONOU.
 *
 * Na hlavním panelu Windows znamená tlačítko „tady je okno“. V Docku znamená
 * tečka „tady běží program“ – a ta tečka zůstane svítit i potom, co žák zavře
 * poslední okno červeným puntíkem. Je to jediné místo na obrazovce, kde je
 * spuštěný program bez okna vidět, takže se na ni odkazuje i zadání úloh.
 *
 * Schované (žluté) okno se navíc objeví jako vlastní ikona vpravo za čárou,
 * takže jsou oba stavy vidět vedle sebe.
 */

import { Download, FileText, Folder, Settings, TerminalSquare, Trash2 } from "lucide-react";
import { useMac } from "./system";
import { APLIKACE, type AppId } from "@/lib/mac/stav";
import { KOS, STAZENE, slozMac } from "@/lib/mac/cesty";
import { jeSlozka, najdiSlozku } from "@/lib/win/fs";

const PORADI: AppId[] = ["finder", "poznamky", "terminal", "nastaveni"];

/**
 * Ikona Launchpadu, kreslená podle té skutečné: nahoře vyhledávací pole,
 * pod ním mřížka barevných dlaždic. Obecná mřížka z knihovny ikon se
 * nepodobala ničemu a Karel ji v Docku nepoznal.
 */
function ZnakLaunchpad({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const barvy = ["#f5a33c", "#e8607c", "#5ac2a0", "#c58cf0", "#6aa9f0", "#f0c44a", "#7fd08a", "#e87f7f", "#9aa0aa"];
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <rect x="3" y="3.2" width="18" height="4" rx="2" fill="currentColor" opacity="0.28" />
      <circle cx="6.4" cy="5.2" r="1.1" fill="currentColor" opacity="0.55" />
      {barvy.map((b, i) => (
        <rect
          key={b + i}
          x={3.4 + (i % 3) * 6.2}
          y={9.6 + Math.floor(i / 3) * 4.6}
          width="5.2"
          height="3.6"
          rx="1.2"
          fill={b}
        />
      ))}
    </svg>
  );
}

/** Ikona aplikace: buď z knihovny, nebo vlastní kresba. */
type Znak = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

/**
 * Ikony jsou kreslené, ne obrázkové – prostředí se kvůli Docku nemá stahovat
 * o megabajt navíc, a hlavně by staženými ikonami Applu předstíralo, že je to
 * jejich aplikace.
 *
 * Každá je vlastní kresba, ne symbol z knihovny na barevném čtverci: Finder má
 * dvoubarevný obličej, Terminál výzvu na černém, Poznámky linkovaný papír
 * se žlutým pruhem. Na obecném symbolu nebylo poznat, která aplikace to je,
 * a v Docku to byla ta nejnápadnější věc.
 */
function ZnakFinder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      {/* Dvě poloviny obličeje, jak je má Finder: světlejší levá, sytější pravá */}
      <path d="M2 4h10v16H2z" fill="#bfe3ff" />
      <path d="M12 4h10v16H12z" fill="#1e88e5" />
      <circle cx="7.4" cy="10" r="1.05" fill="#0b3c63" />
      <circle cx="16.6" cy="10" r="1.05" fill="#ffffff" />
      <path
        d="M6.6 15.2c1.9 1.5 8.9 1.5 10.8 0"
        fill="none"
        stroke="#0b3c63"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZnakTerminal({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path
        d="M4.5 7.5 9 11.5 4.5 15.5"
        fill="none"
        stroke="#7dff9b"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11 16h8" stroke="#7dff9b" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ZnakPoznamky({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="2" fill="#fffaf0" />
      <rect x="4" y="3.5" width="16" height="3.6" rx="2" fill="#f0b429" />
      {[10.5, 13.4, 16.3].map((y) => (
        <rect key={y} x="6.6" y={y} width="10.8" height="1.25" rx="0.62" fill="#c9a227" opacity="0.6" />
      ))}
    </svg>
  );
}

function ZnakNastaveni({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" fill="#8b9099" />
      <circle cx="12" cy="12" r="3.1" fill="#f2f3f5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <rect
            key={i}
            x="11.1"
            y="1.9"
            width="1.8"
            height="3.4"
            rx="0.9"
            fill="#8b9099"
            transform={`rotate(${(a * 180) / Math.PI} 12 12)`}
          />
        );
      })}
    </svg>
  );
}

export const VZHLED_APLIKACI: Record<AppId, { pozadi: string; barva: string; znak: Znak }> = {
  finder: { pozadi: "linear-gradient(165deg,#ffffff,#e6eef6)", barva: "#0b3c63", znak: ZnakFinder },
  poznamky: { pozadi: "linear-gradient(165deg,#fff6dc,#f3d98a)", barva: "#5a4300", znak: ZnakPoznamky },
  terminal: { pozadi: "linear-gradient(165deg,#3a3a3f,#141416)", barva: "#7dff9b", znak: ZnakTerminal },
  nastaveni: { pozadi: "linear-gradient(165deg,#eceef2,#b9bec7)", barva: "#3a3a3c", znak: ZnakNastaveni },
};

export function Dock({ onLaunchpad }: { onLaunchpad: () => void }) {
  const { stav, poslat, spust } = useMac();
  const schovana = stav.okna.filter((o) => o.minimalizovane);
  /** Kolik je v koši. Plný koš má na Macu jinou ikonu než prázdný. */
  const vKosi = najdiSlozku(stav.disk, KOS)?.deti.length ?? 0;

  /**
   * Co udělá kliknutí na ikonu v Docku.
   *
   * Přesně jako na skutečném Macu, a to ve všech čtyřech případech:
   *   neběží                → spustí se a otevře okno
   *   běží a okno je vidět  → vytáhne se dopředu
   *   běží a okno je v Docku→ vrátí se z Docku
   *   běží a okno není      → otevře se NOVÉ okno
   *
   * Poslední případ se sem musel dodělat. Předtím se jen přepnula lišta
   * nahoře a na obrazovce se nestalo nic – žák, který zavřel okno Finderu,
   * neměl jak se dostat zpátky a vypadalo to jako rozbitá ikona. Lekci to
   * nebere: tečka pod ikonou svítila celou dobu a nahoře stál Finder, což
   * je přesně to, co má úloha ukázat.
   */
  const otevriZDocku = (app: AppId) => {
    if (!stav.bezici.includes(app)) {
      spust(app);
      return;
    }
    const jehoOkna = stav.okna.filter((o) => o.app === app);
    if (jehoOkna.length === 0) {
      spust(app);
      return;
    }
    const vidiSe = jehoOkna.filter((o) => !o.minimalizovane);
    if (vidiSe.length === 0) {
      const posledni = jehoOkna.reduce((a, b) => (a.z > b.z ? a : b));
      poslat({ typ: "okno/obnov", id: posledni.id });
      return;
    }
    poslat({ typ: "app/dopredu", app });
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[800] flex justify-center pb-2">
      <div className="mac-sklo mac-bezvyberu pointer-events-auto flex items-end gap-2 rounded-2xl border border-white/20 px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {/* Launchpad stojí na Macu hned vedle Finderu a je to jediné místo,
            kde žák uvidí všechny aplikace pohromadě. */}
        <Ikona
          popis="Launchpad"
          vzhled={{ pozadi: "linear-gradient(165deg,#fbfbfd,#d6d8de)", barva: "#3a3a3c", znak: ZnakLaunchpad }}
          onClick={onLaunchpad}
        />
        {PORADI.map((app) => (
          <Ikona
            key={app}
            popis={APLIKACE[app].nazev}
            vzhled={VZHLED_APLIKACI[app]}
            bezi={stav.bezici.includes(app)}
            onClick={() => otevriZDocku(app)}
          />
        ))}

        {schovana.length > 0 && <div className="mx-1 h-12 w-px self-center bg-white/25" />}

        {schovana.map((okno) => (
          <Ikona
            key={okno.id}
            popis={`${okno.titul || APLIKACE[okno.app].nazev} – schované okno`}
            vzhled={VZHLED_APLIKACI[okno.app]}
            male
            onClick={() => poslat({ typ: "okno/obnov", id: okno.id })}
          />
        ))}

        {/* Za čárou stojí na Macu zástupci složek a koš – ne aplikace.
            Proto jsou tady, ne v řadě výš. */}
        <div className="mx-1 h-12 w-px self-center bg-white/25" />
        <Ikona
          popis="Stažené"
          vzhled={{ pozadi: "linear-gradient(160deg,#9fd6ff,#3f97e0)", barva: "#0b3c63", znak: Download }}
          onClick={() => spust("finder", slozMac(STAZENE))}
        />
        <Ikona
          popis={vKosi === 0 ? "Koš (prázdný)" : `Koš (${vKosi})`}
          vzhled={{
            pozadi: vKosi === 0
              ? "linear-gradient(160deg,#d8d8dd,#a9a9b0)"
              : "linear-gradient(160deg,#c3c7cf,#7f858f)",
            barva: "#3a3a3c",
            znak: Trash2,
          }}
          // Koš je na Macu složka, takže se otevře ve Finderu jako každá jiná.
          // Tím se zároveň prozradí, že smazané soubory nezmizely.
          onClick={() => spust("finder", slozMac(KOS))}
        />
      </div>
    </div>
  );
}

function Ikona({
  popis,
  vzhled,
  bezi,
  male,
  onClick,
}: {
  popis: string;
  vzhled: { pozadi: string; barva: string; znak: Znak };
  bezi?: boolean;
  male?: boolean;
  onClick?: () => void;
}) {
  const Znak = vzhled.znak;
  const strana = male ? 42 : 58;
  return (
    <div className="group/dock relative flex flex-col items-center">
      {/* Popisek nad ikonou. V Docku je to jediné, co ikonu pojmenuje – bez
          něj žák hádá podle obrázku, a u Terminálu to není poznat. */}
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-[12px] text-white opacity-0 transition-opacity group-hover/dock:opacity-100">
        {popis}
      </span>
      <button
        type="button"
        title={popis}
        aria-label={popis}
        onClick={onClick}
        disabled={!onClick}
        // Zaoblení 22 % strany je macOS „squircle"; pevných 12 px vypadalo
        // při větší ikoně jako obyčejný zaoblený čtverec.
        className="flex items-center justify-center shadow-md transition-transform duration-150 hover:-translate-y-1.5 hover:scale-110 disabled:cursor-default"
        style={{
          width: strana,
          height: strana,
          background: vzhled.pozadi,
          borderRadius: `${Math.round(strana * 0.22)}px`,
        }}
      >
        <Znak style={{ color: vzhled.barva }} className={male ? "h-6 w-6" : "h-8 w-8"} />
      </button>
      {/*
        Tečka běžícího programu.

        Je to jediné místo na obrazovce, kde je vidět program bez okna, takže
        na ni ukazuje zadání první úlohy – a proto je schválně o kus větší, než
        má skutečný macOS. Změřeno na 4 px přes světlé sklo Docku: byla sotva
        znát a úloha, která na ni odkazuje, by nedávala smysl.

        Barva jde z `--mac-text`, takže je tmavá ve světlém motivu a světlá
        v tmavém. Bílá napevno by v tmavém motivu zmizela úplně.

        Místo pod ikonou je rezervované vždycky, aby ikony neposkakovaly
        nahoru a dolů podle toho, co zrovna běží.
      */}
      <span
        className={`mt-1 h-[6px] w-[6px] rounded-full ${
          bezi ? "bg-mac-text/75" : "bg-transparent"
        }`}
      />
    </div>
  );
}
