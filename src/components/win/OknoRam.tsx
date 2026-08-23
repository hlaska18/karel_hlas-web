"use client";

/**
 * Rám okna: záhlaví, tlačítka, tažení, změna velikosti a přichycení.
 *
 * Souřadnice jsou v pixelech vůči ploše (obrazovka bez hlavního panelu),
 * ale přichycené a maximalizované okno se počítá v procentech. Půlka
 * obrazovky tak zůstane půlkou i po zvětšení okna prohlížeče – kdyby se
 * ukládaly pixely, rozpadlo by se rozvržení při každé změně rozlišení.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import { Ikona } from "./Ikona";
import { useSystem } from "./system";
import type { Okno, Prichyceni } from "@/lib/win/stav";
import { MERITKO } from "@/lib/win/stav";

const MIN_SIRKA = 320;
const MIN_VYSKA = 200;

/** Kam se okno položí podle přichycení. Vše v procentech plochy. */
const MISTA: Record<Exclude<Prichyceni, null>, React.CSSProperties> = {
  vlevo: { left: 0, top: 0, width: "50%", height: "100%" },
  vpravo: { left: "50%", top: 0, width: "50%", height: "100%" },
  "levo-nahore": { left: 0, top: 0, width: "50%", height: "50%" },
  "pravo-nahore": { left: "50%", top: 0, width: "50%", height: "50%" },
  "levo-dole": { left: 0, top: "50%", width: "50%", height: "50%" },
  "pravo-dole": { left: "50%", top: "50%", width: "50%", height: "50%" },
};

/** Osm úchytů pro změnu velikosti: čtyři strany a čtyři rohy. */
const UCHYTY: { smer: string; trida: string }[] = [
  { smer: "n", trida: "left-2 right-2 top-0 h-1.5 cursor-ns-resize" },
  { smer: "s", trida: "left-2 right-2 bottom-0 h-1.5 cursor-ns-resize" },
  { smer: "w", trida: "top-2 bottom-2 left-0 w-1.5 cursor-ew-resize" },
  { smer: "e", trida: "top-2 bottom-2 right-0 w-1.5 cursor-ew-resize" },
  { smer: "nw", trida: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
  { smer: "ne", trida: "right-0 top-0 h-3 w-3 cursor-nesw-resize" },
  { smer: "sw", trida: "left-0 bottom-0 h-3 w-3 cursor-nesw-resize" },
  { smer: "se", trida: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize" },
];

export function OknoRam({
  okno,
  aktivni,
  children,
}: {
  okno: Okno;
  aktivni: boolean;
  /**
   * Obsah okna. Dostane prvek v záhlaví, do kterého si aplikace může
   * portálem vykreslit vlastní pruh – tak jsou ve Windows 11 udělané karty
   * Průzkumníku: nejsou pod záhlavím, jsou přímo v něm.
   */
  children: (slotZahlavi: HTMLDivElement | null) => ReactNode;
}) {
  const { stav, poslat, plocha } = useSystem();
  const [nabidkaRozvrzeni, nastavNabidku] = useState(false);
  const casovacNabidky = useRef<number | null>(null);
  const tazeni = useRef<{
    rezim: "posun" | string;
    startX: number;
    startY: number;
    ram: { x: number; y: number; w: number; h: number };
  } | null>(null);
  /** Co se stane, když se okno teď pustí. `max` = přes celou plochu. */
  const [nahled, nastavNahled] = useState<Prichyceni | "max">(null);
  const [slotZahlavi, nastavSlot] = useState<HTMLDivElement | null>(null);
  /** Vykreslila si aplikace do záhlaví vlastní pruh (karty Průzkumníku)? */
  const [vlastniZahlavi, nastavVlastniZahlavi] = useState(false);

  /**
   * Do slotu nesmí nic kreslit rám samotný – sleduje se, jestli si do něj
   * něco vykreslila aplikace. Kdyby v něm byl i náhradní titulek, střídalo by
   * se jeho přidání a odebrání donekonečna: mutace → nový stav → jiný obsah
   * slotu → mutace. Titulek proto stojí vedle slotu, ne v něm.
   */
  useEffect(() => {
    if (!slotZahlavi) return;
    const zkontroluj = () => nastavVlastniZahlavi(slotZahlavi.childElementCount > 0);
    zkontroluj();
    const sledovac = new MutationObserver(zkontroluj);
    sledovac.observe(slotZahlavi, { childList: true });
    return () => sledovac.disconnect();
  }, [slotZahlavi]);

  const maximalizovane = okno.stav === "maximalizovane";

  /* ───── tažení a změna velikosti ───── */

  /*
   * `zoom` na prostředí zvětší rozvržení, ale `clientX` z ukazatele zůstává
   * v pixelech okna prohlížeče. Posuny se proto musí měřítkem podělit, jinak
   * okno utíká zpod kurzoru – změřeno: při rozlišení 1280 se posunulo 1,5× dál.
   *
   * Počítá se ZDE, ne uvnitř efektu: musí být mezi jeho závislostmi. Napoprvé
   * jsem ho měl uvnitř a posluchač si držel měřítko z doby, kdy vznikl, takže
   * oprava nefungovala, dokud se okno nezavřelo a neotevřelo.
   */
  const meritko = MERITKO[stav.nastaveni.rozliseni];

  useEffect(() => {
    const pohyb = (e: PointerEvent) => {
      const t = tazeni.current;
      if (!t) return;
      const dx = (e.clientX - t.startX) / meritko;
      const dy = (e.clientY - t.startY) / meritko;

      if (t.rezim === "posun") {
        const x = Math.min(Math.max(t.ram.x + dx, -t.ram.w + 120), plocha.w - 120);
        const y = Math.min(Math.max(t.ram.y + dy, 0), plocha.h - 40);
        poslat({ typ: "okno/posun", id: okno.id, obdelnik: { ...t.ram, x, y } });
        // Kurzor u okraje plochy nabídne přichycení – u horního celou plochu,
        // u bočního půlku. Rozhoduje kurzor, ne okno: tak to dělá i Windows.
        const mysX = e.clientX / meritko - plocha.x;
        const mysY = e.clientY / meritko - plocha.y;
        const uOkraje = 6;
        nastavNahled(
          mysY <= uOkraje
            ? "max"
            : mysX <= uOkraje
              ? "vlevo"
              : mysX >= plocha.w - uOkraje
                ? "vpravo"
                : null,
        );
        return;
      }

      let { x, y, w, h } = t.ram;
      if (t.rezim.includes("e")) w = Math.max(MIN_SIRKA, t.ram.w + dx);
      if (t.rezim.includes("s")) h = Math.max(MIN_VYSKA, t.ram.h + dy);
      if (t.rezim.includes("w")) {
        w = Math.max(MIN_SIRKA, t.ram.w - dx);
        x = t.ram.x + (t.ram.w - w);
      }
      if (t.rezim.includes("n")) {
        h = Math.max(MIN_VYSKA, t.ram.h - dy);
        y = t.ram.y + (t.ram.h - h);
      }
      poslat({ typ: "okno/posun", id: okno.id, obdelnik: { x, y, w, h } });
    };

    const konec = () => {
      if (tazeni.current?.rezim === "posun" && nahled) {
        poslat(
          nahled === "max"
            ? { typ: "okno/maximalizuj", id: okno.id }
            : { typ: "okno/prichyt", id: okno.id, kam: nahled },
        );
      }
      tazeni.current = null;
      nastavNahled(null);
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", pohyb);
    window.addEventListener("pointerup", konec);
    return () => {
      window.removeEventListener("pointermove", pohyb);
      window.removeEventListener("pointerup", konec);
    };
  }, [okno.id, plocha.x, plocha.y, plocha.w, plocha.h, poslat, nahled, meritko]);

  const zacniTahat = (e: React.PointerEvent, rezim: string) => {
    if (e.button !== 0) return;
    // Maximalizované okno se tažením za záhlaví vrátí do své velikosti.
    if (maximalizovane && rezim === "posun") {
      poslat({ typ: "okno/obnov", id: okno.id });
      return;
    }
    e.preventDefault();
    poslat({ typ: "okno/zamer", id: okno.id });
    tazeni.current = {
      rezim,
      startX: e.clientX,
      startY: e.clientY,
      ram: { x: okno.x, y: okno.y, w: okno.w, h: okno.h },
    };
  };

  /* ───── nabídka rozvržení nad tlačítkem maximalizace ───── */

  const otevriNabidkuPozdeji = () => {
    casovacNabidky.current = window.setTimeout(() => nastavNabidku(true), 380);
  };
  const zrusNabidku = () => {
    if (casovacNabidky.current) window.clearTimeout(casovacNabidky.current);
    casovacNabidky.current = null;
  };
  useEffect(() => () => zrusNabidku(), []);

  const poloha: React.CSSProperties = maximalizovane
    ? { inset: 0, width: "100%", height: "100%" }
    : okno.prichyceni
      ? MISTA[okno.prichyceni]
      : { left: okno.x, top: okno.y, width: okno.w, height: okno.h };

  // Minimalizované okno se skryje, ale zůstane v DOM. Kdyby se odpojilo,
  // přišel by žák o rozepsaný text v Poznámkovém bloku i o rozkreslený obrázek.
  if (okno.stav === "minimalizovane") poloha.display = "none";

  return (
    <>
      {nahled && (
        <div
          className="pointer-events-none absolute z-[400] rounded-lg border-2 border-win-akcent"
          style={{
            ...(nahled === "max"
              ? { inset: 0 }
              : MISTA[nahled]),
            backgroundColor: "rgb(var(--win-akcent) / 0.2)",
          }}
        />
      )}
      <section
        aria-label={okno.titul}
        onPointerDown={() => poslat({ typ: "okno/zamer", id: okno.id })}
        className={`win-vjezd absolute flex flex-col overflow-hidden bg-win-plocha text-win-text ${
          maximalizovane ? "rounded-none" : "rounded-lg"
        } ${
          aktivni
            ? "border border-win-linka shadow-[var(--win-stin)]"
            : "border border-win-linka/60 shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
        }`}
        style={{ ...poloha, zIndex: okno.z }}
      >
        {/* Záhlaví */}
        <div
          onPointerDown={(e) => zacniTahat(e, "posun")}
          onDoubleClick={() =>
            poslat({ typ: maximalizovane ? "okno/obnov" : "okno/maximalizuj", id: okno.id })
          }
          className="win-bezvyberu flex h-8 shrink-0 items-center gap-2 pl-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 self-stretch">
            {/* Ikonu a název kreslí rám jen tehdy, když si aplikace záhlaví
                nezabrala sama – jinak by vedle sebe stály dvě ikony téže
                aplikace. Obojí je vedle slotu, nikdy uvnitř něj. */}
            {!vlastniZahlavi && (
              <>
                <Ikona klic={okno.app} velikost={16} />
                <span
                  className={`min-w-0 flex-1 truncate text-[12px] ${
                    aktivni ? "text-win-text" : "text-win-slaby"
                  }`}
                >
                  {okno.titul}
                </span>
              </>
            )}
            <div
              ref={nastavSlot}
              className={`flex min-w-0 items-center self-stretch ${
                vlastniZahlavi ? "flex-1" : ""
              }`}
            />
          </div>
          <div className="flex h-8 shrink-0">
            <button
              type="button"
              aria-label="Minimalizovat"
              onClick={() => poslat({ typ: "okno/minimalizuj", id: okno.id })}
              className="flex h-8 w-[46px] items-center justify-center hover:bg-win-zvyrazneny"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <div
              className="relative"
              onMouseEnter={otevriNabidkuPozdeji}
              onMouseLeave={() => {
                zrusNabidku();
                nastavNabidku(false);
              }}
            >
              <button
                type="button"
                aria-label={maximalizovane ? "Zmenšit" : "Maximalizovat"}
                onClick={() =>
                  poslat({ typ: maximalizovane ? "okno/obnov" : "okno/maximalizuj", id: okno.id })
                }
                className="flex h-8 w-[46px] items-center justify-center hover:bg-win-zvyrazneny"
              >
                {maximalizovane ? (
                  <Copy className="h-3 w-3 -scale-x-100" strokeWidth={1.5} />
                ) : (
                  <Square className="h-3 w-3" strokeWidth={1.5} />
                )}
              </button>
              {nabidkaRozvrzeni && (
                <NabidkaRozvrzeni
                  onVyber={(kam) => {
                    poslat({ typ: "okno/prichyt", id: okno.id, kam });
                    nastavNabidku(false);
                  }}
                />
              )}
            </div>
            <button
              type="button"
              aria-label="Zavřít"
              onClick={() => poslat({ typ: "okno/zavri", id: okno.id })}
              className="flex h-8 w-[46px] items-center justify-center hover:bg-[#c42b1c] hover:text-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Obsah aplikace */}
        <div className="relative min-h-0 flex-1 overflow-hidden">{children(slotZahlavi)}</div>

        {/* Úchyty pro změnu velikosti – u maximalizovaného okna nedávají smysl */}
        {!maximalizovane &&
          !okno.prichyceni &&
          UCHYTY.map((u) => (
            <div
              key={u.smer}
              onPointerDown={(e) => zacniTahat(e, u.smer)}
              className={`absolute z-10 ${u.trida}`}
            />
          ))}
      </section>
    </>
  );
}

/**
 * Rozvržení přichycení – to, co ve Windows 11 vyjede nad tlačítkem
 * maximalizace. Dvě varianty stačí: půlky a čtvrtiny.
 */
function NabidkaRozvrzeni({ onVyber }: { onVyber: (kam: Prichyceni) => void }) {
  const dlazdice =
    "rounded-sm bg-win-slaby/30 transition-colors hover:bg-win-akcent focus-visible:bg-win-akcent";
  return (
    <div className="win-vyjezd absolute right-0 top-8 z-[500] w-[228px] rounded-lg border border-win-linka bg-win-povrch p-2.5 shadow-[var(--win-stin-nabidka)]">
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" aria-label="Vlevo" className={`${dlazdice} h-14`} onClick={() => onVyber("vlevo")} />
        <button type="button" aria-label="Vpravo" className={`${dlazdice} h-14`} onClick={() => onVyber("vpravo")} />
      </div>
      <div className="mt-2 grid grid-cols-2 grid-rows-2 gap-1.5">
        <button type="button" aria-label="Vlevo nahoře" className={`${dlazdice} h-7`} onClick={() => onVyber("levo-nahore")} />
        <button type="button" aria-label="Vpravo nahoře" className={`${dlazdice} h-7`} onClick={() => onVyber("pravo-nahore")} />
        <button type="button" aria-label="Vlevo dole" className={`${dlazdice} h-7`} onClick={() => onVyber("levo-dole")} />
        <button type="button" aria-label="Vpravo dole" className={`${dlazdice} h-7`} onClick={() => onVyber("pravo-dole")} />
      </div>
    </div>
  );
}
