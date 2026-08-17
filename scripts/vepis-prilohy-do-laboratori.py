#!/usr/bin/env python3
"""
Vepíše obrázky a média přímo do HTML laboratoří jako data: URI.

Proč: laboratoře jsou jediné materiály v bance, které potřebují sousední
soubory. Kdo si v bance stáhne jen ten jeden HTML soubor, otevře si prázdné
rámečky – vedle něj žádná složka Obrázky/ není. Samy si přitom slibují, že
„běží offline". Po vepsání ten slib platí doopravdy: soubor jde poslat mailem,
nosit na flashce i otevřít bez připojení.

Složky Obrázky/ a Média/ zůstávají na místě – odkazují na ně pracovní listy.

Spouštět z kořene projektu:  python3 scripts/vepis-prilohy-do-laboratori.py
"""

import base64
import glob
import mimetypes
import os
import re
import sys

KOREN = "public/materialy/1L/6"

LABORATORE = [
    "1. Rastrová a vektorová grafika/Laboratoř – rastr a vektor.html",
    "2. Rozlišení, barvy a barevná hloubka/Laboratoř – barevná hloubka.html",
    "3. Formáty obrázků a komprese/Laboratoř – komprese a formáty.html",
    "6. Zvuk a video/Laboratoř – vzorkování zvuku.html",
]

# Cesty, které si laboratoř skládá až v JavaScriptu ('Obrázky/foto_jpeg_q'+q+'.jpg').
# Literál v kódu je jen předpona, takže se nedá nahradit textem – tyhle projdou
# přes tabulku OBR a funkci obr().
SKLADANE = re.compile(r"'((?:Obrázky|Média)/[^']*)'\s*\+")

mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("audio/wav", ".wav")


def data_uri(cesta: str) -> str:
    typ = mimetypes.guess_type(cesta)[0] or "application/octet-stream"
    with open(cesta, "rb") as f:
        return f"data:{typ};base64," + base64.b64encode(f.read()).decode("ascii")


def uplne_cesty(text: str) -> set:
    """Úplné cesty uvedené v uvozovkách – ty jdou nahradit rovnou textem."""
    n = set(re.findall(r'"((?:Obrázky|Média)/[^"]+)"', text))
    n |= set(re.findall(r"'((?:Obrázky|Média)/[^']+)'", text))
    # předpona složené cesty není úplná cesta, i když je v uvozovkách
    return {c for c in n if os.path.splitext(c)[1]}


def skladane_cesty(text: str, slozka: str) -> set:
    """Z 'Obrázky/foto_jpeg_q' + q + '.jpg' odvodí všechny soubory, co sedí."""
    ven = set()
    for predpona in SKLADANE.findall(text):
        vzor = os.path.join(slozka, predpona + "*")
        for nalez in glob.glob(vzor):
            if os.path.isfile(nalez):
                ven.add(os.path.relpath(nalez, slozka).replace(os.sep, "/"))
    return ven


def zpracuj(rel: str) -> bool:
    cesta = os.path.join(KOREN, rel)
    slozka = os.path.dirname(cesta)
    nazev = os.path.basename(cesta)
    puv = open(cesta, encoding="utf-8").read()
    text = puv

    uplne = {c for c in uplne_cesty(text) if os.path.exists(os.path.join(slozka, c))}
    slozene = skladane_cesty(text, slozka)

    if not uplne and not slozene:
        print(f"  {nazev[:44]:44s} nic k vepsání")
        return False

    # POŘADÍ JE PODSTATNÉ. Obalování musí proběhnout dřív, než se do textu
    # dostane první data: URI. Konec příkazu se totiž hledá podle středníku –
    # a data URI středník obsahuje („data:image/png;base64,…"), takže obrácené
    # pořadí uzavře závorku uprostřed přílohy a rozbije skript.

    # 1) skládané cesty – obalit přiřazení funkcí, která je za běhu přeloží
    if slozene:
        text = re.sub(
            r"(\$\('[A-Za-z]+'\)\.src\s*=\s*)([^;]*?'(?:Obrázky|Média)/[^;]*?)(;)",
            lambda m: m.group(1) + "obr(" + m.group(2) + ")" + m.group(3),
            text,
        )

    # 2) úplné cesty – nahradit rovnou, ať v atributu nebo v poli v JavaScriptu
    for c in sorted(uplne):
        uri = data_uri(os.path.join(slozka, c))
        text = text.replace(f'"{c}"', f'"{uri}"').replace(f"'{c}'", f"'{uri}'")

    # 3) tabulka příloh pro skládané cesty (až teď, ať ji krok 1 nepotká)
    if slozene:
        polozky = ",\n".join(
            f"  {c!r}: {data_uri(os.path.join(slozka, c))!r}" for c in sorted(slozene)
        )
        tabulka = (
            "<script>\n"
            "// Přílohy jsou vepsané přímo do souboru, aby laboratoř fungovala i po\n"
            "// stažení samotného HTML. Cesty, které se skládají za běhu, projdou obr().\n"
            "var OBR = {\n" + polozky + "\n};\n"
            "function obr(p){ return OBR[p] || p; }\n"
            "</script>\n"
        )
        text = text.replace("<script>\n(function(){", tabulka + "<script>\n(function(){", 1)

    if text == puv:
        print(f"  {nazev[:44]:44s} beze změny (?)")
        return False

    open(cesta, "w", encoding="utf-8").write(text)
    pred = len(puv.encode()) / 1024
    po = len(text.encode()) / 1024
    print(
        f"  {nazev[:44]:44s} {pred:6.0f} kB → {po:6.0f} kB"
        f"   ({len(uplne)} úplných, {len(slozene)} skládaných)"
    )
    return True


def main() -> int:
    if not os.path.isdir(KOREN):
        print(f"chybí {KOREN} – spusť z kořene projektu", file=sys.stderr)
        return 1
    print("Vepisuji přílohy do laboratoří:\n")
    for rel in LABORATORE:
        zpracuj(rel)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
