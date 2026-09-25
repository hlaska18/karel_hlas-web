"use client";

/**
 * Moje výsledky (pro žáka) a Přehled třídy (pro učitele).
 *
 * Žádné účty ani server: žák ukáže obrazovku, vyfotí ji, nebo opíše kód
 * postupu do Teams. Učitel kódy vloží do Přehledu třídy a vidí tabulku.
 * Kód je shrnutí, ne důkaz – důkazem je stažený soubor z lekce 19.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useDbb } from "@/components/dbb/kontext";
import { Okno, Tlacitko, Paticka } from "@/components/dbb/okna";
import { KURZ, SADY, lekceHotova, povinne, rozdelSkore } from "@/lib/dbb/kurz";
import {
  zakoduj,
  najdiKody,
  dekoduj,
  sloucitPostupy,
  souhrnTridy,
  kdeZacit,
  skoreSadyText,
  type Postup,
  type SkoreSady,
} from "@/lib/dbb/kodPostupu";
import { pisemka, LEKCE_PISEMKY, type Varianta } from "@/lib/dbb/pisemka";
import { NAZEV_SIMULATORU, najdiKodySimulatoru, sloucitSimulatory } from "@/lib/postupSimulatoru";
import { POVINNE_KLICE, KLIC_NAZVY_ULOH } from "@/lib/dbb/obnovaPostupu";
import { stahni } from "@/lib/dbb/stahni";
import { cist, zapsat } from "@/lib/dbb/uloziste";
import { t, jeAnglicky } from "@/lib/dbb/jazyk";

const MESICE = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dva = (n: number) => (n < 10 ? `0${n}` : String(n));

/** „3 s řešením“ za skóre sady. */
const S_RESENIM = () => t("s řešením", "with the solution");

/** Sada, ze které je písemka dané varianty. */
function sadaPisemky(v: Varianta) {
  return SADY.filter((s) => s.lekce.id === LEKCE_PISEMKY[v])[0];
}

/** Body písemky z kódu: [samostatně, celkem]. */
function bodyPisemky(p: Postup): SkoreSady | null {
  if (!p.pisemka) return null;
  const s = sadaPisemky(p.pisemka);
  return s && p.sady && p.sady[s.id] ? p.sady[s.id] : [0, s ? s.lekce.ukoly.length : 0, 0];
}

/**
 * Co se zkopíruje do Teams: jméno a skóre před kódem, ať učitel vidí
 * výsledek i bez Přehledu třídy (rada 24. 9. 2026).
 */
export function textKopie(p: Postup, kod: string): string {
  const b = bodyPisemky(p);
  if (b && p.pisemka) return `${p.jmeno} · ${t("Písemka", "Test")} ${p.pisemka} ${b[0]}/${b[1]} · ${kod}`;
  const s = rozdelSkore(p.hotove);
  return `${p.jmeno} · ${t("Dotazy", "Queries")} ${s.dotazy[0]}/${s.dotazy[1]} · ${t("Program", "Program")} ${s.program[0]}/${s.program[1]} · ${kod}`;
}

/** Postup žáka spočítaný z odškrtnutých úkolů. */
export function spoctiPostup(splneno: Set<string>, opsano: Set<string>, jmeno: string): Postup {
  const d = new Date();
  const hotove = KURZ.filter((l) => lekceHotova(l, splneno)).map((l) => l.id);
  const sede = KURZ.filter(
    (l) => lekceHotova(l, splneno) && povinne(l).some((u) => opsano.has(u.klic)),
  ).map((l) => l.id);
  let navic = 0;
  KURZ.forEach((l) => l.ukoly.forEach((u) => u.navic && splneno.has(u.klic) && navic++));
  // Úlohy splněné po zobrazení řešení se do skóre sady nepočítají, jen zvlášť.
  const sady: Record<string, SkoreSady> = {};
  SADY.forEach((s) => {
    const ukoly = s.lekce.ukoly;
    const hotove = ukoly.filter((u) => splneno.has(u.klic));
    const sReseni = hotove.filter((u) => opsano.has(u.klic)).length;
    sady[s.id] = [hotove.length - sReseni, ukoly.length, sReseni];
  });
  const ulohy = Array.from(splneno).filter((k) => k.indexOf("u-") === 0);
  // Úlohy navíc, detektivka a procvičování – aby šly z kódu obnovit na jiném počítači.
  const klice = Array.from(splneno).filter((k) => k.indexOf("u-") !== 0 && POVINNE_KLICE.indexOf(k) === -1);
  let ulozeneNazvy: Record<string, string> = {};
  try {
    ulozeneNazvy = JSON.parse(cist(KLIC_NAZVY_ULOH) || "{}");
  } catch {
    ulozeneNazvy = {};
  }
  const nazvyUloh: Record<string, string> = {};
  ulohy.forEach((u) => ulozeneNazvy[u] && (nazvyUloh[u] = ulozeneNazvy[u]));
  return {
    jmeno,
    datum: `${d.getFullYear()}-${dva(d.getMonth() + 1)}-${dva(d.getDate())}`,
    hotove,
    sede,
    navic,
    sady,
    ulohy,
    klice,
    nazvyUloh,
    pisemka: pisemka() || undefined,
  };
}

export function kopiruj(text: string, hotovo: () => void) {
  const zaloha = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      hotovo();
    } finally {
      document.body.removeChild(ta);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(hotovo, zaloha);
  else zaloha();
}

/** Dlaždice lekce: zelená = samostatně, šedá = po zobrazení řešení, prázdná = zatím ne. */
function Dlazdice({ id, stav, nazev }: { id: number; stav: "hotova" | "seda" | "nic"; nazev: string }) {
  const barva =
    stav === "hotova"
      ? "border-[#2e9d4f] bg-[#2e9d4f] text-white"
      : stav === "seda"
        ? "border-[#9a9a9a] bg-[#c8c8c8] text-[#333]"
        : "border-dbb-linka bg-dbb-povrch text-dbb-slaby";
  return (
    <span title={nazev} className={`flex h-[30px] w-[30px] items-center justify-center border text-[12px] font-semibold ${barva}`}>
      {id}
    </span>
  );
}

export function MojeVysledky({ zavrit }: { zavrit: () => void }) {
  const { kurz } = useDbb();
  const [jmeno, nastavJmeno] = useState(() => cist("dbb-jmeno") || "");
  const [zkopirovano, nastavZkopirovano] = useState(false);
  const [vlozenyKod, nastavVlozenyKod] = useState("");
  const [obnova, nastavObnovu] = useState<{ ok: boolean; text: string } | null>(null);
  const nactiKod = () => {
    const p = najdiKody(vlozenyKod)[0] || dekoduj(vlozenyKod);
    if (!p) {
      nastavObnovu({
        ok: false,
        text: t("Tohle není kód postupu – začíná SQLKURZ1-. Vlož celý kód z Teams.", "This is not a progress code – it starts with SQLKURZ1-. Paste the whole code from Teams."),
      });
      return;
    }
    kurz.obnovZKodu(p);
    if (p.jmeno && !jmeno.trim()) {
      nastavJmeno(p.jmeno);
    }
    nastavVlozenyKod("");
    const s = rozdelSkore(p.hotove);
    nastavObnovu({
      ok: true,
      text: t(
        `Načteno z kódu: Dotazy ${s.dotazy[0]}/${s.dotazy[1]} · Program ${s.program[0]}/${s.program[1]}. Rozpracované lekce kód nenese – ty dodělej znovu.`,
        `Loaded from the code: Queries ${s.dotazy[0]}/${s.dotazy[1]} · Program ${s.program[0]}/${s.program[1]}. Unfinished lessons are not in the code – do them again.`,
      ),
    });
  };
  const p = spoctiPostup(kurz.splneno, kurz.opsano, jmeno.trim());
  const kod = zakoduj(p);
  const d = new Date();
  const videno = Array.from(kurz.opsano).length;
  const skore = rozdelSkore(p.hotove);
  const bezJmena = !jmeno.trim();
  const varianta = pisemka();
  const sada = varianta ? sadaPisemky(varianta) : null;
  const body = bodyPisemky(p);

  return (
    <Okno
      titulek={varianta ? t(`Moje výsledky – písemka ${varianta}`, `My Results – Test ${varianta}`) : t("Moje výsledky", "My Results")}
      zavrit={zavrit}
      sirka={560}
    >
      <div className="dbb-posuv min-h-0 flex-1 overflow-auto px-5 py-4 text-[12px] leading-relaxed">
        <label className="flex items-center">
          <span className="mr-2 shrink-0">{t("Jméno:", "Name:")}</span>
          <input
            value={jmeno}
            onChange={(e) => {
              nastavJmeno(e.target.value);
              zapsat("dbb-jmeno", e.target.value);
            }}
            placeholder={t("napiš své jméno, ať je na fotce i v kódu", "type your name so it is on the photo and in the code")}
            aria-invalid={bezJmena}
            className={`h-[26px] flex-1 border bg-dbb-povrch px-2 text-[13px] text-dbb-text focus:border-dbb-akcent ${
              bezJmena ? "border-[#c42b1c]" : "border-dbb-linka"
            }`}
          />
        </label>
        <p className="mt-4 flex flex-wrap items-baseline leading-none">
          {varianta && body ? (
            <span className="mr-5 text-[28px] font-semibold">
              {t("Písemka", "Test")} {varianta} {body[0]}/{body[1]}
            </span>
          ) : (
            <>
              <span className="mr-5 text-[28px] font-semibold">
                {t("Dotazy", "Queries")} {skore.dotazy[0]}/{skore.dotazy[1]}
              </span>
              <span className="mr-5 text-[28px] font-semibold">
                {t("Program", "Program")} {skore.program[0]}/{skore.program[1]}
              </span>
            </>
          )}
          <span className="text-[13px] font-normal text-dbb-slaby">
            {jeAnglicky()
              ? `${d.getDate()} ${MESICE[d.getMonth()]} ${d.getFullYear()}`
              : `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`}{" "}
            {dva(d.getHours())}:{dva(d.getMinutes())}
          </span>
        </p>
        {sada ? (
          <>
            <p className="mt-1 text-dbb-slaby">{sada.lekce.title}</p>
            <div className="mt-3 flex flex-wrap" style={{ width: 8 * 34 }}>
              {sada.lekce.ukoly.map((u, i) => (
                <span key={u.klic} className="mb-1 mr-1">
                  <Dlazdice id={i + 1} nazev={u.zadani} stav={kurz.splneno.has(u.klic) ? "hotova" : "nic"} />
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap" style={{ width: 10 * 34 }}>
              {KURZ.map((l) => (
                <span key={l.id} className="mb-1 mr-1">
                  <Dlazdice
                    id={l.id}
                    nazev={l.title}
                    stav={p.sede.indexOf(l.id) !== -1 ? "seda" : p.hotove.indexOf(l.id) !== -1 ? "hotova" : "nic"}
                  />
                </span>
              ))}
            </div>
            <p className="mt-2 text-dbb-slaby">
              <span className="mr-1 inline-block h-2.5 w-2.5 bg-[#2e9d4f] align-middle" /> {t("zelená = samostatně", "green = on your own")}
              <span className="ml-3 mr-1 inline-block h-2.5 w-2.5 bg-[#c8c8c8] align-middle" />{" "}
              {t("šedá = viděl(a) jsi řešení", "grey = you saw the solution")}
            </p>
            <p className="mt-1 text-dbb-slaby">
              {t("Zobrazená řešení", "Solutions shown")}: {videno} · {t("úlohy navíc", "extra tasks")}: {p.navic}
              {SADY.map((s) => {
                const x = p.sady && p.sady[s.id];
                return x && (x[0] > 0 || (x[2] || 0) > 0) ? ` · ${s.kratce}: ${skoreSadyText(x, S_RESENIM())}` : "";
              })}
              {p.ulohy && p.ulohy.length > 0 ? ` · ${t("úlohy od učitele", "tasks from your teacher")}: ${p.ulohy.length}` : ""}
            </p>
          </>
        )}

        <p className="mt-4 font-semibold">{t("Kód postupu pro učitele", "Progress code for your teacher")}</p>
        <p className="text-dbb-slaby">
          {t(
            "Zkopíruj ho do Teams. Když Teams nejde, vyfoť celé tohle okno.",
            "Copy it into Teams. If Teams doesn't work, take a photo of this whole window.",
          )}
        </p>
        <div className="mt-1 flex items-center">
          <code className="dbb-kod min-w-0 flex-1 select-all truncate border border-dbb-linka bg-dbb-okno px-2 py-1 text-[11px]">
            {kod}
          </code>
          <button
            type="button"
            disabled={bezJmena}
            title={bezJmena ? t("Nejdřív nahoře napiš své jméno.", "Type your name at the top first.") : undefined}
            onClick={() => kopiruj(textKopie(p, kod), () => nastavZkopirovano(true))}
            className="ml-2 flex h-[26px] items-center border border-dbb-linka bg-dbb-povrch px-2 enabled:hover:bg-dbb-hover disabled:opacity-45"
          >
            {zkopirovano ? <Check className="mr-1 h-3.5 w-3.5 text-[#2e9d4f]" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {zkopirovano ? t("Zkopírováno", "Copied") : t("Kopírovat", "Copy")}
          </button>
        </div>

        {/* V písemce nejde přenést postup odjinud – ani sousedův. */}
        {!varianta && (
          <>
            <p className="mt-4 font-semibold">{t("Pokračovat z kódu", "Continue from a code")}</p>
            <p className="text-dbb-slaby">
              {t(
                "Začal(a) jsi na jiném počítači? Vlož svůj kód postupu (třeba z Teams) a lekce se ti odškrtnou i tady.",
                "Did you start on another computer? Paste your progress code (from Teams, for example) and your lessons are ticked off here too.",
              )}
            </p>
            <div className="mt-1 flex items-center">
              <input
                value={vlozenyKod}
                onChange={(e) => {
                  nastavVlozenyKod(e.target.value);
                  nastavObnovu(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") nactiKod();
                }}
                spellCheck={false}
                placeholder="SQLKURZ1-…"
                aria-label={t("Kód postupu z jiného počítače", "Progress code from another computer")}
                className="dbb-kod h-[26px] min-w-0 flex-1 border border-dbb-linka bg-dbb-povrch px-2 text-[11px] text-dbb-text focus:border-dbb-akcent"
              />
              <button
                type="button"
                disabled={!vlozenyKod.trim()}
                onClick={nactiKod}
                className="ml-2 flex h-[26px] items-center border border-dbb-linka bg-dbb-povrch px-2 enabled:hover:bg-dbb-hover disabled:opacity-45"
              >
                {t("Načíst", "Load")}
              </button>
            </div>
            {obnova && <p className={`mt-1 ${obnova.ok ? "text-[#1e6b35]" : "text-[#a4262c]"}`}>{obnova.text}</p>}
          </>
        )}
      </div>
      <Paticka>
        <Tlacitko primarni prvni akce={zavrit}>
          {t("Zavřít", "Close")}
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}

export function PrehledTridy({ zavrit }: { zavrit: () => void }) {
  const [text, nastavText] = useState("");
  // Kódy téhož žáka (z domu i ze školy) se sčítají – nic se neztratí.
  // Písemka má vlastní řádek a se zbytkem kurzu se nesčítá.
  const vsichni = sloucitPostupy(najdiKody(text));
  const zaci = vsichni.filter((z) => !z.pisemka);
  const pisemky = vsichni.filter((z) => !!z.pisemka);
  // Kódy z Windows a macOS (WIN1-, MAC1-) – učitel často vloží celé vlákno
  // z Teams, kde jsou všechny tři simulátory pohromadě.
  const simulatory = sloucitSimulatory(najdiKodySimulatoru(text));
  const souhrn = souhrnTridy(zaci, KURZ.map((l) => l.id));
  const zacit = kdeZacit(souhrn, zaci.length);
  const bezLekce = (id: number) => zaci.filter((z) => z.hotove.indexOf(id) === -1).map((z) => z.jmeno || "?");
  const nazevUlohy = (z: Postup, u: string) => (z.nazvyUloh && z.nazvyUloh[u]) || u;

  const csv = () => {
    const hlava = [
      t("Jméno", "Name"),
      t("Datum", "Date"),
      t("Dotazy (1–13)", "Queries (1–13)"),
      t("Program (14–19)", "Program (14–19)"),
      t("Šedé lekce", "Grey lessons"),
      t("Úlohy navíc", "Extra tasks"),
    ].concat(
      SADY.map((s) => s.kratce),
      [t("Úlohy od učitele", "Tasks from the teacher"), t("Písemka", "Test"), t("Body písemky", "Test score")],
    );
    const radky = zaci.map((z) =>
      [
        z.jmeno,
        z.datum,
        `${rozdelSkore(z.hotove).dotazy[0]}/${rozdelSkore(z.hotove).dotazy[1]}`,
        `${rozdelSkore(z.hotove).program[0]}/${rozdelSkore(z.hotove).program[1]}`,
        z.sede.join(" "),
        String(z.navic),
      ].concat(
        SADY.map((s) => (z.sady && z.sady[s.id] ? skoreSadyText(z.sady[s.id], S_RESENIM()) : "")),
        [(z.ulohy || []).map((u) => nazevUlohy(z, u)).join(" | "), "", ""],
      ),
    );
    const radkyPisemek = pisemky.map((z) => {
      const b = bodyPisemky(z);
      return [z.jmeno, z.datum, "", "", "", ""].concat(
        SADY.map(() => ""),
        ["", z.pisemka || "", b ? `${b[0]}/${b[1]}` : ""],
      );
    });
    const obsah = [hlava]
      .concat(radky, radkyPisemek)
      .map((r) => r.map((b) => `"${b.replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    // BOM, ať Excel pozná češtinu.
    stahni(t("prehled-tridy-sql.csv", "class-overview-sql.csv"), new Uint8Array(new TextEncoder().encode("\uFEFF" + obsah)), "text/csv");
  };

  return (
    <Okno titulek={t("Přehled třídy (pro učitele)", "Class Overview (for Teachers)")} zavrit={zavrit} sirka={900}>
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 text-[12px]">
        <p className="leading-relaxed">
          {t(
            "Vlož kódy postupu od žáků – klidně celé zprávy z Teams, kódy se v textu najdou samy, i ty z virtuálních Windows a macOS. Kód je shrnutí, ne důkaz: vzniká v prohlížeči žáka a dá se upravit. Důkazem práce je stažený soubor z lekce 19.",
            "Paste the pupils' progress codes – whole Teams messages are fine, the codes are found in the text automatically, including those from the virtual Windows and macOS. A code is a summary, not proof: it is made in the pupil's browser and can be edited. The proof of work is the file downloaded in lesson 19.",
          )}
        </p>
        <textarea
          value={text}
          onChange={(e) => nastavText(e.target.value)}
          spellCheck={false}
          aria-label={t("Kódy postupu od žáků", "Progress codes from pupils")}
          placeholder="SQLKURZ1-…"
          className="dbb-kod mt-2 h-[90px] w-full shrink-0 resize-none border border-dbb-linka bg-dbb-povrch p-2 text-[11px] text-dbb-text focus:border-dbb-akcent"
        />
        <div className="dbb-posuv mt-3 min-h-[120px] flex-1 overflow-auto border border-dbb-linka">
          {vsichni.length === 0 && simulatory.length === 0 ? (
            <p className="p-3 text-dbb-slaby">{t("Zatím žádný kód.", "No codes yet.")}</p>
          ) : (
            <>
              {zaci.length > 0 && (
                <table className="w-full" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-dbb-hlavicka text-left">
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Jméno", "Name")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Datum", "Date")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Dotazy", "Queries")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Program", "Program")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Lekce", "Lessons")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Navíc", "Extra")}</th>
                      <th className="border-b border-dbb-mrizka px-2 py-1 font-normal">{t("Od učitele", "From teacher")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zaci.map((z, i) => (
                      <tr key={i}>
                        <td className="border-b border-dbb-mrizka px-2 py-1 font-semibold">{z.jmeno || t("(bez jména)", "(no name)")}</td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">{z.datum}</td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                          {rozdelSkore(z.hotove).dotazy[0]}/{rozdelSkore(z.hotove).dotazy[1]}
                        </td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                          {rozdelSkore(z.hotove).program[0]}/{rozdelSkore(z.hotove).program[1]}
                        </td>
                        <td className="border-b border-dbb-mrizka px-2 py-1">
                          <span className="flex">
                            {KURZ.map((l) => {
                              const stav = z.sede.indexOf(l.id) !== -1 ? "seda" : z.hotove.indexOf(l.id) !== -1 ? "hotova" : "nic";
                              return (
                                <span
                                  key={l.id}
                                  title={`${l.id}. ${l.title}`}
                                  className={`mr-px h-[14px] w-[12px] ${
                                    stav === "hotova" ? "bg-[#2e9d4f]" : stav === "seda" ? "bg-[#c8c8c8]" : "bg-dbb-mrizka"
                                  }`}
                                />
                              );
                            })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                          {z.navic}
                          {SADY.map((s) => {
                            const x = z.sady && z.sady[s.id];
                            return x && (x[0] > 0 || (x[2] || 0) > 0) ? ` · ${s.kratce} ${skoreSadyText(x, S_RESENIM())}` : "";
                          })}
                        </td>
                        <td className="border-b border-dbb-mrizka px-2 py-1 text-[11px]">
                          {(z.ulohy || []).length
                            ? (z.ulohy || []).map((u) => (
                                <span key={u} className="block" title={u}>
                                  ✓ {nazevUlohy(z, u)}
                                </span>
                              ))
                            : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-dbb-okno">
                      <td colSpan={4} className="px-2 py-1.5 text-right text-dbb-slaby">
                        {t(`Lekci má hotovou (z ${zaci.length}):`, `Lesson done by (of ${zaci.length}):`)}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="flex">
                          {KURZ.map((l, i) => {
                            const chybi = bezLekce(l.id);
                            return (
                              <span
                                key={l.id}
                                title={
                                  t(`Lekce ${l.id}: ${souhrn[i]} z ${zaci.length}`, `Lesson ${l.id}: ${souhrn[i]} of ${zaci.length}`) +
                                  (chybi.length ? `\n${t("Chybí", "Missing")}: ${chybi.join(", ")}` : "")
                                }
                                className={`mr-px w-[12px] text-center text-[9px] leading-[14px] text-white ${
                                  i === zacit ? "outline outline-2 outline-[#c42b1c]" : ""
                                }`}
                                style={{
                                  // Čím víc žáků lekci má, tím sytější zelená – kde třída skončila, je vidět na první pohled.
                                  background: `rgba(46, 157, 79, ${zaci.length ? 0.15 + (0.85 * souhrn[i]) / zaci.length : 0.15})`,
                                }}
                              >
                                {souhrn[i]}
                              </span>
                            );
                          })}
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
              {zacit !== -1 && (
                <p className="border-t border-dbb-mrizka bg-[#fdecea] px-3 py-2 leading-snug text-[#5c1a14]">
                  <b>
                    {t(`Příště začni lekcí ${KURZ[zacit].id}`, `Next time, start with lesson ${KURZ[zacit].id}`)}
                  </b>{" "}
                  ({KURZ[zacit].title}){" "}
                  {t(
                    `– hotovou ji má jen ${souhrn[zacit]} z ${zaci.length}. Chybí: ${bezLekce(KURZ[zacit].id).join(", ")}.`,
                    `– only ${souhrn[zacit]} of ${zaci.length} have done it. Missing: ${bezLekce(KURZ[zacit].id).join(", ")}.`,
                  )}
                </p>
              )}
              {simulatory.length > 0 && (
                <table className="w-full" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-dbb-hlavicka text-left">
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">
                        {t("Windows a macOS – jméno", "Windows and macOS – name")}
                      </th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Simulátor", "Simulator")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Datum", "Date")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Hotovo", "Done")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulatory.map((z, i) => (
                      <tr key={i}>
                        <td className="border-b border-dbb-mrizka px-2 py-1 font-semibold">{z.jmeno || t("(bez jména)", "(no name)")}</td>
                        <td className="border-b border-dbb-mrizka px-2 py-1">{NAZEV_SIMULATORU[z.simulator]}</td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">{z.datum}</td>
                        <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">
                          {z.splneno.length}/{z.celkem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {simulatory.length > 0 && (
                <p className="px-3 py-1.5 text-dbb-slaby">
                  {t(
                    "Které úlohy kdo splnil, ukáže Přehled třídy přímo ve virtuálních Windows nebo macOS (panel Úkoly).",
                    "Which tasks each pupil completed is shown by the Class Overview inside the virtual Windows or macOS (Tasks panel).",
                  )}
                </p>
              )}
              {pisemky.length > 0 && (
                <table className="w-full" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-dbb-hlavicka text-left">
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Písemka – jméno", "Test – name")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Datum", "Date")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Varianta", "Version")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Body", "Score")}</th>
                      <th className="border-b border-t border-dbb-mrizka px-2 py-1 font-normal">{t("Úlohy", "Tasks")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pisemky.map((z, i) => {
                      const b = bodyPisemky(z);
                      const sada = z.pisemka ? sadaPisemky(z.pisemka) : null;
                      return (
                        <tr key={i}>
                          <td className="border-b border-dbb-mrizka px-2 py-1 font-semibold">{z.jmeno || t("(bez jména)", "(no name)")}</td>
                          <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1">{z.datum}</td>
                          <td className="border-b border-dbb-mrizka px-2 py-1">{z.pisemka}</td>
                          <td className="whitespace-nowrap border-b border-dbb-mrizka px-2 py-1 font-semibold">{b ? `${b[0]}/${b[1]}` : "–"}</td>
                          <td className="border-b border-dbb-mrizka px-2 py-1">
                            <span className="flex">
                              {sada &&
                                sada.lekce.ukoly.map((u, j) => (
                                  <span
                                    key={u.klic}
                                    title={`${j + 1}. ${u.zadani}`}
                                    className={`mr-px h-[14px] w-[12px] ${
                                      (z.klice || []).indexOf(u.klic) !== -1 ? "bg-[#2e9d4f]" : "bg-dbb-mrizka"
                                    }`}
                                  />
                                ))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
      <Paticka
        vlevo={
          vsichni.length > 0 ? (
            <button type="button" onClick={csv} className="h-[28px] border border-dbb-linka bg-dbb-povrch px-3 hover:bg-dbb-hover">
              {t("Stáhnout jako CSV (Excel)", "Download as CSV (Excel)")}
            </button>
          ) : null
        }
      >
        <Tlacitko primarni prvni akce={zavrit}>
          {t("Zavřít", "Close")}
        </Tlacitko>
      </Paticka>
    </Okno>
  );
}
