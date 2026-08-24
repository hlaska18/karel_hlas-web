#!/usr/bin/env python3
"""
Odstraní vržený stín ze skleněné ikony tématu a srovná ji do rámu.

Proč: ikona databáze měla za sebou stín, který byl na dlaždici vidět jako
šmouha vpravo dole. Narazil jsem na něj už dřív, když se z ikon dělaly masky —
v masce vyskočil jako boule na boku a tehdy se to obešlo zvýšením prahu křivky.
Tady se odstraňuje u zdroje.

────────────────────────────────────────────────────────────────────────────
PROČ TO NENÍ JEN „ZAHOĎ SLABÉ PIXELY"

Vyzkoušené a NEFUNGUJE:

  * Práh alfy. Stín má krytí 17–180, jenže spáry mezi kotouči klesají na 113.
    Rozsahy se překrývají, takže co odstraní stín, slije i kotouče.
  * „Nech jen největší souvislou část." Stín na válec navazuje, je to jedna
    souvislá oblast o 121 828 pixelech.
  * Zaplavení od okraje. Odlesk ve skle, který se dotýká obrysu, je odtud
    dosažitelný stejně jako stín — vykouslo to díru do spodního kotouče.

Co funguje: skleněné ikony sady jsou v průmětu VYPUKLÉ. Stačí proto v každé
řádce a v každém sloupci najít rozpětí plně krycích pixelů (tělo) a všechno,
co leží mimo, zahodit. Stín je posunutý stranou, takže padne celý; odlesky
uvnitř skla leží mezi krajními body těla, takže zůstanou — i ty, které se
dotýkají obrysu.

Na nevypuklý tvar (písmeno, mřížka) by se tenhle postup nehodil.

Spouštět z kořene projektu:
    python3 scripts/odstran-stin-ikony.py public/images/tools/glass/databaze.png
"""

import os
import sys

from PIL import Image

# Krytí, od kterého se pixel počítá za tělo. Musí být nad spárami (113),
# aby se braly jako vnitřek, a pod plným krytím, ať se vejde i vyhlazený okraj.
PRAH_TELA = 200

# O kolik pixelů se rozpětí povolí, aby zůstal vyhlazený okraj.
REZERVA = 4

# Jak velkou část rámu má objekt zabrat. Zbytek sady má 74–86 %, průměr 80.
PODIL_V_RAMU = 0.80


def bez_stinu(im: Image.Image) -> Image.Image:
    w, h = im.size
    alfa = im.split()[3]
    ap = alfa.load()

    radky: dict[int, tuple[int, int]] = {}
    sloupce: dict[int, tuple[int, int]] = {}
    for y in range(h):
        xs = [x for x in range(w) if ap[x, y] >= PRAH_TELA]
        if xs:
            radky[y] = (min(xs) - REZERVA, max(xs) + REZERVA)
    for x in range(w):
        ys = [y for y in range(h) if ap[x, y] >= PRAH_TELA]
        if ys:
            sloupce[x] = (min(ys) - REZERVA, max(ys) + REZERVA)

    zahozeno = 0
    for y in range(h):
        r = radky.get(y)
        for x in range(w):
            if ap[x, y] == 0:
                continue
            s = sloupce.get(x)
            mimo = r is None or not (r[0] <= x <= r[1])
            mimo = mimo or s is None or not (s[0] <= y <= s[1])
            if mimo:
                ap[x, y] = 0
                zahozeno += 1

    im.putalpha(alfa)
    print(f"  zahozeno pixelů stínu: {zahozeno}")
    return im


def srovnej_do_ramu(im: Image.Image, hrana: int) -> Image.Image:
    """Objekt na střed a na dohodnutý podíl rámu.

    Bez tohohle kroku by ikona po odstranění stínu seděla mimo střed: původní
    rám byl vycentrovaný na objekt VČETNĚ stínu.
    """
    bbox = im.getbbox()
    if not bbox:
        raise SystemExit("po ořezu nic nezbylo")
    objekt = im.crop(bbox)
    strana = round(max(objekt.size) / PODIL_V_RAMU)
    plocha = Image.new("RGBA", (strana, strana), (0, 0, 0, 0))
    plocha.paste(objekt, ((strana - objekt.width) // 2, (strana - objekt.height) // 2))
    return plocha.resize((hrana, hrana), Image.LANCZOS)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    for cesta in sys.argv[1:]:
        if not os.path.exists(cesta):
            print(f"chybí {cesta}", file=sys.stderr)
            return 1
        im = Image.open(cesta).convert("RGBA")
        hrana = im.size[0]
        print(os.path.basename(cesta))
        vysledek = srovnej_do_ramu(bez_stinu(im), hrana)
        vysledek.save(cesta, "PNG", optimize=True)
        bb = vysledek.getbbox()
        podil = max(bb[2] - bb[0], bb[3] - bb[1]) / hrana * 100
        print(f"  podíl v rámu: {podil:.1f} % (sada 74–86 %)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
