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

Import the repo (`vercel.json` adds cache and security headers); Vercel detects Vite automatically (build `npm run build`, output `dist`).
Set `VITE_SITE_URL` (for example `https://mizu.id`) in Project Settings, Environment Variables.
Without it the canonical URL, Open Graph image, `sitemap.xml` and JSON-LD URLs are skipped.

## Where things live

| What | Where |
| --- | --- |
| Site name, links, handles, theme colour, share image | `src/config/site.ts` |
| Profile facts that are the same in every language (height, debut, birthday, fan name, socials, aliases). Values starting with `TODO` are never published | `src/config/site.ts` (`profile`, `fanName`) |
| **All text**, in English, Japanese, Indonesian and Korean: UI labels, SEO title/description, bio, FAQ, emote names, form messages | `src/i18n/messages/{en,jp,id,kr}.ts` |
| Language list, URL codes (`/en/`, `/jp/`, `/id/`, `/kr/`), device-language detection | `src/i18n/locales.ts`, `src/i18n/detect.ts`, `src/i18n/initial.ts` |
| Per-language pages, meta tags, hreflang, JSON-LD, robots.txt (AI crawler rules), llms.txt, sitemap.xml, no-JS fallback HTML, the `/` language redirect | `vite/seoPlugin.ts` |
| Animations (GSAP + ScrollTrigger, reduced-motion aware: with reduced motion nothing animates and CSS shows the final look) | `src/lib/motion.ts`, `src/hooks/useGsap.ts`, `Reveal.tsx` |
| Membership tiers and their badges | `src/data/membership.ts`, `public/membership/tier-1.webp` to `tier-6.webp` (1:1, replace the placeholders) |
| Clover and branch decorations | `Clover` / `Branch` in `Doodles.tsx`, `Garland.tsx`, `SectionHeading.tsx` |
| Emotes / hero art / stream types / schedule (structure only; the words are in `src/i18n/messages`) | `src/data/*.ts` |
| Loading screen markup + styles / logic | `index.html` (inline critical CSS) / `src/lib/{preload,loader}.ts` |
| Images (you supply them, they are not in git) | `public/emotes/<name>.png`, `public/hero/<name>.png`, `public/membership/tier-<n>.png` (source PNGs, converted to `.webp` by `npm run images`), `public/og-image.png`, favicons |

When you add an emote or hero image, add it to `src/data/emotes.ts` or `src/data/hero.ts`.
Then run `npm run images` to generate the `.webp` files the site actually loads.
The loading screen only waits for fonts and the hero images (`src/lib/preload.ts`); everything else loads lazily.

## Languages

The site lives at `/en/`, `/jp/`, `/id/` and `/kr/`. `/` redirects to the visitor's saved choice, then their device language, then English.
The header menu switches language without a reload and remembers the choice.

- `src/i18n/messages/en.ts` is the source of truth. Add a key there and `npm run typecheck` lists every language that still needs it.
- Text with a value in it is a function, for example `iAm: (name) => ...`, so each language can put the value where its grammar wants it.
- To add a language: add its code to `LOCALES` and `localeInfo` in `src/i18n/locales.ts`, a `src/i18n/messages/<code>.ts` file, register it in `messages/index.ts`, and add its language subtag to `browserLanguageMap` in `src/i18n/detect.ts`.
- `npm run build` writes one page per language (`dist/<code>/index.html`) with its own title, meta tags, hreflang links and JSON-LD, so search engines see each language.
- Stream titles in `src/data/schedule.ts` are the real YouTube titles and are not translated; their descriptions are.
