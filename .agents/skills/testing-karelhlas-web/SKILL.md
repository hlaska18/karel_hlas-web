---
name: testing-karelhlas-web
description: Test the karel_hlas-web Next.js personal site end-to-end. Use when verifying UI/security changes (SQL playground, Word .docx preview, security headers).
---

# Testing karel_hlas-web

Static Next.js 14 App Router site (no backend/API/DB/auth). Content in `src/lib/content.ts`, materials in `public/materialy/`.

## Setup
- `npm install` (Node 20 recommended per README).
- Build + serve prod: `npm run build && npx next start -p 3000`. Dev server (`npm run dev`) also applies `next.config.mjs` `headers()`.
- No secrets required — the site needs no credentials to test.

## Key runtime features that pull scripts from CDN (jsDelivr)
These are the highest-value things to test because they depend on external scripts loaded with Subresource Integrity (SRI):
- **SQL playground** (`/sql`): `src/lib/sqljs.ts` loads `sql-wasm.js`. Type e.g. `SELECT * FROM knihy;` and click **Spustit** → expect a result table (10 rows for that query). Tables: `knihy`, `ctenari`, `vypujcky`.
- **Word .docx preview**: homepage `#banka` → pick a topic (e.g. "Digitální gramotnost") → click a `.docx` item's **Náhled** (eye icon) → `src/lib/docxPreview.ts` loads `jszip` + `docx-preview` → expect formatted Word content in a modal.

If SRI hashes are wrong the browser refuses to run the CDN script, so these features fail visibly — a good adversarial signal. When bumping a CDN version, recompute the hash: `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`.

## Security headers
Set in `next.config.mjs` `headers()`. Verify with `curl -sI http://localhost:3000/` — expect `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

## Notes / gotchas
- `next lint` may prompt interactively (no eslint config committed) — don't block on it; rely on `npm run build`.
- A Vercel preview deploy is attached to PRs; you can also test against that URL.
- `npm audit` may still show high-severity Next.js advisories fixable only by a breaking `next@15/16` (React 19) upgrade — flag rather than upgrade blindly.

## Devin Secrets Needed
None.
