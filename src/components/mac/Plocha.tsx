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

import { useMac } from "./system";
import { VelkaIkona } from "./ikony";
import { PLOCHA, jeBalicek, jeSkryte, slozMac } from "@/lib/mac/cesty";
import { jeSlozka, najdiSlozku } from "@/lib/win/fs";

export function Plocha() {
  const { stav, spust } = useMac();
  const slozka = najdiSlozku(stav.disk, PLOCHA);

  const polozky = (slozka?.deti ?? []).filter(
    (d) => stav.nastaveni.skrytePolozky || !jeSkryte(d.jmeno),
  );

  return (
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
            className="flex w-[92px] flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-white/10 focus-visible:bg-white/20"
          >
            {/* Tytéž ikony jako ve Finderu. Mléčný čtvereček pod nimi je
                pryč – na Macu leží ikona rovnou na tapetě. */}
            <VelkaIkona uzel={u} />
            {/* Stín pod textem, ne podklad: na světlé tapetě by byl bílý text
                nečitelný, a obdélník za každým názvem vypadá jako rozbité. */}
            <span
              className="w-full break-words text-[11px] leading-tight text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
            >
              {u.jmeno}
            </span>
          </button>
        );
      })}
    </div>
  );
}
