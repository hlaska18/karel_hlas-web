"use client";

/**
 * Fotky – prohlížeč obrázků.
 *
 * Umí projít celou složku, přiblížit a otočit. Otočení a přiblížení schválně
 * NEmění soubor na disku: prohlížeč se dívá, needituje. Je to drobnost, ale
 * odpovídá na otázku, kterou dostane každý učitel informatiky: „proč se to
 * po zavření vrátilo?"
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Minus, Plus, RotateCw, Trash2 } from "lucide-react";
import { IkonoveTlacitko } from "../ui";
import { useOkno, useSystem } from "../system";
import {
  jeSoubor,
  najdiSlozku,
  nadrazena,
  rozloz,
  sloz,
  velikost,
  type Soubor,
} from "@/lib/win/fs";
import { datumDlouhy, velikostPodrobne } from "@/lib/win/format";
import { jeObrazek, typSouboru } from "@/lib/win/typy";
import { smazDoKose } from "@/lib/win/operace";

export function Fotky() {
  const { stav, poslat } = useSystem();
  const { arg, nastavTitul } = useOkno();
  /**
   * Spuštění bez souboru (ze Startu nebo z panelu) otevře složku Obrázky
   * a v ní první obrázek. Bez toho by aplikace hlásila prázdno, i když
   * ve složce obrázky jsou – jen na ně nikdo neukázal.
   */
  const [cesta, nastavCestu] = useState<string[]>(() => {
    if (arg) return rozloz(arg);
    const obrazky = rozloz("C:\\Users\\Zak\\Pictures");
    const slozka = najdiSlozku(stav.disk, obrazky);
    const prvni = slozka?.deti.find((d) => jeSoubor(d) && jeObrazek(d.jmeno));
    return prvni ? [...obrazky, prvni.jmeno] : [...obrazky, ""];
  });
  const [zvetseni, nastavZvetseni] = useState(100);
  const [otoceni, nastavOtoceni] = useState(0);
  const [info, nastavInfo] = useState(false);

  const slozka = najdiSlozku(stav.disk, nadrazena(cesta));
  const obrazky = useMemo<Soubor[]>(
    () => (slozka?.deti ?? []).filter((d): d is Soubor => jeSoubor(d) && jeObrazek(d.jmeno)),
    [slozka],
  );
  const index = obrazky.findIndex((o) => o.jmeno === cesta[cesta.length - 1]);
  const aktualni = index >= 0 ? obrazky[index] : null;

  useEffect(() => {
    nastavTitul(aktualni ? `${aktualni.jmeno} – Fotky` : "Fotky");
  }, [aktualni, nastavTitul]);

  const prejdi = (o: number) => {
    if (obrazky.length === 0) return;
    const dalsi = obrazky[(index + o + obrazky.length) % obrazky.length];
    nastavCestu([...nadrazena(cesta), dalsi.jmeno]);
    nastavZvetseni(100);
    nastavOtoceni(0);
  };

  const smaz = () => {
    if (!aktualni) return;
    const vysledek = smazDoKose(stav.disk, [cesta]);
    poslat({ typ: "disk/nastav", disk: vysledek.disk });
    poslat({ typ: "kos/vloz", polozky: vysledek.polozky });
    if (obrazky.length > 1) prejdi(1);
  };

  return (
    <div className="win-bezvyberu flex h-full flex-col bg-[#1b1b1b] text-white">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
        <span className="truncate text-[13px]">{aktualni?.jmeno ?? "Žádný obrázek"}</span>
        <div className="flex items-center gap-0.5">
          <IkonoveTlacitko aria-label="Oddálit" onClick={() => nastavZvetseni((z) => Math.max(10, z - 20))}>
            <Minus className="h-4 w-4" />
          </IkonoveTlacitko>
          <span className="w-12 text-center text-[12px]">{zvetseni} %</span>
          <IkonoveTlacitko aria-label="Přiblížit" onClick={() => nastavZvetseni((z) => Math.min(500, z + 20))}>
            <Plus className="h-4 w-4" />
          </IkonoveTlacitko>
          <IkonoveTlacitko aria-label="Otočit" onClick={() => nastavOtoceni((o) => (o + 90) % 360)}>
            <RotateCw className="h-4 w-4" />
          </IkonoveTlacitko>
          <IkonoveTlacitko aria-label="Informace o souboru" aktivni={info} onClick={() => nastavInfo((i) => !i)}>
            <Info className="h-4 w-4" />
          </IkonoveTlacitko>
          <IkonoveTlacitko aria-label="Odstranit" onClick={smaz}>
            <Trash2 className="h-4 w-4" />
          </IkonoveTlacitko>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
        {obrazky.length > 1 && (
          <button
            type="button"
            aria-label="Předchozí"
            onClick={() => prejdi(-1)}
            className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {aktualni ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aktualni.obsah}
            alt={aktualni.jmeno}
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zvetseni / 100}) rotate(${otoceni}deg)` }}
          />
        ) : (
          <p className="text-center text-white/60">
            V této složce žádný obrázek není.
            <br />
            Zkus složku Obrázky nebo si nějaký nakresli v Malování.
          </p>
        )}
        {obrazky.length > 1 && (
          <button
            type="button"
            aria-label="Další"
            onClick={() => prejdi(1)}
            className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {info && aktualni && (
          <aside className="absolute right-0 top-0 h-full w-64 overflow-auto bg-black/70 p-4 text-[12px] backdrop-blur">
            <h2 className="mb-3 text-[14px] font-semibold">Informace o souboru</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-white/60">Název</dt>
                <dd className="break-words">{aktualni.jmeno}</dd>
              </div>
              <div>
                <dt className="text-white/60">Typ</dt>
                <dd>{typSouboru(aktualni.jmeno).popis}</dd>
              </div>
              <div>
                <dt className="text-white/60">Velikost</dt>
                <dd>{velikostPodrobne(velikost(aktualni))}</dd>
              </div>
              <div>
                <dt className="text-white/60">Umístění</dt>
                <dd className="break-words">{sloz(nadrazena(cesta))}</dd>
              </div>
              <div>
                <dt className="text-white/60">Datum změny</dt>
                <dd>{datumDlouhy(aktualni.zmeneno)}</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>

      <div className="flex h-8 shrink-0 items-center justify-center gap-2 text-[11px] text-white/60">
        {obrazky.length > 0 && `${index + 1} z ${obrazky.length}`}
      </div>
    </div>
  );
}
