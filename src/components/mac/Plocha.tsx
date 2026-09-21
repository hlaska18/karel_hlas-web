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
 */

import { useState } from "react";
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

export function Plocha() {
  const { stav, poslat, spust } = useMac();
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

  const polozky = (slozka?.deti ?? []).filter(
    (d) => stav.nastaveni.skrytePolozky || !jeSkryte(d.jmeno),
  );

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
      return [
        { text: "Nová složka", akce: zalozSlozku, oddelovac: true },
        {
          text: "Zobrazit informace o Ploše",
          akce: () => nastavInformace({ jmeno: null }),
        },
        { text: "Změnit pozadí plochy…", akce: () => spust("nastaveni") },
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

  return (
    <>
      {/* Vrstva přes celou plochu jen kvůli pravému tlačítku. Okna i Dock
          leží nad ní, takže jim nic nebere. */}
      <div
        className="absolute inset-0"
        onContextMenu={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: null });
        }}
      />

      <div className="mac-bezvyberu absolute right-4 top-4 flex flex-col flex-wrap-reverse content-end gap-1">
        {polozky.map((u) => {
          const slozkaNeBalicek = jeSlozka(u) && !jeBalicek(u.jmeno);
          return (
            <button
              key={u.jmeno}
              type="button"
              onDoubleClick={() => {
                const cesta = slozMac([...PLOCHA, u.jmeno]);
                if (slozkaNeBalicek) spust("finder", cesta);
                else spust("poznamky", cesta);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: u.jmeno });
              }}
              className="flex w-[92px] flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-white/10 focus-visible:bg-white/20"
            >
              {/* Tytéž ikony jako ve Finderu. Mléčný čtvereček pod nimi je
                pryč – na Macu leží ikona rovnou na tapetě. */}
              <VelkaIkona uzel={u} />
              {/* Stín pod textem, ne podklad: obdélník za každým názvem vypadá
                jako rozbité. Barvu a stín drží `.mac-popisek-plochy`
                v globals.css – na světlé tapetě je písmo tmavé, na tmavé
                bílé, a rozhoduje o tom tapeta, ne motiv. */}
              <span className="mac-popisek-plochy w-full break-words text-[11px] leading-tight">
                {u.jmeno}
              </span>
            </button>
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
            ? "Balíček aplikace (je to složka)"
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
