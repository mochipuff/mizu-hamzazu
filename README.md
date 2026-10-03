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
| Site name, links, SEO title/description/alt text | `src/config/site.ts` |
| Profile facts for search engines, AI and the About card (bio, species, height, debut, birthday, fan name, socials, agency, aliases). Values starting with `TODO` are never published | `src/config/site.ts` (`profile`, `fanName`) |
| Meta tags, JSON-LD, robots.txt (AI crawler rules), llms.txt, sitemap.xml, no-JS fallback HTML | `vite/seoPlugin.ts` |
| Animations (GSAP + ScrollTrigger, reduced-motion aware: with reduced motion nothing animates and CSS shows the final look) | `src/lib/motion.ts`, `src/hooks/useGsap.ts`, `Reveal.tsx` |
| Membership tiers and their badges | `src/data/membership.ts`, `public/membership/tier-1.png` to `tier-6.png` (1:1, replace the placeholders) |
| Clover and branch decorations | `Clover` / `Branch` in `Doodles.tsx`, `Garland.tsx`, `SectionHeading.tsx` |
| Emotes / hero art / stream types / schedule | `src/data/*.ts` |
| Loading screen markup + styles / logic | `index.html` (inline critical CSS) / `src/lib/{preload,loader}.ts` |
| Images (you supply them, they are not in git) | `public/emotes/<name>.png`, `public/hero/<name>.png`, `public/membership/tier-<n>.png`, `public/og-image.png`, favicons |

When you add an emote or hero image, add it to `src/data/emotes.ts` or `src/data/hero.ts`.
The loading screen preloads exactly those lists, so the new image is waited for automatically.
