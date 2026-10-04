# Materiály do výuky – Karel Hlas

Web [karelhlas.vercel.app](https://karelhlas.vercel.app): veřejná dvojjazyčná
(CZ/EN) banka výukových materiálů pro učitele informatiky a nástroje, které
běží přímo v prohlížeči. Světlý i tmavý režim, jedna stránka se sekcemi
(banka, ostatní předměty, AI Hub, o mně, kontakt).

## Technologie

- [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript
- [Tailwind CSS 3](https://tailwindcss.com/), [next-themes](https://github.com/pacocoursey/next-themes), [lucide-react](https://lucide.dev/)
- [sql.js](https://sql.js.org/) pro kurz SQL (vlastní kopie v `public/sqljs/`, CDN jako záloha)
- [Vitest](https://vitest.dev/) pro testy
- nasazení na [Vercel](https://vercel.com/) – push na `main` jde rovnou na web

Před úpravou Next.js si přečti [`AGENTS.md`](AGENTS.md): Next 16 má oproti
starším verzím změny a dokumentace k nainstalované verzi je v
`node_modules/next/dist/docs/`.

## Spuštění lokálně

Potřebuješ **Node 22** (stejně jako Vercel, viz `engines` v `package.json`).

```bash
npm ci           # instalace přesně podle package-lock.json
npm run dev      # vývojový server na http://localhost:3000
npm test         # testy (Vitest)
npm run build    # produkční sestavení včetně kontroly TypeScriptu
```

Testy a sestavení se po každém pushi spouštějí i na GitHubu
(`.github/workflows/kontrola.yml`, Node 22). Výsledek je vidět u commitu;
nasazení na Vercel to nezastaví.

## Stránky

| Adresa | Co to je | Kde se upravuje |
| --- | --- | --- |
| `/`, `/en` | jednostránkový web (česky, anglicky) | `src/components/Site.tsx`, texty v `src/lib/content.ts` |
| `/windows` | výuková simulace Windows 11 | `src/lib/win/`, `src/components/win/` – podrobně v [`WINDOWS.md`](WINDOWS.md) |
| `/macos` | výuková simulace macOS (srovnání s Windows) | `src/lib/mac/`, `src/components/mac/` |
| `/sql` | kurz SQL v DB Browseru (`?z=en` anglicky) | `src/lib/dbb/`, `src/components/dbb/` |
| `/soukromi` | co web ukládá | `src/app/soukromi/` |

Do simulátorů i kurzu SQL se žák přihlásí jen svým jménem. Práce se ukládá
do prohlížeče (`localStorage`) a učiteli ji žák předá **kódem postupu**
(`src/lib/postupSimulatoru.ts`, `src/lib/dbb/kodPostupu.ts`). Účty ani
vstupní kódy web nemá. Simulátory i kurz běží jen na počítači s myší.

## Jak přidat obsah

| Co | Kde |
| --- | --- |
| **Materiál do banky** | soubor do `public/materialy/<kurz>/<téma>/` – podrobně v [`MATERIALY.md`](MATERIALY.md) |
| Anglický název souboru nebo složky | `NAME_EN` v `src/lib/materials.ts` |
| Popis složky nebo souboru | `_popis.json` ve složce |
| Autor převzatých materiálů | `_autor.txt` ve složce |
| Odkaz na cizí web v bance | `_zdroj.json` ve vlastní složce |
| Nástroj tady na webu (laboratoř, simulátor) | `_nastroj.json` |
| Které skupiny tvoří kartu lekce | `LESSON_CONFIG` v `src/components/BankBrowser.tsx` |
| Nástroje pro ostatní předměty, AI Hub, texty sekcí | `src/lib/content.ts` |
| Ověřený výstup do AI Hubu | `public/ai-hub/<slug>/vystup.json` |
| Ikony témat a předmětů | [`scripts/ikony/README.md`](scripts/ikony/README.md) |
| Barvy | `tailwind.config.ts` (paleta `accent`) |

Banka čte složky při sestavení, takže nový soubor se na webu objeví po pushi
(asi za minutu).

## Další dokumenty

- [`CLAUDE.md`](CLAUDE.md) – předávka mezi relacemi: pravidla, rozhodnutí, historie změn
- [`WINDOWS.md`](WINDOWS.md) – simulace Windows
- [`MATERIALY.md`](MATERIALY.md) – jak přidávat materiály
- [`ZNAME-LIMITY.md`](ZNAME-LIMITY.md) – známé limity a vědomé kompromisy (npm audit, SQL, CSP, úložiště)
