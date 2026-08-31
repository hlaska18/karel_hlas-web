# Jazyková a logická kontrola

Stav k 1. 9. 2026. Prošel jsem texty webu v obou jazycích a materiály —
111 souborů, zhruba 723 tisíc znaků prózy.

Seznam je řazený podle závažnosti. **Poctivá zpráva zní, že nálezů je málo.**
Většina toho, co automatické kontroly vyhodily, byly plané poplachy z mého
vlastního nástroje, ne chyby v textech; píšu je sem taky, aby bylo vidět, co
se prověřovalo a proč to prošlo.

---

## Opraveno

### Rozcestník tématu Umělá inteligence mlčel o jedné složce

`1L/10/Začni zde.txt` má sekci **STRUKTURA**, která popisuje, co je
v balíčku. Vyjmenovávala pět složek, ale složka **`Doporučené čtení`**
mezi nimi nebyla — přestože na disku je a vede z ní odkaz na příručku
„101 tipů, jak využít AI ve výuce" Karla Klatovského.

Učitel, který si balíček stáhne a řídí se rozcestníkem, by o ní nevěděl.
Doplněno, včetně poznámky, že to není součást hodin, ale čtení navíc.

---

## Prověřeno a v pořádku

### Čeština a angličtina na webu si odpovídají

216 klíčů v každém jazyce, **strom sedí přesně** — žádný chybějící ani
přebývající řetězec. Prošel jsem i všech osm popisů předmětů v sekci
„Pro ostatní předměty" po dvojicích: český i anglický text mluví o tomtéž
předmětu a překlady jsou idiomatické, ne doslovné.

> Během kontroly to chvíli vypadalo, že si čeština a angličtina u předmětů
> neodpovídají — že český text popisuje matematiku a anglický chemii. Byla
> to chyba mého výběru, ne webu: bral jsem první výskyt klíče v každém
> stromě a ty nebyly tytéž. Po správném spárování všech osm sedí.

### Čísla v dokumentech odpovídají skutečnosti

Ověřeno proti souborům na disku:

| téma | tvrzení | skutečnost |
|---|---|---|
| Umělá inteligence | 6 prezentací po 7 snímcích, 6 hodin | 6 × 7 ✓ |
| Grafika a multimédia | 8 prezentací po 7 snímcích, celkem 56 · 5 modulů ve 4 laboratořích | 8 × 7 = 56 ✓ · 5 modulů ve 4 ✓ |
| Internet a bezpečnost | 10 hodin, každá 7 snímků | 10 × 7 ✓ |

### Texty nejsou slepené

Automatická kontrola nejdřív ohlásila 62 míst, kde věta navazuje bez mezery
(`…ai-fluencyV sadě využito`, `…data.csvOdevzdej:`). **Všechna byla planá.**
V dokumentu je mezi nimi `<w:br/>`, tedy zalomení řádku, a ve Wordu se to
zobrazí správně na dvou řádcích — jen můj extraktor zalomení zahazoval.
Po opravě extraktoru zbyly samé oprávněné názvy typu OneDrive, PowerShell,
Get-FileHash nebo LibreOffice.

### Tykání sedí

Kontrola našla vykání ve čtyřech prezentacích, ale ve všech případech jde
o **přímou řeč učitele ke třídě** („Napište si svou odpověď…"), kde je
množné číslo správně — je to i pravidlo, na kterém jsme se shodli dřív.

### Dlaždice jsou všude stejně vysoké

Změřeno na 768 a 1440 px, na homepage i s otevřeným tématem v bance:
**žádná mřížka nemá v řádku různě vysoké karty.** Ta v „Pro ostatní
předměty" byla jediná a je opravená (`3895a40`).

---

## Co jsem nestihl přečíst pozorně

Automatické kontroly proběhly nad **všemi** 111 soubory. Pozorné čtení
věta po větě je ale u 723 tisíc znaků jiná disciplína a to jsem nezvládl
celé — prošel jsem takto Grafiku a Umělou inteligenci, u Internetu
a bezpečnosti a Digitální gramotnosti jsem se opíral hlavně o automatiku.

**Co z toho plyne:** stylistické a věcné chyby v těch dvou tématech můžou
existovat a tenhle dokument je nevylučuje. Chyby v číslech, v odkazech na
soubory, v tykání a v typografii vyloučit můžu — na ty jsem měl nástroj
a projel jsem jimi všechno.
