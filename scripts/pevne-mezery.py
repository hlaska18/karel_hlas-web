#!/usr/bin/env python3
"""
Doplní pevné mezery za jednopísmenné předložky a spojky.

PROČ. Česká sazba (ČSN 01 6910) nenechává `k`, `s`, `v`, `z`, `o`, `u`, `a`, `i`
na konci řádku. V dokumentech to nikdo neřešil – 3 804 takových míst ve 40
souborech a pevná mezera ani jedna. Word to sám neopraví a při psaní na to
nikdo nemyslí, protože se sází přes Ctrl+Shift+mezerník.

JEN NA DOKUMENTY. Web to má vyřešený od začátku funkcí `sazba()` v
`src/lib/sazba.ts`, která pevné mezery doplňuje AŽ PŘI VYKRESLENÍ a jen pro
češtinu. Zdrojové řetězce v `src/` je proto mít nemají a sahat do nich je
CHYBA – ověřeno tvrdě: první pokus tam mezery vepsal a rozbil tři testy,
protože některé texty slouží zároveň jako klíče („Grafika a multimédia"
se hledá při překladu popisků, „Zvuk a video" je název souboru).

Změřeno na vykreslené stránce: 232 pevných mezer proti dvěma obyčejným,
a ty dvě jsou názvy souborů, které `sazba()` vynechává schválně. Web je
tedy hotový a tenhle skript na něj nesmí.

CO SE MĚNÍ A CO NE

  * Mění se jen mezera MEZI předložkou a následujícím slovem, a jen tehdy, když
    předložka stojí samostatně (před ní je začátek, mezera nebo závorka).
  * `Dokumentace`, `Ukládá`, `Analyzuj` – nic uvnitř slova. Hlídá to podmínka
    na hranici slova z obou stran.
  * `a` v `a. b. c.` nebo `v 5 hodin` se mění taky, a je to správně: pravidlo
    platí i před číslicí.

KDE SE TO NEDĚLÁ

  * V `.docx`/`.pptx` jen uvnitř `<w:t>` a `<a:t>`, tedy ve vlastním textu.
    Text rozdělený mezi dva runy se přeskočí – nejde poznat, kde končí; radši
    ho vynechat než rozbít formátování.
  * Nikde v URL, cestách ani v kódu uvnitř textu.

Po zápisu se každý archiv otevře a každá jeho část se rozparsuje; při jakékoli
chybě se soubor vrátí ze zálohy. Ověřeno i zvenčí: po nahrazení pevné mezery
zpět obyčejnou jsou texty všech 40 souborů shodné s verzí v gitu.

Spouštět z kořene projektu:
    python3 scripts/pevne-mezery.py --nasucho   # jen spočítá
    python3 scripts/pevne-mezery.py --zapis
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NBSP = " "

# Jednopísmenné předložky a spojky. `i` je spojka, ale pravidlo se na ni
# vztahuje stejně.
PISMENA = "ksvzouaiKSVZOUAI"

# Před předložkou smí být jen začátek, mezera nebo otevírací závorka/uvozovka –
# tím se vyloučí konec delšího slova. Za mezerou musí následovat písmeno nebo
# číslice, aby se nechytla mezera před interpunkcí.
VZOR = re.compile(
    rf"(?<![^\s(\[„«> ])([{PISMENA}]) (?=[0-9A-Za-zÀ-ÿĀ-ſ])"
)


def nahrad(text: str) -> tuple[str, int]:
    novy, n = VZOR.subn(lambda m: m.group(1) + NBSP, text)
    return novy, n


# ── Dokumenty ───────────────────────────────────────────────────────────────

TEXT_UZEL = re.compile(r"(<(w|a):t[^>]*>)([^<]*)(</\2:t>)")


def zpracuj_ooxml(cesta: Path, nasucho: bool) -> int:
    zaloha = cesta.with_suffix(cesta.suffix + ".bak")
    shutil.copy2(cesta, zaloha)
    try:
        src = zipfile.ZipFile(zaloha)
        celkem = 0
        casti: dict[str, bytes] = {}

        for info in src.infolist():
            data = src.read(info.filename)
            if re.match(r"(word/document|ppt/(slides|notesSlides)/\w+\d+)\.xml$", info.filename):
                t = data.decode("utf8")

                def uprav(m: re.Match[str]) -> str:
                    nonlocal celkem
                    novy, n = nahrad(m.group(3))
                    celkem += n
                    return m.group(1) + novy + m.group(4)

                t = TEXT_UZEL.sub(uprav, t)
                data = t.encode("utf8")
            casti[info.filename] = data

        if celkem and not nasucho:
            with zipfile.ZipFile(cesta, "w") as out:
                for info in src.infolist():
                    out.writestr(info, casti[info.filename], compress_type=info.compress_type)
            src.close()
            # Kontrola: archiv musí jít otevřít a každá část být platné XML.
            z = zipfile.ZipFile(cesta)
            if z.testzip() is not None:
                raise RuntimeError("poškozený archiv")
            for n in z.namelist():
                if n.endswith((".xml", ".rels")):
                    ET.fromstring(z.read(n))
            z.close()
        else:
            src.close()
        return celkem
    except Exception:
        shutil.copy2(zaloha, cesta)      # vrať původní
        raise
    finally:
        zaloha.unlink(missing_ok=True)


# ── Běh ─────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--nasucho", action="store_true", help="jen spočítat, nic neměnit")
    ap.add_argument("--zapis", action="store_true", help="zapsat změny")
    a = ap.parse_args()
    if not (a.nasucho or a.zapis):
        ap.error("vyber --nasucho nebo --zapis")

    soucty: dict[str, int] = {}

    for p in sorted(Path("public/materialy").rglob("*.docx")) + sorted(
            Path("public/materialy").rglob("*.pptx")
        ):
        if p.name.startswith("~$"):
            continue
        n = zpracuj_ooxml(p, a.nasucho)
        if n:
            soucty[str(p)] = n

    celkem = sum(soucty.values())
    print(f"  {'NASUCHO – nic se nezměnilo' if a.nasucho else 'ZAPSÁNO'}")
    print(f"  souborů: {len(soucty)}   pevných mezer: {celkem}")
    for cesta, n in sorted(soucty.items(), key=lambda x: -x[1])[:8]:
        print(f"     {n:5d}  {cesta}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
