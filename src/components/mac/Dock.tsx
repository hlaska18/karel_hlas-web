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

import { FileText, Folder, TerminalSquare, Trash2 } from "lucide-react";
import { useMac } from "./system";
import { APLIKACE, type AppId } from "@/lib/mac/stav";

const PORADI: AppId[] = ["finder", "poznamky", "terminal"];

/** Ikony jsou kreslené, ne obrázkové – prostředí se kvůli Docku nemá stahovat. */
const VZHLED: Record<AppId, { pozadi: string; barva: string; znak: typeof Folder }> = {
  finder: { pozadi: "linear-gradient(160deg,#4aa8ff,#0a6fd8)", barva: "#fff", znak: Folder },
  poznamky: { pozadi: "linear-gradient(160deg,#ffe27a,#f5c518)", barva: "#5a4300", znak: FileText },
  terminal: { pozadi: "linear-gradient(160deg,#4a4a4f,#1c1c1e)", barva: "#7dff9b", znak: TerminalSquare },
};

export function Dock() {
  const { stav, poslat, spust } = useMac();
  const schovana = stav.okna.filter((o) => o.minimalizovane);

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
        {PORADI.map((app) => (
          <Ikona
            key={app}
            popis={APLIKACE[app].nazev}
            vzhled={VZHLED[app]}
            bezi={stav.bezici.includes(app)}
            onClick={() => otevriZDocku(app)}
          />
        ))}

        {schovana.length > 0 && <div className="mx-1 h-12 w-px self-center bg-white/25" />}

        {schovana.map((okno) => (
          <Ikona
            key={okno.id}
            popis={`${okno.titul || APLIKACE[okno.app].nazev} – schované okno`}
            vzhled={VZHLED[okno.app]}
            male
            onClick={() => poslat({ typ: "okno/obnov", id: okno.id })}
          />
        ))}

        <div className="mx-1 h-12 w-px self-center bg-white/25" />
        <Ikona
          popis="Koš"
          vzhled={{ pozadi: "linear-gradient(160deg,#d8d8dd,#a9a9b0)", barva: "#3a3a3c", znak: Trash2 }}
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
  vzhled: { pozadi: string; barva: string; znak: typeof Folder };
  bezi?: boolean;
  male?: boolean;
  onClick?: () => void;
}) {
  const Znak = vzhled.znak;
  const strana = male ? 40 : 52;
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
        className="flex items-center justify-center rounded-[12px] shadow-md transition-transform hover:-translate-y-1 disabled:cursor-default"
        style={{ width: strana, height: strana, background: vzhled.pozadi }}
      >
        <Znak style={{ color: vzhled.barva }} className={male ? "h-5 w-5" : "h-7 w-7"} />
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
