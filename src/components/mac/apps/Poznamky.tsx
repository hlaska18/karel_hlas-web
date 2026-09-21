"use client";

/**
 * Poznámky – prostý editor textu.
 *
 * Není tu kvůli psaní. Je tu proto, aby měl žák DRUHOU aplikaci, kterou jde
 * ukončit – Finder ukončit nejde, takže na něm rozdíl mezi „zavřel jsem okno“
 * a „ukončil jsem program“ ukázat nelze. Na Poznámkách ano, a proto jsou
 * v Docku hned vedle.
 *
 * Text se ukládá na virtuální disk, takže přežije zavření okna. To je samo
 * o sobě další doklad, že program a jeho data nejsou totéž co okno.
 */

import { useEffect, useRef, useState } from "react";
import { useMac, useOknoMac } from "../system";
import { DOKUMENTY, rozlozMac, slozMac } from "@/lib/mac/cesty";
import { najdiSoubor, novySoubor, vloz, nadrazena } from "@/lib/win/fs";

/** Kam se ukládá, když se Poznámky spustí z Docku bez konkrétního souboru. */
const VYCHOZI = [...DOKUMENTY, "Poznámka.txt"];

/**
 * Událost, kterou horní lišta žádá o uložení. Nese id okna, protože Poznámek
 * může být otevřených víc a uložit se má jen to, které je vpředu.
 */
export const UDALOST_ULOZIT = "mac-poznamky-uloz";

export function Poznamky() {
  const { stav, poslat, stopa } = useMac();
  const { id, arg, nastavTitul } = useOknoMac();

  const cesta = arg ? rozlozMac(arg) : VYCHOZI;
  const soubor = najdiSoubor(stav.disk, cesta);
  const jmeno = cesta[cesta.length - 1];

  const [text, nastavText] = useState(soubor?.obsah ?? "");
  const [ulozeno, nastavUlozeno] = useState(true);

  useEffect(() => {
    nastavTitul(jmeno);
  }, [jmeno, nastavTitul]);

  const uloz = () => {
    const puvodni = najdiSoubor(stav.disk, cesta);
    const novy = puvodni
      ? { ...puvodni, obsah: text, zmeneno: Date.now() }
      : { ...novySoubor(jmeno, text) };
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, nadrazena(cesta), novy),
    });
    nastavUlozeno(true);
    stopa("ulozil-poznamku");
  };

  /*
   * Ukládá se z horní lišty, Soubor → Uložit – ne tlačítkem v okně. Na Macu
   * tlačítko Uložit v okně textového editoru není; ukládá se z nabídky, která
   * patří programu vpředu. To je navíc přesně lekce skupiny „Nabídka patří
   * programu".
   *
   * `uloz` vzniká při každém vykreslení znovu (drží aktuální text), proto se
   * volá přes ref – posluchač se tak nemusí přihlašovat pokaždé znovu.
   */
  const ulozRef = useRef(uloz);
  ulozRef.current = uloz;
  useEffect(() => {
    const naPozadani = (e: Event) => {
      if ((e as CustomEvent<number>).detail === id) ulozRef.current();
    };
    window.addEventListener(UDALOST_ULOZIT, naPozadani);
    return () => {
      window.removeEventListener(UDALOST_ULOZIT, naPozadani);
    };
  }, [id]);

  return (
    <div className="flex h-full flex-col bg-mac-povrch">
      <div className="flex h-[32px] shrink-0 items-center gap-3 border-b border-mac-linka bg-mac-panel px-3 text-[12px] text-mac-slaby">
        <span className="tabular-nums">{slozMac(cesta)}</span>
        <span className={`ml-auto ${ulozeno ? "opacity-0" : "opacity-100"}`}>
          neuloženo
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          nastavText(e.target.value);
          nastavUlozeno(false);
        }}
        spellCheck={false}
        aria-label={`Obsah souboru ${jmeno}`}
        className="mac-posuv min-h-0 flex-1 resize-none bg-mac-povrch p-4 font-mono text-[13px] leading-relaxed text-mac-text outline-none"
      />
    </div>
  );
}
