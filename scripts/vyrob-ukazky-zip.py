#!/usr/bin/env python3
"""
Sbalí každou složku s ukázkami (tu se souborem `_zdroje.txt`) do ZIPu
stejného jména vedle ní: `Obrázky/` → `Obrázky.zip`.

Podle složky, ne nějaké „Ukázky.zip": v bance pak stojí řádek „Obrázky"
přesně tím jménem, kterým na něj posílá pracovní list. A Bonus má složky
dvě (`Obrázky` i `Média`), takže by si jeden pevný název přepsaly.

Proč vůbec: banka takovou složku nevypisuje – osmnáct řádků `foto_jpeg_q*`
vedle sebe bylo přesně to, kvůli čemu byla Grafika nepřehledná. Jenže pracovní
listy na ty soubory posílají („Poslechni si dvojici (Média/)"), takže se k nim
učitel musí umět dostat. Jeden řádek se ZIPem to řeší, aniž by se seznam
zase rozsypal.

ZIP se generuje sem do `public/` a commituje. Nedělá se při buildu schválně:
na Vercelu by to znamenalo další krok, který se může rozbít, a tyhle ukázky
se mění jednou za rok. Že ZIP odpovídá složce, hlídá test v `materials.test.ts`.

Spuštění:  python3 scripts/vyrob-ukazky-zip.py
"""

from pathlib import Path
import zipfile

KOREN = Path(__file__).resolve().parent.parent / "public" / "materialy"
MARKER = "_zdroje.txt"

# Pevné datum: bez něj by měl každý běh jiné časy a ZIP by se v gitu měnil,
# i když se v něm fakticky nic nezměnilo.
CAS = (2026, 1, 1, 0, 0, 0)


def main() -> int:
    slozky = sorted(p.parent for p in KOREN.rglob(MARKER))
    if not slozky:
        print("Žádná složka s " + MARKER + " – není co balit.")
        return 1

    for slozka in slozky:
        cil = slozka.parent / f"{slozka.name}.zip"
        soubory = sorted(
            (p for p in slozka.iterdir() if p.is_file() and p.name != MARKER),
            key=lambda p: p.name,
        )
        if not soubory:
            print(f"přeskočeno (prázdné): {slozka}")
            continue

        with zipfile.ZipFile(cil, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for soubor in soubory:
                # Uvnitř ZIPu zůstane původní jméno složky („Obrázky/foto.png"),
                # aby cesty z pracovních listů seděly i po rozbalení.
                info = zipfile.ZipInfo(f"{slozka.name}/{soubor.name}", CAS)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                z.writestr(info, soubor.read_bytes())

        kb = cil.stat().st_size / 1024
        vzhledem = cil.relative_to(KOREN)
        print(f"{len(soubory):3d} souborů → {vzhledem}  ({kb:.0f} kB)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
