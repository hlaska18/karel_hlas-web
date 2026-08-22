"use client";

/**
 * Kalkulačka – standardní a programátorský režim.
 *
 * Programátorský režim je tu hlavně kvůli číselným soustavám: žák vidí totéž
 * číslo naráz v desítkové, šestnáctkové, osmičkové i dvojkové soustavě a může
 * v něm přepínat jednotlivé bity. To je věc, kterou z výkladu na tabuli
 * pochopí polovina třídy, a z klikání skoro všichni.
 */

import { useEffect, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useOkno, useSystem } from "../system";

type Rezim = "standardni" | "programatorska";
type Soustava = "HEX" | "DEC" | "OCT" | "BIN";

const ZAKLADY: Record<Soustava, number> = { HEX: 16, DEC: 10, OCT: 8, BIN: 2 };

export function Kalkulacka() {
  const { stopa } = useSystem();
  const { nastavTitul } = useOkno();
  const [rezim, nastavRezim] = useState<Rezim>("standardni");
  const [nabidka, nastavNabidku] = useState(false);
  const [displej, nastavDisplej] = useState("0");
  const [ulozene, nastavUlozene] = useState<number | null>(null);
  const [operace, nastavOperaci] = useState<string | null>(null);
  const [novyVstup, nastavNovyVstup] = useState(true);
  const [historie, nastavHistorii] = useState("");
  const [soustava, nastavSoustavu] = useState<Soustava>("DEC");

  useEffect(() => {
    nastavTitul(rezim === "standardni" ? "Kalkulačka" : "Kalkulačka – Programátorská");
    if (rezim === "programatorska") stopa("kalkulacka:programatorsky");
  }, [rezim, nastavTitul, stopa]);

  /** Hodnota na displeji jako číslo – v programátorském režimu podle soustavy. */
  const hodnota = () =>
    rezim === "programatorska" ? parseInt(displej, ZAKLADY[soustava]) || 0 : Number(displej) || 0;

  const zobraz = (n: number) =>
    rezim === "programatorska"
      ? Math.trunc(n).toString(ZAKLADY[soustava]).toUpperCase()
      : formatuj(n);

  const pisCislici = (znak: string) => {
    if (rezim === "programatorska" && parseInt(znak, 16) >= ZAKLADY[soustava]) return;
    if (novyVstup) {
      nastavDisplej(znak === "," ? "0," : znak);
      nastavNovyVstup(false);
      return;
    }
    if (znak === "," && displej.includes(",")) return;
    nastavDisplej((d) => (d === "0" && znak !== "," ? znak : d + znak));
  };

  const spoctiOperaci = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      case "Mod":
        return b === 0 ? NaN : a % b;
      case "Lsh":
        return a << b;
      case "Rsh":
        return a >> b;
      case "AND":
        return a & b;
      case "OR":
        return a | b;
      case "XOR":
        return a ^ b;
      default:
        return b;
    }
  };

  const zadejOperaci = (op: string) => {
    const cislo = hodnota();
    if (ulozene !== null && operace && !novyVstup) {
      const vysledek = spoctiOperaci(ulozene, cislo, operace);
      nastavUlozene(vysledek);
      nastavDisplej(zobraz(vysledek));
    } else {
      nastavUlozene(cislo);
    }
    nastavOperaci(op);
    nastavNovyVstup(true);
    nastavHistorii(`${zobraz(ulozene ?? cislo)} ${op}`);
  };

  const rovnaSe = () => {
    if (ulozene === null || !operace) return;
    const vysledek = spoctiOperaci(ulozene, hodnota(), operace);
    nastavHistorii(`${zobraz(ulozene)} ${operace} ${displej} =`);
    nastavDisplej(Number.isFinite(vysledek) ? zobraz(vysledek) : "Nelze dělit nulou");
    nastavUlozene(null);
    nastavOperaci(null);
    nastavNovyVstup(true);
  };

  const vymaz = (vse: boolean) => {
    nastavDisplej("0");
    nastavNovyVstup(true);
    if (vse) {
      nastavUlozene(null);
      nastavOperaci(null);
      nastavHistorii("");
    }
  };

  const jednoducha = (co: "±" | "√" | "x²" | "1/x" | "%") => {
    const n = hodnota();
    const vysledek =
      co === "±" ? -n : co === "√" ? Math.sqrt(n) : co === "x²" ? n * n : co === "1/x" ? 1 / n : n / 100;
    nastavDisplej(Number.isFinite(vysledek) ? zobraz(vysledek) : "Nelze dělit nulou");
    nastavNovyVstup(true);
  };

  /* ───────── klávesnice ───────── */

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => {
      const cil = e.target as HTMLElement;
      if (cil.tagName === "INPUT" || cil.tagName === "TEXTAREA") return;
      if (/^[0-9]$/.test(e.key)) pisCislici(e.key);
      else if (e.key === "," || e.key === ".") pisCislici(",");
      else if (e.key === "+") zadejOperaci("+");
      else if (e.key === "-") zadejOperaci("−");
      else if (e.key === "*") zadejOperaci("×");
      else if (e.key === "/") {
        e.preventDefault();
        zadejOperaci("÷");
      } else if (e.key === "Enter" || e.key === "=") rovnaSe();
      else if (e.key === "Escape") vymaz(true);
      else if (e.key === "Backspace") {
        nastavDisplej((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      }
    };
    window.addEventListener("keydown", naKlavesu);
    return () => window.removeEventListener("keydown", naKlavesu);
  });

  const cislo = hodnota();

  return (
    <div className="win-bezvyberu flex h-full flex-col bg-win-plocha">
      {/* Přepínač režimu */}
      <div className="relative flex h-11 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          aria-label="Režim kalkulačky"
          onClick={() => nastavNabidku((n) => !n)}
          className="flex h-8 items-center gap-2 rounded px-2 text-[14px] font-semibold hover:bg-win-zvyrazneny"
        >
          <Menu className="h-4 w-4" />
          {rezim === "standardni" ? "Standardní" : "Programátorská"}
          <ChevronDown className="h-3 w-3" />
        </button>
        {nabidka && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => nastavNabidku(false)} />
            <div className="win-vyjezd absolute left-3 top-10 z-[200] w-52 rounded-lg border border-win-linka bg-win-povrch p-1 shadow-[var(--win-stin-nabidka)]">
              {(
                [
                  ["standardni", "Standardní"],
                  ["programatorska", "Programátorská"],
                ] as [Rezim, string][]
              ).map(([id, popis]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    nastavRezim(id);
                    nastavNabidku(false);
                    vymaz(true);
                  }}
                  className={`flex h-9 w-full items-center rounded px-3 text-left text-[13px] hover:bg-win-zvyrazneny ${
                    rezim === id ? "bg-win-akcent/20" : ""
                  }`}
                >
                  {popis}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Displej */}
      <div className="shrink-0 px-4 pb-2 text-right">
        <div className="h-5 truncate text-[12px] text-win-slaby">{historie}</div>
        <div className="truncate text-[38px] font-semibold leading-tight">{displej}</div>
      </div>

      {rezim === "programatorska" && (
        <div className="shrink-0 px-4 pb-2">
          {(Object.keys(ZAKLADY) as Soustava[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                // Přepnutí soustavy nemění hodnotu, jen její zápis.
                nastavDisplej(Math.trunc(cislo).toString(ZAKLADY[s]).toUpperCase());
                nastavSoustavu(s);
                nastavNovyVstup(true);
              }}
              className={`flex w-full items-center gap-3 rounded px-2 py-1 text-left text-[12px] ${
                soustava === s ? "bg-win-akcent/20" : "hover:bg-win-zvyrazneny"
              }`}
            >
              <span className="w-10 font-semibold text-win-slaby">{s}</span>
              <span className="truncate font-mono">
                {s === "BIN"
                  ? poBajtech(Math.trunc(cislo) >>> 0)
                  : Math.trunc(cislo).toString(ZAKLADY[s]).toUpperCase()}
              </span>
            </button>
          ))}
          <BitovaMapa
            hodnota={Math.trunc(cislo)}
            onZmena={(n) => {
              nastavDisplej(n.toString(ZAKLADY[soustava]).toUpperCase());
              nastavNovyVstup(true);
            }}
          />
        </div>
      )}

      {/* Klávesnice */}
      <div className="min-h-0 flex-1 p-1.5">
        {rezim === "standardni" ? (
          <Mrizka sloupcu={4}>
            <Klavesa onClick={() => jednoducha("%")}>%</Klavesa>
            <Klavesa onClick={() => vymaz(false)}>CE</Klavesa>
            <Klavesa onClick={() => vymaz(true)}>C</Klavesa>
            <Klavesa onClick={() => nastavDisplej((d) => (d.length > 1 ? d.slice(0, -1) : "0"))}>⌫</Klavesa>
            <Klavesa onClick={() => jednoducha("1/x")}>1/x</Klavesa>
            <Klavesa onClick={() => jednoducha("x²")}>x²</Klavesa>
            <Klavesa onClick={() => jednoducha("√")}>√x</Klavesa>
            <Klavesa onClick={() => zadejOperaci("÷")}>÷</Klavesa>
            {["7", "8", "9"].map((c) => (
              <Klavesa key={c} cislice onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("×")}>×</Klavesa>
            {["4", "5", "6"].map((c) => (
              <Klavesa key={c} cislice onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("−")}>−</Klavesa>
            {["1", "2", "3"].map((c) => (
              <Klavesa key={c} cislice onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("+")}>+</Klavesa>
            <Klavesa onClick={() => jednoducha("±")}>±</Klavesa>
            <Klavesa cislice onClick={() => pisCislici("0")}>
              0
            </Klavesa>
            <Klavesa cislice onClick={() => pisCislici(",")}>
              ,
            </Klavesa>
            <Klavesa akcent onClick={rovnaSe}>
              =
            </Klavesa>
          </Mrizka>
        ) : (
          /* Rozložení jako v předloze: A–F ve sloupci vlevo, čísla uprostřed,
             operace vpravo. Nedostupné číslice se v nižší soustavě zašednou. */
          <Mrizka sloupcu={5}>
            <Klavesa nedostupne={ZAKLADY[soustava] <= 10} onClick={() => pisCislici("A")}>A</Klavesa>
            <Klavesa onClick={() => zadejOperaci("Lsh")}>Lsh</Klavesa>
            <Klavesa onClick={() => zadejOperaci("Rsh")}>Rsh</Klavesa>
            <Klavesa onClick={() => vymaz(true)}>C</Klavesa>
            <Klavesa onClick={() => nastavDisplej((d) => (d.length > 1 ? d.slice(0, -1) : "0"))}>⌫</Klavesa>

            <Klavesa nedostupne={ZAKLADY[soustava] <= 11} onClick={() => pisCislici("B")}>B</Klavesa>
            <Klavesa onClick={() => zadejOperaci("AND")}>AND</Klavesa>
            <Klavesa onClick={() => zadejOperaci("OR")}>OR</Klavesa>
            <Klavesa onClick={() => zadejOperaci("XOR")}>XOR</Klavesa>
            <Klavesa onClick={() => zadejOperaci("÷")}>÷</Klavesa>

            <Klavesa nedostupne={ZAKLADY[soustava] <= 12} onClick={() => pisCislici("C")}>C</Klavesa>
            {["7", "8", "9"].map((c) => (
              <Klavesa key={c} cislice nedostupne={ZAKLADY[soustava] <= Number(c)} onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("×")}>×</Klavesa>

            <Klavesa nedostupne={ZAKLADY[soustava] <= 13} onClick={() => pisCislici("D")}>D</Klavesa>
            {["4", "5", "6"].map((c) => (
              <Klavesa key={c} cislice nedostupne={ZAKLADY[soustava] <= Number(c)} onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("−")}>−</Klavesa>

            <Klavesa nedostupne={ZAKLADY[soustava] <= 14} onClick={() => pisCislici("E")}>E</Klavesa>
            {["1", "2", "3"].map((c) => (
              <Klavesa key={c} cislice nedostupne={ZAKLADY[soustava] <= Number(c)} onClick={() => pisCislici(c)}>
                {c}
              </Klavesa>
            ))}
            <Klavesa onClick={() => zadejOperaci("+")}>+</Klavesa>

            <Klavesa nedostupne={ZAKLADY[soustava] <= 15} onClick={() => pisCislici("F")}>F</Klavesa>
            <Klavesa onClick={() => jednoducha("±")}>±</Klavesa>
            <Klavesa cislice onClick={() => pisCislici("0")}>0</Klavesa>
            <Klavesa onClick={() => zadejOperaci("Mod")}>Mod</Klavesa>
            <Klavesa akcent onClick={rovnaSe}>=</Klavesa>
          </Mrizka>
        )}
      </div>
    </div>
  );
}

/** Zápis s mezerami po tisících a desetinnou čárkou, jako česká Kalkulačka. */
function formatuj(n: number): string {
  if (!Number.isFinite(n)) return "Nelze dělit nulou";
  const zaokrouhlene = Math.abs(n) < 1e16 ? Number(n.toPrecision(16)) : n;
  return zaokrouhlene.toLocaleString("cs-CZ", { maximumFractionDigits: 12 });
}

/** Dvojkový zápis po bajtech: `0000 1010`. */
function poBajtech(n: number): string {
  const bity = n.toString(2).padStart(8, "0");
  return bity.replace(/(.{4})(?=.)/g, "$1 ");
}

function Mrizka({ children, sloupcu }: { children: React.ReactNode; sloupcu: number }) {
  return (
    <div
      className="grid h-full gap-1"
      style={{ gridTemplateColumns: `repeat(${sloupcu}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

function Klavesa({
  children,
  onClick,
  cislice,
  akcent,
  nedostupne,
}: {
  children: React.ReactNode;
  onClick: () => void;
  cislice?: boolean;
  akcent?: boolean;
  nedostupne?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={nedostupne}
      onClick={onClick}
      className={`rounded-[4px] text-[15px] transition-colors disabled:opacity-30 ${
        akcent
          ? "bg-win-akcent text-win-akcent-text hover:opacity-90"
          : cislice
            ? "bg-win-povrch font-semibold hover:bg-win-zvyrazneny"
            : "bg-win-plocha hover:bg-win-zvyrazneny"
      } border border-win-linka/60`}
    >
      {children}
    </button>
  );
}

/** Osm bitů dolního bajtu ke klikání. Nejnázornější věc v celé kalkulačce. */
function BitovaMapa({ hodnota, onZmena }: { hodnota: number; onZmena: (n: number) => void }) {
  const bity = Array.from({ length: 8 }, (_, i) => 7 - i);
  return (
    <div className="mt-2 flex items-center justify-end gap-1">
      {bity.map((bit) => {
        const zapnuty = ((hodnota >> bit) & 1) === 1;
        return (
          <button
            key={bit}
            type="button"
            aria-label={`Bit ${bit}`}
            title={`Bit ${bit} (hodnota ${2 ** bit})`}
            onClick={() => onZmena(hodnota ^ (1 << bit))}
            className={`h-6 w-6 rounded border text-[11px] ${
              zapnuty
                ? "border-win-akcent bg-win-akcent text-win-akcent-text"
                : "border-win-linka text-win-slaby hover:bg-win-zvyrazneny"
            }`}
          >
            {zapnuty ? 1 : 0}
          </button>
        );
      })}
    </div>
  );
}
