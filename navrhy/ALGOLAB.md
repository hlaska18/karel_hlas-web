# ALGOLAB: koncepce a co zbývá

Dílna algoritmizace, 8 × 45 minut, pro 3. ročník. Běží jen v prohlížeči, bez účtů a serveru.
Adresa `/algolab`, zatím bez odkazu z webu a s `noindex`.

## Hodiny

| Hodina | Téma | Činnost | Stav |
| --- | --- | --- | --- |
| 1 | Efektivita algoritmů | Lineární a binární vyhledávání, podmínka seřazených dat | **hotová** |
| 2 | Rozděl a panuj | Merge Sort a Bubble Sort, rekurze | **hotová** |
| 3 | Dynamické programování | Nejlevnější cesta mřížkou | **hotová** |
| 4 | Dynamické programování | Problém batohu | **hotová** |
| 5 | Heuristiky | Nejbližší soused, 2-opt | **hotová** |
| 6 | Grafy a simulace | Dijkstra na hotové síti, náhodné výpadky spojů | **hotová** |
| 7 | Laboratoř efektivity | Dvojice na stejné úloze (níž) | **hotová** |
| 8 | Závěrečné ověření | Jediný výstup se známkou | **hotová** (níž) |

Předpoklady: proměnné, podmínky, cykly, pole. Rekurzi vysvětlí hodina 2.

Fáze každé lekce: problém 5 min, vlastní pokus 10, experiment 15, výzva 10, reflexe 5. Hodina 6 má vlastní rozpis:
zadání 5, pokus 7, krokovaný Dijkstra 8, simulace 10, interpretace 10, vyhodnocení 5.

Hodina 7 porovnává jen stejnou úlohu: lineární × binární vyhledávání, Bubble × Merge Sort, hrubá síla × DP u batohu,
hrubá síla × nejbližší soused a 2-opt u tras (vedle počtu operací i délka trasy). Hlavní metrika je počet operací, velikosti vstupů
omezené, nad limitem jen odhad.

## Hodina 8

| Část | Čas | Body | Jak se boduje |
| --- | --- | --- | --- |
| Rozpoznání strategie u čtyř situací | 8 min | 20 | automaticky |
| DP: doplnit tři buňky, význam buňky, dopad kapacity +1 | 12 min | 30 | automaticky, význam výběrem |
| Porovnání algoritmů | 12 min | 25 | automaticky |
| Zdůvodnění a kontrola, 2–3 krátké odpovědi | 13 min | 25 | učitel podle rubriky |

Rubrika: výběr algoritmu 0/5/10, souvislost postupu a výsledku 0/5/10, podmínka nebo omezení 0/2/5. Hranice známek určuje učitel.
Hodiny 1–7 se neznámkují.

Tok: učitel vytvoří odkaz s id zadání → žák napíše jméno, varianta vznikne deterministicky ze jména a id → žák nevidí správnost ani
body → zkopíruje jednu zprávu s čitelnými odpověďmi a kódem → učitel zprávy vloží do přehledu.

Musí platit:

- **Verze generátoru v kódu a zmrazený test.** Oprava generátoru nesmí změnit správné odpovědi u už odevzdaných prací.
- **Zdůvodnění i uvnitř kódu**, s limitem délky. Text vedle kódu se při hromadném vložení může spárovat špatně.
- **Ruční body se ukládají** v prohlížeči učitele, s exportem do CSV. Dnešní Přehled třídy si nic nepamatuje.
- **Podmínky zadání** ověřené strojově na tisících variant. Základ je v `src/lib/algolab/vyzva.ts`.
- **Vlastní prefix kódu** a vlastní sekce přehledu, jako u dílny. Formáty WIN1-, MAC1- a WSIT1- zůstávají beze změny.

Limity: bez serveru nejde ověřit totožnost. Kódy jsou podepsané a zamíchané (upravený se nenačte) a odpovědi se vyhodnotí jen s heslem zadání, ale kdo čte kód stránky, ochranu obejde. Hodí se na běžné školní hodnocení, ne na zabezpečenou zkoušku.
Žák si může spustit nástroje z lekcí v jiné kartě, proto se boduje porozumění, ne výsledek, který nástroj spočítá.

## Stav (8. 11. 2026)

Postavené jsou všechny hodiny 1–8, se žáky zatím neodučené. Kód je v `src/components/algolab/` (`Hodina1.tsx` až
`Hodina7.tsx`, `Zaverecne.tsx`, společné díly v `Kostra.tsx`) a `src/lib/algolab/`.

- Hodiny 1–7 nesou jeden kód postupu **ALG1-**. Hodina 8 má vlastní kód **ALGZ1-**.
- Hodina 8: učitel v části „Pro vyučující“ vytvoří zadání (6 znaků) a odkaz `/algolab?zaverecne=ID`. Žák během práce
  nevidí správnost, odevzdá a zkopíruje zprávu. Učitel vloží zprávy (i celé vlákno), body za části 1–3 se spočítají samy,
  rubriku část 4 vyplní učitel (uloží se v jeho prohlížeči), export do CSV. Cvičné ověření ukáže body a správné odpovědi.
- Splněno z „Musí platit“: `VERZE_GENERATORU` v kódu a zmrazený test (`zaverecne.zmrazene.test.ts`), zdůvodnění uvnitř
  kódu do 600 znaků, ruční body v prohlížeči učitele s CSV, 2000 variant ověřených testem, vlastní prefix a vlastní přehled.
