"use client";

/**
 * Terminál.
 *
 * Schválně unixové příkazy, ne windowsové. Žák, který zná `dir` a `cd C:\`,
 * tu narazí na `ls` a na cestu bez písmene disku – a to je přesně ten rozdíl,
 * kvůli kterému Terminál v simulaci je. Není to kurz shellu; je to jedno
 * místo, kde je vidět, že strom souborů má jediný kořen `/`.
 *
 * Příkazů je málo a je to záměr. Každý z nich má v úlohách svůj důvod:
 *   pwd   kde jsem, zapsané unixově
 *   ls    výpis; s `-a` i položky s tečkou (skrytý = jméno, ne příznak)
 *   cd    chození včetně `~` a `..`
 *   cat   obsah souboru
 *   open  otevře složku ve Finderu – spojka mezi terminálem a oknem
 *   mkdir založí složku – i s tečkou na začátku, kterou Finder odmítne
 */

import { useEffect, useRef, useState } from "react";
import { useMac, useOknoMac } from "../system";
import { DOMOV, KOREN, rozlozMac, slozMac, sVlnovkou, jeSkryte } from "@/lib/mac/cesty";
import { jeSlozka, najdi, najdiSlozku, novaSlozka, vloz } from "@/lib/win/fs";

interface Radek {
  vstup?: string;
  vystup: string;
  /**
   * Ve které složce se příkaz spustil.
   *
   * Musí se pamatovat, ne dopočítat z aktuální cesty. Jinak se po `cd`
   * přepíše cesta i u všech starších řádků a historie začne lhát: u `pwd`
   * by svítila jiná složka, než jakou `pwd` vypsalo. V nástroji, kde je
   * cesta celá pointa, je to ta nejhorší možná chyba.
   */
  kde?: string[];
}

const UVOD = `Poslední přihlášení: dnes

Tohle je výukový terminál. Umí: pwd, ls, cd, cat, open, mkdir, clear, help
Cesty se píšou lomítkem a začínají u kořene /, ne u písmene disku.
`;

export function Terminal() {
  const { stav, poslat, spust, stopa } = useMac();
  const { nastavTitul } = useOknoMac();

  const [cesta, nastavCestu] = useState<string[]>(DOMOV);
  const [radky, nastavRadky] = useState<Radek[]>([{ vystup: UVOD }]);
  const [vstup, nastavVstup] = useState("");
  const konec = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nastavTitul(`zak — ${sVlnovkou(cesta)}`);
  }, [cesta, nastavTitul]);

  /**
   * Odrolovat na konec a držet kurzor v řádku.
   *
   * BLOKOVÉ TĚLO, NE ZKRÁCENÁ ŠIPKA. Šipka s výrazem vrací hodnotu a React ji
   * bere jako úklidovou funkci – když to není funkce, shodí při dalším běhu
   * efektu celé prostředí. Naletěl jsem na to tady: terminál spadl na prvním
   * Enteru, ať byl příkaz jakýkoli.
   */
  useEffect(() => {
    konec.current?.scrollIntoView({ block: "end" });
    pole.current?.focus();
  }, [radky]);

  /* Kurzor v řádku hned po otevření okna. Terminál, do kterého se musí napřed
     kliknout, vypadá rozbitě – žák píše a nic se neděje. */
  useEffect(() => {
    const id = window.setTimeout(() => pole.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  /** Vyřeší zadanou cestu proti aktuální složce. Zvládne `~`, `..` i `.`. */
  const vyres = (zadano: string): string[] => {
    const text = zadano.trim();
    let zaklad: string[];
    let zbytek: string;
    if (text === "~" || text.startsWith("~/")) {
      zaklad = DOMOV;
      zbytek = text.slice(1);
    } else if (text.startsWith("/")) {
      zaklad = [KOREN];
      zbytek = text;
    } else {
      zaklad = cesta;
      zbytek = text;
    }
    let vysledek = [...zaklad];
    for (const cast of zbytek.split("/")) {
      if (!cast || cast === ".") continue;
      if (cast === "..") {
        if (vysledek.length > 1) vysledek = vysledek.slice(0, -1);
      } else {
        vysledek = [...vysledek, cast];
      }
    }
    return vysledek;
  };

  const spustPrikaz = (radek: string) => {
    const [prikaz, ...argy] = radek.trim().split(/\s+/);
    const prepinace = argy.filter((a) => a.startsWith("-"));
    const cile = argy.filter((a) => !a.startsWith("-"));
    const pridej = (vystup: string) =>
      nastavRadky((r) => [...r, { vstup: radek, vystup, kde: cesta }]);

    switch (prikaz) {
      case "":
        nastavRadky((r) => [...r, { vstup: radek, vystup: "", kde: cesta }]);
        return;

      case "help":
        pridej(
          "pwd            vypíše, ve které složce jsi\n" +
            "ls [-a]        vypíše obsah; -a ukáže i položky s tečkou\n" +
            "cd <cesta>     přejde do složky (funguje ~ i ..)\n" +
            "cat <soubor>   vypíše obsah souboru\n" +
            "open <cesta>   otevře složku ve Finderu\n" +
            "mkdir <název>  založí složku\n" +
            "clear          smaže okno",
        );
        return;

      case "pwd":
        stopa("terminal:pwd");
        pridej(slozMac(cesta));
        return;

      case "ls": {
        const kam = cile[0] ? vyres(cile[0]) : cesta;
        const slozka = najdiSlozku(stav.disk, kam);
        if (!slozka) {
          pridej(`ls: ${cile[0] ?? slozMac(kam)}: Adresář neexistuje`);
          return;
        }
        const vse = prepinace.some((p) => p.includes("a"))
          ? slozka.deti
          : slozka.deti.filter((d) => !jeSkryte(d.jmeno));
        if (prepinace.some((p) => p.includes("a"))) stopa("terminal:ls-a");
        pridej(
          [...vse]
            .sort((a, b) => a.jmeno.localeCompare(b.jmeno, "cs"))
            .map((d) => (jeSlozka(d) ? `${d.jmeno}/` : d.jmeno))
            .join("\n"),
        );
        return;
      }

      case "cd": {
        const kam = cile[0] ? vyres(cile[0]) : DOMOV;
        const slozka = najdiSlozku(stav.disk, kam);
        if (!slozka) {
          pridej(`cd: ${cile[0]}: Adresář neexistuje`);
          return;
        }
        nastavCestu(kam);
        // `kde` je cesta PŘED `cd` – řádek má ukazovat, odkud se odešlo.
        nastavRadky((r) => [...r, { vstup: radek, vystup: "", kde: cesta }]);
        return;
      }

      case "cat": {
        if (!cile[0]) {
          pridej("cat: chybí název souboru");
          return;
        }
        const uzel = najdi(stav.disk, vyres(cile[0]));
        if (!uzel) pridej(`cat: ${cile[0]}: Soubor neexistuje`);
        else if (jeSlozka(uzel)) pridej(`cat: ${cile[0]}: Je to adresář`);
        else pridej(uzel.obsah || "(soubor bez textového obsahu)");
        return;
      }

      case "open": {
        const kam = cile[0] ? vyres(cile[0]) : cesta;
        if (!najdiSlozku(stav.disk, kam)) {
          pridej(`open: ${cile[0]}: Adresář neexistuje`);
          return;
        }
        spust("finder", slozMac(kam));
        stopa("terminal:open");
        nastavRadky((r) => [...r, { vstup: radek, vystup: "", kde: cesta }]);
        return;
      }

      case "mkdir": {
        if (!cile[0]) {
          pridej("usage: mkdir <název složky>");
          return;
        }
        const cil = vyres(cile[0]);
        const rodic = najdiSlozku(stav.disk, cil.slice(0, -1));
        const jmeno = cil[cil.length - 1];
        if (!rodic) {
          pridej(`mkdir: ${cile[0]}: Adresář neexistuje`);
          return;
        }
        if (rodic.zamceno) {
          pridej(`mkdir: ${cile[0]}: Přístup odepřen`);
          return;
        }
        if (rodic.deti.some((d) => d.jmeno === jmeno)) {
          pridej(`mkdir: ${cile[0]}: Soubor už existuje`);
          return;
        }
        poslat({ typ: "disk/nastav", disk: vloz(stav.disk, cil.slice(0, -1), novaSlozka(jmeno)) });
        // Doklad pro úlohu o tom, že tečka na začátku položku schová.
        if (jeSkryte(jmeno)) stopa("zalozil-teckovou");
        nastavRadky((r) => [...r, { vstup: radek, vystup: "", kde: cesta }]);
        return;
      }

      case "clear":
        nastavRadky([]);
        return;

      // Windowsové příkazy nejsou chyba žáka – jsou to jeho dosavadní znalosti.
      // První řádek je to, co napíše skutečné zsh; druhý je nápověda simulace
      // a je tak i označený, aby se nepletl se skutečným výstupem.
      case "dir":
        pridej("zsh: command not found: dir\n(Nápověda simulace: na Macu se obsah složky vypíše příkazem ls.)");
        return;
      case "cls":
        pridej("zsh: command not found: cls\n(Nápověda simulace: okno smaže příkaz clear.)");
        return;
      case "type":
        // `type` v zsh existuje, jen dělá něco jiného: řekne, co je dané
        // jméno za příkaz. U jména souboru proto odpoví „not found“.
        pridej(
          (cile[0] ? `${cile[0]} not found\n` : "") +
            "(Nápověda simulace: v zsh type obsah souboru nevypíše – na to je cat.)",
        );
        return;

      default:
        pridej(`zsh: command not found: ${prikaz}`);
    }
  };

  return (
    <div
      className="mac-posuv h-full overflow-y-auto bg-[#1c1c1e] p-3 font-mono text-[13px] leading-relaxed text-[#e6e6e6]"
      onClick={() => pole.current?.focus()}
    >
      {radky.map((r, i) => (
        <div key={i}>
          {r.vstup !== undefined && (
            <div>
              <Vyzva cesta={r.kde ?? cesta} />
              {r.vstup}
            </div>
          )}
          {r.vystup && <pre className="whitespace-pre-wrap font-mono">{r.vystup}</pre>}
        </div>
      ))}
      <div className="flex">
        <Vyzva cesta={cesta} />
        <input
          ref={pole}
          value={vstup}
          onChange={(e) => nastavVstup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            spustPrikaz(vstup);
            nastavVstup("");
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Příkazová řádka"
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#e6e6e6] outline-none focus-visible:outline-none"
        />
      </div>
      <div ref={konec} />
    </div>
  );
}

function Vyzva({ cesta }: { cesta: string[] }) {
  return (
    <span className="mr-1 shrink-0 select-none">
      <span className="text-[#7dff9b]">zak@mac</span>
      <span className="text-[#9aa0a6]"> {sVlnovkou(cesta)} % </span>
    </span>
  );
}
