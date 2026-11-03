"use client";

/**
 * Plocha.
 *
 * Ikony na ploše nejsou zvláštní seznam – jsou to soubory ve složce
 * `C:\Users\Zak\Desktop`. Co žák udělá na ploše, uvidí v Průzkumníku
 * i v terminálu, a naopak. Právě tohle bývá první „aha": plocha je složka.
 */

import { useMemo, useState } from "react";
import { Ikona, IkonaSouboru } from "./Ikona";
import { KontextovaNabidka, useNabidka } from "./ui";
import { useSystem } from "./system";
import {
  jeSlozka,
  najdiSlozku,
  novaSlozka,
  novySoubor,
  odeber,
  pripona,
  rozloz,
  sloz,
  vloz,
  volneJmeno,
  zaklad,
  type Uzel,
} from "@/lib/win/fs";
import { typSouboru, znamaPripona } from "@/lib/win/typy";
import { KOS, POCITAC, smazDoKose, vloz_ze_schranky } from "@/lib/win/operace";
import { vybranaTapeta } from "@/lib/win/obrazky";

const PLOCHA = ["C:", "Users", "Zak", "Desktop"];

/** Zástupci, kteří nejsou soubory – Koš a Tento počítač. */
const ZASTUPCI = [
  { id: KOS, nazev: "Koš", klic: "kos" as const },
  { id: POCITAC, nazev: "Tento počítač", klic: "tento-pocitac" as const },
];

export function Plocha() {
  const { stav, poslat, spust, stopa } = useSystem();
  const [vyber, nastavVyber] = useState<string[]>([]);
  const [prejmenovava, nastavPrejmenovava] = useState<string | null>(null);
  const [navrh, nastavNavrh] = useState("");
  const nabidka = useNabidka();

  const slozka = najdiSlozku(stav.disk, PLOCHA);
  const polozky = useMemo(
    () =>
      (slozka?.deti ?? [])
        .filter((d) => stav.nastaveni.skrytePolozky || !d.skryty)
        .sort((a, b) => {
          if (jeSlozka(a) !== jeSlozka(b)) return jeSlozka(a) ? -1 : 1;
          return a.jmeno.localeCompare(b.jmeno, "cs");
        }),
    [slozka, stav.nastaveni.skrytePolozky],
  );

  const tapeta = vybranaTapeta(stav.nastaveni.tapeta);

  const otevri = (uzel: Uzel) => {
    const cesta = sloz([...PLOCHA, uzel.jmeno]);
    if (jeSlozka(uzel) || pripona(uzel.jmeno) === "zip") {
      spust("pruzkumnik", cesta);
      return;
    }
    const typ = typSouboru(uzel.jmeno);
    if (!typ.app) {
      stopa(`neotevreno:${pripona(uzel.jmeno)}`);
      // Bez okna Průzkumníku není kam vypsat hlášku – otevře se tedy plocha
      // v Průzkumníku a soubor se otevře znovu odtamtud.
      spust("pruzkumnik", sloz(PLOCHA));
      return;
    }
    spust(typ.app, cesta);
  };

  const nova = (typ: "slozka" | "text") => {
    if (!slozka) return;
    const jmeno =
      typ === "slozka"
        ? volneJmeno(slozka, "Nová složka")
        : volneJmeno(slozka, "Nový textový dokument.txt");
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, PLOCHA, typ === "slozka" ? novaSlozka(jmeno) : novySoubor(jmeno)),
    });
    nastavVyber([jmeno]);
    nastavPrejmenovava(jmeno);
    nastavNavrh(typ === "slozka" ? jmeno : zaklad(jmeno));
  };

  const smaz = () => {
    if (vyber.length === 0) return;
    const vysledek = smazDoKose(
      stav.disk,
      vyber.map((j) => [...PLOCHA, j]),
    );
    poslat({ typ: "disk/nastav", disk: vysledek.disk });
    poslat({ typ: "kos/vloz", polozky: vysledek.polozky });
    nastavVyber([]);
  };

  const dokonciPrejmenovani = () => {
    const stare = prejmenovava;
    nastavPrejmenovava(null);
    if (!stare || !slozka) return;
    const skryta = !stav.nastaveni.pripony && znamaPripona(stare);
    const nove = skryta ? `${navrh}.${pripona(stare)}` : navrh;
    if (!nove.trim() || nove === stare) return;
    if (slozka.deti.some((d) => d.jmeno.toLowerCase() === nove.toLowerCase())) return;
    const uzel = slozka.deti.find((d) => d.jmeno === stare);
    if (!uzel || uzel.zamceno) return;
    poslat({
      typ: "disk/nastav",
      disk: vloz(odeber(stav.disk, [...PLOCHA, stare]), PLOCHA, {
        ...uzel,
        jmeno: nove,
        zmeneno: Date.now(),
      }),
    });
    nastavVyber([nove]);
  };

  const nabidkaPozadi = [
    {
      id: "zobrazit",
      nazev: "Zobrazit",
      podnabidka: [
        {
          id: "pripony",
          nazev: "Přípony názvů souborů",
          zaskrtnuto: stav.nastaveni.pripony,
          akce: () => poslat({ typ: "nastaveni/zmen", zmena: { pripony: !stav.nastaveni.pripony } }),
        },
        {
          id: "skryte",
          nazev: "Skryté položky",
          zaskrtnuto: stav.nastaveni.skrytePolozky,
          akce: () =>
            poslat({
              typ: "nastaveni/zmen",
              zmena: { skrytePolozky: !stav.nastaveni.skrytePolozky },
            }),
        },
      ],
    },
    {
      id: "novy",
      nazev: "Nový",
      podnabidka: [
        { id: "slozka", nazev: "Složka", akce: () => nova("slozka") },
        { id: "text", nazev: "Textový dokument", akce: () => nova("text") },
      ],
    },
    {
      id: "vloz",
      nazev: "Vložit",
      nedostupne: !stav.schranka,
      akce: () => {
        if (!stav.schranka) return;
        const vysledek = vloz_ze_schranky(stav.disk, stav.schranka, PLOCHA);
        poslat({ typ: "disk/nastav", disk: vysledek.disk });
        poslat({ typ: "schranka/nastav", schranka: vysledek.schranka });
      },
    },
    { id: "c1", cara: true },
    { id: "terminal", nazev: "Otevřít v Terminálu", akce: () => spust("terminal", sloz(PLOCHA)) },
    {
      id: "prizpusobit",
      nazev: "Přizpůsobit",
      akce: () => spust("nastaveni", "prizpusobeni"),
    },
  ];

  const nabidkaPolozky = (uzel: Uzel) => [
    { id: "otevri", nazev: "Otevřít", akce: () => otevri(uzel) },
    { id: "c1", cara: true },
    {
      id: "kopiruj",
      nazev: "Kopírovat",
      zkratka: "Ctrl+C",
      akce: () =>
        poslat({
          typ: "schranka/nastav",
          schranka: { uzly: [uzel], zdroj: PLOCHA, vyjmout: false },
        }),
    },
    {
      id: "vyjmi",
      nazev: "Vyjmout",
      zkratka: "Ctrl+X",
      akce: () =>
        poslat({
          typ: "schranka/nastav",
          schranka: { uzly: [uzel], zdroj: PLOCHA, vyjmout: true },
        }),
    },
    {
      id: "prejmenuj",
      nazev: "Přejmenovat",
      zkratka: "F2",
      nedostupne: !!uzel.zamceno,
      akce: () => {
        nastavPrejmenovava(uzel.jmeno);
        nastavNavrh(
          !stav.nastaveni.pripony && znamaPripona(uzel.jmeno) ? zaklad(uzel.jmeno) : uzel.jmeno,
        );
      },
    },
    { id: "smaz", nazev: "Odstranit", zkratka: "Del", nedostupne: !!uzel.zamceno, akce: smaz },
    { id: "c2", cara: true },
    {
      id: "vlastnosti",
      nazev: "Vlastnosti",
      akce: () => spust("pruzkumnik", sloz(PLOCHA)),
    },
  ];

  return (
    <div
      className="win-bezvyberu absolute inset-0 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url("${tapeta.url}")` }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) nastavVyber([]);
      }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-ikona]")) return;
        nastavVyber([]);
        nabidka.otevri(e, nabidkaPozadi, e.currentTarget);
      }}
    >
      <div
        className="grid h-full w-full content-start justify-start gap-1 p-2"
        style={{ gridAutoFlow: "column", gridTemplateRows: "repeat(auto-fill, 96px)" }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) nastavVyber([]);
        }}
      >
        {ZASTUPCI.map((z) => (
          <IkonaPlochy
            key={z.id}
            nazev={z.nazev}
            vybrana={vyber.includes(z.id)}
            svetlaTapeta={tapeta.svetla}
            onKlik={(e) => vyberIkonu(e, z.id, vyber, nastavVyber)}
            onOtevri={() => spust("pruzkumnik", z.id)}
            onNabidka={(e) => {
              nastavVyber([z.id]);
              nabidka.otevri(
                e,
                [
                  { id: "otevri", nazev: "Otevřít", akce: () => spust("pruzkumnik", z.id) },
                  ...(z.id === KOS
                    ? [
                        {
                          id: "vysyp",
                          nazev: "Vysypat koš",
                          nedostupne: stav.kos.length === 0,
                          akce: () => poslat({ typ: "kos/vyprazdni" }),
                        },
                      ]
                    : []),
                ],
                e.currentTarget.closest("div"),
              );
            }}
          >
            <Ikona
              klic={z.id === KOS && stav.kos.length > 0 ? "kos-plny" : z.klic}
              velikost={44}
            />
          </IkonaPlochy>
        ))}

        {polozky.map((uzel) => (
          <IkonaPlochy
            key={uzel.jmeno}
            nazev={
              jeSlozka(uzel) || stav.nastaveni.pripony || !znamaPripona(uzel.jmeno)
                ? uzel.jmeno
                : zaklad(uzel.jmeno)
            }
            vybrana={vyber.includes(uzel.jmeno)}
            svetlaTapeta={tapeta.svetla}
            prejmenovava={prejmenovava === uzel.jmeno}
            navrh={navrh}
            onNavrh={nastavNavrh}
            onDokonci={dokonciPrejmenovani}
            onKlik={(e) => vyberIkonu(e, uzel.jmeno, vyber, nastavVyber)}
            onOtevri={() => otevri(uzel)}
            onNabidka={(e) => {
              if (!vyber.includes(uzel.jmeno)) nastavVyber([uzel.jmeno]);
              nabidka.otevri(e, nabidkaPolozky(uzel), e.currentTarget.closest("div"));
            }}
          >
            <IkonaSouboru jmeno={uzel.jmeno} slozka={jeSlozka(uzel)} velikost={44} />
          </IkonaPlochy>
        ))}
      </div>

      {nabidka.misto && <KontextovaNabidka misto={nabidka.misto} zavri={nabidka.zavri} />}
    </div>
  );
}

function vyberIkonu(
  e: React.MouseEvent,
  id: string,
  vyber: string[],
  nastavVyber: (v: string[]) => void,
) {
  if (e.ctrlKey) {
    nastavVyber(vyber.includes(id) ? vyber.filter((x) => x !== id) : [...vyber, id]);
  } else {
    nastavVyber([id]);
  }
}

function IkonaPlochy({
  nazev,
  children,
  vybrana,
  svetlaTapeta,
  prejmenovava,
  navrh,
  onNavrh,
  onDokonci,
  onKlik,
  onOtevri,
  onNabidka,
}: {
  nazev: string;
  children: React.ReactNode;
  vybrana: boolean;
  svetlaTapeta: boolean;
  prejmenovava?: boolean;
  navrh?: string;
  onNavrh?: (h: string) => void;
  onDokonci?: () => void;
  onKlik: (e: React.MouseEvent) => void;
  onOtevri: () => void;
  onNabidka: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      data-ikona
      onClick={onKlik}
      onDoubleClick={onOtevri}
      onContextMenu={onNabidka}
      className={`flex h-24 w-24 flex-col items-center justify-start gap-1 rounded p-2 text-center ${
        vybrana ? "bg-win-akcent/35 ring-1 ring-win-akcent/60" : "hover:bg-white/15"
      }`}
    >
      {children}
      {prejmenovava ? (
        <input
          autoFocus
          value={navrh}
          // Windows má při přejmenování celý název označený, takže psaní ho
          // přepíše. Bez toho se nový název nalepí na starý.
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onNavrh?.(e.target.value)}
          onBlur={onDokonci}
          onKeyDown={(e) => {
            if (e.key === "Enter") onDokonci?.();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Nový název"
          className="w-full rounded-sm border border-win-akcent bg-white px-1 text-[11px] text-black outline-none"
        />
      ) : (
        <span
          className={`line-clamp-2 break-words text-[11px] leading-tight ${
            svetlaTapeta && !vybrana ? "text-black" : "text-white"
          }`}
          style={
            svetlaTapeta && !vybrana
              ? undefined
              : { textShadow: "0 1px 3px rgba(0,0,0,0.85)" }
          }
        >
          {nazev}
        </span>
      )}
    </button>
  );
}
