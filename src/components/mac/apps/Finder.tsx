"use client";

/**
 * Finder.
 *
 * Proti windowsovému Průzkumníkovi tu jsou čtyři věci jinak, a všechny čtyři
 * jsou záměr, ne zjednodušení:
 *
 *   1. CESTA NEMÁ PÍSMENO DISKU. Všechno visí pod jediným `/` a připojený
 *      flash disk se objeví ve `/Volumes`. Proto je dole pruh s cestou –
 *      žák má vidět, kde zrovna je, zapsané tak, jak se to na Macu píše.
 *   2. SKRYTÉ JE JMÉNO, ne příznak. Cokoli s tečkou na začátku Finder neukáže.
 *      Přepínač proto říká „položky s tečkou", ne „skryté položky" – ať je
 *      poznat, že je to něco jiného než ve Windows.
 *   3. `.app` NENÍ SOUBOR, je to složka. Finder ji ukazuje jako jednu položku
 *      a dovnitř pustí jen přes „Zobrazit obsah balíčku" v pravém tlačítku.
 *   4. INFORMACE MÍSTO VLASTNOSTÍ. Ukazují druh položky a plnou cestu –
 *      u balíčku doslova napíšou, že je to balíček.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Folder, FileText, HardDrive, Package, Usb } from "lucide-react";
import { useMac, useOknoMac } from "../system";
import { NabidkaMistni, PanelInformace, type PolozkaNabidky } from "../ui";
import {
  DOKUMENTY,
  DOMOV,
  KOREN,
  OBRAZKY,
  PLOCHA,
  STAZENE,
  SVAZKY,
  KOS,
  jeBalicek,
  jeSkryte,
  rozlozMac,
  slozMac,
  sVlnovkou,
} from "@/lib/mac/cesty";
import {
  jeSlozka,
  kopie,
  najdi,
  najdiSlozku,
  novaSlozka as vytvorSlozku,
  odeber,
  pocetPolozek,
  prejmenuj,
  velikost,
  vloz,
  volneJmeno,
  type Uzel,
} from "@/lib/win/fs";
import { datumCas, velikostPodrobne, velikostSloupec, velikostText } from "@/lib/win/format";

const MISTA = [
  { jmeno: "Plocha", cesta: PLOCHA },
  { jmeno: "Dokumenty", cesta: DOKUMENTY },
  { jmeno: "Stažené", cesta: STAZENE },
  { jmeno: "Obrázky", cesta: OBRAZKY },
  { jmeno: "zak", cesta: DOMOV },
];

/**
 * České skloňování ve stavovém řádku: 1 položka, 2–4 položky, 5+ položek.
 * Bez toho tam stálo „1 položek“, což je přesně ten druh drobnosti, podle
 * které je poznat, že prostředí nikdo nedodělal.
 */
function polozekSlovy(n: number): string {
  if (n === 1) return "1 položka";
  if (n >= 2 && n <= 4) return `${n} položky`;
  return `${n} položek`;
}

/** Je to složka, kterou Finder ukazuje jako složku? Balíček se počítá jinak. */
const jeProstaSlozka = (u: Uzel) => jeSlozka(u) && !jeBalicek(u.jmeno);

export function Finder() {
  const { stav, poslat, stopa } = useMac();
  const { arg, nastavTitul } = useOknoMac();

  /** Historie chození tam a zpět. Index ukazuje, kde v ní právě stojíme. */
  const [historie, nastavHistorii] = useState<string[][]>([arg ? rozlozMac(arg) : PLOCHA]);
  const [kde, nastavKde] = useState(0);
  const [vybrano, nastavVybrano] = useState<string | null>(null);
  const [nabidka, nastavNabidku] = useState<{ x: number; y: number; jmeno: string | null } | null>(
    null,
  );
  const [informace, nastavInformace] = useState<string | null>(null);
  const [prejmenovavany, nastavPrejmenovavany] = useState<string | null>(null);
  const [novyNazev, nastavNovyNazev] = useState("");
  const polePrejmenovani = useRef<HTMLInputElement>(null);

  const cesta = historie[kde];
  const slozka = najdiSlozku(stav.disk, cesta);
  /** Volné místo. Kapacita disku je 245 GB, obsazené se počítá ze stromu. */
  const volneMisto = useMemo(() => {
    const obsazeno = velikost(stav.disk) + 41_000_000_000;
    // `velikostText`, ne `velikostSloupec`: ten druhý je windowsácký sloupec
    // Velikost a hlásí VŽDYCKY kilobajty, takže dole svítilo
    // „199 198 416 kB k dispozici“ místo „190,0 GB“.
    return velikostText(245_000_000_000 - obsazeno);
  }, [stav.disk]);
  const jmenoMista = cesta[cesta.length - 1] || "Macintosh HD";

  useEffect(() => {
    nastavTitul(jmenoMista);
  }, [jmenoMista, nastavTitul]);

  /**
   * Nabídka „Jít“ poslala okno jinam. Porovnává se s aktuální cestou, aby to
   * nezacyklilo: `jdi` sáhne do historie, ta překreslí Finder a efekt by se
   * spustil znovu.
   */
  useEffect(() => {
    if (!arg) return;
    const kam = rozlozMac(arg);
    if (slozMac(kam) === slozMac(historie[kde])) return;
    nastavHistorii((h) => [...h.slice(0, kde + 1), kam]);
    nastavKde((k) => k + 1);
    nastavVybrano(null);
    // `historie` a `kde` schválně mimo závislosti: efekt reaguje na příkaz
    // z nabídky, ne na vlastní chození uvnitř okna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arg]);

  /* Doklad, že žák našel připojený disk tam, kde na Macu je – bez písmene. */
  useEffect(() => {
    if (slozMac(cesta) === "/Volumes/FLASH") stopa("nasel-flash");
  }, [cesta, stopa]);

  useEffect(() => {
    if (prejmenovavany) window.setTimeout(() => polePrejmenovani.current?.select(), 30);
  }, [prejmenovavany]);

  const jdi = useCallback(
    (nova: string[]) => {
      nastavHistorii((h) => [...h.slice(0, kde + 1), nova]);
      nastavKde((k) => k + 1);
      nastavVybrano(null);
      nastavPrejmenovavany(null);
    },
    [kde],
  );

  const polozky = useMemo(() => {
    if (!slozka) return [];
    const vse = stav.nastaveni.skrytePolozky
      ? slozka.deti
      : slozka.deti.filter((d) => !jeSkryte(d.jmeno));
    // Složky napřed, pak podle abecedy – Finder to tak dělá ve výchozím stavu.
    return [...vse].sort((a, b) => {
      const as = jeProstaSlozka(a);
      const bs = jeProstaSlozka(b);
      if (as !== bs) return as ? -1 : 1;
      return a.jmeno.localeCompare(b.jmeno, "cs");
    });
  }, [slozka, stav.nastaveni.skrytePolozky]);

  const otevri = (u: Uzel) => {
    // Balíček se chová jako jeden kus. Dovnitř se jde až přes pravé tlačítko –
    // dokud to žák neudělá, nemá poznat, že je to složka.
    if (jeProstaSlozka(u)) jdi([...cesta, u.jmeno]);
  };

  /* ───────── akce z pravého tlačítka ───────── */

  const zalozSlozku = () => {
    if (!slozka) return;
    const jmeno = volneJmeno(slozka, "nová složka");
    poslat({ typ: "disk/nastav", disk: vloz(stav.disk, cesta, vytvorSlozku(jmeno)) });
    nastavVybrano(jmeno);
    nastavNovyNazev(jmeno);
    nastavPrejmenovavany(jmeno);
  };

  const dokonciPrejmenovani = () => {
    if (!prejmenovavany) return;
    const cil = novyNazev.trim();
    if (cil && cil !== prejmenovavany) {
      const novy = prejmenuj(stav.disk, [...cesta, prejmenovavany], cil);
      if (novy) {
        poslat({ typ: "disk/nastav", disk: novy });
        nastavVybrano(cil);
        // Doklad pro úlohu o tom, že tečka na začátku položku schová.
        if (jeSkryte(cil)) stopa("zalozil-teckovou");
      }
    }
    nastavPrejmenovavany(null);
  };

  /**
   * „Přesunout do koše" je na Macu doslova PŘESUN, ne smazání – soubor skončí
   * ve skryté složce `~/.Trash` a je pořád na disku. Dokud ho žák nevysype,
   * dá se vrátit. Přesně tenhle rozdíl proti „Odstranit" ve Windows má
   * prostředí ukázat, takže se tu nic nemaže.
   */
  const doKose = (jmeno: string) => {
    const uzel = najdi(stav.disk, [...cesta, jmeno]);
    if (!uzel || uzel.zamceno) return;
    const vKosi = najdiSlozku(stav.disk, KOS);
    const noveJmeno = vKosi ? volneJmeno(vKosi, jmeno) : jmeno;
    let disk = odeber(stav.disk, [...cesta, jmeno]);
    disk = vloz(disk, KOS, { ...kopie(uzel), jmeno: noveJmeno });
    poslat({ typ: "disk/nastav", disk });
    stopa("presunul-do-kose");
    nastavVybrano(null);
  };

  /** Vysypat koš. Teprve tohle soubory doopravdy smaže. */
  const vysypKos = () => {
    const vKosi = najdiSlozku(stav.disk, KOS);
    if (!vKosi || vKosi.deti.length === 0) return;
    let disk = stav.disk;
    for (const d of vKosi.deti) disk = odeber(disk, [...KOS, d.jmeno]);
    poslat({ typ: "disk/nastav", disk });
    stopa("vysypal-kos");
  };

  const vKosi = slozMac(cesta) === slozMac(KOS);

  const polozkyNabidky = (jmeno: string | null): PolozkaNabidky[] => {
    if (!jmeno) {
      return vKosi
        ? [{ text: "Vysypat koš", akce: polozky.length ? vysypKos : undefined }]
        : [{ text: "Nová složka", akce: zalozSlozku }];
    }
    const uzel = slozka?.deti.find((d) => d.jmeno === jmeno);
    if (!uzel) return [{ text: "Nová složka", akce: zalozSlozku }];

    const seznam: PolozkaNabidky[] = [];
    if (jeProstaSlozka(uzel)) {
      seznam.push({ text: "Otevřít", akce: () => otevri(uzel) });
    }
    if (jeBalicek(uzel.jmeno)) {
      // Tohle je celý úkol o balíčcích. Jediná cesta dovnitř `.app`.
      seznam.push({
        text: "Zobrazit obsah balíčku",
        akce: () => {
          stopa("balicek:otevrel");
          jdi([...cesta, uzel.jmeno]);
        },
      });
    }
    seznam.push({
      text: "Informace",
      akce: () => {
        // Stopa se zapisuje, i když na ní zatím žádná úloha nevisí. Kroky
        // úlohy o položkách s tečkou do Informací posílají, takže až bude
        // jasné, co přesně se z nich má vyčíst, je doklad po ruce – a žákům,
        // kteří prostředí projdou dřív, se zpětně nepočítá nic.
        stopa("otevrel-informace");
        nastavInformace(uzel.jmeno);
      },
      oddelovac: true,
    });
    seznam.push({
      text: "Přejmenovat",
      akce: uzel.zamceno
        ? undefined
        : () => {
            nastavNovyNazev(uzel.jmeno);
            nastavPrejmenovavany(uzel.jmeno);
          },
    });
    seznam.push({
      text: "Přesunout do koše",
      akce: uzel.zamceno ? undefined : () => doKose(uzel.jmeno),
      oddelovac: true,
    });
    seznam.push({ text: "Nová složka", akce: zalozSlozku });
    return seznam;
  };

  const uzelInformace = informace ? slozka?.deti.find((d) => d.jmeno === informace) : null;

  return (
    <div className="mac-bezvyberu flex h-full bg-mac-povrch text-[13px] text-mac-text">
      <aside className="mac-posuv w-[180px] shrink-0 overflow-y-auto border-r border-mac-linka bg-mac-postranni px-2 py-3">
        <Skupina nazev="Oblíbené" />
        {MISTA.map((m) => (
          <PolozkaBoku
            key={m.jmeno}
            jmeno={m.jmeno}
            znak={<Folder className="h-4 w-4 text-mac-akcent" />}
            aktivni={slozMac(cesta) === slozMac(m.cesta)}
            onClick={() => jdi(m.cesta)}
          />
        ))}
        <Skupina nazev="Umístění" />
        <PolozkaBoku
          jmeno="Macintosh HD"
          znak={<HardDrive className="h-4 w-4 text-mac-slaby" />}
          aktivni={cesta.length === 1}
          onClick={() => jdi([KOREN])}
        />
        <PolozkaBoku
          jmeno="FLASH"
          znak={<Usb className="h-4 w-4 text-mac-slaby" />}
          aktivni={slozMac(cesta) === "/Volumes/FLASH"}
          onClick={() => jdi([...SVAZKY, "FLASH"])}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[40px] shrink-0 items-center gap-2 border-b border-mac-linka bg-mac-panel px-3">
          <button
            type="button"
            aria-label="Zpět"
            disabled={kde === 0}
            onClick={() => {
              nastavKde((k) => k - 1);
              nastavVybrano(null);
            }}
            className="rounded p-1 hover:bg-mac-zvyrazneny disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Vpřed"
            disabled={kde >= historie.length - 1}
            onClick={() => {
              nastavKde((k) => k + 1);
              nastavVybrano(null);
            }}
            className="rounded p-1 hover:bg-mac-zvyrazneny disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-1 font-semibold">{jmenoMista}</span>

          {/* Zaškrtávátko „Položky s tečkou" tu bývalo kvůli objevitelnosti,
              jenže skutečný Finder ho v pruhu nástrojů nemá – přepíná se
              v nabídce Zobrazení nebo zkratkou. Zůstal jen tichý údaj, že je
              zapnuté, ať žák pozná, proč mu ve výpisu přibyly tečkové soubory. */}
          {stav.nastaveni.skrytePolozky && (
            <span className="ml-auto text-[11px] text-mac-slaby">položky s tečkou</span>
          )}
        </div>

        <div
          className="mac-posuv min-h-0 flex-1 overflow-y-auto"
          onContextMenu={(e) => {
            // Prázdné místo pod seznamem: nabídka jen s „Nová složka".
            if (e.target !== e.currentTarget) return;
            e.preventDefault();
            nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: null });
          }}
        >
          {!slozka ? (
            <p className="p-6 text-mac-slaby">Tahle složka tu není.</p>
          ) : polozky.length === 0 ? (
            <p className="p-6 text-mac-slaby">Složka je prázdná.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-mac-panel text-[11px] uppercase tracking-wide text-mac-slaby">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Název</th>
                  <th className="w-[160px] px-3 py-1.5 text-left font-medium">Datum změny</th>
                  <th className="w-[90px] px-3 py-1.5 text-right font-medium">Velikost</th>
                </tr>
              </thead>
              <tbody>
                {polozky.map((u) => {
                  const vybranaRadka = vybrano === u.jmeno;
                  return (
                    <tr
                      key={u.jmeno}
                      onClick={() => nastavVybrano(u.jmeno)}
                      onDoubleClick={() => otevri(u)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        nastavVybrano(u.jmeno);
                        nastavNabidku({ x: e.clientX, y: e.clientY, jmeno: u.jmeno });
                      }}
                      className={`cursor-default ${
                        vybranaRadka
                          ? "bg-mac-akcent text-mac-akcent-text"
                          : "odd:bg-black/[0.02] hover:bg-mac-zvyrazneny"
                      }`}
                    >
                      <td className="flex items-center gap-2 px-3 py-1.5">
                        <IkonaPolozky uzel={u} barevne={!vybranaRadka} />
                        {prejmenovavany === u.jmeno ? (
                          <input
                            ref={polePrejmenovani}
                            value={novyNazev}
                            onChange={(e) => nastavNovyNazev(e.target.value)}
                            onBlur={dokonciPrejmenovani}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") dokonciPrejmenovani();
                              if (e.key === "Escape") nastavPrejmenovavany(null);
                            }}
                            aria-label="Nový název"
                            spellCheck={false}
                            className="min-w-0 flex-1 rounded border border-mac-akcent bg-mac-povrch px-1 text-[13px] text-mac-text outline-none"
                          />
                        ) : (
                          /* Tečka na začátku se schválně nezvýrazňuje jinak –
                             žák ji má poznat sám podle jména, protože přesně
                             tak to na Macu funguje. */
                          <span className="truncate">{u.jmeno}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums opacity-80">
                        {datumCas(u.zmeneno)}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums opacity-80">
                        {jeProstaSlozka(u) ? "--" : velikostSloupec(velikost(u))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pruh s cestou. Ve Windows je adresní řádek nahoře a píše se do něj;
            tady je dole a jen ukazuje – a hlavně ukazuje unixovou cestu. */}
        <div className="flex h-[24px] shrink-0 items-center gap-2 border-t border-mac-linka bg-mac-panel px-3 text-[11px] text-mac-slaby">
          <span className="tabular-nums">{sVlnovkou(cesta)}</span>
          {/* Skutečný Finder píše dole počet položek a volné místo na disku.
              Kapacita je vymyšlená, ale pevná – kdyby se dopočítávala z obsahu,
              skákala by po každém uloženém souboru a vypadalo by to rozbitě. */}
          <span className="ml-auto">
            {polozekSlovy(polozky.length)}, {volneMisto} k dispozici
          </span>
        </div>
      </div>

      {nabidka && (
        <NabidkaMistni
          x={nabidka.x}
          y={nabidka.y}
          polozky={polozkyNabidky(nabidka.jmeno)}
          zavri={() => nastavNabidku(null)}
        />
      )}

      {uzelInformace && (
        <PanelInformace
          nadpis={uzelInformace.jmeno}
          zavri={() => nastavInformace(null)}
          radky={[
            { popisek: "Druh", hodnota: druh(uzelInformace) },
            {
              popisek: "Velikost",
              hodnota: velikostPodrobne(velikost(uzelInformace)),
            },
            ...(jeSlozka(uzelInformace)
              ? [
                  {
                    popisek: "Obsahuje",
                    hodnota: `${pocetPolozek(uzelInformace).souboru} souborů, ${
                      pocetPolozek(uzelInformace).slozek
                    } složek`,
                  },
                ]
              : []),
            {
              popisek: "Kde",
              // Plná cesta bez písmene disku. Přesně tohle je v Informacích
              // nejcennější a ve windowsových Vlastnostech to vypadá jinak.
              hodnota: (
                <span className="font-mono text-[11px]">{slozMac(cesta)}</span>
              ),
            },
            { popisek: "Změněno", hodnota: datumCas(uzelInformace.zmeneno) },
          ]}
        />
      )}
    </div>
  );
}

/**
 * Jak se položka jmenuje v Informacích.
 *
 * Balíček se říká nahlas. Je to jediné místo v prostředí, kde se žák to slovo
 * dozví, aniž by musel hádat – a bez něj by úloha „dostaň se dovnitř aplikace"
 * neměla za co chytit.
 */
function druh(u: Uzel): string {
  if (jeBalicek(u.jmeno)) return "Balíček aplikace (je to složka)";
  if (jeSlozka(u)) return "Složka";
  if (jeSkryte(u.jmeno)) return "Dokument (jméno začíná tečkou, proto se běžně neukazuje)";
  return "Dokument";
}

function IkonaPolozky({ uzel, barevne }: { uzel: Uzel; barevne: boolean }) {
  if (jeBalicek(uzel.jmeno)) {
    return <Package className={`h-4 w-4 ${barevne ? "text-mac-slaby" : ""}`} />;
  }
  if (jeSlozka(uzel)) return <Folder className={`h-4 w-4 ${barevne ? "text-mac-akcent" : ""}`} />;
  return <FileText className="h-4 w-4 opacity-70" />;
}

function Skupina({ nazev }: { nazev: string }) {
  return (
    <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-mac-slaby">
      {nazev}
    </div>
  );
}

function PolozkaBoku({
  jmeno,
  znak,
  aktivni,
  onClick,
}: {
  jmeno: string;
  znak: React.ReactNode;
  aktivni: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left ${
        aktivni ? "bg-mac-akcent text-mac-akcent-text" : "hover:bg-black/5"
      }`}
    >
      {znak}
      <span className="truncate">{jmeno}</span>
    </button>
  );
}
