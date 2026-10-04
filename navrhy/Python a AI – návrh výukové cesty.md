# Python a umělá inteligence – návrh výukové cesty

**NÁVRH, NEODUČENO.** Vznikl podle auditu webu (4. 10. 2026, body 6.7, 6.10 a 9.7)
k Karlově recenzi. Na web nepatří, dokud ho Karel neupraví a neodučí. Délky jsou
odhad pro plánování, ne změřený čas. Nástroje jsou v bance u témat Python a Umělá
inteligence (složka „Online nástroje“, podmínky ověřené 10/2026).

---

## Python – šest navazujících úloh

Cíl celé cesty: žák napíše krátký program, sám ho otestuje na dvou vstupech a najde
v něm chybu. Na konci zpracuje malý soubor s daty z technické praxe.

Předpoklady: žák umí spustit program v prostředí, které škola používá (IDLE, Thonny,
nebo JupyterLite v prohlížeči). V každé úloze je jedna typická chyba, kterou má žák
najít, a aspoň dva vstupy na ověření.

| # | Téma | Úloha (výstup žáka) | Typická chyba k odhalení | Ověření |
| --- | --- | --- | --- | --- |
| 1 | Proměnná a vstup | Program se zeptá na délku a šířku desky a vypíše plochu v m². | `input()` vrací text – `"2" * "3"` nejde, `"2" + "3"` dá `"23"`. | 2 × 3 → 6; 0,5 × 4 → 2 (desetinná čárka × tečka) |
| 2 | Podmínka | Podle naměřeného průměru hřídele vypíše „vyhovuje“ / „nevyhovuje“ (tolerance ± 0,05 mm). | Hraniční hodnota: `<` místo `<=`. | přesně na hranici; těsně mimo |
| 3 | Cyklus | Vypíše tabulku spotřeby materiálu pro 1 až 10 kusů. | `range(1, 10)` končí u 9. | první a poslední řádek tabulky |
| 4 | Seznam | Z naměřených hodnot najde největší, nejmenší a průměr – bez `max()`, `min()`. | Počáteční hodnota maxima 0 u samých záporných čísel. | seznam s jedním prvkem; samá záporná čísla |
| 5 | Funkce a test | Funkce `plocha_kruhu(d)`; žák napíše 3 kontroly `assert`. | Poloměr × průměr; zaokrouhlení v testu. | `d = 0`, `d = 2`, desetinné `d` |
| 6 | Malý CSV | Ze souboru měření (rozměr;hmotnost) najde vadné řádky a spočítá součet hmotností. | Prázdný řádek, desetinná čárka, chybějící hodnota. | soubor s jedním vadným řádkem |

Python Tutor (krokování po řádcích) se hodí k úlohám 3–5. Žák uvidí, kdy se proměnná
změní, a pozná, proč program dělá něco jiného, než čekal. Kód se tam spouští na
serveru provozovatele, nejvýš asi 10 sekund – jen na krátké ukázky.

Hodnocení: funkčnost na připravených vstupech, nalezená a vysvětlená chyba, vlastní
test. Ne délka kódu.

---

## Umělá inteligence – šest hodin

Cíl: žák pochopí, že model se učí z příkladů a dělá chyby podle toho, z čeho se učil,
a že výstup generativní AI se musí ověřit. Hodnotí se vysvětlení a kontrola, ne délka
promptu.

| Hodina | Co se děje | Výstup žáka |
| --- | --- | --- |
| 1 | Pravidlo × učení z příkladů × generování. Třída třídí situace (filtr spamu, kalkulačka, chatbot). | Krátké zdůvodnění u tří příkladů |
| 2 | Teachable Machine: dvě třídy předmětů z webkamery (ne obličeje spolužáků), trénink, test na jiném pozadí. | Záznam: kde model selhal a proč |
| 3 | Zkreslení dat: model natrénovaný jednostranně. Porovnat výsledky na trénovacích a nových příkladech. | Návrh, jak doplnit data |
| 4 | Generativní AI a ověřování: model vysvětlí odborný pojem, žák najde tvrzení, která je potřeba doložit, a opraví je podle důvěryhodných zdrojů. | Opravený text se zdroji |
| 5 | AI jako nápověda: žák si nechá poradit s úlohou, vysvětlí řešení vlastními slovy a porovná ho s vlastním rozhodnutím. | Vysvětlení + co převzal a co ne |
| 6 | Malý závěrečný úkol s přiznáním použití AI (stejné pravidlo jako v hodině 8 grafiky), vlastním testem a popisem chyby nebo omezení. | Úkol s technickým listem |

Volitelně pro technické lyceum: TensorFlow Playground. Žák mění data, šum a počet
vrstev a porovnává chybu na trénovacích a testovacích datech.

Chatbot pro hodiny 4–6 se vybírá podle toho, co škola má. Před hodinou je potřeba
ověřit skutečný účet a to, jestli ho správce povolil i žákům (u Copilot Chat a
Gemini rozhoduje správce školy).

---

## Co je potřeba udělat, než se z toho stane materiál

1. Karel vybere, co z toho chce učit, a upraví délky podle svých hodin.
2. Připravit soubory: zadání úloh a data (CSV z úlohy 6), řešení do `_ucitel`.
3. Odučit aspoň jednou a teprve pak dát do banky. Nepopisovat jako odučené dřív.
