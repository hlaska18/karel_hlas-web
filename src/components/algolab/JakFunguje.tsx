"use client";

/**
 * Karty „Jak to funguje“: vysvětlení každého algoritmu (Karel 8. 11. 2026).
 * Stojí na začátku experimentu, tedy až po vlastním pokusu žáka.
 *
 * Psáno pro člověka, který o algoritmu nikdy neslyšel (Karel 9. 11. 2026):
 * přirovnání z běžného života, krátké věty, každý pojem vysvětlený, příklad
 * na malých číslech krok za krokem. Python bez triků (žádné zip, [::-1], 1 << i).
 *
 * Texty nesmí prozradit odpověď na „Tipni si nejdřív“ ve stejné části
 * (např. jestli nejbližší soused najde nejkratší trasu, kolik porovnání
 * potřebuje Merge Sort) ani na otázky v reflexi hodiny 3 a 6.
 * Zápisy v Pythonu jsou ověřené spuštěním na číslech z hodin
 * (mřížka 28 s, batoh 51, Dijkstra 16 min, nejbližší soused 313,6 km, 2-opt 253,6 km).
 */

import { isValidElement, useMemo, useState, type ReactNode } from "react";
import { Obrazem, SNIMKY } from "./Obrazem";

export type Algoritmus =
  | "linearni"
  | "binarni"
  | "bubble"
  | "merge"
  | "mrizka"
  | "batoh"
  | "hrubabatoh"
  | "hrubatrasy"
  | "soused"
  | "dvaopt"
  | "dijkstra"
  | "simulace";

interface Vysvetleni {
  nazev: string;
  myslenka: ReactNode;
  postup: ReactNode[];
  priklad: ReactNode;
  pozor: ReactNode;
  python: string;
}

const VYSVETLENI: Record<Algoritmus, Vysvetleni> = {
  linearni: {
    nazev: "Lineární vyhledávání (jedno po druhém)",
    myslenka:
      "Jako když hledáš klíče a prohledáváš kapsy jednu po druhé. Počítač se dívá na položky od první, dokud tu hledanou nenajde, nebo nedojde na konec.",
    postup: [
      "Podívej se na první položku.",
      "Je to ta, kterou hledáš? Hotovo.",
      "Není? Podívej se na další.",
      "Došel(a) jsi na konec a nenašel(a) ji? Pak tam není.",
    ],
    priklad: "Hledáš číslo 9 v řadě 4, 7, 9, 2. Podíváš se na 4 (ne), na 7 (ne), na 9 (ano). Stačily tři kroky.",
    pozor: "Funguje vždycky, i když položky nejsou nijak seřazené. Když je jich ale hodně, trvá to dlouho.",
    python: `def linearni(seznam, hledane):
    for i in range(len(seznam)):      # i = 0, 1, 2, … (pozice v seznamu)
        if seznam[i] == hledane:      # je to ono?
            return i                  # ano: vrať pozici
    return -1                         # došli jsme na konec: není tam`,
  },
  binarni: {
    nazev: "Binární vyhledávání (půlení)",
    myslenka: (
      <>
        Jako hra „Myslím si číslo od 1 do 100“. Řekneš 50 a uslyšíš „víc“. Čísla 1 až 50 už zkoušet nemusíš, jednou otázkou jsi{" "}
        <b>vyřadil(a) polovinu</b>. Binární vyhledávání dělá totéž: podívá se doprostřed a polovinu, kde hledané být nemůže, zahodí.
        Binární znamená „dvojkový“: zbytek se pokaždé dělí na dvě části.
      </>
    ),
    postup: [
      "Otevři krabici přesně uprostřed řady.",
      "Je v ní hledané číslo? Hotovo.",
      "Je hledané číslo menší než to v krabici? Dál hledej jen v levé polovině. Je větší? Jen v pravé.",
      "Se zbylou polovinou udělej totéž: otevři její prostřední krabici.",
      "Když už žádná krabice nezbývá, hledané číslo tam není.",
    ],
    priklad:
      "Krabice mají čísla 3, 8, 12, 20, 25, 31, 40 a hledáš 25. Uprostřed je 20. Hledané 25 je větší, zbývá 25, 31, 40. Uprostřed je 31. Hledané 25 je menší, zbývá jen 25. Otevřeš ji a máš ho. Stačily tři kroky.",
    pozor:
      "V tomhle skladu jsou krabice seřazené od nejmenšího čísla po největší. Co když nejsou, vyzkoušíš v části Neseřazený sklad.",
    python: `def binarni(seznam, hledane):
    od = 0                            # první pozice úseku
    do = len(seznam) - 1              # poslední pozice úseku
    while od <= do:                   # dokud v úseku něco zbývá
        stred = (od + do) // 2        # prostřední pozice (// = dělení bez zbytku)
        if seznam[stred] == hledane:
            return stred              # našli jsme ho
        if hledane < seznam[stred]:
            do = stred - 1            # hledej jen vlevo od středu
        else:
            od = stred + 1            # hledej jen vpravo od středu
    return -1                         # úsek je prázdný: není tam`,
  },
  bubble: {
    nazev: "Bubble Sort (bublinkové řazení)",
    myslenka:
      "Porovnává vždycky jen dvě karty vedle sebe. Když je větší vlevo, prohodí je. Největší karta se tak posouvá doprava jako bublina, která ve vodě stoupá nahoru. Odtud název: bubble je anglicky bublina.",
    postup: [
      "Porovnej první a druhou kartu. Je levá větší? Prohoď je.",
      "Posuň se o kartu dál: porovnej druhou a třetí, pak třetí a čtvrtou… až na konec řady. Tomu se říká jeden průchod.",
      "Po prvním průchodu je největší karta úplně vpravo. Tam už zůstane.",
      "Projdi řadu znovu, ale jen po poslední nehotovou kartu.",
      "Opakuj, dokud není seřazená celá řada.",
    ],
    priklad:
      "Karty 5, 1, 4, 2. První průchod: 5 a 1 prohodit (1, 5, 4, 2), 5 a 4 prohodit (1, 4, 5, 2), 5 a 2 prohodit (1, 4, 2, 5). Pětka je na konci. Druhý průchod: 1 a 4 nechat, 4 a 2 prohodit (1, 2, 4, 5). Třetí průchod: 1 a 2 nechat. Hotovo.",
    pozor: "Je velmi jednoduchý. Když je ale karet hodně, musí jich porovnat opravdu hodně.",
    python: `def bubble_sort(karty):
    n = len(karty)
    for pruchod in range(n - 1):              # n − 1 průchodů řadou
        for i in range(n - 1 - pruchod):      # konec řady už je hotový
            if karty[i] > karty[i + 1]:       # levá je větší než pravá?
                pom = karty[i]                # prohoď je
                karty[i] = karty[i + 1]
                karty[i + 1] = pom
    return karty`,
  },
  merge: {
    nazev: "Merge Sort (řazení sléváním): rozděl a panuj",
    myslenka: (
      <>
        <b>Rozděl a panuj</b> je trik: velkou úlohu rozsekáš na malé, které jsou snadné, a výsledky pak složíš dohromady. Merge Sort
        půlí balík karet tak dlouho, až zbudou jednotlivé karty. Jedna karta je seřazená vždycky. Pak hromádky slévá zpátky dohromady
        tak, aby zůstaly seřazené. Merge je anglicky slít, spojit.
      </>
    ),
    postup: [
      "Rozpůl balík na dvě hromádky. Každou hromádku znovu rozpůl. Pokračuj, dokud nemáš hromádky po jedné kartě.",
      "Teď slévej dvě sousední hromádky do jedné. Podívej se na vrchní, tedy nejmenší kartu obou hromádek a menší z nich polož do nové hromádky.",
      "Opakuj, dokud jedna hromádka nedojde. Zbytek druhé dej na konec, ten už je seřazený.",
      "Slévej dál větší a větší hromádky, až zbude jediná. To je celý seřazený balík.",
    ],
    priklad:
      "Slévání hromádek 2, 7 a 3, 5: porovnáš 2 a 3, vezmeš 2. Porovnáš 7 a 3, vezmeš 3. Porovnáš 7 a 5, vezmeš 5. Pravá hromádka došla, zbylou sedmičku dáš na konec: 2, 3, 5, 7.",
    pozor:
      "Program na seřazení půlky použije sám sebe: „seřaď půlku“ dělá stejným postupem jako „seřaď balík“. Tomu se říká rekurze. Musí mít konec, tady je to hromádka s jednou kartou. Bez něj by se půlilo donekonečna.",
    python: `def merge_sort(karty):
    if len(karty) <= 1:                   # jedna karta: není co řadit
        return karty
    stred = len(karty) // 2
    leva = merge_sort(karty[:stred])      # levou půlku seřaď stejně
    prava = merge_sort(karty[stred:])     # pravou půlku taky
    # slévání: vždy vezmi menší z vrchních karet
    vysledek = []
    i = 0                                 # vrchní karta levé hromádky
    j = 0                                 # vrchní karta pravé hromádky
    while i < len(leva) and j < len(prava):
        if leva[i] <= prava[j]:
            vysledek.append(leva[i])
            i = i + 1
        else:
            vysledek.append(prava[j])
            j = j + 1
    # jedna hromádka došla, zbytek druhé přidej na konec
    vysledek = vysledek + leva[i:] + prava[j:]
    return vysledek`,
  },
  mrizka: {
    nazev: "Dynamické programování: nejrychlejší cesta halou",
    myslenka: (
      <>
        Nezkouší všechny cesty. Vede si tabulku a do každého pole zapíše, za kolik sekund se na něj dá ze startu nejrychleji dojet.
        Každé nové číslo spočítá z čísel, která už má zapsaná. Tomuhle postupu se říká <b>dynamické programování</b>: výsledek velké úlohy
        skládáš z výsledků malých úloh a ty si zapisuješ, abys je nemusel(a) počítat znovu.
      </>
    ),
    postup: [
      "Vozík jede jen doprava, nebo dolů. Do každého pole se tedy dá přijet jen zleva, nebo shora.",
      "Do startu napiš jeho čas.",
      "Pole v horním řádku: číslo pole vlevo plus čas tohoto pole. Pole v levém sloupci: číslo pole nad ním plus čas tohoto pole.",
      "Každé další pole: vezmi menší z čísel vlevo a nahoře a přičti čas tohoto pole.",
      "Postupuj po řádcích zleva doprava. Číslo v cíli je nejrychlejší čas celé cesty.",
      "Kudy cesta vede, zjistíš pozpátku: z cíle jdi vždycky na to pole (vlevo, nebo nahoru), ze kterého jsi menší číslo vzal(a).",
    ],
    priklad:
      "Hala 2 × 2: nahoře pole s časy 1 a 2, dole 3 a 4. Start: 1. Vpravo od něj: 1 + 2 = 3. Pod ním: 1 + 3 = 4. Cíl: menší z čísel 3 a 4 je 3, plus 4 je 7. Nejrychlejší cesta trvá 7 sekund a vede doprava, pak dolů.",
    pozor:
      "Záleží na pořadí. Když počítáš po řádcích zleva doprava, máš oba sousedy pole spočítané dřív než pole samotné.",
    python: `def nejkratsi_cas(hala):          # hala[r][s] = sekundy průjezdu polem
    radku = len(hala)
    sloupcu = len(hala[0])
    t = [[0] * sloupcu for r in range(radku)]   # tabulka samých nul
    for r in range(radku):                      # po řádcích shora
        for s in range(sloupcu):                # v řádku zleva
            if r == 0 and s == 0:
                predtim = 0                     # start
            elif r == 0:
                predtim = t[r][s - 1]           # horní řádek: jen zleva
            elif s == 0:
                predtim = t[r - 1][s]           # levý sloupec: jen shora
            else:
                predtim = min(t[r - 1][s], t[r][s - 1])   # rychlejší soused
            t[r][s] = predtim + hala[r][s]
    return t[radku - 1][sloupcu - 1]            # číslo v cíli`,
  },
  batoh: {
    nazev: "Dynamické programování: problém batohu",
    myslenka: (
      <>
        Název je podle hádanky: do batohu se vejde jen určitá váha a ty chceš naskládat věci co nejvyšší ceny. Tady je „batoh“ stroj
        s 10 hodinami a věci jsou zakázky. Tabulka zjišťuje nejlepší přínos nejdřív pro malé úlohy a z nich skládá větší.{" "}
        <b>Řádek</b> říká, které zakázky smíš použít (žádnou, první, první dvě…). <b>Sloupec</b> říká, kolik hodin má stroj. Číslo
        v buňce je nejvyšší přínos, jaký se za těchto podmínek dá získat.
      </>
    ),
    postup: [
      "Řádek „žádná zakázka“ a sloupec 0 h jsou samé nuly: bez zakázek nebo bez času nic nevyděláš.",
      "U každé další buňky se zeptej: vyplatí se vzít zakázku z tohoto řádku?",
      "Nevzít: přínos je stejný jako v buňce přímo nad.",
      "Vzít (jen když se do hodin vejde): přínos zakázky plus číslo z řádku nad, ve sloupci s hodinami, které zbudou. Řádek nad proto, že stejnou zakázku nejde udělat dvakrát.",
      "Do buňky napiš větší z obou čísel.",
      "Pravý dolní roh je nejlepší přínos. Které zakázky to jsou, zjistíš pozpátku: kde se číslo liší od čísla nad ním, tam se zakázka vzala.",
    ],
    priklad:
      "Stroj má 3 h. Zakázka 1 trvá 2 h a má přínos 3, zakázka 2 trvá 1 h a má přínos 2. V řádku zakázky 1 je pro 0 a 1 h nula (nevejde se), pro 2 a 3 h přínos 3. Řádek zakázky 2, sloupec 3 h: nevzít dá 3. Vzít dá 2 plus číslo nad ve sloupci 3 − 1 = 2 h, tedy 2 + 3 = 5. Větší je 5, vyplatí se vzít obě.",
    pozor:
      "Doby zakázek musí být v celých hodinách. Jinak by tabulka potřebovala sloupec třeba pro každou minutu. Tabulka roste s počtem zakázek i s počtem hodin stroje.",
    python: `def batoh(ukoly, hodin):          # ukoly = [(doba, prinos), ...]
    n = len(ukoly)
    # tabulka: n + 1 řádků (0 až n úkolů), hodin + 1 sloupců (0 až hodin)
    t = [[0] * (hodin + 1) for r in range(n + 1)]
    for i in range(1, n + 1):             # řádek i = smíš brát úkoly 1 až i
        doba = ukoly[i - 1][0]
        prinos = ukoly[i - 1][1]
        for h in range(hodin + 1):        # sloupec h = stroj má h hodin
            nevzit = t[i - 1][h]          # číslo přímo nad buňkou
            if doba <= h:                 # úkol se do h hodin vejde
                vzit = prinos + t[i - 1][h - doba]
                t[i][h] = max(nevzit, vzit)
            else:
                t[i][h] = nevzit
    return t[n][hodin]                    # pravý dolní roh`,
  },
  hrubabatoh: {
    nazev: "Hrubá síla u batohu",
    myslenka:
      "Hrubá síla znamená: vyzkoušej úplně všechno, nic nevynechej. Počítač projde každý možný výběr zakázek, spočítá jeho dobu a přínos a nechá si nejlepší výběr, který se do hodin vejde.",
    postup: [
      "U každé zakázky jsou dvě možnosti: vzít, nebo nevzít.",
      "Sestav všechny výběry, i ten prázdný.",
      "U každého výběru sečti doby a přínosy.",
      "Vejde se do hodin a má větší přínos než dosud nejlepší? Zapamatuj si ho.",
    ],
    priklad:
      "Zakázky A a B dávají 4 výběry: nic, jen A, jen B, A i B. Se třemi zakázkami je výběrů 8. Každá další zakázka počet výběrů zdvojnásobí: 2 · 2 · 2 = 8, píše se 2³ (čti „dvě na třetí“).",
    pozor: "Nejlepší výběr najde vždycky. U 30 zakázek by ale výběrů bylo přes miliardu.",
    python: `from itertools import product

def batoh_hrubou_silou(ukoly, hodin):    # ukoly = [(doba, prinos), ...]
    nejlepsi = 0
    # u každého úkolu 0 = nevzít, 1 = vzít; product vytvoří všechny výběry
    for vyber in product([0, 1], repeat=len(ukoly)):
        doba = 0
        prinos = 0
        for i in range(len(ukoly)):
            if vyber[i] == 1:            # i-tý úkol je ve výběru
                doba = doba + ukoly[i][0]
                prinos = prinos + ukoly[i][1]
        if doba <= hodin and prinos > nejlepsi:
            nejlepsi = prinos            # vejde se a je lepší
    return nejlepsi`,
  },
  hrubatrasy: {
    nazev: "Hrubá síla u trasy",
    myslenka:
      "Hrubá síla znamená: vyzkoušej úplně všechno. Počítač projde všechna pořadí, v jakých jde zákazníky objet, každé změří a nechá si nejkratší.",
    postup: [
      "Sepiš všechna pořadí, v jakých jde zákazníky objet.",
      "U každého pořadí sečti vzdálenosti: z dílny k prvnímu, mezi zákazníky a od posledního zpátky do dílny.",
      "Je okruh kratší než dosud nejkratší? Zapamatuj si ho.",
    ],
    priklad:
      "Zákazníci A, B, C dávají 6 pořadí: ABC, ACB, BAC, BCA, CAB, CBA. Počet pořadí je 1 · 2 · 3 = 6, píše se 3! (čti „tři faktoriál“). Okruh ABC a okruh CBA jsou stejné, jen jeté opačně, takže různých okruhů jsou jen 3. Pro 8 zákazníků je okruhů 20 160, pro 15 zákazníků přes 650 miliard.",
    pozor: "Nejkratší trasu najde vždycky. Už u pár desítek zákazníků by ale nestačil žádný počítač na světě.",
    python: `from itertools import permutations

def nejkratsi_trasa(vzdalenost, zakaznici):   # dílna má číslo 0
    nejlepsi = None
    for poradi in permutations(zakaznici):    # všechna pořadí zákazníků
        trasa = [0] + list(poradi) + [0]      # z dílny a zpět do dílny
        delka = 0
        for i in range(len(trasa) - 1):       # sečti úseky trasy
            delka = delka + vzdalenost[trasa[i]][trasa[i + 1]]
        if nejlepsi is None or delka < nejlepsi:
            nejlepsi = delka                  # zatím nejkratší
    return nejlepsi`,
  },
  soused: {
    nazev: "Nejbližší soused (heuristika)",
    myslenka: (
      <>
        Jako když roznášíš letáky a vždycky jdeš k nejbližšímu domu, kde jsi ještě nebyl(a). Nic nezkoušíš a nepočítáš dopředu, jen
        se rozhodneš podle toho, co je nejblíž. Takovému rychlému pravidlu „od oka“ se říká <b>heuristika</b>.
      </>
    ),
    postup: [
      "Začni v dílně.",
      "Ze zákazníků, u kterých jsi ještě nebyl(a), vyber nejbližšího a jeď k němu.",
      "Opakuj krok 2, dokud nenavštívíš všechny.",
      "Vrať se do dílny.",
    ],
    priklad:
      "Z dílny je to k zákazníkovi A 2 km, k B 5 km a k C 6 km. Jedeš k A. Od A je to k B 4 km a k C 3 km, jedeš k C. Zbývá B, pak zpátky do dílny.",
    pozor: "Rozhoduje se vždycky jen podle jednoho dalšího kroku. Co to udělá s celou trasou, uvidíš na mapě.",
    python: `def nejblizsi_soused(vzdalenost, zakaznici):  # dílna má číslo 0
    trasa = [0]                               # začínáme v dílně
    zbyva = list(zakaznici)                   # u koho jsme ještě nebyli
    while len(zbyva) > 0:
        ted = trasa[-1]                       # kde právě jsme ([-1] = poslední)
        dalsi = zbyva[0]
        for z in zbyva:                       # najdi nejbližšího
            if vzdalenost[ted][z] < vzdalenost[ted][dalsi]:
                dalsi = z
        trasa.append(dalsi)                   # jeď k němu
        zbyva.remove(dalsi)
    trasa.append(0)                           # návrat do dílny
    return trasa`,
  },
  dvaopt: {
    nazev: "2-opt: rozplétání trasy",
    myslenka:
      "Vezme hotovou trasu a zkouší ji vylepšit. Když se trasa na mapě kříží sama se sebou jako zamotaná šňůra, 2-opt ji rozplete. Název: mění vždycky 2 úseky trasy, „opt“ je od anglického optimize, vylepšit.",
    postup: [
      "Začni s hotovou trasou, třeba od nejbližšího souseda.",
      "Vyber dva úseky trasy a rozpoj je.",
      "Konce spoj obráceně. Kousek trasy mezi nimi pak projedeš v opačném pořadí.",
      "Je nová trasa kratší? Nech si ji. Není? Vrať to.",
      "Zkoušej všechny dvojice úseků znovu a znovu, dokud už žádná výměna trasu nezkrátí.",
    ],
    priklad:
      "Trasa Dílna → A → C → B → D → Dílna se na mapě kříží v úsecích A–C a B–D. 2-opt je vymění za A–B a C–D: pojedeš Dílna → A → B → C → D → Dílna. Kousek mezi nimi (C → B) se projede obráceně (B → C) a křížení zmizí.",
    pozor:
      "Když se dva úseky kříží, rozpletení trasu vždycky zkrátí (u vzdáleností vzdušnou čarou). 2-opt skončí, když už nepomůže žádná výměna. To ještě nemusí být nejkratší možná trasa.",
    python: `def delka(trasa, vzdalenost):
    soucet = 0
    for i in range(len(trasa) - 1):
        soucet = soucet + vzdalenost[trasa[i]][trasa[i + 1]]
    return soucet

def dva_opt(trasa, vzdalenost):   # trasa začíná i končí v dílně
    zlepseno = True
    while zlepseno:               # opakuj, dokud se něco zlepšuje
        zlepseno = False
        for i in range(1, len(trasa) - 2):
            for j in range(i + 1, len(trasa) - 1):
                # zastávky od i do j projeď v obráceném pořadí
                obracene = list(reversed(trasa[i:j + 1]))
                nova = trasa[:i] + obracene + trasa[j + 1:]
                if delka(nova, vzdalenost) < delka(trasa, vzdalenost):
                    trasa = nova          # je kratší: nech si ji
                    zlepseno = True
    return trasa`,
  },
  dijkstra: {
    nazev: "Dijkstrův algoritmus",
    myslenka: (
      <>
        Hledá nejrychlejší cestu ze startu do všech hal. Jmenuje se po nizozemském informatikovi Edsgeru Dijkstrovi (čti „dajkstra“).
        Postupuje od startu jako vlna: nejdřív s jistotou zjistí nejbližší halu, pak druhou nejbližší a tak dál. U každé haly má čas
        napsaný jakoby tužkou: nejlepší, jaký zatím zná. Když si je jistý, že lepší nebude, halu <b>uzavře</b>, jako by čas obtáhl
        propiskou.
      </>
    ),
    postup: [
      "Start má čas 0. U ostatních hal napiš „?“: čas zatím neznáš.",
      "Ze všech neuzavřených hal vyber tu s nejmenším časem a uzavři ji. Její čas už platí.",
      "Podívej se na sousedy právě uzavřené haly. Čas přes ni je její čas plus délka cesty k sousedovi. Je to méně, než má soused napsáno (nebo tam má „?“)? Přepiš to a poznamenej si, odkud jsi přijel(a).",
      "Opakuj od kroku 2, dokud nejsou uzavřené všechny haly.",
      "Cestu přečteš pozpátku: z cíle jdi tam, odkud se do haly přijelo, až dojdeš na start.",
    ],
    priklad:
      "Ze startu vede cesta do haly A (4 min) a do haly B (6 min), z A do B je to 1 min. Uzavřeš start s časem 0 a napíšeš A = 4, B = 6. Nejmenší je A, uzavřeš ji. Přes A je to do B 4 + 1 = 5, to je méně než 6, takže přepíšeš B = 5. Uzavřeš B. Nejrychlejší cesta do B vede přes A.",
    pozor: "Funguje, jen když žádná cesta nemá zápornou délku. U času jízdy to platí vždycky.",
    python: `NEVIM = float("inf")              # nekonečno: čas zatím neznáme

def dijkstra(sit, start):         # sit[hala] = [(soused, minut), ...]
    cas = {}
    for hala in sit:
        cas[hala] = NEVIM
    cas[start] = 0
    odkud = {}                    # odkud jsme do haly přijeli
    uzavrene = []
    while len(uzavrene) < len(sit):
        # najdi neuzavřenou halu s nejmenším časem
        hala = None
        for h in sit:
            if h not in uzavrene and (hala is None or cas[h] < cas[hala]):
                hala = h
        if cas[hala] == NEVIM:
            break                 # na zbytek haly se nedá dojet
        uzavrene.append(hala)     # její čas už platí
        for soused, minut in sit[hala]:
            pres_halu = cas[hala] + minut
            if pres_halu < cas[soused]:   # přes tuhle halu je to rychlejší
                cas[soused] = pres_halu
                odkud[soused] = hala
    return cas, odkud`,
  },
  simulace: {
    nazev: "Simulace náhodných výpadků",
    myslenka:
      "Některé věci rozhoduje náhoda: nevíš, které cesty budou zítra zavřené. Simulace to vyzkouší nanečisto. Počítač si vymyslí stovky dní, každý s jinými náhodně zavřenými cestami, a spočítá, jak každý den dopadl. Je to jako hodit kostkou tisíckrát a zapsat si, kolikrát padla šestka.",
    postup: [
      "Na každý den rozhodni u každé cesty jako losem, jestli je zavřená. Zálohovaná cesta je otevřená vždycky.",
      "Na otevřených cestách najdi Dijkstrovým algoritmem nejrychlejší rozvoz.",
      "Zapiš, kolik minut to trvalo, nebo že vozík ten den do Montáže vůbec nedojel.",
      "Po všech dnech spočítej, kolikrát vyšel který čas a kolik dní vozík nedojel.",
    ],
    priklad:
      "Pravděpodobnost zavření 10 % znamená, že každá cesta je zavřená zhruba jeden den z deseti. Při 12 cestách je tak v průměru zavřená asi jedna cesta denně (12 · 0,1 = 1,2). Některé dny žádná, jindy dvě nebo tři najednou.",
    pozor:
      "Výsledek je odhad: jiná sada dní dá trochu jiná čísla. Čím víc dní, tím je přesnější. U takhle malé sítě by se to dalo spočítat i přesně (12 cest může být otevřených a zavřených 4 096 způsoby). U velké sítě by ale takových možností byly miliardy, proto se simuluje.",
    python: `import random

def simulace(haly, cesty, start, cil, p, zaloha, dnu):
    # cesty = [(a, b, minut), ...], p = pravděpodobnost zavření (0,1 = 10 %)
    # zaloha = pořadí zálohované cesty, nebo -1 (žádná)
    vysledky = []
    for den in range(dnu):
        sit = {}
        for h in haly:
            sit[h] = []
        for i in range(len(cesty)):
            a, b, minut = cesty[i]
            zavrena = random.random() < p     # random() = náhodné číslo 0 až 1
            if i == zaloha or not zavrena:    # záloha je otevřená vždycky
                sit[a].append((b, minut))
                sit[b].append((a, minut))
        cas, odkud = dijkstra(sit, start)
        vysledky.append(cas[cil])             # nekonečno = dnes nedojel
    return vysledky`,
  },
};

/**
 * Karta s vysvětlením algoritmu (Karel 9. 11. 2026: „čím méně textu, tím lépe“).
 * Nahoře je krokovač s obrázkem a jednou větou (Obrazem.tsx). Slovní
 * vysvětlení a Python jsou sbalené pod „Podrobněji“.
 *
 * - `kratce`: v „Podrobněji“ jen myšlenka a postup (připomenutí v hodině 7).
 * - `odkryto`: karta stojí nad „Tipni si nejdřív“ (rada 9. 11. 2026). Dokud je
 *   `false`, „Podrobněji“ ukáže jen myšlenku a postup; příklad, „Dobré vědět“
 *   a Python se odkryjí samy po vyhodnocení tipu nebo tlačítkem. Krokovač je
 *   vidět vždycky, proto jeho věty tip neprozrazují (hlídá JakFunguje.test.ts).
 */
export function JakFunguje({ algoritmus, kratce, odkryto }: { algoritmus: Algoritmus; kratce?: boolean; odkryto?: boolean }) {
  const v = VYSVETLENI[algoritmus];
  const snimky = useMemo(() => SNIMKY[algoritmus](), [algoritmus]);
  const [rucne, setRucne] = useState(false);
  const cela = !kratce && (odkryto !== false || rucne);
  return (
    <section className="max-w-3xl rounded-xl border border-[#6fe3c2]/30 bg-[#0f231d] p-4">
      <div className="text-[11px] font-semibold tracking-[.08em] text-[#6fe3c2]">JAK TO FUNGUJE</div>
      <h3 className="mt-1 text-[16px] font-semibold">{v.nazev}</h3>
      <Obrazem key={algoritmus} snimky={snimky} popis={v.nazev} />
      <details className="mt-3 border-t border-white/10 pt-2.5">
        <summary className="cursor-pointer text-[13px] font-semibold text-[#6fe3c2]">
          {kratce ? "Podrobněji" : "Podrobněji: postup slovy, příklad a zápis v Pythonu"}
        </summary>
        <p className="mt-2 text-[14px] leading-relaxed text-[#e8f3ef]">{v.myslenka}</p>
        <div className="mt-2.5 text-[13px] font-semibold text-[#e8f3ef]">Krok za krokem</div>
        <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 text-[14px] leading-relaxed text-[#c5d6cf] marker:text-[#6fe3c2]">
          {v.postup.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ol>
        {!kratce && !cela && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={() => setRucne(true)}
              className="rounded-lg border border-[#6fe3c2]/50 px-2.5 py-1 text-[13px] font-semibold text-[#6fe3c2] hover:bg-[#6fe3c2]/10"
            >
              Ukázat celé vysvětlení
            </button>
            <span className="text-[12px] text-[#a6bdb4]">Příklad a zápis v Pythonu se ukážou samy, až si tipneš a projdeš postup.</span>
          </div>
        )}
        {cela && (
          <>
            <p className="mt-2.5 text-[14px] leading-relaxed text-[#c5d6cf]">
              <b className="font-semibold text-[#e8f3ef]">Na malém příkladu:</b> {v.priklad}
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#c5d6cf]">
              <b className="font-semibold text-[#e8f3ef]">Dobré vědět:</b> {v.pozor}
            </p>
            <details className="mt-2.5">
              <summary className="cursor-pointer text-[13px] font-semibold text-[#6fe3c2]">Ukázat zápis v Pythonu</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[#080d0b] p-3 text-[12.5px] leading-[1.55] text-[#e8f3ef]">
                <code>{v.python}</code>
              </pre>
            </details>
          </>
        )}
      </details>
    </section>
  );
}

/** Souhrn v reflexi: celé karty všech algoritmů hodiny, sbalené (rada 9. 11. 2026). */
export function AlgoritmyHodiny({ algoritmy }: { algoritmy: Algoritmus[] }) {
  return (
    <details className="rounded-xl border border-white/[.14] p-3.5">
      <summary className="cursor-pointer text-[14px] font-semibold text-[#6fe3c2]">
        Algoritmy této hodiny: celé vysvětlení ({algoritmy.map((a) => VYSVETLENI[a].nazev).join(", ")})
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {algoritmy.map((a) => (
          <JakFunguje key={a} algoritmus={a} />
        ))}
      </div>
    </details>
  );
}

/** Pro testy: text karty bez Pythonu, i s větami krokovače (čísla musí sedět s daty hodin, tip se nesmí prozradit). */
export function textKarty(a: Algoritmus): string {
  const v = VYSVETLENI[a];
  return [v.nazev, v.myslenka, ...v.postup, v.priklad, v.pozor, ...vetyObrazem(a)].map(naText).join(" ");
}

/** Pro testy: jen věty krokovače. */
export const vetyObrazem = (a: Algoritmus) => SNIMKY[a]().map((s) => s.veta);

function naText(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(naText).join("");
  if (isValidElement<{ children?: ReactNode }>(n)) return naText(n.props.children);
  return "";
}

export const ALGORITMY = Object.keys(VYSVETLENI) as Algoritmus[];
