"use client";

/**
 * Microsoft Edge.
 *
 * Neumí do skutečného internetu – zná jen stránky z `lib/win/web.ts` a soubory
 * na virtuálním disku. Zato umí to nejcennější: otevřít HTML soubor, který si
 * žák sám napsal v Poznámkovém bloku, a ukázat mu, co z něj vzniklo.
 *
 * Stránky se vykreslují v odděleném rámu se zakázanými skripty. I když je
 * obsah vlastní, prohlížeč nemá být dírou, kterou by šlo sáhnout na zbytek
 * stránky – a sandbox to řeší jednou provždy.
 */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  House,
  Lock,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { IkonoveTlacitko } from "../ui";
import { useOkno, useSystem } from "../system";
import { jeSoubor, najdi, pripona, rozloz, sloz, vloz, volneJmeno, najdiSlozku } from "@/lib/win/fs";
import { DOMOVSKA, chybovaStranka, najdiStranku, nahledPdf, STRANKY } from "@/lib/win/web";

interface Karta {
  id: number;
  historie: string[];
  index: number;
}

export function Prohlizec() {
  const { stav, poslat } = useSystem();
  const { arg, nastavTitul } = useOkno();
  const [karty, nastavKarty] = useState<Karta[]>(() => [
    { id: 1, historie: [arg ?? DOMOVSKA], index: 0 },
  ]);
  const [aktivni, nastavAktivni] = useState(1);
  const [adresniRadek, nastavAdresniRadek] = useState("");
  const [stazeno, nastavStazeno] = useState<string | null>(null);

  const karta = karty.find((k) => k.id === aktivni) ?? karty[0];
  const adresa = karta.historie[karta.index];

  /** Co se má zobrazit: stránka z vnitřní sítě, nebo soubor z disku. */
  const obsah = useMemo(() => {
    if (/^[a-z]:[\\/]/i.test(adresa)) {
      const uzel = najdi(stav.disk, rozloz(adresa));
      const jmeno = rozloz(adresa).pop() ?? adresa;
      if (!uzel || !jeSoubor(uzel)) {
        return { titulek: "Soubor nenalezen", html: chybovaStranka(adresa) };
      }
      if (pripona(jmeno) === "pdf") return { titulek: jmeno, html: nahledPdf(jmeno) };
      return { titulek: jmeno, html: uzel.obsah };
    }
    const stranka = najdiStranku(adresa);
    return stranka
      ? { titulek: stranka.titulek, html: stranka.telo }
      : { titulek: "Stránka není dostupná", html: chybovaStranka(adresa) };
  }, [adresa, stav.disk]);

  const stranka = najdiStranku(adresa);

  useEffect(() => {
    nastavTitul(`${obsah.titulek} – Microsoft Edge`);
  }, [obsah.titulek, nastavTitul]);

  useEffect(() => {
    nastavAdresniRadek(adresa);
  }, [adresa]);

  const jdi = (kam: string) => {
    const cil = kam.trim();
    if (!cil) return;
    nastavKarty((s) =>
      s.map((k) =>
        k.id === aktivni
          ? { ...k, historie: [...k.historie.slice(0, k.index + 1), cil], index: k.index + 1 }
          : k,
      ),
    );
  };

  const stahni = () => {
    if (!stranka?.kestazeni) return;
    const kam = rozloz("C:\\Users\\Zak\\Downloads");
    const slozka = najdiSlozku(stav.disk, kam);
    if (!slozka) return;
    const jmeno = volneJmeno(slozka, stranka.kestazeni.jmeno);
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, kam, {
        druh: "soubor",
        jmeno,
        obsah: stranka.kestazeni.obsah,
        zmeneno: Date.now(),
      }),
    });
    nastavStazeno(jmeno);
  };

  return (
    <div className="win-bezvyberu flex h-full flex-col bg-win-plocha">
      {/* Karty */}
      <div className="flex h-9 shrink-0 items-end gap-1 px-2 pt-1">
        {karty.map((k) => {
          const nazev = najdiStranku(k.historie[k.index])?.titulek ?? k.historie[k.index];
          return (
            <div
              key={k.id}
              className={`group flex h-8 max-w-[200px] items-center gap-2 rounded-t-md px-3 text-[12px] ${
                k.id === aktivni ? "bg-win-povrch" : "hover:bg-win-zvyrazneny"
              }`}
            >
              <button type="button" onClick={() => nastavAktivni(k.id)} className="min-w-0 flex-1 truncate text-left">
                {nazev}
              </button>
              {karty.length > 1 && (
                <button
                  type="button"
                  aria-label="Zavřít kartu"
                  onClick={() => {
                    const zbytek = karty.filter((x) => x.id !== k.id);
                    nastavKarty(zbytek);
                    if (aktivni === k.id) nastavAktivni(zbytek[0].id);
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          aria-label="Nová karta"
          onClick={() => {
            const id = Math.max(0, ...karty.map((k) => k.id)) + 1;
            nastavKarty((s) => [...s, { id, historie: [DOMOVSKA], index: 0 }]);
            nastavAktivni(id);
          }}
          className="mb-1 flex h-6 w-6 items-center justify-center rounded hover:bg-win-zvyrazneny"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Adresní řádek */}
      <div className="flex h-11 shrink-0 items-center gap-1 bg-win-povrch px-2">
        <IkonoveTlacitko
          aria-label="Zpět"
          disabled={karta.index === 0}
          onClick={() =>
            nastavKarty((s) => s.map((k) => (k.id === aktivni ? { ...k, index: k.index - 1 } : k)))
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </IkonoveTlacitko>
        <IkonoveTlacitko
          aria-label="Vpřed"
          disabled={karta.index >= karta.historie.length - 1}
          onClick={() =>
            nastavKarty((s) => s.map((k) => (k.id === aktivni ? { ...k, index: k.index + 1 } : k)))
          }
        >
          <ArrowRight className="h-4 w-4" />
        </IkonoveTlacitko>
        <IkonoveTlacitko aria-label="Aktualizovat" onClick={() => jdi(adresa)}>
          <RotateCw className="h-4 w-4" />
        </IkonoveTlacitko>
        <IkonoveTlacitko aria-label="Domovská stránka" onClick={() => jdi(DOMOVSKA)}>
          <House className="h-4 w-4" />
        </IkonoveTlacitko>
        <form
          className="flex min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            jdi(adresniRadek);
          }}
        >
          <div className="flex h-8 w-full items-center gap-2 rounded-full border border-win-linka bg-win-plocha px-3">
            <Lock className="h-3.5 w-3.5 shrink-0 text-win-slaby" />
            <input
              value={adresniRadek}
              onChange={(e) => nastavAdresniRadek(e.target.value)}
              aria-label="Adresa"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
            <Search className="h-3.5 w-3.5 shrink-0 text-win-slaby" />
          </div>
        </form>
        {stranka?.kestazeni && (
          <button
            type="button"
            onClick={stahni}
            className="flex h-8 shrink-0 items-center gap-2 rounded bg-win-akcent px-3 text-[12px] text-win-akcent-text hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Stáhnout soubor
          </button>
        )}
      </div>

      {/* Stránka */}
      <div className="relative min-h-0 flex-1 bg-white">
        <iframe
          key={`${karta.id}-${adresa}`}
          title={obsah.titulek}
          srcDoc={obsah.html}
          // Prázdný sandbox = žádné skripty a cizí původ. Vlastní HTML se
          // vykreslí, ale nemůže sáhnout na nic mimo svůj rám.
          sandbox=""
          className="h-full w-full border-0"
        />
        {stazeno && (
          <div className="win-vyjezd absolute right-3 top-3 w-72 rounded-lg border border-win-linka bg-win-povrch p-3 shadow-[var(--win-stin-nabidka)]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[13px] font-semibold">Stahování dokončeno</span>
              <button type="button" aria-label="Zavřít" onClick={() => nastavStazeno(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[12px]">{stazeno}</p>
            <p className="mt-1 text-[11px] text-win-slaby">
              Uloženo do C:\Users\Zak\Downloads (Stažené soubory)
            </p>
          </div>
        )}
      </div>

      {/* Rychlé odkazy – ať žák nemusí adresy opisovat z tabule */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-t border-win-linka px-3 text-[11px] text-win-slaby">
        <span>Dostupné stránky:</span>
        {STRANKY.map((s) => (
          <button
            key={s.adresa}
            type="button"
            onClick={() => jdi(s.adresa)}
            className="rounded px-1.5 py-0.5 hover:bg-win-zvyrazneny hover:text-win-akcent"
          >
            {s.adresa}
          </button>
        ))}
      </div>
    </div>
  );
}
