Dokumenty pro učitele ke kurzu SQL v DB Browseru (téma Databáze v bance)
=========================================================================

  Řešení a postup - DB Browser.docx   ← reseni.js
  Návod pro učitele - DB Browser.docx ← navod.js

Řešení se skládají přímo z dat kurzu (src/lib/dbb/kurz.ts a sady.ts), takže
po každé změně lekcí nebo úloh stačí dokument vygenerovat znovu. Návod je
psaný ručně v navod.js – když se změní ovládání programu, uprav ho tam.

Z kořene repozitáře:

  node_modules/.bin/esbuild scripts/dbb-dokumenty/vytah.ts --bundle \
    --platform=node --format=cjs --tsconfig=tsconfig.json \
    --outfile=/tmp/dbb-vytah.cjs
  node /tmp/dbb-vytah.cjs > scripts/dbb-dokumenty/lekce.json
  npm install --no-save docx
  node scripts/dbb-dokumenty/reseni.js "public/materialy/1L/8/_ucitel/1. Kurz SQL v prohlížeči/Řešení a postup - DB Browser.docx"
  node scripts/dbb-dokumenty/navod.js  "public/materialy/1L/8/_ucitel/1. Kurz SQL v prohlížeči/Návod pro učitele - DB Browser.docx"

lekce.json je mezivýsledek a do gitu nepatří (je v .gitignore).
Knihovna docx není závislost webu, proto --no-save.
