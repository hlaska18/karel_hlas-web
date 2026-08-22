#!/usr/bin/env python3
"""
Vyrobí z barevných skleněných ikon malé masky pro CSS `mask-image`.

Proč: ukázky materiálů v úvodu kreslí ikonu tématu jako šedou siluetu.
Maska přitom bere obrázek ze surové cesty, tedy mimo `next/image` – a stahoval
se kvůli tomu plný 512px PNG (170–380 kB) jen proto, aby se z něj vykreslil
tvar o velikosti 26 px. Na úvodní stránce to dělalo 880 kB navíc.

Maska potřebuje jen alfa kanál a jen v rozlišení, ve kterém se kreslí.
Devět masek dohromady váží kolem 13 kB místo 2,6 MB.

Barevné ikony zůstávají – používají je dlaždice v bance, kde jsou velké.

Spouštět z kořene projektu:  python3 scripts/vyrob-masky-ikon.py
"""

import glob
import os
import sys

from PIL import Image

ZDROJ = "public/images/tools/glass"
CIL = "public/images/tools/maska"
HRANA = 64  # ukázky kreslí 26 px, na retině 52 – 64 je s rezervou


def main() -> int:
    if not os.path.isdir(ZDROJ):
        print(f"chybí {ZDROJ} – spusť z kořene projektu", file=sys.stderr)
        return 1
    os.makedirs(CIL, exist_ok=True)

    soubory = sorted(glob.glob(f"{ZDROJ}/*.png"))
    if not soubory:
        print(f"v {ZDROJ} nejsou žádné ikony", file=sys.stderr)
        return 1

    print(f"{'ikona':26s} {'barevná':>10s} {'maska':>9s}")
    print("─" * 48)
    cel_zdroj = cel_cil = 0

    for p in soubory:
        nazev = os.path.basename(p)
        im = Image.open(p).convert("RGBA")

        # Maska se řídí alfa kanálem, barvy jsou jí lhostejné. Ukládá se jako
        # šedotónový obrázek s alfou – prohlížeč z něj vezme právě průhlednost.
        alfa = im.split()[3].resize((HRANA, HRANA), Image.LANCZOS)
        maska = Image.new("LA", (HRANA, HRANA), (0, 0))
        maska.putalpha(alfa)

        ven = os.path.join(CIL, nazev)
        maska.save(ven, "PNG", optimize=True)

        z = os.path.getsize(p) / 1024
        c = os.path.getsize(ven) / 1024
        cel_zdroj += z
        cel_cil += c
        print(f"{nazev[:-4]:26s} {z:7.0f} kB {c:6.1f} kB")

    print("─" * 48)
    print(
        f"{'celkem':26s} {cel_zdroj:7.0f} kB {cel_cil:6.1f} kB"
        f"   (úspora {100 * (1 - cel_cil / cel_zdroj):.0f} %)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
