# Ikony témat a předmětů

Ikony témat leží v `public/images/tools/glass/` (seznam v `TOOL_ICON`,
src/lib/bankLabels.ts), ikony předmětů v `public/images/subjects/`
(`icon` v src/lib/content.ts). Kreslí se v 80–152 px (témata) a 56 px
(předměty), proto **hodnoť je vždy v téhle velikosti na skutečném webu**,
ve světlém i tmavém režimu, ne zvětšené.

## Styl (Karel, 4. 10. 2026)

- Matné pískované smaragdové sklo, realistický materiál, čelem k uživateli
  (jen nepatrně shora), průhledné pozadí, žádná záře ani opar.
- **Tvar zjednodušený**: pár velkých hladkých tvarů, žádné drobné detaily
  (okna, šupiny, závity). Karlovi byl realistický dům a had „moc realistický“,
  zjednodušený mozek zase „moc jednoduchý“ – mozek zůstal z původní sady.
- Předloha stylu = původní ikona databáze (`databaze.png`). Nová ikona
  vzniká s ní jako referencí, jinak do sady nesedne.
- Motivy: databáze = válce, Python = logo Pythonu (dva hadi, dva odstíny
  zelené), Power BI = tři sloupce bez podstavy, matematika = ±,
  chemie = baňka, hudební výchova = dvě noty, strojírenství = ozubené kolo,
  Excel = list s ohnutým rohem a mřížkou (ladí s Wordem), grafika = paleta
  se štětcem, angličtina = dvě bubliny rozhovoru.
  Motiv neměň bez Karlova souhlasu; dvě varianty ukaž vedle sebe.

## Výroba (Higgsfield, GPT Image 2.5)

1. Nahraj `public/images/tools/glass/databaze.png` jako referenci
   (Higgsfield `media_upload`; na Karlově účtu už je jako
   media_id `66a9bde4-d5de-48b8-80e7-2b295b65a8ba`).
2. `generate_image`: model `gpt_image_2_5`, `quality: high`,
   `resolution: 1k`, `aspect_ratio: 1:1`, `background: transparent`,
   `medias: [{role: image_references, value: <media_id>}]` – 1,5 kreditu.
   Souběžně projdou asi 4 úlohy, další vrátí 429 (nic se nezaplatí).
3. Zadání (doplň předmět):

   > A single simplified 3D icon of <PŘEDMĚT, popis tvaru bez detailů>.
   > Bold, clean silhouette made of a few large smooth shapes, readable even
   > at 56 pixels. Match the reference image's material exactly: the same
   > realistic frosted sandblasted emerald-green glass with soft translucency,
   > the same color, the same soft studio lighting and subtle highlights. Do
   > not copy its stacked-cylinder shape. View: facing the viewer straight
   > from the front, with only a very slight view from above like the
   > reference. Object centered, filling about 72% of the frame. No outer
   > glow, no halo, no haze. No text, no letters, no numbers, no logos, no
   > floor, no cast shadow, fully transparent background.

4. `python3 scripts/ikony/normalizuj.py stazena.png public/images/…/nazev.png`
   (ořez, vyčištění, 512 × 512, optické vyrovnání plochy).
5. Zkontroluj na webu v 56/80/152 px ve světlém i tmavém režimu a ukaž Karlovi.

V patičce je věta, že ikony vznikly s pomocí AI (`footer.ikonyAI`).
