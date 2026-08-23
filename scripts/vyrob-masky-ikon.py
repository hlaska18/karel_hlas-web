#!/usr/bin/env python3
"""
Vyrobí z barevných skleněných ikon malé masky pro CSS `mask-image`.

Proč: ukázky materiálů v úvodu kreslí ikonu tématu jako šedou siluetu.
Maska přitom bere obrázek ze surové cesty, tedy mimo `next/image` – a stahoval
se kvůli tomu plný 512px PNG (170–380 kB) jen proto, aby se z něj vykreslil
tvar o velikosti 26 px. Na úvodní stránce to dělalo 880 kB navíc.

Maska potřebuje jen alfa kanál a jen v rozlišení, ve kterém se kreslí.
Deset masek dohromady váží kolem 15 kB místo 2,9 MB.

POZOR: masky teď nic nepoužívá. Ukázky materiálů v úvodu se vrátily k barevné
skleněné ikoně, protože silueta byla na 26 px k nepoznání (paleta bez důlků,
sloupce Power BI slité do bloku). Skript tu zůstává proto, že vyrobit masky
znovu je jeden příkaz – a je v něm zapsané, proč to není jen opsání alfy.
Vygenerované PNG se ze `public/` smazaly, ať se nedeployuje, co nikdo nečte.

Barevné ikony zůstávají – používají je dlaždice v bance i ukázky v úvodu.

────────────────────────────────────────────────────────────────────────────
DVĚ VĚCI, KTERÉ SE NEDAJÍ UDĚLAT PROSTÝM OPSÁNÍM ALFY

1. MĚKKÁ ALFA. Skleněné ikony jsou průsvitné, takže velká část plochy má
   alfu někde mezi. Maska z ní udělá poloprůhlednou siluetu – duch, ne tvar.
   Změřeno na zdrojích: Power BI mělo 78 % pixelů poloprůhledných, Word 46 %,
   Python 46 %. Řeší se kontrastní křivkou (`KRIVKA_LO`…`KRIVKA_HI`), ne
   prahem: práh by na 26 px udělal zubaté okraje, křivka nechá hrany hladké
   a zvedne jen vnitřek.

2. DETAIL NESENÝ BARVOU, NE ALFOU. U palety jsou důlky na barvu namalované,
   ne vyříznuté – v alfa kanálu po nich není ani stopa. Silueta pak byla
   vejce s jednou dírkou a nikdo v ní paletu nepoznal. Proto se u vyjmenovaných
   ikon (`DIRY`) tmavé kruhové oblasti najdou v barvách a vyrazí se do masky
   jako díry. Kreslí se čisté kruhy, ne nalezený tvar: obrys z prahování je
   roztřepený o skleněné odlesky.

Krok 2 je schválně jen pro jmenovitě uvedené ikony. Heuristika, která by
běžela na všechno, by dřív nebo později vykousla díru tam, kde nemá.

Spouštět z kořene projektu:  python3 scripts/vyrob-masky-ikon.py
"""

import glob
import math
import os
import sys

from PIL import Image, ImageDraw

ZDROJ = "public/images/tools/glass"
CIL = "public/images/tools/maska"
HRANA = 64  # ukázky kreslí 26 px, na retině 52 – 64 je s rezervou

# Kontrastní křivka na alfu: co je pod LO zmizí, co je nad HI je plné,
# mezi tím se lineárně natáhne. Hrany mají přechod přes několik pixelů,
# takže zůstanou hladké; průsvitný vnitřek se zvedne na plný.
#
# Jedna křivka na všechno NEFUNGUJE a stálo mě to dvě kola měření:
#   • Power BI má sloupce průsvitné i uvnitř (alfa 44–162, plné je jen
#     orámování). Aby z nich byly plné sloupce, musí HI dolů k 50.
#   • Databáze má naopak alfu 255 skoro všude a k tomu vržený stín se slabou
#     alfou. Při HI=50 stín prošel do siluete jako boule na boku a mezery mezi
#     kotouči se slily do jedné hrudky.
# Proto je křivka po ikoně. Devět položek se uhlídat dá; univerzální vzorec,
# který občas ukousne, co nemá, ne.
KRIVKA_VYCHOZI = (18, 50)
KRIVKA: dict[str, tuple[int, int]] = {
    # Vržený stín má slabou alfu – LO musí být nad ním, jinak se přikreslí
    # k válci. Vyšší HI zachová mezery mezi kotouči, které dělají z válce
    # databázi.
    "databaze.png": (70, 200),
}

# Ikony, jejichž vnitřní kresba je barva, ne průhlednost. Hodnota = práh jasu,
# pod kterým se pixel počítá za „důlek".
DIRY = {
    "grafika-multimedia.png": 110,
}

# Kdy se nalezená oblast bere jako důlek: dost velká a dost kulatá.
DIRA_MIN_PX = 400
DIRA_MIN_KRUHOVOST = 0.65


def jas(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def najdi_dulky(im: Image.Image, prah: int) -> list[tuple[float, float, float]]:
    """Střed a poloměr tmavých kruhových oblastí uvnitř neprůhledné části."""
    w, h = im.size
    px = im.load()
    videno = bytearray(w * h)
    nalezy: list[tuple[float, float, float]] = []

    for y0 in range(h):
        for x0 in range(w):
            if videno[y0 * w + x0]:
                continue
            r, g, b, a = px[x0, y0]
            if a <= 200 or jas(r, g, b) >= prah:
                continue

            stack, body = [(x0, y0)], []
            videno[y0 * w + x0] = 1
            while stack:
                cx, cy = stack.pop()
                body.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not videno[ny * w + nx]:
                        rr, gg, bb, aa = px[nx, ny]
                        if aa > 200 and jas(rr, gg, bb) < prah:
                            videno[ny * w + nx] = 1
                            stack.append((nx, ny))

            if len(body) < DIRA_MIN_PX:
                continue
            xs = [p[0] for p in body]
            ys = [p[1] for p in body]
            sirka, vyska = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            polomer = (sirka + vyska) / 4
            if len(body) / (math.pi * polomer**2) < DIRA_MIN_KRUHOVOST:
                continue
            nalezy.append((sum(xs) / len(xs), sum(ys) / len(ys), polomer))

    return nalezy


def vyraz_dulky(alfa: Image.Image, dulky: list[tuple[float, float, float]]) -> int:
    """Vykreslí důlky do alfy jako díry. Vrací, kolik jich bylo."""
    if not dulky:
        return 0
    # Nalezená oblast je vždycky o kus větší než samotný důlek – zabírá
    # i stín kolem něj. Poloměr se proto srovná na medián a zmenší; jinak by
    # dva důlky, kterým stín splynul, vyšly jako obří kaňky.
    polomery = sorted(d[2] for d in dulky)
    median = polomery[len(polomery) // 2]
    kresli = ImageDraw.Draw(alfa)
    for sx, sy, _ in dulky:
        r = median * 0.8
        kresli.ellipse((sx - r, sy - r, sx + r, sy + r), fill=0)
    return len(dulky)


def main() -> int:
    if not os.path.isdir(ZDROJ):
        print(f"chybí {ZDROJ} – spusť z kořene projektu", file=sys.stderr)
        return 1
    os.makedirs(CIL, exist_ok=True)

    soubory = sorted(glob.glob(f"{ZDROJ}/*.png"))
    if not soubory:
        print(f"v {ZDROJ} nejsou žádné ikony", file=sys.stderr)
        return 1

    print(f"{'ikona':26s} {'barevná':>10s} {'maska':>9s}  poznámka")
    print("─" * 62)
    cel_zdroj = cel_cil = 0

    for p in soubory:
        nazev = os.path.basename(p)
        im = Image.open(p).convert("RGBA")

        alfa = im.split()[3]

        pozn = ""
        prah = DIRY.get(nazev)
        if prah is not None:
            kolik = vyraz_dulky(alfa, najdi_dulky(im, prah))
            pozn = f"vyraženo děr: {kolik}"

        # Kontrastní křivka až po vyražení děr – díra má být plná díra.
        lo, hi = KRIVKA.get(nazev, KRIVKA_VYCHOZI)
        rozsah = hi - lo
        alfa = alfa.point(
            lambda v: 0 if v <= lo else 255 if v >= hi else round((v - lo) * 255 / rozsah)
        )
        alfa = alfa.resize((HRANA, HRANA), Image.LANCZOS)

        maska = Image.new("LA", (HRANA, HRANA), (0, 0))
        maska.putalpha(alfa)

        ven = os.path.join(CIL, nazev)
        maska.save(ven, "PNG", optimize=True)

        z = os.path.getsize(p) / 1024
        c = os.path.getsize(ven) / 1024
        cel_zdroj += z
        cel_cil += c
        print(f"{nazev[:-4]:26s} {z:7.0f} kB {c:6.1f} kB  {pozn}")

    print("─" * 62)
    print(
        f"{'celkem':26s} {cel_zdroj:7.0f} kB {cel_cil:6.1f} kB"
        f"   (úspora {100 * (1 - cel_cil / cel_zdroj):.0f} %)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
