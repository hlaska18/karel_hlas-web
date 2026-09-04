#!/usr/bin/env python3
"""
Vyrobí skleněnou ikonu Hudební výchovy do sady předmětů.

PROČ SKRIPTEM A NE GENERÁTOREM. Sedm stávajících ikon (`e7fa606`) vzniklo
generováním obrázku a pozadí se z nich ořezávalo lokálně. Tady generátor
k dispozici nebyl, takže se ikona kreslí – ale musí do sady zapadnout, ne
vypadat jako cizí prvek. Sada má společné znaky, které se drží i tady:

  * 384 × 384, průhledné pozadí, žádný vržený stín
    (`odstran-stin-ikony.py` vznikl právě proto, že stín na dlaždici svítil),
  * jeden zelený tón, světlo zleva shora, bílý odlesk,
  * VYPOUKLÝ tvar – přesně ten předpoklad, na kterém stojí `vyrob-masky-ikon.py`
    i odstraňovač stínu (hledají v každé řádce rozpětí krycích pixelů).

JAK VZNIKÁ VYPOUKLOST. Ne gradientem – ten na složitějším tvaru vypadá plochý.
Z masky se spočítá vzdálenost od okraje (`distance_transform_edt`), ta se vezme
jako výška a z jejího spádu se dopočítá normála. Zbytek je obyčejné Lambertovo
nasvícení plus zrcadlový odlesk. Tvar tím zůstane čitelný i v 56 px na dlaždici,
protože hrany zesvětlí samy od sebe.

Kreslí se v osminásobku a zmenšuje, takže hrany nejsou zubaté.

Spouštět z kořene projektu:
    python3 scripts/vyrob-ikonu-hudebni-vychovy.py
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt

HRANA = 384
NASOBEK = 8
S = HRANA * NASOBEK

# Paleta odečtená ze stávajících ikon: průměr těla #5fb380–#7ab997,
# odlesky až k bílé, stíny do tmavě zelené.
ZAKLAD = np.array([0x5c, 0xba, 0x86], dtype=float)
STIN = np.array([0x1e, 0x5c, 0x3c], dtype=float)
SVETLO = np.array([0xf2, 0xff, 0xf7], dtype=float)


def maska_osminove_noty() -> Image.Image:
    """Osminová nota: hlavička, nožička, praporek. Vše v soustavě 384 × 384."""
    im = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(im)
    k = NASOBEK

    def xy(*body):
        return [(x * k, y * k) for x, y in body]

    # Hlavička – nakloněná elipsa. Kreslí se zvlášť a otočí, protože
    # PIL neumí elipsu pod úhlem.
    hlavicka = Image.new("L", (150 * k, 118 * k), 0)
    ImageDraw.Draw(hlavicka).ellipse([0, 0, 150 * k - 1, 118 * k - 1], fill=255)
    hlavicka = hlavicka.rotate(20, resample=Image.BICUBIC, expand=True)
    im.paste(hlavicka, (58 * k, 214 * k), hlavicka)

    # Nožička – svislý zaoblený pruh od hlavičky nahoru.
    d.rounded_rectangle(xy((188, 66), (222, 288)), radius=17 * k, fill=255)

    # Praporek – ne polygon. Ostré cípy vypadaly jako vystřižený papír,
    # takže se kreslí jako zužující se stopa: po kvadratické křivce se
    # sázejí kruhy s klesajícím poloměrem. Výsledek je plynulý a zúžený
    # konec vypadá jako u sázené noty.
    def bezier(t_, a, b, c):
        return ((1 - t_) ** 2 * a[0] + 2 * (1 - t_) * t_ * b[0] + t_**2 * c[0],
                (1 - t_) ** 2 * a[1] + 2 * (1 - t_) * t_ * b[1] + t_**2 * c[1])

    A, B, C = (210, 74), (312, 108), (272, 210)
    for i in range(240):
        t_ = i / 239
        x, y = bezier(t_, A, B, C)
        r = (30 - 21 * t_**1.35) * k          # od 30 px k 9 px
        d.ellipse([x * k - r, y * k - r, x * k + r, y * k + r], fill=255)

    # Drobné zaoblení spojů; práh vrátí ostrou masku.
    im = im.filter(ImageFilter.GaussianBlur(1.6 * k))
    im = im.point(lambda p: 255 if p > 128 else 0)
    return im


def nasvit(maska: Image.Image) -> Image.Image:
    m = np.asarray(maska, dtype=float) / 255.0
    uvnitr = m > 0.5

    # Výška = vzdálenost od okraje, zastropovaná, ať je tvar vypouklý,
    # ale ne špičatý uprostřed.
    vzdalenost = distance_transform_edt(uvnitr)
    strop = 26.0 * NASOBEK
    vyska = np.clip(vzdalenost / strop, 0, 1) ** 0.55

    # Normála ze spádu výšky. Měřítko určuje, jak „nafouklá" ikona působí.
    gy, gx = np.gradient(vyska * (strop * 0.9))
    nx, ny, nz = -gx, -gy, np.ones_like(vyska)
    delka = np.sqrt(nx**2 + ny**2 + nz**2)
    nx, ny, nz = nx / delka, ny / delka, nz / delka

    # Světlo zleva shora, stejně jako u zbytku sady.
    L = np.array([-0.42, -0.62, 0.66])
    L = L / np.linalg.norm(L)
    lam = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)

    # Zrcadlový odlesk – úzký, aby to působilo jako sklo, ne jako plast.
    H = (L + np.array([0, 0, 1.0]))
    H = H / np.linalg.norm(H)
    spec = np.clip(nx * H[0] + ny * H[1] + nz * H[2], 0, 1) ** 18

    barva = STIN[None, None, :] + (ZAKLAD - STIN)[None, None, :] * (0.52 + 0.48 * lam)[..., None]
    barva = barva + (SVETLO - barva) * (0.72 * spec)[..., None]

    # Prosvětlení dovnitř od okraje: sklo u kraje propouští víc světla.
    okraj = np.clip(1.0 - vzdalenost / (14.0 * NASOBEK), 0, 1) ** 2
    barva = barva + (SVETLO - barva) * (0.22 * okraj)[..., None]

    rgb = np.clip(barva, 0, 255).astype(np.uint8)
    alfa = (np.clip(m, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alfa]), mode="RGBA")


def main() -> None:
    ikona = nasvit(maska_osminove_noty())
    ikona = ikona.resize((HRANA, HRANA), Image.LANCZOS)

    # Jemné zrno – stávající ikony ho mají po generátoru a bez něj
    # nová vypadá vedle nich jako vektor.
    r = np.random.default_rng(7)
    pole = np.asarray(ikona, dtype=float)
    sum_ = r.normal(0, 3.1, pole.shape[:2])[..., None]
    pole[..., :3] = np.clip(pole[..., :3] + sum_, 0, 255)
    ikona = Image.fromarray(pole.astype(np.uint8), mode="RGBA")

    cesta = "public/images/subjects/hudebni-vychova.png"
    ikona.save(cesta)
    print(f"  hotovo: {cesta}  {ikona.size}")


if __name__ == "__main__":
    main()
