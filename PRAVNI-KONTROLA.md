# Právní kontrola webu

Stav k 1. 9. 2026. Prošel jsem web z pohledu ochrany osobních údajů,
autorského práva, licencí a toho, co web o sobě tvrdí.

**Nejsem právník.** Tohle je seznam toho, co jsem v kódu a v materiálech
skutečně našel, seřazený podle závažnosti. Co je nález, doložím; co je
domněnka, označím. Návrh textu o zpracování údajů je v souboru
[NAVRH-ZPRACOVANI-UDAJU.md](NAVRH-ZPRACOVANI-UDAJU.md) a je to podklad
k odsouhlasení, ne hotový dokument.

---

## 1 · Vysoká — chybí informace o zpracování osobních údajů

**Co se děje.** Ve virtuálním Windows (`/windows`) si žáci zakládají účty
a ukládá se jim postup na server. Ověřeno, že to na produkci **běží**:

```
$ curl https://karelhlas.vercel.app/api/postup/prihlaseni
Uloziste pripojene: ano
Podpis nastaveny:   ano
Synchronizace postupu bezi.
```

Na server jde přezdívka, otisk hesla (scrypt + sůl), seznam splněných úloh
a časy založení a posledního přihlášení. K omezení pokusů se navíc počítá
podle **IP adresy**, a ta je osobním údajem sama o sobě.

**Co je udělané dobře** a proč to není havárie:

- heslo se neukládá, jen scrypt s solí,
- přihlašovací obrazovka výslovně říká *„Přezdívku si vymysli, nepoužívej
  svoje jméno. Na server se uloží jen ona a seznam splněných úloh"*,
- je tam tlačítko **Přeskočit**, takže je to dobrovolné,
- v kontaktech je e-mail, takže se má kdo ozvat.

Je to tedy pseudonymní a dobrovolné. Přesto jde o zpracování osobních údajů,
a to **údajů nezletilých**.

**Co chybí**

| co | stav |
|---|---|
| stránka o zpracování údajů | **žádná** — cesty jsou jen `api`, `en`, `pro-ucitele`, `sql`, `windows` |
| kdo je správce | nikde |
| kdo jsou zpracovatelé | Vercel a Upstash nejsou zmínění |
| kde data leží | neuvedeno |
| jak dlouho se drží | **žádná expirace** — `expire` je jen na počítadlech pokusů |
| jak o výmaz požádat | neuvedeno |

**Návrh:** zveřejnit stránku o zpracování údajů (návrh přiložen), doplnit
účtům expiraci — nabízí se prázdninový úklid, třeba 12 měsíců od posledního
přihlášení — a doplnit na přihlašovací obrazovku odkaz na tu stránku.

---

## 2 · Střední — analytika bez zmínky

`@vercel/analytics/next` je v [layout.tsx](src/app/layout.tsx) a běží na všech
stránkách. Vercel Analytics nepoužívá cookies a údaje agreguje, takže
souhlas nejspíš nepotřebuje, ale **informační povinnost platí i tak**.
Dnes o něm web nikde nemluví.

**Návrh:** jeden odstavec v témže dokumentu jako bod 1.

---

## 3 · Střední — dvojí tvrzení o tom, čí web to je

`licenceNote` v sekci AI Hub říká, že *„AI Hub vzniká na Střední průmyslové
škole strojní a stavební Tábor v rámci mé práce koordinátora ICT"*.

Vazba na školu je pro grantovou žádost potřebná, ale s ní přichází otázka,
kterou v kódu rozhodnout nejde: **je provozovatelem webu Karel jako fyzická
osoba, nebo škola?** Na tom visí, kdo je správcem údajů z bodu 1 a kdo za
web odpovídá.

**Toto je otázka, ne nález.** V kódu je jen ta věta; skutečnost znáš ty.

---

## 4 · Nízká — značky cizích zdrojů

`digitalpromise.png`, `lifewire.png` a `meta.png` v `public/images/clanky/`
jsou siluety ochranných známek, které jsem vyrobil z log těch webů, aby
odkaz na článek nesl poznávací značku zdroje.

Použití cizí známky k označení zdroje, na který se odkazuje, je běžná praxe
a nepůsobí jako přivlastnění. Uvádím to pro úplnost — kdyby se to někomu
nelíbilo, jsou to tři soubory a jeden řádek v `content.ts`.

---

## Co je naopak v pořádku a nemusí se řešit

**Cizí materiály se nehostují.** Klatovského cvičebnice, iMyšlení i Microsoft
365 mají `_zdroj.json` s odkazem na originál a na disku po nich nic není.
Web to i říká: *„Cizí cvičebnice tu nehostuju, vede k nim jen odkaz na
původní zdroj."* Ověřeno u všech patnácti `_zdroj.json`.

**Balíček AI Fluency má vše, co má mít.** Je to jediná výjimka, kdy se cizí
dílo hostuje, a je pokrytá: `Licence a zdroj.txt` uvádí autory (Rick Dakan,
Joseph Feller, Anthropic), licenci CC BY-NC-SA 4.0, odkaz na originální kurz
i na plné znění licence. Web má **tutéž** licenci, takže podmínka „zachovej
licenci" je splněná.

**Vlastní materiály neobsahují osobní údaje.** Obrázky, zvuky i videa
v ukázkách vznikly programově, nejsou na nich žádné osoby. `foto_s_exif.jpg`
má metadata vymyšlená schválně a je to u něj napsané.

**Co zůstává v prohlížeči, zůstává v prohlížeči.** Virtuální Windows i SQL
hřiště ukládají stav do `localStorage`. To není zpracování na straně
provozovatele a přihlašovací obrazovka to tvrdí správně.

---

## Co jsem neposuzoval

- **Přístupnost.** Směrnice o přístupnosti webů míří na veřejný sektor.
  Jestli se na školní web vztahuje, je právní otázka, ne technická.
- **Jestli návrh textu obstojí.** Umím popsat, co se v kódu doopravdy děje.
  Jestli je ten popis právně dostatečný, musí posoudit člověk, který na to
  má razítko.
