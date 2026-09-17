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

import { useEffect, useState } from "react";
import { useMac, useOknoMac } from "../system";
import { DOKUMENTY, rozlozMac, slozMac } from "@/lib/mac/cesty";
import { najdiSoubor, novySoubor, vloz, nadrazena } from "@/lib/win/fs";

/** Kam se ukládá, když se Poznámky spustí z Docku bez konkrétního souboru. */
const VYCHOZI = [...DOKUMENTY, "Poznámka.txt"];

export function Poznamky() {
  const { stav, poslat, stopa } = useMac();
  const { arg, nastavTitul } = useOknoMac();

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
    poslat({ typ: "disk/nastav", disk: vloz(stav.disk, nadrazena(cesta), novy) });
    nastavUlozeno(true);
    stopa("ulozil-poznamku");
  };

  return (
    <div className="flex h-full flex-col bg-mac-povrch">
      <div className="flex h-[32px] shrink-0 items-center gap-3 border-b border-mac-linka bg-mac-panel px-3 text-[12px] text-mac-slaby">
        <span className="tabular-nums">{slozMac(cesta)}</span>
        <button
          type="button"
          onClick={uloz}
          className="ml-auto rounded-md bg-mac-akcent px-3 py-1 text-[12px] font-medium text-mac-akcent-text hover:opacity-90"
        >
          Uložit
        </button>
        <span className={ulozeno ? "opacity-0" : "opacity-100"}>neuloženo</span>
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
