# Karel Hlas — osobní web

Osobní stránka Mgr. Karla Hlase, učitele informatiky a angličtiny na SPŠ Tábor.
Bilingvní (CZ/EN), světlý i tmavý režim, minimalistický design se smaragdovým akcentem.

## Technologie

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [next-themes](https://github.com/pacocoursey/next-themes) — světlý/tmavý režim
- [Framer Motion](https://www.framer.com/motion/) — jemné animace
- [lucide-react](https://lucide.dev/) — ikony

## Spuštění lokálně

```bash
npm install      # jen poprvé
npm run dev      # vývojový server na http://localhost:3000
```

Produkční build a spuštění:

```bash
npm run build
npm start
```

## Co kde upravit

| Co | Soubor |
| --- | --- |
| **Texty (CZ i EN)**, kontakt, odkazy, sociální sítě | `src/lib/content.ts` |
| **Odkaz na Odevzdávárnu** | `SUBMIT_URL` v `src/lib/content.ts` |
| **Profilová fotka** | ulož jako `public/images/karel.jpg` |
| Barvy / akcent | `tailwind.config.ts` (paleta `accent`) |
| Pořadí sekcí | `src/app/page.tsx` |

Vše podstatné (jména, telefon, e-mail, kabinet, odkazy) je na jednom místě
v `src/lib/content.ts`, takže úpravy nevyžadují zásah do komponent.

## Nasazení (doména karelhlas.xyz)

Nejjednodušší je [Vercel](https://vercel.com/):

1. Nahraj projekt na GitHub.
2. Na Vercelu „Import Project" → vyber repozitář (Next.js se rozpozná sám).
3. V nastavení projektu přidej doménu `karelhlas.xyz` a u registrátora
   nastav DNS podle pokynů Vercelu.

> Poznámka: lokálně běží na Node 19. Pro nasazení i další vývoj doporučuji
> přejít na **Node 20 LTS**.
