"use client";

/**
 * Plocha.
 *
 * Na Macu není plocha zvláštní místo – je to obyčejná složka `~/Desktop`,
 * jejíž obsah systém kreslí na pozadí. Proto se tu nic neukládá zvlášť: čte
 * se týž strom, který ukazuje Finder, a co žák do složky Plocha přidá, se
 * objeví i tady. Je to malý, ale hmatatelný důkaz, že „plocha“ je složka.
 *
 * Ikony jdou od PRAVÉHO horního rohu dolů, ne od levého – tak to macOS dělá
 * a je to jeden z rozdílů, který si žáci všimnou dřív než čehokoli jiného.
 *
 * Ikony jdou přetáhnout kamkoli po ploše a zůstanou tam (`pozicePlochy`),
 * do složky na ploše, do okna Finderu i na koš v Docku. „Uklidit" z místní
 * nabídky je vrátí do mřížky.
 */

import { useEffect, useRef, useState } from "react";
import { useMac } from "./system";
import { VelkaIkona } from "./ikony";
import { NabidkaMistni, PanelInformace, type PolozkaNabidky } from "./ui";
import {
  PLOCHA,
  jeBalicek,
  jeSkryte,
  sVlnovkou,
  slozMac,
} from "@/lib/mac/cesty";
import {
  jeSlozka,
  najdiSlozku,
  novaSlozka,
  vloz,
  volneJmeno,
} from "@/lib/win/fs";
import { polozekSlovy } from "@/lib/mac/text";
import type { PoziceIkony } from "@/lib/mac/stav";
import {
  coUdelaTazeni,
  pustTazene,
  skonciTazeni,
  stopaTazeni,
  tazenaPolozka,
  zacniTazeni,
} from "@/lib/mac/tazeni";

/** Místo pro jednu ikonu v mřížce. Ikona sama je 92 px široká. */
const BUNKA_S = 96;
const BUNKA_V = 104;
/** Odstup mřížky od kraje plochy – tolik, kolik měla dřív (`right-4 top-4`). */
const OKRAJ = 16;

type Misto = { left: number; top: number };

/**
 * Kde každá ikona stojí.
 *
 * Přetažené mají své místo, oříznuté tak, aby nevyjely z obrazovky ani
 * nezalezly pod Dock. Ostatní se skládají do mřížky od pravého horního rohu
 * dolů a pak doleva, jako na Macu, a přeskočí pole, na kterém už něco stojí.
 */
function rozmisti(
  jmena: string[],
  pozice: Record<string, PoziceIkony>,
  w: number,
  h: number,
  dole: number,
): Map<string, Misto> {
  const mista = new Map<string, Misto>();
  const maxLeft = Math.max(0, w - BUNKA_S);
  const maxTop = Math.max(0, h - dole - BUNKA_V);
  const obsazeno: Misto[] = [];
  for (const j of jmena) {
    const p = pozice[j];
    if (!p) continue;
    const m = {
      left: Math.min(maxLeft, p.x * w),
      top: Math.min(maxTop, p.y * h),
    };
    mista.set(j, m);
    obsazeno.push(m);
  }
  const radku = Math.max(1, Math.floor((h - dole - OKRAJ) / BUNKA_V));
  let pole = 0;
  for (const j of jmena) {
    if (mista.has(j)) continue;
    for (;;) {
      const m = {
        left: w - OKRAJ - (Math.floor(pole / radku) + 1) * BUNKA_S,
        top: OKRAJ + (pole % radku) * BUNKA_V,
      };
      pole++;
      const volno = !obsazeno.some(
        (o) =>
          Math.abs(o.left - m.left) < BUNKA_S * 0.6 &&
          Math.abs(o.top - m.top) < BUNKA_V * 0.6,
      );
      // Když dojde místo, ikona se vejde aspoň na kraj – ztratit ji je horší
      // než ji položit přes jinou.
      if (volno || m.left < 0) {
        const misto = { left: Math.max(0, m.left), top: m.top };
        mista.set(j, misto);
        obsazeno.push(misto);
        break;
      }
    }
  }
  return mista;
}

export function Plocha() {
  const { stav, poslat, spust, stopa } = useMac();
  const slozka = najdiSlozku(stav.disk, PLOCHA);
  /** Kam se kliklo pravým a čeho se to týkalo (`null` = prázdná plocha). */
  const [nabidka, nastavNabidku] = useState<{
    x: number;
    y: number;
    jmeno: string | null;
  } | null>(null);
  /**
   * Co se ukazuje v informacích. `null` je zavřeno, `{ jmeno: null }` je
   * Plocha sama – proto obálka, jinak by „zavřeno" a „Plocha" splynulo.
   */
  const [informace, nastavInformace] = useState<{
    jmeno: string | null;
  } | null>(null);

  const plocha = useRef<HTMLDivElement>(null);
  const [rozmer, nastavRozmer] = useState<{ w: number; h: number } | null>(
    null,
  );
  /** Označená ikona – jako na Macu, šedý podklad a modrá pilulka pod jménem. */
  const [vybrana, nastavVybranou] = useState<string | null>(null);
  /** Co se z plochy právě táhne (zešedne, dokud se nepustí). */
  const [tazena, nastavTazenou] = useState<string | null>(null);
  /** Nad kterou složkou na ploše se táhne – ta se zvýrazní jako cíl. */
  const [nadSlozkou, nastavNadSlozkou] = useState<string | null>(null);
  /** Kde se ikona chytila. Po puštění pak stojí tam, kam ji žák položil,
      ne levým horním rohem pod kurzorem. */
  const uchop = useRef({ x: BUNKA_S / 2, y: 36 });

  useEffect(() => {
    const zmer = () => {
      const el = plocha.current;
      if (el) nastavRozmer({ w: el.clientWidth, h: el.clientHeight });
    };
    zmer();
    window.addEventListener("resize", zmer);
    // Puštění kdekoli ukončí tažení i tehdy, když ikona, ze které začalo,
    // mezitím z plochy zmizela (přesunula se do okna) a `dragend` už
    // nedostane. Zachytává se, aby to neutnul cíl, který zastaví probublání.
    const konec = () => {
      nastavTazenou(null);
      nastavNadSlozkou(null);
    };
    window.addEventListener("drop", konec, true);
    window.addEventListener("dragend", konec, true);
    return () => {
      window.removeEventListener("resize", zmer);
      window.removeEventListener("drop", konec, true);
      window.removeEventListener("dragend", konec, true);
    };
  }, []);

  const polozky = (slozka?.deti ?? []).filter(
    (d) => stav.nastaveni.skrytePolozky || !jeSkryte(d.jmeno),
  );
  const mista = rozmer
    ? rozmisti(
        polozky.map((u) => u.jmeno),
        stav.pozicePlochy,
        rozmer.w,
        rozmer.h,
        stav.nastaveni.dockVelikost + 30,
      )
    : null;

  /**
   * Nová složka rovnou na ploše. Je to malý, ale přesvědčivý důkaz toho,
   * co říká komentář nahoře: plocha JE složka. Co tu vznikne, je hned
   * vidět i ve Finderu v `~/Desktop`.
   */
  const zalozSlozku = () => {
    if (!slozka) return;
    poslat({
      typ: "disk/nastav",
      disk: vloz(
        stav.disk,
        PLOCHA,
        novaSlozka(volneJmeno(slozka, "nová složka")),
      ),
    });
  };

  const polozkyNabidky = (jmeno: string | null): PolozkaNabidky[] => {
    if (!jmeno) {
      const nekdeJinde = polozky.some((u) => stav.pozicePlochy[u.jmeno]);
      return [
        { text: "Nová složka", akce: zalozSlozku, oddelovac: true },
        {
          text: "Zobrazit informace o Ploše",
          akce: () => nastavInformace({ jmeno: null }),
        },
        {
          text: "Změnit pozadí plochy…",
          akce: () => spust("nastaveni"),
          oddelovac: true,
        },
        // Vrátí ikony do mřížky. Šedé, dokud žádnou nepřetáhl.
        {
          text: "Uklidit",
          akce: nekdeJinde ? () => poslat({ typ: "plocha/uklid" }) : undefined,
        },
      ];
    }
    const uzel = slozka?.deti.find((d) => d.jmeno === jmeno);
    return [
      {
        text: "Otevřít",
        akce: () => {
          if (!uzel) return;
          const cesta = slozMac([...PLOCHA, uzel.jmeno]);
          if (jeSlozka(uzel) && !jeBalicek(uzel.jmeno)) spust("finder", cesta);
          else spust("poznamky", cesta);
        },
        oddelovac: true,
      },
      { text: "Zobrazit informace", akce: () => nastavInformace({ jmeno }) },
    ];
  };

  /*
   * Tažení. Po ploše se ikona jen POSUNE – soubor zůstává ve složce Plocha,
   * mění se jen místo, kde se kreslí. Z okna Finderu se na plochu přesouvá
   * (nebo z FLASH kopíruje) podle týchž pravidel jako mezi okny, viz
   * `lib/mac/tazeni.ts`. A složka na ploše je cíl: co se na ni pustí,
   * skončí uvnitř.
   */
  const zPlochy = (c: string[]) => slozMac(c.slice(0, -1)) === slozMac(PLOCHA);

  const nadPlochou = (e: React.DragEvent) => {
    const zdroj = tazenaPolozka();
    if (!zdroj) return;
    const akce = zPlochy(zdroj)
      ? "presun"
      : coUdelaTazeni(stav.disk, zdroj, PLOCHA);
    if (!akce) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = akce === "kopie" ? "copy" : "move";
  };

  const pustNaPlochu = (e: React.DragEvent) => {
    const zdroj = tazenaPolozka();
    const el = plocha.current;
    if (!zdroj || !el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const odsud = zPlochy(zdroj);
    // Z okna ikona přiletí bez „úchopu", tak se postaví středem pod kurzor.
    const chyt = odsud ? uchop.current : { x: BUNKA_S / 2, y: 36 };
    let jmeno = zdroj[zdroj.length - 1];
    if (!odsud) {
      const vysledek = pustTazene(stav.disk, zdroj, PLOCHA);
      if (!vysledek) return;
      poslat({ typ: "disk/nastav", disk: vysledek.disk });
      stopa(stopaTazeni(PLOCHA, vysledek.akce));
      jmeno = vysledek.jmeno;
    }
    poslat({
      typ: "plocha/umisti",
      jmeno,
      x: (e.clientX - r.left - chyt.x) / r.width,
      y: (e.clientY - r.top - chyt.y) / r.height,
    });
    nastavVybranou(jmeno);
    skonciTazeni();
  };

  /** Složka na ploše jako cíl. Co nebere, probublá na plochu a jen se posune. */
  const cilSlozky = (jmeno: string) => {
    const cil = [...PLOCHA, jmeno];
    return {
      onDragOver: (e: React.DragEvent) => {
        const zdroj = tazenaPolozka();
        const akce = zdroj ? coUdelaTazeni(stav.disk, zdroj, cil) : null;
        if (!akce) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = akce === "kopie" ? "copy" : "move";
        if (nadSlozkou !== jmeno) nastavNadSlozkou(jmeno);
      },
      onDragLeave: () => {
        if (nadSlozkou === jmeno) nastavNadSlozkou(null);
      },
      onDrop: (e: React.DragEvent) => {
        const zdroj = tazenaPolozka();
        const vysledek = zdroj ? pustTazene(stav.disk, zdroj, cil) : null;
        if (!vysledek) return;
        e.preventDefault();
        e.stopPropagation();
        poslat({ typ: "disk/nastav", disk: vysledek.disk });
        stopa(stopaTazeni(cil, vysledek.akce));
        nastavNadSlozkou(null);
        skonciTazeni();
      },
    };
  };

  return (
    <>
      {/* Celá plocha: pravé tlačítko, klik do prázdna (zruší označení)
          a cíl tažení. Okna i Dock leží nad ní, takže jim nic nebere. */}
      <div
        ref={plocha}
        className="mac-bezvyberu absolute inset-0"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) nastavVybranou(null);
        }}
        onContextMenu={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: null });
        }}
        onDragOver={nadPlochou}
        onDrop={pustNaPlochu}
      >
        {mista &&
          polozky.map((u) => {
            const slozkaNeBalicek = jeSlozka(u) && !jeBalicek(u.jmeno);
            const misto = mista.get(u.jmeno)!;
            const oznacena = vybrana === u.jmeno;
            return (
              // `div`, ne `button`: Firefox tlačítko táhnout nedovolí. Stejně
              // to má Finder.
              <div
                key={u.jmeno}
                role="button"
                tabIndex={0}
                aria-label={u.jmeno}
                draggable
                onDragStart={(e) => {
                  // Safari bez `setData` tažení vůbec nezačne.
                  e.dataTransfer.setData("text/plain", u.jmeno);
                  e.dataTransfer.effectAllowed = "copyMove";
                  const r = e.currentTarget.getBoundingClientRect();
                  uchop.current = {
                    x: e.clientX - r.left,
                    y: e.clientY - r.top,
                  };
                  zacniTazeni([...PLOCHA, u.jmeno]);
                  nastavTazenou(u.jmeno);
                  nastavVybranou(u.jmeno);
                }}
                onDragEnd={() => {
                  skonciTazeni();
                  nastavTazenou(null);
                }}
                {...(slozkaNeBalicek ? cilSlozky(u.jmeno) : {})}
                onMouseDown={() => nastavVybranou(u.jmeno)}
                onDoubleClick={() => {
                  const cesta = slozMac([...PLOCHA, u.jmeno]);
                  if (slozkaNeBalicek) spust("finder", cesta);
                  else spust("poznamky", cesta);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  nastavVybranou(u.jmeno);
                  nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: u.jmeno });
                }}
                style={{ left: misto.left, top: misto.top }}
                className={`absolute flex w-[92px] cursor-default flex-col items-center gap-1 rounded-lg p-1.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-mac-akcent ${
                  nadSlozkou === u.jmeno
                    ? "bg-mac-akcent/25 ring-2 ring-mac-akcent"
                    : ""
                } ${tazena === u.jmeno ? "opacity-50" : ""}`}
              >
                {/* Tytéž ikony jako ve Finderu. Mléčný čtvereček pod nimi je
                    pryč – na Macu leží ikona rovnou na tapetě. Šedý podklad
                    má jen označená, jako na Macu. */}
                <span
                  className={`rounded-md p-0.5 ${oznacena ? "bg-black/20" : ""}`}
                >
                  <VelkaIkona uzel={u} />
                </span>
                {/* Stín pod textem, ne podklad: obdélník za každým názvem vypadá
                    jako rozbité. Barvu a stín drží `.mac-popisek-plochy`
                    v globals.css – na světlé tapetě je písmo tmavé, na tmavé
                    bílé, a rozhoduje o tom tapeta, ne motiv. Označená ikona
                    má místo toho modrou pilulku. */}
                <span
                  className={`max-w-full break-words text-[11px] leading-tight ${
                    oznacena
                      ? "rounded px-1 bg-mac-akcent text-mac-akcent-text"
                      : "mac-popisek-plochy w-full"
                  }`}
                >
                  {u.jmeno}
                </span>
              </div>
            );
          })}
      </div>

      {nabidka && (
        <NabidkaMistni
          x={nabidka.x}
          y={nabidka.y}
          polozky={polozkyNabidky(nabidka.jmeno)}
          zavri={() => nastavNabidku(null)}
        />
      )}

      {informace && (
        <Informace
          jmeno={informace.jmeno}
          pocet={polozky.length}
          zavri={() => nastavInformace(null)}
        />
      )}
    </>
  );
}

/**
 * Informace o ploše nebo o položce na ní.
 *
 * U Plochy je to celá pointa: ukáže se cesta `~/Desktop` a druh „Složka".
 * Plocha není zvláštní místo v systému, je to obyčejná složka v domovském
 * adresáři – a tohle okénko je na to nejkratší důkaz.
 */
function Informace({
  jmeno,
  pocet,
  zavri,
}: {
  jmeno: string | null;
  /** Kolik je na ploše VIDĚT. Skryté položky se nepočítají, jinak by
      informace tvrdily něco jiného než Finder i než plocha sama. */
  pocet: number;
  zavri: () => void;
}) {
  const { stav } = useMac();
  const slozka = najdiSlozku(stav.disk, PLOCHA);
  const uzel = jmeno ? slozka?.deti.find((d) => d.jmeno === jmeno) : null;

  if (!jmeno) {
    return (
      <PanelInformace
        nadpis="Plocha"
        radky={[
          { popisek: "Druh", hodnota: "Složka" },
          { popisek: "Kde je", hodnota: sVlnovkou(PLOCHA) },
          { popisek: "Obsahuje", hodnota: polozekSlovy(pocet) },
          {
            popisek: "Poznámka",
            hodnota:
              "Plocha není zvláštní místo v systému – je to obyčejná složka.",
          },
        ]}
        zavri={zavri}
      />
    );
  }

  return (
    <PanelInformace
      nadpis={jmeno}
      radky={[
        {
          popisek: "Druh",
          hodnota: jeBalicek(jmeno)
            ? "Aplikace"
            : uzel && jeSlozka(uzel)
              ? "Složka"
              : "Dokument",
        },
        { popisek: "Kde je", hodnota: sVlnovkou([...PLOCHA, jmeno]) },
      ]}
      zavri={zavri}
    />
  );
}
