"use client";

/**
 * Rám okna v macOS: semafor vlevo, titulek uprostřed, tažení a změna velikosti.
 *
 * Tři puntíky vlevo nahoře nejsou ozdoba – každý dělá něco jiného a ten rozdíl
 * je celá první lekce prostředí:
 *
 *   červený   zavře OKNO. Aplikace běží dál (tečka v Docku zůstane).
 *   žlutý     okno schová do Docku. Existuje dál, jen není vidět.
 *   zelený    roztáhne okno přes plochu a zpátky.
 *
 * Symboly se v nich ukazují až při najetí myší, jako ve skutečnosti. Aby to
 * žák našel, má celá trojice společný `group` – stačí najet kamkoli na ni.
 */

import { useState, type ReactNode } from "react";
import { useMac } from "./system";
import { useDzin, zmerSchovani } from "./Dzin";
import type { Okno } from "@/lib/mac/stav";

const MIN_SIRKA = 380;
const MIN_VYSKA = 240;

/** Osm úchytů pro změnu velikosti: čtyři strany a čtyři rohy. */
const UCHYTY: { smer: string; trida: string }[] = [
  { smer: "n", trida: "left-3 right-3 top-0 h-1.5 cursor-ns-resize" },
  { smer: "s", trida: "left-3 right-3 bottom-0 h-1.5 cursor-ns-resize" },
  { smer: "w", trida: "top-3 bottom-3 left-0 w-1.5 cursor-ew-resize" },
  { smer: "e", trida: "top-3 bottom-3 right-0 w-1.5 cursor-ew-resize" },
  { smer: "nw", trida: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
  { smer: "ne", trida: "right-0 top-0 h-3 w-3 cursor-nesw-resize" },
  { smer: "sw", trida: "left-0 bottom-0 h-3 w-3 cursor-nesw-resize" },
  { smer: "se", trida: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize" },
];

export function OknoRamMac({
  okno,
  aktivni,
  children,
}: {
  okno: Okno;
  aktivni: boolean;
  /**
   * Obsah okna. Dostane prvek uvnitř záhlaví, do kterého si aplikace portálem
   * vykreslí vlastní ovládání.
   *
   * SKUTEČNÝ FINDER MÁ JEDEN PRUH, ne záhlaví a pod ním pruh nástrojů. Šipky
   * zpět, přepínání pohledů i hledání sedí v témže řádku jako semafor a název.
   * Tohle je ta nejnápadnější věc, podle které bylo poznat, že okno není
   * z Macu – proto rám nabízí slot místo toho, aby si každá aplikace kreslila
   * druhý proužek.
   */
  children: (slotZahlavi: HTMLDivElement | null) => ReactNode;
}) {
  const { poslat } = useMac();
  const [tazeni, nastavTazeni] = useState(false);
  /**
   * Prvek v záhlaví pro ovládání aplikace. `useState` místo `useRef`, aby
   * překreslení přišlo ve chvíli, kdy prvek vznikne – s refem by portál
   * cílil na `null` a pruh by zůstal prázdný.
   */
  const [slot, nastavSlot] = useState<HTMLDivElement | null>(null);

  /**
   * Tažení a zvětšování myší.
   *
   * Schválně `mousedown`/`mousemove`, ne Pointer Events: cíl webu sahá na
   * Safari 12, kde `onPointerDown` vůbec neexistuje a okno by se nedalo
   * chytit. Zjištěno tvrdě – jednou jsem to už přepsal a musel vrátit.
   */
  const zacniTahat = (e: React.MouseEvent, smer: string | null) => {
    if (e.button !== 0) return;
    e.preventDefault();
    poslat({ typ: "okno/dopredu", id: okno.id });
    // Zvětšeným oknem se nehýbe ani se nemění jeho velikost – stejně jako
    // ve skutečnosti. Napřed ho musí žák vrátit zeleným puntíkem.
    if (okno.zvetsene) return;

    const start = { x: e.clientX, y: e.clientY };
    const puvodni = { ...okno.ram };
    nastavTazeni(true);

    const pohyb = (ev: MouseEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (smer === null) {
        // Okno se nesmí zasunout pod horní lištu – tam už by se nedalo chytit.
        const y = Math.max(0, puvodni.y + dy);
        poslat({
          typ: "okno/posun",
          id: okno.id,
          ram: { ...puvodni, x: puvodni.x + dx, y },
        });
        return;
      }
      let { x, y, w, h } = puvodni;
      if (smer.includes("e")) w = Math.max(MIN_SIRKA, puvodni.w + dx);
      if (smer.includes("s")) h = Math.max(MIN_VYSKA, puvodni.h + dy);
      if (smer.includes("w")) {
        w = Math.max(MIN_SIRKA, puvodni.w - dx);
        x = puvodni.x + (puvodni.w - w);
      }
      if (smer.includes("n")) {
        h = Math.max(MIN_VYSKA, puvodni.h - dy);
        y = Math.max(0, puvodni.y + (puvodni.h - h));
      }
      poslat({ typ: "okno/posun", id: okno.id, ram: { x, y, w, h } });
    };

    const konec = () => {
      nastavTazeni(false);
      window.removeEventListener("mousemove", pohyb);
      window.removeEventListener("mouseup", konec);
    };
    window.addEventListener("mousemove", pohyb);
    window.addEventListener("mouseup", konec);
  };

  if (okno.minimalizovane) return null;

  const poloha = okno.zvetsene
    ? { left: 0, top: 0, width: "100%", height: "100%" }
    : {
        left: okno.ram.x,
        top: okno.ram.y,
        width: okno.ram.w,
        height: okno.ram.h,
        // Okno nikdy nesmí přetéct za okraj plochy. Výchozí Finder je široký
        // 940 px a na 1024px projektoru ve třídě mu vyjelo hledání mimo
        // obrazovku. Skutečný Mac okno nikam mimo plochu neotevře, proto se
        // tu radši zmenší. Počítá se to v CSS, aby se nemusela měřit plocha.
        maxWidth: `calc(100% - ${okno.ram.x}px)`,
        maxHeight: `calc(100% - ${okno.ram.y}px)`,
      };

  return (
    <div
      data-okno={okno.id}
      className={`mac-vjezd absolute flex flex-col overflow-hidden bg-mac-povrch mac-bezvyberu ${
        okno.zvetsene ? "rounded-none" : "rounded-[16px]"
      }`}
      style={{
        ...poloha,
        zIndex: 100 + okno.z,
        boxShadow: aktivni ? "var(--mac-stin)" : "0 8px 24px rgba(0,0,0,0.18)",
        // Během tažení se text uvnitř nemá označovat ani probublávat kurzor.
        cursor: tazeni ? "grabbing" : undefined,
      }}
      onMouseDown={() => poslat({ typ: "okno/dopredu", id: okno.id })}
    >
      <div
        className="relative flex h-[58px] shrink-0 items-center gap-3 border-b border-mac-linka bg-mac-panel px-4"
        onMouseDown={(e) => {
          // Na semaforu ani na ovládání v pruhu se netáhne – tam se kliká.
          if ((e.target as HTMLElement).closest("[data-semafor],[data-naradi]"))
            return;
          zacniTahat(e, null);
        }}
        onDoubleClick={() => poslat({ typ: "okno/zvetsi", id: okno.id })}
      >
        <Semafor okno={okno} aktivni={aktivni} />
        {/* Název je VLEVO a tučný, ne na středu. Vystředěný titulek je starší
            macOS; dnešní Finder ho má hned za šipkami zpět (ověřeno na snímku
            z české nápovědy Applu). */}
        <div
          data-naradi
          ref={nastavSlot}
          className="relative z-10 flex min-w-0 flex-1 items-center gap-2"
        />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {children(slot)}
      </div>

      {!okno.zvetsene &&
        UCHYTY.map((u) => (
          <div
            key={u.smer}
            className={`absolute ${u.trida}`}
            onMouseDown={(e) => zacniTahat(e, u.smer)}
          />
        ))}
    </div>
  );
}

/** Tři puntíky. Barvu mají jen tehdy, když je okno aktivní – jako ve skutečnosti. */
function Semafor({ okno, aktivni }: { okno: Okno; aktivni: boolean }) {
  const { poslat } = useMac();
  const dzin = useDzin();

  /**
   * Schování do Docku. Okno ze stavu zmizí hned – přesně jako na Macu – a to,
   * co se vsává, je jeho obrys. Se Shiftem to jede zpomaleně; ten vtípek má
   * Apple v systému od roku 2001 a Shift není ⌘, takže se vejde i sem.
   */
  const schovej = (e: React.MouseEvent) => {
    const zmereno = zmerSchovani(okno.id, okno.app);
    const doStavu = () => poslat({ typ: "okno/minimalizuj", id: okno.id });
    if (!zmereno) {
      doStavu();
      return;
    }
    doStavu();
    dzin({ ...zmereno, smer: 1, pomalu: e.shiftKey });
  };

  const puntik = (
    barva: string,
    popis: string,
    znak: ReactNode,
    akce: (e: React.MouseEvent) => void,
  ) => (
    <button
      type="button"
      title={popis}
      aria-label={popis}
      onClick={(e) => {
        e.stopPropagation();
        akce(e);
      }}
      className="flex h-[13px] w-[13px] items-center justify-center rounded-full text-black/60 transition-colors"
      style={{ backgroundColor: aktivni ? barva : "rgb(var(--mac-linka))" }}
    >
      {/* Symbol se ukáže až při najetí na semafor, přesně jako na Macu. */}
      <span className="opacity-0 transition-opacity group-hover/semafor:opacity-100">
        {znak}
      </span>
    </button>
  );

  return (
    <div
      data-semafor
      className="group/semafor z-10 flex items-center gap-[9px]"
    >
      {puntik(
        "#ff5f57",
        "Zavřít okno (aplikace poběží dál)",
        <ZnakZavrit />,
        () => poslat({ typ: "okno/zavri", id: okno.id }),
      )}
      {puntik("#febc2e", "Schovat okno do Docku", <ZnakSchovat />, schovej)}
      {puntik(
        "#28c840",
        okno.zvetsene ? "Zmenšit okno" : "Zvětšit okno",
        <ZnakZvetsit zpet={okno.zvetsene} />,
        () => poslat({ typ: "okno/zvetsi", id: okno.id }),
      )}
    </div>
  );
}

/*
 * Značky v semaforu.
 *
 * Bývaly to textové znaky („✕", „–", „⤢"). Vystředit je nešlo: každý znak má
 * jinou výšku i jiné posazení k účaří, takže i ve vystředěném rámečku seděly
 * pokaždé jinde a v puntíku to lítalo. Kreslené značky mají střed daný
 * geometrií, ne fontem.
 */

const RAMEC = "h-[7px] w-[7px]";

function ZnakZavrit() {
  return (
    <svg viewBox="0 0 10 10" className={RAMEC} aria-hidden="true">
      <path
        d="M2.6 2.6 L7.4 7.4 M7.4 2.6 L2.6 7.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ZnakSchovat() {
  return (
    <svg viewBox="0 0 10 10" className={RAMEC} aria-hidden="true">
      <path
        d="M2 5 H8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Zelený puntík. Dvě trojúhelníčky: ven, když okno teprve půjde na celou
 * obrazovku, dovnitř, když se z ní bude vracet. Tohle rozlišení má i Mac.
 */
function ZnakZvetsit({ zpet }: { zpet?: boolean }) {
  return (
    <svg viewBox="0 0 10 10" className={RAMEC} aria-hidden="true">
      {zpet ? (
        <>
          <polygon points="2,6.4 6.4,6.4 6.4,2" fill="currentColor" />
          <polygon points="8,3.6 3.6,3.6 3.6,8" fill="currentColor" />
        </>
      ) : (
        <>
          <polygon points="1.8,1.8 6.2,1.8 1.8,6.2" fill="currentColor" />
          <polygon points="8.2,8.2 3.8,8.2 8.2,3.8" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
