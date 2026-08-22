"use client";

/**
 * Poznámkový blok.
 *
 * Záměrně strohý, jako předloha: nabídky Soubor / Úpravy / Zobrazení, žádné
 * formátování, stavový řádek s pozicí kurzoru. Právě proto je to dobrý první
 * editor – co se napíše, to je v souboru, nic navíc.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Tlacitko } from "../ui";
import { DialogSouboru } from "../DialogSouboru";
import { useOkno, useSystem } from "../system";
import {
  najdi,
  najdiSlozku,
  nadrazena,
  novySoubor,
  rozloz,
  sloz,
  vloz,
  jeSlozka,
} from "@/lib/win/fs";
import { TEXTOVE } from "@/lib/win/typy";

const NABIDKY = ["Soubor", "Úpravy", "Zobrazení"] as const;
type Nabidka = (typeof NABIDKY)[number];

export function PoznamkovyBlok() {
  const { stav, poslat, stopa } = useSystem();
  const { arg, nastavTitul } = useOkno();

  const [cesta, nastavCestu] = useState<string[] | null>(() => (arg ? rozloz(arg) : null));
  const [text, nastavText] = useState("");
  const [ulozeno, nastavUlozeno] = useState(true);
  const [zalamovat, nastavZalamovat] = useState(true);
  const [zvetseni, nastavZvetseni] = useState(100);
  const [otevrenaNabidka, nastavNabidku] = useState<Nabidka | null>(null);
  const [dialog, nastavDialog] = useState<"ulozit" | "otevrit" | null>(null);
  const [ptaSeNaUlozeni, nastavOtazku] = useState<null | "novy" | "otevrit">(null);
  const plocha = useRef<HTMLTextAreaElement>(null);
  const [kurzor, nastavKurzor] = useState({ radek: 1, sloupec: 1 });

  /* Načtení souboru, se kterým se aplikace spustila. */
  useEffect(() => {
    if (!cesta) return;
    const uzel = najdi(stav.disk, cesta);
    if (uzel && !jeSlozka(uzel)) {
      nastavText(uzel.obsah.startsWith("data:") ? "" : uzel.obsah);
      nastavUlozeno(true);
    }
    // Čte se jen při změně otevřeného souboru, ne při každé úpravě disku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cesta && sloz(cesta)]);

  const nazev = cesta ? cesta[cesta.length - 1] : "Bez názvu";

  useEffect(() => {
    nastavTitul(`${ulozeno ? "" : "*"}${nazev} – Poznámkový blok`, cesta ? sloz(cesta) : undefined);
  }, [nazev, ulozeno, cesta, nastavTitul]);

  /* ───────── operace se souborem ───────── */

  const ulozDo = (kam: string[]) => {
    const rodic = nadrazena(kam);
    if (!najdiSlozku(stav.disk, rodic)) return;
    const puvodni = najdi(stav.disk, kam);
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, rodic, {
        ...(puvodni && !jeSlozka(puvodni) ? puvodni : novySoubor(kam[kam.length - 1])),
        jmeno: kam[kam.length - 1],
        obsah: text,
        velikost: undefined,
        zmeneno: Date.now(),
      }),
    });
    nastavCestu(kam);
    nastavUlozeno(true);
    stopa("poznamkovy-blok:ulozeno");
  };

  const uloz = () => {
    if (cesta) ulozDo(cesta);
    else nastavDialog("ulozit");
  };

  const novy = () => {
    if (!ulozeno) {
      nastavOtazku("novy");
      return;
    }
    nastavCestu(null);
    nastavText("");
    nastavUlozeno(true);
  };

  /* ───────── nabídky ───────── */

  const polozkyNabidky: Record<Nabidka, { nazev: string; zkratka?: string; akce: () => void }[]> = {
    Soubor: [
      { nazev: "Nový", zkratka: "Ctrl+N", akce: novy },
      { nazev: "Otevřít…", zkratka: "Ctrl+O", akce: () => nastavDialog("otevrit") },
      { nazev: "Uložit", zkratka: "Ctrl+S", akce: uloz },
      { nazev: "Uložit jako…", akce: () => nastavDialog("ulozit") },
    ],
    Úpravy: [
      {
        nazev: "Vybrat vše",
        zkratka: "Ctrl+A",
        akce: () => plocha.current?.select(),
      },
      {
        nazev: "Čas a datum",
        zkratka: "F5",
        akce: () => vlozNaKurzor(new Date().toLocaleString("cs-CZ")),
      },
    ],
    Zobrazení: [
      {
        nazev: zalamovat ? "Zalamování řádků (zapnuto)" : "Zalamování řádků (vypnuto)",
        akce: () => nastavZalamovat((z) => !z),
      },
      { nazev: "Přiblížit", zkratka: "Ctrl++", akce: () => nastavZvetseni((z) => Math.min(300, z + 10)) },
      { nazev: "Oddálit", zkratka: "Ctrl+-", akce: () => nastavZvetseni((z) => Math.max(50, z - 10)) },
      { nazev: "Obnovit výchozí velikost", akce: () => nastavZvetseni(100) },
    ],
  };

  function vlozNaKurzor(vlozka: string) {
    const el = plocha.current;
    if (!el) return;
    const { selectionStart: od, selectionEnd: do_ } = el;
    nastavText(`${text.slice(0, od)}${vlozka}${text.slice(do_)}`);
    nastavUlozeno(false);
  }

  /* ───────── klávesové zkratky ───────── */

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      if (!plocha.current?.ownerDocument.activeElement) return;
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        uloz();
      } else if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        nastavDialog("otevrit");
      } else if (e.key === "F5") {
        e.preventDefault();
        vlozNaKurzor(new Date().toLocaleString("cs-CZ"));
      }
    };
    const el = plocha.current;
    el?.addEventListener("keydown", naKlavesu);
    return () => el?.removeEventListener("keydown", naKlavesu);
  });

  const spocitejKurzor = () => {
    const el = plocha.current;
    if (!el) return;
    const pred = el.value.slice(0, el.selectionStart);
    const radky = pred.split("\n");
    nastavKurzor({ radek: radky.length, sloupec: radky[radky.length - 1].length + 1 });
  };

  const znaku = useMemo(() => text.length, [text]);

  return (
    <div className="flex h-full flex-col bg-win-povrch">
      {/* Pruh nabídek */}
      <div className="win-bezvyberu relative flex h-8 shrink-0 items-center gap-0.5 border-b border-win-linka px-1">
        {NABIDKY.map((n) => (
          <div key={n} className="relative">
            <button
              type="button"
              onClick={() => nastavNabidku((o) => (o === n ? null : n))}
              onMouseEnter={() => otevrenaNabidka && nastavNabidku(n)}
              className={`h-7 rounded px-3 text-[12px] ${
                otevrenaNabidka === n ? "bg-win-zvyrazneny" : "hover:bg-win-zvyrazneny"
              }`}
            >
              {n}
            </button>
            {otevrenaNabidka === n && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => nastavNabidku(null)} />
                <div className="win-vyjezd absolute left-0 top-7 z-[200] min-w-[220px] rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)]">
                  {polozkyNabidky[n].map((p) => (
                    <button
                      key={p.nazev}
                      type="button"
                      onClick={() => {
                        p.akce();
                        nastavNabidku(null);
                      }}
                      className="flex h-8 w-full items-center justify-between gap-6 rounded px-2 text-left text-[13px] hover:bg-win-zvyrazneny"
                    >
                      <span>{p.nazev}</span>
                      {p.zkratka && <span className="text-[12px] text-win-slaby">{p.zkratka}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Plocha pro psaní */}
      <textarea
        ref={plocha}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          nastavText(e.target.value);
          nastavUlozeno(false);
        }}
        onKeyUp={spocitejKurzor}
        onClick={spocitejKurzor}
        aria-label="Text dokumentu"
        className={`win-posuv min-h-0 flex-1 resize-none bg-win-povrch p-2 font-mono text-win-text outline-none ${
          zalamovat ? "" : "whitespace-pre overflow-x-auto"
        }`}
        style={{ fontSize: `${(14 * zvetseni) / 100}px`, lineHeight: 1.5 }}
      />

      {/* Stavový řádek */}
      <div className="flex h-6 shrink-0 items-center justify-end gap-6 border-t border-win-linka bg-win-plocha px-3 text-[11px] text-win-slaby">
        <span>
          Řádek {kurzor.radek}, sloupec {kurzor.sloupec}
        </span>
        <span>{znaku} znaků</span>
        <span>{zvetseni} %</span>
        <span>Windows (CRLF)</span>
        <span>UTF-8</span>
      </div>

      {dialog && (
        <DialogSouboru
          rezim={dialog}
          vychoziNazev={dialog === "ulozit" ? nazev.replace(/^\*/, "") : ""}
          vychoziSlozka={cesta ? sloz(nadrazena(cesta)) : "C:\\Users\\Zak\\Documents"}
          filtr={TEXTOVE}
          popisFiltru="Textové dokumenty (*.txt)"
          onZavrit={() => nastavDialog(null)}
          onPotvrdit={(kam) => {
            if (dialog === "ulozit") ulozDo(kam);
            else {
              nastavCestu(kam);
              nastavUlozeno(true);
            }
            nastavDialog(null);
          }}
        />
      )}

      {ptaSeNaUlozeni && (
        <Dialog
          nadpis="Poznámkový blok"
          onZavrit={() => nastavOtazku(null)}
          tlacitka={
            <>
              <Tlacitko
                vzhled="akcent"
                onClick={() => {
                  uloz();
                  nastavOtazku(null);
                }}
              >
                Uložit
              </Tlacitko>
              <Tlacitko
                onClick={() => {
                  nastavUlozeno(true);
                  nastavCestu(null);
                  nastavText("");
                  nastavOtazku(null);
                }}
              >
                Neukládat
              </Tlacitko>
              <Tlacitko onClick={() => nastavOtazku(null)}>Zrušit</Tlacitko>
            </>
          }
        >
          Chcete uložit změny v souboru {nazev}?
        </Dialog>
      )}
    </div>
  );
}
