# Mizu Hamzazu

Landing page for the virtual streamer Mizu Hamzazu. React 19 + React Router + Vite + TypeScript.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173 (static site only, /api/* is not served)
npx vercel dev     # http://localhost:3000, site + /api/* (needs .env.local, see Schedule backend)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally
npm run lint
```

To test the production build with gzip on localhost (needs Python 3.10+):

```bash
pip install -r requirements.txt
npm run build                       # also writes a .gz next to every text file in dist/
npm run serve                       # http://localhost:8000, uvicorn server.app:app
curl -sI -H 'Accept-Encoding: gzip' localhost:8000/en/   # shows content-encoding: gzip
```

## Deploy (Vercel)

Import the repo (`vercel.json` sets the Vite preset and adds cache and security headers; `.vercelignore` keeps the Python test server out). Vercel compresses responses itself (Brotli or gzip, whichever the browser asks for), so the `.gz` files are skipped there.
Set `VITE_SITE_URL` (for example `https://mizu.id`) in Project Settings, Environment Variables.
Without it the build falls back to the Vercel production domain; with neither, the canonical URL, Open Graph image, `sitemap.xml` and JSON-LD URLs are skipped.
Also set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `YOUTUBE_API_KEY` and `CRON_SECRET` there (see Backend). `ALLOWED_ORIGINS` is optional (extra sites allowed to call `/api/*`, comma separated, for example a `www` alias).
The Content-Security-Policy in `vercel.json` only lets images load from this site, `i.ytimg.com`, `*.supabase.co` and `pbs.twimg.com`, and scripts only from this site: there is no `'unsafe-inline'` for scripts, so the `/` language redirect is a file (`redirect.js`, written by the build), never an inline script. Keep it that way: an inline `<script>` in `index.html` or `vite/seoPlugin.ts` would be blocked.

## Backend (Supabase + `api/index.ts`)

`api/index.ts` is a Hono function (Vercel Node.js runtime) and the only thing that talks to Supabase. The browser never does: RLS is on with no policy, so only the secret key can touch a table.

### Database

All SQL lives in `database/`. Run the files in the Supabase SQL editor of a new, empty database, in this order. Every statement is idempotent, so a file can be run again safely.

| File | What it does |
| --- | --- |
| `01_schema.sql` | Tables (`likes_dislikes`, `fanarts`, `videos`, `stream_slots`, `site_settings`, `collab`, `api_keys`), indexes, `updated_at` triggers, RLS, and a `revoke` from `anon` and `authenticated` as a second lock |
| `02_api_keys.sql` | `pgcrypto` and `create_api_key(name, permissions, expires_at)`, which mints a key (see API keys) |
| `03_seed.sql` | Starting data: the guerilla mode switch (off), the likes lists, two sample streams |
| `04_patch_existing.sql` | **Only for a database built from the old README** (Korean text, `viewers_notes`). Run 01, 02, then this file, and deploy the API after it. A new database skips it |
| `05_patch_fanart_unique.sql` | **Every database, after 01.** A unique index on `fanarts.media_url`, so a retried `POST /api/admin/fanarts` answers `409` instead of storing the art twice. It never deletes: if duplicates already exist it only prints a notice, and you remove them by hand before running it again |
| `06_patch_collab.sql` | **Every database, after 01.** Adds the `collab` table and the `collab:*` and `backup:read` permissions to the `api_keys` check (keys made earlier keep working). A database created before the Collab page needs it; a new one already has it from 01, and running it again changes nothing |
| `07_patch_collab_fill.sql` | **Every database, after 01 and 06.** Adds `collab.fill_url`, the picture that fills a partner's card (null = plain card). **Run it before deploying the API**: until the column exists `GET /api/collab/` fails. A new database already has the column from 01 |
| `08_patch_stream_thumbnail.sql` | **Every database, after 01.** Adds the `https://` check on `stream_slots.thumbnail_url` that the other link columns already had in the database (the API enforced it already). It never deletes: if a stored row breaks the rule it only prints a notice, you fix the row and run it again. A new database already has the check from 01 |

Then, in Vercel, Project Settings, Environment Variables: `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (the `sb_secret_...` key, mark it **Sensitive**, never prefix either with `VITE_`), plus `YOUTUBE_API_KEY` and `CRON_SECRET` (at least 32 characters, `openssl rand -hex 32`) for the Content page. `ALLOWED_ORIGINS` is optional (extra sites allowed to call `/api/*`, comma separated). Locally copy `.env.example` to `.env.local` and run `npx vercel dev`.

### Public routes (the site)

| Route | Table | Feeds |
| --- | --- | --- |
| `GET /api/schedule/` | `stream_slots` | Schedule: streams from 1 day ago to 8 days ahead |
| `GET /api/settings/` | `site_settings` | `{ guerillaMode }`. While it is `true` the Schedule section glitches every 3 seconds (the creator has no fixed schedule) |
| `GET /api/preferences/` | `likes_dislikes` | "Likes" and "Not so much" |
| `GET /api/fanart/<page>/` | `fanarts` | Fan art, 9 per page, newest first, answer `{ posts, hasMore }` |
| `GET /api/content/<kind>/` | `videos` | Content page: `live`, `short`, `vod`, or `song` (any video with a `label`). The 12 newest |
| `GET /api/collab/` | `collab` | Collab page: partners ranked by number of collabs, ties by name, at most 200. Answer `[{ id, name, avatarUrl, fillUrl, linkUrl, count }]` |
| `GET /api/videos/sync/` | `videos` | Not for the browser. Vercel Cron calls it daily at 03:00 UTC with `Authorization: Bearer $CRON_SECRET`; it adds new uploads of `@MizuHamzazu` and keeps 12 per category. Rows already in the table are never changed |

Only this site's own pages may call them: other origins get `403`. Allowed are `VITE_SITE_URL`, the Vercel production domain, `ALLOWED_ORIGINS`, and outside production the preview URLs and `localhost:3000` / `localhost:5173`. The public routes accept no query string (`400`), because every distinct URL would miss the CDN cache. Schedule, settings, fan art and collab are cached for about 1 to 6 minutes, likes and the Content page for 1 hour (up to 24 more if stale).

**Opening an API address in the browser shows the Forbidden page, never data.** It is decided before any database call, in two places: the first `redirects` entry of `vercel.json` (matches `Sec-Fetch-Dest: document | iframe | ...`, runs before the CDN cache) and `opensAsPage()` in `api/index.ts` (same test, plus a fallback for browsers that send no `Sec-Fetch-*`). It keeps data out of the address bar, links and frames; it cannot hide what the page itself fetches, so an answer must never hold anything private. Check after a deploy (first must be `307` to `/forbidden/`, second `200`):

```bash
curl -si -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Site: none' https://your-domain.tld/api/schedule/ | head -5
curl -si -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' https://your-domain.tld/api/schedule/ | head -5
```

The function has no rate limiter of its own (a counter in one serverless instance does not hold). Add one in the Vercel Firewall: path starts with `/api/`, Rate Limit, fixed window 60 s, about 60 requests per IP.

### API keys

Services (a bot, a script, another backend) change the data through `/api/admin/*` with a key. **Keys are for servers only**: never put one in a browser, an app or a repository; browsers are refused by CORS and the origin check anyway.

1. Mint a key in the SQL editor (permissions are `<resource>:<action>`):

```sql
select public.create_api_key('fan-art-bot', array['fanarts:create', 'fanarts:read']);
```

2. Copy the result (`mzk_<12 hex>.<64 hex>`) into the secret store of that service. It is shown once. The table keeps only the key id, a random salt and `sha256(salt + secret)`; `api/index.ts` hashes the presented secret the same way and compares in constant time, so a leaked table gives nobody a working key. The secret is 256 random bits, which is why one salted SHA-256 is enough (a slow password hash would only slow every request).
3. Revoke with `update public.api_keys set revoked_at = now() where key_id = '<the 12 hex>';`. `expires_at` (third argument of `create_api_key`) ends a key on its own. A revoked, expired or wrong key answers `401`; an `Authorization` header that is not `Bearer <key>` answers `400`; a key without the permission answers `403` (checked before the body, so a key learns nothing about columns it may not write).

| Resource (permission prefix) | Table | Actions | Writable columns |
| --- | --- | --- | --- |
| `fanarts` (Supports) | `fanarts` | create, read, update, delete | `username` (no `@`), `media_url` (https, from an allowed image host, unique), `posted_at` (ISO 8601 with offset) |
| `videos` (Content) | `videos` | create, read, update, delete | `id` (YouTube id, on create only), `kind`, `label` (or `null`), `title`, `published_at` |
| `schedule` | `stream_slots` | create, read, update, delete | `id` (on create only), `title`, `description` (`en`, `jp`, `id`), `datetime`, `duration_minutes`, `platform`, `members_only`, `thumbnail_url` (https, allowed image host, or `null`) |
| `preferences` | `likes_dislikes` | create, read, update, delete | `kind`, `label` (`en`, `jp`, `id`), `sort_order` |
| `collab` (Collab) | `collab` | create, read, update, delete | `name` (up to 100, unique ignoring case), `avatar_url` (https, allowed image host, or `null`), `fill_url` (https, allowed image host, or `null`), `link_url` (https, any host, or `null`), `collab_count` (1 to 10000, default 1) |
| `settings` | `site_settings` | read, update | `enabled` |

| Call | Needs |
| --- | --- |
| `GET /api/admin/<resource>?limit=50&offset=0` (limit 1 to 100) | `<resource>:read` |
| `GET /api/admin/<resource>/<id>` | `<resource>:read` |
| `POST /api/admin/<resource>` (JSON body, answers `201` with the row) | `<resource>:create` |
| `PATCH /api/admin/<resource>/<id>` (only the columns to change) | `<resource>:update` |
| `DELETE /api/admin/<resource>/<id>` (answers `204`) | `<resource>:delete` |
| `GET /api/admin/backup/` (see Backup) | `backup:read` |

Send `Authorization: Bearer <key>`. A body with an unknown column (`Unknown field: x`), an invalid or missing one (`Invalid field: x`) or nothing to update answers `400`; a body over 16 KB answers `413`; a duplicate answers `409`. Bodies are checked with Zod schemas (`resources` in `api/index.ts`), one set of routes per resource. Admin answers are never cached (every `/api/admin/*` response carries `Cache-Control: no-store`), but the public routes above are: a change shows on the site after their cache time.

```bash
# Guerilla mode on (permission settings:update)
curl -X PATCH https://your-domain.tld/api/admin/settings/guerilla_mode -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' -d '{"enabled": true}'

# Add a fan art (permission fanarts:create)
curl -X POST https://your-domain.tld/api/admin/fanarts -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"username": "someone", "media_url": "https://pbs.twimg.com/media/x.jpg", "posted_at": "2026-10-12T20:15:00+07:00"}'
```

A new image host must be added in two places: `img-src` in the Content-Security-Policy of `vercel.json`, and `IMAGE_HOST` in `api/index.ts` (the API refuses a stored image link from any other host). Adding a resource or an action means: the entry in `resources` in `api/index.ts`, and the permission in the `api_keys.permissions` check of `01_schema.sql`.

Every call to Supabase and YouTube has an 8 second timeout, so a slow upstream answers with an error instead of holding the function until Vercel stops it.

### Backup

`GET /api/admin/backup/` answers one JSON file with every table behind the resources above (`fanarts`, `videos`, `stream_slots`, `likes_dislikes`, `site_settings`, `collab`), with the column names as stored, so it can be loaded back with plain inserts:

```json
{ "version": 1, "createdAt": "2026-10-16T05:00:00.000Z", "tables": { "fanarts": [], "collab": [] } }
```

```bash
# once: in the SQL editor, a key that can do nothing but back up, and that ends on its own
#   select public.create_api_key('backup-bot', array['backup:read'], now() + interval '90 days');
curl -fL https://your-domain.tld/api/admin/backup/ -H "Authorization: Bearer $KEY" -o "mizu-backup-$(date +%F).json"
```

- It needs `backup:read`, which no other permission includes: a key that may edit every resource still cannot download the data. Give it to one service, with an expiry, and treat the file as private (it holds everything the tables hold).
- `api_keys` is never exported. The list of tables is built from `resources` in `api/index.ts`, so a resource added later is in the backup without a second edit.
- Tables are read in pages cut by the primary key, so rows written during the backup are never duplicated or skipped. The tables are read one after the other, not as one snapshot: for a point-in-time copy use `supabase db dump` or the Pro plan's backups.
- The answer is never cached (`Cache-Control: no-store`) and is sent as a download.
- Vercel Functions refuse a response over 4.5 MB, so the endpoint stops at 4 MB of data and answers `500` (the log says which table) instead of returning a partial file. When the data grows past that, switch to `supabase db dump`.
- Each call reads the whole database. Put it under the same Vercel Firewall rate limit as the rest of `/api/`, or a tighter one.

### Maintaining the data by hand

The Table Editor works as before: insert or delete rows of `fanarts`, `likes_dislikes` and `stream_slots` (write `datetime` with its offset, `2026-10-22 08:00+07`; streams do not repeat on their own); edit `label` or `kind` of a `videos` row to move it to another tab (the sync never overwrites it); flip `enabled` of `guerilla_mode` in `site_settings`. Changing the schema: write it as a migration (`supabase migration new <n>`), add a column before the API reads it and drop one only after the API stopped selecting it. Back-ups: Supabase Pro keeps daily ones; on the free plan run `supabase db dump` now and then. **Never** expose these tables to the `anon` role.

## Where things live

| What | Where |
| --- | --- |
| Site name, links, handles, theme colour, share image | `src/config/site.ts` |
| Profile facts that are the same in every language (height, debut, birthday, fan name, socials, aliases). Empty values (like `illustrator` until it is known) are never published | `src/config/site.ts` (`profile`, `fanName`) |
| **All text**, in English, Japanese and Indonesian: UI labels, SEO title/description, bio, FAQ, emote names, form messages | `src/i18n/messages/{en,jp,id}.ts` |
| Language list, URL codes (`/en/`, `/jp/`, `/id/`), device-language detection, saved choice | `src/i18n/locales.ts`, `src/i18n/navigation.ts` |
| Routes (`/<locale>/`, `/<locale>/supports/`, `/<locale>/content/`, `/<locale>/collab/`, and the hidden `/<locale>/forbidden/` and `/<locale>/game/`), redirect for URLs without a language | `src/App.tsx`, page slugs in `src/i18n/pages.ts`, sections in `src/pages/` |
| Per-language, per-page HTML files, meta tags, hreflang, JSON-LD, robots.txt (AI crawler rules), llms.txt (one per language too), sitemap.xml, sitemap-images.xml, no-JS fallback HTML, the `/` language redirect | `vite/seoPlugin.ts` |
| Animations (GSAP + ScrollTrigger, reduced-motion aware: with reduced motion nothing animates and CSS shows the final look) | `src/lib/motion.ts`, `src/hooks/useGsap.ts`, `Reveal.tsx` |
| Membership tier badges | `TIER_LEVELS` in `FloatingBadges.tsx`, `public/membership/tier-1.webp` to `tier-6.webp` (1:1, replace the placeholders) |
| Clover and branch decorations | `Clover` / `Branch` in `Doodles.tsx`, `Garland.tsx`, `SectionHeading.tsx` |
| Header. Desktop: a bar with About (dropdown with Lore, Schedule, Emotes, FAQ), Join, Content, Collab, Supports and the language menu. Below 1024 px the menu button opens a popup bubble with the language menu and the same links. The brand pill opens a second bubble with Home, the sound switch (`Sfx: on` / `Sfx: off`, remembered in `localStorage` as `mizu:sound`, off by default; the effects are synthesized with the Web Audio API, the site ships no audio files) and, right under it, a disabled bell button "Coming soon" (`header.comingSoon`, placeholder until the feature exists) and, below that, the "Bonding card" link (`header.bondingCard`) to the game page | `src/components/layout/Header.tsx`, `Header.module.css`, `src/context/sound.ts` |
| Home sections, in order: Hero, Lore (`id="lore"`: the lore card, profile, likes, not so much, stream types), Schedule, Emotes, Join, FAQ. The Lore link in the About dropdown points at `#lore`; the dropdown button itself keeps the label `nav.about` | `src/pages/HomePage.tsx`, `src/components/sections/`, `navIds` in `Header.tsx` |
| Fan art decorations (stickers along both edges of the section). Fixed zigzag, the same on every visit, behind the grid. They pop in on scroll, drift at their own speed while scrolling and fly a small loop of their own when idle (three nested layers, GSAP through `useGsap`; with reduced motion they sit still) | `DECORATION_COUNT`, `SIZES`, `TILTS`, `PARALLAX` and the `useGsap` call in `Fanart.tsx` |
| Emotes: every emote sits in the same square tile and keeps its own proportions (`object-fit: contain`), so images that are not exactly 1:1 are not stretched | `.tile` in `Emotes.module.css` (`LoadingImage` with `--image-fit: contain`) |
| Hero watch buttons: YouTube and Twitch. While the schedule says a stream is on, the button of that stream's platform becomes the animated **Now live** button (pulsing dot, rippling ring, sheen) and opens the live page; otherwise it is the normal `Watch on ...` button | `HeroActions` in `Hero.tsx`, `LiveButton.tsx`, texts `hero.nowLive` / `hero.nowLiveOn` |
| Loading of images: skeleton cards while a list loads (Content page, first page of the fan art) and every thumbnail, fan art and emote shows an animated placeholder (sliding stripes, hopping paw) until its image arrives, then fades in. A failed image keeps a calm placeholder. Reusable for any image: `<LoadingImage className="..." src alt />`; `--image-fit` and `--image-pad` on its frame change how the picture sits in it; `SkeletonLines` are the pulsing text bars | `LoadingImage.tsx`, `VideoSkeleton` in `ContentPage.tsx`, the skeleton in `Fanart.tsx` |
| Page changes: every in-site `Link` and the language switch ask the router for a view transition, so the browser cross-fades the old and new page (the header keeps its own layer). Browsers without it fade the new `main` in. Both are off with reduced motion | `Link.tsx`, `I18nProvider.tsx`, the end of `src/styles/global.css` |
| Game page (`/<locale>/game/`, the "Bonding card" link of the header bubble points here). It is a hidden page until the game exists: built per language with `noindex`, no sitemap entry. To launch it, move `game` from `HIDDEN_PAGES` to `PAGES` in `src/i18n/pages.ts` and add `game` to `nav` in the messages | `src/pages/GamePage.tsx`, `game` in the messages, `HIDDEN_PAGES` in `src/i18n/pages.ts` |
| Forbidden page, shown when a browser opens an API address (see Backend, Public routes) | `src/pages/ForbiddenPage.tsx`, `forbidden` in the messages, `HIDDEN_PAGES` in `src/i18n/pages.ts` |
| Collab page: partners ranked by number of collabs (table `collab`, public `GET /api/collab/`, written through `/api/admin/collab`). The first three are highlighted; a partner without an avatar shows their initial; a card with `fill_url` is filled with that picture under a white veil; the card links out only when `link_url` is set. While the list loads, stripes and a paw cover the whole screen under the header, with a glitching label. Stars and sparkles pop up at random spots in the background | `src/pages/CollabPage.tsx`, `PopField.tsx`, `collab` in the messages, `collab` in `api/index.ts` |
| Fan art: flowers and hearts pop up at random spots behind the grid (same effect as the stars of the Collab page); a click on a picture opens it at full size in a dialog, with a link to the original file | `Fanart.tsx` (`ImagePreview`), `PopField.tsx`, `Modal.tsx` |
| Leaving the site: a click on any link to another site (YouTube included) first opens a dialog that shows where it goes, with "Stay here" and "Open link". One document-level listener, so new links are covered without an edit; Ctrl/Cmd/middle clicks pass straight through, with JavaScript off the links work as before. A link that must not ask carries `data-no-leave-prompt` | `src/components/ui/ExternalLinkGuard.tsx`, `leave` in the messages |
| Emotes, hero art, first-paint images | `src/data/images.ts` |
| Stream schedule: table in Supabase, API in `api/index.ts`, client request in `src/data/schedule.ts`, date maths in `src/lib/schedule.ts`. Guerilla mode: `site_settings`, `useGuerillaMode` in `src/data/schedule.ts`, the glitch is the `glitch` keyframes in `Schedule.module.css` (off with reduced motion). Likes and fan art: tables in Supabase, same API file, the client data layer in `src/data/api.ts` (see Conventions), support links in `src/data/supports.ts`, the fan art section in `src/components/sections/Fanart.tsx`. The words are in `src/i18n/messages` | `api/index.ts`, `src/data/api.ts`, `src/data/schedule.ts`, `src/data/supports.ts` |
| Loading screen markup + styles / logic | `index.html` (inline critical CSS; keep the `<!--locale-head-->` and `<!--locale-noscript-->` markers, the build fails without them) / `src/main.tsx` |
| Images `.webp` | `public/emotes/<name>.webp`, `public/hero/<name>.webp`, `public/membership/tier-<n>.webp`, `public/og-image.webp` (1200x630), `public/favicon.ico` (must hold a 48x48 image, Google ignores favicons that are not a multiple of 48 px; the build warns), `public/favicon.svg` |

When you add an emote or hero image, add its `.webp` file to `public/` and list it in `src/data/images.ts`.
The loading screen only waits for fonts and the hero images, downloaded and decoded (`src/main.tsx`, list in `src/data/images.ts`); everything else loads lazily.

## Languages

The site lives at `/en/`, `/jp/` and `/id/`. `/` redirects to the visitor's saved choice, then their device language, then English.
The header menu switches language without a reload and remembers the choice.

- `src/i18n/messages/en.ts` is the source of truth. Add a key there and `npm run typecheck` lists every language that still needs it.
- Text with a value in it is a function, for example `iAm: (name) => ...`, so each language can put the value where its grammar wants it.
- To add a language: add its code to `LOCALES` and `localeInfo` in `src/i18n/locales.ts`, a `src/i18n/messages/<code>.ts` file, register it in `messages/index.ts`, and add its language subtag to `browserLanguageMap` in `src/i18n/locales.ts`.
- `npm run build` writes one file per language and page (`dist/<code>/index.html`, `dist/<code>/supports/index.html`, `dist/<code>/content/index.html`, `dist/<code>/collab/index.html`) with its own title, meta tags and hreflang links (JSON-LD on the home page), so search engines see each language and a direct visit or refresh of any page finds a real file.
- A path whose slug is not in `SLUGS` is not an error: it falls through to the home page (`RedirectToLocale` in `src/App.tsx`). So a new page that "always redirects to the homepage" is missing from `SLUGS` or from the `<Route>` list.
- To add a page: add it to `PAGES` and `SLUGS` in `src/i18n/pages.ts`, a `<Route>` in `src/App.tsx`, and its `seo` text in the messages. A page that must never be listed by search engines (like `forbidden`) goes in `HIDDEN_PAGES` instead: it gets a file per language with `noindex`, and no sitemap entry, canonical or hreflang.
- `npm run build` also writes `dist/forbidden/index.html`, the language-less address the API sends browsers to.
- Stream titles in the `stream_slots` table are the real YouTube titles and are not translated; their descriptions are (`description` holds `en`, `jp`, `id`).

## Conventions

- Data from the API: a section that shows a skeleton while its list loads reads it with `useData(path)` inside `<AsyncBoundary fallback={...}>` (`src/components/ui/AsyncBoundary.tsx`): React's `use` and Suspense for the loading state, an error boundary with a "Try again" button for the failure. Content that must stay on screen while it is fetched or refreshed (the schedule) uses `useApi(path)` instead: it never suspends, keeps the old answer while a new one arrives and asks again when the tab comes back to the foreground. Both share one cache in `src/data/api.ts` (an answer is reused for a minute, a failure for five seconds). Switching between lists (the Content tabs) goes through `useTransition`, so the old list stays until the new one has arrived. Keep the `path` of a mounted component fixed; change a `key` to read another list.
- Motion: run GSAP only through `useGsap` (or check `prefersReducedMotion()`), so reduced motion shows the final static look.
- Styling: CSS Modules per component; colours and shadows come from the variables in `src/styles/global.css`, no hard-coded hex in modules.
- Fonts: only Latin subsets are bundled on purpose; kana and kanji use the system fonts in `--font-cjk-fallback`.
- Dropdowns: never a native `<select>`; use `src/components/ui/Dropdown.tsx`.
- Popups (the two header bubbles) close on an outside press and on Escape through `useDismiss` in `Header.tsx`.
- Sizes: write them in `rem`, not `px`. `src/styles/global.css` lowers the root size to 93.75% below 1024 px and 90% below 760 px, so type, spacing and components shrink together on tablets and phones.
- Platforms are looked up with `getPlatform()` from `src/config/site.ts`. Event handlers start with `handle`.
- Files stay together: a helper lives in the component that uses it until it is shared or the file passes ~250 lines.
