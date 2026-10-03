# Mizu Hamzazu

Landing page for the virtual streamer Mizu Hamzazu. React 19 + Vite + TypeScript.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally
npm run lint
```

## Deploy (Vercel)

Import the repo; Vercel detects Vite automatically (build `npm run build`, output `dist`).
Set `VITE_SITE_URL` (for example `https://mizu.id`) in Project Settings, Environment Variables.
Without it the canonical URL, Open Graph image, `sitemap.xml` and JSON-LD URLs are skipped.

## Where things live

| What | Where |
| --- | --- |
| Site name, links, SEO title/description/alt text | `src/config/site.ts` |
| Open Graph image path and size, meta tags, robots.txt, sitemap.xml, JSON-LD | `vite.config.ts` (`seoPlugin`) |
| Emotes / hero art / stream types / schedule | `src/data/*.ts` |
| Loading screen markup / styles / logic | `index.html` / `src/styles/loader.css` / `src/lib/{preload,loader}.ts` |
| Images (you supply them, they are not in git) | `public/emotes/<name>.png`, `public/hero/<name>.png`, `public/og-image.png`, favicons |

When you add an emote or hero image, add it to `src/data/emotes.ts` or `src/data/hero.ts`.
The loading screen preloads exactly those lists, so the new image is waited for automatically.
