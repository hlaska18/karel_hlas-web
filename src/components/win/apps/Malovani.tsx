"use client";

/**
 * Malování.
 *
 * Kreslí se do skutečného `<canvas>`, takže uložený obrázek je opravdový PNG
 * – dá se pak otevřít ve Fotkách, zjistit jeho velikost ve Vlastnostech
 * a porovnat ji s velikostí prázdného plátna. Na rastrové grafice se tím dá
 * ukázat úplně všechno podstatné, aniž by se cokoli instalovalo.
 */

import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Droplet,
  Eraser,
  Minus,
  Pencil,
  PaintBucket,
  Save,
  Square,
  Undo2,
} from "lucide-react";
import { IkonoveTlacitko, Tlacitko } from "../ui";
import { DialogSouboru } from "../DialogSouboru";
import { useOkno, useSystem } from "../system";
import { jeSlozka, najdi, nadrazena, rozloz, sloz, vloz } from "@/lib/win/fs";

type Nastroj = "tuzka" | "stetec" | "guma" | "vypln" | "cara" | "obdelnik" | "elipsa";

const BARVY = [
  "#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200",
  "#22b14c", "#00a2e8", "#3f48cc", "#a349a4", "#ffffff", "#c3c3c3",
  "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0", "#b5e61d", "#99d9ea",
  "#7092be", "#c8bfe7",
];

const SIRKA = 900;
const VYSKA = 520;

export function Malovani() {
  const { stav, poslat, stopa } = useSystem();
  const { arg, nastavTitul } = useOkno();
  const platno = useRef<HTMLCanvasElement>(null);
  const [nastroj, nastavNastroj] = useState<Nastroj>("tuzka");
  const [barva, nastavBarvu] = useState("#000000");
  const [tloustka, nastavTloustku] = useState(3);
  const [kresli, nastavKresli] = useState(false);
  const zacatek = useRef<{ x: number; y: number } | null>(null);
  const snimek = useRef<ImageData | null>(null);
  const kroky = useRef<string[]>([]);
  const [cesta, nastavCestu] = useState<string[] | null>(() => (arg ? rozloz(arg) : null));
  const [dialog, nastavDialog] = useState(false);

  const nazev = cesta ? cesta[cesta.length - 1] : "Bez názvu";

  useEffect(() => {
    nastavTitul(`${nazev} – Malování`);
  }, [nazev, nastavTitul]);

  /* Prázdné plátno, případně načtený obrázek. */
  useEffect(() => {
    const kontext = platno.current?.getContext("2d");
    if (!kontext) return;
    kontext.fillStyle = "#ffffff";
    kontext.fillRect(0, 0, SIRKA, VYSKA);
    if (!cesta) return;
    const uzel = najdi(stav.disk, cesta);
    if (!uzel || jeSlozka(uzel) || !uzel.obsah.startsWith("data:")) return;
    const obrazek = new Image();
    obrazek.onload = () => {
      const pomer = Math.min(SIRKA / obrazek.width, VYSKA / obrazek.height, 1);
      kontext.drawImage(obrazek, 0, 0, obrazek.width * pomer, obrazek.height * pomer);
    };
    obrazek.src = uzel.obsah;
    // Načítá se jen při otevření souboru, ne při každé změně disku.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kontext = () => platno.current?.getContext("2d") ?? null;

  const souradnice = (e: React.PointerEvent): { x: number; y: number } => {
    const ram = platno.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - ram.left) / ram.width) * SIRKA,
      y: ((e.clientY - ram.top) / ram.height) * VYSKA,
    };
  };

  const zapisKrok = () => {
    const url = platno.current?.toDataURL();
    if (!url) return;
    kroky.current = [...kroky.current.slice(-14), url];
  };

  const zpet = () => {
    const posledni = kroky.current.pop();
    const k = kontext();
    if (!posledni || !k) return;
    const obrazek = new Image();
    obrazek.onload = () => k.drawImage(obrazek, 0, 0);
    obrazek.src = posledni;
  };

  const start = (e: React.PointerEvent) => {
    const k = kontext();
    if (!k) return;
    zapisKrok();
    const bod = souradnice(e);
    zacatek.current = bod;
    nastavKresli(true);
    platno.current?.setPointerCapture(e.pointerId);

    if (nastroj === "vypln") {
      vyplnPlochu(k, Math.round(bod.x), Math.round(bod.y), barva);
      nastavKresli(false);
      return;
    }
    if (nastroj === "cara" || nastroj === "obdelnik" || nastroj === "elipsa") {
      snimek.current = k.getImageData(0, 0, SIRKA, VYSKA);
      return;
    }
    k.beginPath();
    k.moveTo(bod.x, bod.y);
  };

  const tahni = (e: React.PointerEvent) => {
    const k = kontext();
    if (!kresli || !k || !zacatek.current) return;
    const bod = souradnice(e);
    k.lineCap = "round";
    k.lineJoin = "round";
    k.strokeStyle = nastroj === "guma" ? "#ffffff" : barva;
    k.fillStyle = barva;
    k.lineWidth = nastroj === "guma" ? tloustka * 4 : nastroj === "stetec" ? tloustka * 3 : tloustka;

    if (nastroj === "tuzka" || nastroj === "stetec" || nastroj === "guma") {
      k.lineTo(bod.x, bod.y);
      k.stroke();
      return;
    }
    // Tvary se překreslují z uloženého snímku, aby po tažení nezůstala stopa.
    if (snimek.current) k.putImageData(snimek.current, 0, 0);
    const od = zacatek.current;
    k.beginPath();
    if (nastroj === "cara") {
      k.moveTo(od.x, od.y);
      k.lineTo(bod.x, bod.y);
    } else if (nastroj === "obdelnik") {
      k.rect(od.x, od.y, bod.x - od.x, bod.y - od.y);
    } else {
      k.ellipse(
        (od.x + bod.x) / 2,
        (od.y + bod.y) / 2,
        Math.abs(bod.x - od.x) / 2,
        Math.abs(bod.y - od.y) / 2,
        0,
        0,
        Math.PI * 2,
      );
    }
    k.stroke();
  };

  const konec = (e?: React.PointerEvent) => {
    nastavKresli(false);
    zacatek.current = null;
    snimek.current = null;
    // Zachycení ukazatele se uvolňuje výslovně. Bez toho plátno u některých
    // prohlížečů drží myš i po puštění a další kliknutí padají do něj.
    if (e && platno.current?.hasPointerCapture(e.pointerId)) {
      platno.current.releasePointerCapture(e.pointerId);
    }
  };

  const ulozDo = (kam: string[]) => {
    const url = platno.current?.toDataURL("image/png");
    if (!url) return;
    const rodic = nadrazena(kam);
    const jmeno = kam[kam.length - 1];
    poslat({
      typ: "disk/nastav",
      disk: vloz(stav.disk, rodic, {
        druh: "soubor",
        jmeno,
        obsah: url,
        zmeneno: Date.now(),
      }),
    });
    nastavCestu(kam);
    stopa("malovani:ulozeno");
  };

  const nastroje: { id: Nastroj; popis: string; ikona: React.ReactNode }[] = [
    { id: "tuzka", popis: "Tužka", ikona: <Pencil className="h-4 w-4" /> },
    { id: "stetec", popis: "Štětec", ikona: <Droplet className="h-4 w-4" /> },
    { id: "guma", popis: "Guma", ikona: <Eraser className="h-4 w-4" /> },
    { id: "vypln", popis: "Plechovka", ikona: <PaintBucket className="h-4 w-4" /> },
    { id: "cara", popis: "Čára", ikona: <Minus className="h-4 w-4" /> },
    { id: "obdelnik", popis: "Obdélník", ikona: <Square className="h-4 w-4" /> },
    { id: "elipsa", popis: "Elipsa", ikona: <Circle className="h-4 w-4" /> },
  ];

  return (
    <div className="win-bezvyberu flex h-full flex-col bg-win-plocha">
      {/* Pás karet */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-win-linka px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {nastroje.map((n) => (
            <IkonoveTlacitko
              key={n.id}
              aria-label={n.popis}
              title={n.popis}
              aktivni={nastroj === n.id}
              onClick={() => nastavNastroj(n.id)}
            >
              {n.ikona}
            </IkonoveTlacitko>
          ))}
        </div>

        <div className="h-6 w-px bg-win-linka" />

        <label className="flex items-center gap-2 text-[12px]">
          Tloušťka
          <input
            type="range"
            min={1}
            max={20}
            value={tloustka}
            onChange={(e) => nastavTloustku(Number(e.target.value))}
            className="win-posuvnik w-24"
            style={{ ["--podil" as string]: `${((tloustka - 1) / 19) * 100}%` }}
            aria-label="Tloušťka stopy"
          />
          <span className="w-6 text-win-slaby">{tloustka}</span>
        </label>

        <div className="h-6 w-px bg-win-linka" />

        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 shrink-0 rounded border border-win-linka"
            style={{ backgroundColor: barva }}
            aria-label={`Vybraná barva ${barva}`}
          />
          <div className="grid grid-cols-10 gap-0.5">
            {BARVY.map((b) => (
              <button
                key={b}
                type="button"
                aria-label={`Barva ${b}`}
                onClick={() => nastavBarvu(b)}
                className={`h-4 w-4 rounded-sm border ${
                  barva === b ? "border-win-akcent ring-1 ring-win-akcent" : "border-win-linka"
                }`}
                style={{ backgroundColor: b }}
              />
            ))}
          </div>
          <input
            type="color"
            value={barva}
            onChange={(e) => nastavBarvu(e.target.value)}
            aria-label="Vlastní barva"
            className="h-7 w-7 cursor-pointer rounded border border-win-linka bg-transparent"
          />
        </div>

        <div className="h-6 w-px bg-win-linka" />

        <IkonoveTlacitko aria-label="Zpět" title="Zpět (Ctrl+Z)" onClick={zpet}>
          <Undo2 className="h-4 w-4" />
        </IkonoveTlacitko>
        <Tlacitko onClick={() => nastavDialog(true)}>
          <Save className="h-4 w-4" /> Uložit jako
        </Tlacitko>
        {cesta && (
          <Tlacitko vzhled="akcent" onClick={() => ulozDo(cesta)}>
            Uložit
          </Tlacitko>
        )}
      </div>

      {/* Plátno */}
      <div className="win-posuv flex min-h-0 flex-1 items-start justify-center overflow-auto bg-win-zvyrazneny p-4">
        <canvas
          ref={platno}
          width={SIRKA}
          height={VYSKA}
          onPointerDown={start}
          onPointerMove={tahni}
          onPointerUp={konec}
          onPointerLeave={konec}
          onPointerCancel={konec}
          className="max-w-full cursor-crosshair border border-win-linka bg-white shadow"
          style={{ touchAction: "none" }}
        />
      </div>

      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-win-linka px-3 text-[11px] text-win-slaby">
        <span>
          {SIRKA} × {VYSKA} bodů
        </span>
        <span>Rastrový obrázek – zvětšením se rozostří.</span>
      </div>

      {dialog && (
        <DialogSouboru
          rezim="ulozit"
          vychoziNazev={cesta ? nazev : "Obrázek.png"}
          vychoziSlozka={cesta ? sloz(nadrazena(cesta)) : "C:\\Users\\Zak\\Pictures"}
          filtr={["png"]}
          popisFiltru="Obrázek PNG (*.png)"
          onZavrit={() => nastavDialog(false)}
          onPotvrdit={(kam) => {
            ulozDo(kam);
            nastavDialog(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Semínková výplň (plechovka). Pracuje po řádcích a nad kopií dat – přímé
 * volání `putImageData` po každém bodu by na větší ploše zamrzlo.
 */
function vyplnPlochu(
  kontext: CanvasRenderingContext2D,
  x: number,
  y: number,
  barva: string,
) {
  const data = kontext.getImageData(0, 0, SIRKA, VYSKA);
  const pixely = data.data;
  const index = (bx: number, by: number) => (by * SIRKA + bx) * 4;
  const puvodni = pixely.slice(index(x, y), index(x, y) + 4);

  const cil = document.createElement("canvas").getContext("2d")!;
  cil.fillStyle = barva;
  cil.fillRect(0, 0, 1, 1);
  const nova = cil.getImageData(0, 0, 1, 1).data;
  if (puvodni.every((h, i) => h === nova[i])) return;

  const fronta: [number, number][] = [[x, y]];
  const sedi = (bx: number, by: number) => {
    const i = index(bx, by);
    return (
      Math.abs(pixely[i] - puvodni[0]) < 12 &&
      Math.abs(pixely[i + 1] - puvodni[1]) < 12 &&
      Math.abs(pixely[i + 2] - puvodni[2]) < 12 &&
      Math.abs(pixely[i + 3] - puvodni[3]) < 12
    );
  };

  while (fronta.length) {
    const [bx, by] = fronta.pop()!;
    if (bx < 0 || by < 0 || bx >= SIRKA || by >= VYSKA || !sedi(bx, by)) continue;
    let levo = bx;
    while (levo > 0 && sedi(levo - 1, by)) levo -= 1;
    let pravo = bx;
    while (pravo < SIRKA - 1 && sedi(pravo + 1, by)) pravo += 1;
    for (let i = levo; i <= pravo; i += 1) {
      const p = index(i, by);
      pixely[p] = nova[0];
      pixely[p + 1] = nova[1];
      pixely[p + 2] = nova[2];
      pixely[p + 3] = nova[3];
      if (by > 0 && sedi(i, by - 1)) fronta.push([i, by - 1]);
      if (by < VYSKA - 1 && sedi(i, by + 1)) fronta.push([i, by + 1]);
    }
  }
  kontext.putImageData(data, 0, 0);
}
