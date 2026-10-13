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
Also set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` there (next section), plus `YOUTUBE_API_KEY` and `CRON_SECRET` for the Content page (see Supports, likes and notes backend). `ALLOWED_ORIGINS` is optional (extra sites allowed to call `/api/*`, comma separated, for example a `www` alias).
The Content-Security-Policy in `vercel.json` only lets images load from this site, `i.ytimg.com`, `*.supabase.co` and `pbs.twimg.com`.

## Schedule backend

`GET /api/schedule/` is a Hono function (`api/index.ts`, Vercel Node.js runtime) that reads the `stream_slots` table in Supabase and returns the streams from 1 day ago to 8 days ahead. The browser never talks to Supabase.

1. Create the table in the Supabase SQL editor. RLS is on with no policy, so only the secret key can read it:

```sql
create table public.stream_slots (
  id text primary key,
  title text not null,
  description jsonb not null,
  datetime timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  platform text not null check (platform in ('youtube', 'twitch', 'x', 'discord')),
  members_only boolean not null default false,
  thumbnail_url text
);

create index stream_slots_datetime_idx on public.stream_slots (datetime);

alter table public.stream_slots enable row level security;

insert into public.stream_slots (id, title, description, datetime, duration_minutes, platform, thumbnail_url) values
  ('untilthen', '🔴『UNTIL THEN』kelanjutan setelah ketemu anak baru', '{"en": "Game Stream", "jp": "ゲーム生配信スケジュール", "id": "Stream main game", "kr": "게임 생방송 일정"}', '2026-10-15 08:00+07', 180, 'youtube', 'https://i.ytimg.com/vi/S6PD4T8H4Cw/maxresdefault.jpg'),
  ('thuriview', '#THUREVIEW vtuber fav', '{"en": "Reviewing YOUR Favorite VTubers!", "jp": "みんなの推しV紹介！", "id": "Review VTuber Favorit Kamu!", "kr": "시청자 최애 버튜버 리뷰!"}', '2026-10-15 15:30+07', 180, 'youtube', null);
```

2. Add or edit streams in Supabase, Table Editor. Every stream is one real date and time: write `datetime` with its offset (`2026-10-22 08:00+07`). Streams do not repeat on their own. The page updates within about a minute (CDN cache).
3. In Vercel, Project Settings, Environment Variables, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (the `sb_secret_...` key from Supabase, Settings, API Keys) for Production and Preview, and mark the key **Sensitive**. Never prefix them with `VITE_`, that would put them in the browser bundle. If the key ever leaks, create a new one in Supabase and delete the old one.
4. Locally: copy `.env.example` to `.env.local`, fill it in, run `npx vercel dev`. `.env.local` and `.vercel/` are git-ignored.

## Supports, likes and notes backend

Five more routes of `api/index.ts` read Supabase through the same secret key (RLS on, no policy, the browser never talks to Supabase):

| Route | Table / view | Feeds |
| --- | --- | --- |
| `GET /api/preferences/` | `likes_dislikes` | "Likes" and "Not so much" (Lore section) |
| `GET /api/notes/` | `viewers_notes` | Viewer notes (Supports) |
| `GET /api/fanart/<page>/` | `fanarts` | Fan art, 9 per page (3 by 3 on a desktop, 2 columns on a phone), newest post first (Supports). `<page>` starts at 1 (up to 100), the answer is `{ posts, hasMore }`. The page loads page 1 and asks for the next one only when "Load more" is clicked |
| `GET /api/content/<kind>/` | `videos` | Content page, one tab per `<kind>`: `live` (streams), `short` (Shorts), `vod` (regular videos) or `song` (every video whose `label` is `original` or `cover`, whatever its kind). The 12 newest of that kind. Only reads the table; it never calls YouTube |
| `GET /api/videos/sync/` | `videos` | Not for the browser. Vercel Cron calls it daily at 03:00 UTC (`crons` in `vercel.json`). It reads the newest uploads of the `@MizuHamzazu` channel from the YouTube Data API v3 (streams, regular videos and Shorts), inserts the ones the table does not have yet, then deletes the oldest so each category keeps 12. Rows already in the table are never changed, so a `kind` or `label` you corrected by hand stays. Answers `401` unless the request carries `Authorization: Bearer $CRON_SECRET`. Needs `YOUTUBE_API_KEY` and `CRON_SECRET` (at least 32 characters, for example `openssl rand -hex 32`) |

Only this site's own pages may call the API: other origins get `403` (CORS plus an origin check). Allowed are `VITE_SITE_URL`, the Vercel production domain, `ALLOWED_ORIGINS`, and outside production the Vercel preview URLs and `localhost:3000` / `localhost:5173`.

**Opening an API address in the browser shows the Forbidden page, never data.** A visitor who types `/api/schedule/` in the address bar, follows a link to it or puts it in a frame is sent (`307`) to `/forbidden/`, which the app moves to `/<locale>/forbidden/` (`src/pages/ForbiddenPage.tsx`, in all four languages, `noindex`). It is decided before any database call, in two places:

1. `vercel.json`, first entry of `redirects`: matches `Sec-Fetch-Dest: document | iframe | frame | fencedframe | embed | object` on `/api/*`. This runs before the CDN cache, so a response cached for the site's own `fetch()` can never be served to a page that opens the same address.
2. `api/index.ts`, `opensAsPage()`: the same test inside the function, plus a fallback for browsers that send no `Sec-Fetch-*` headers (they still ask for `text/html`). Every API response also carries `Vary: Origin, Accept, Sec-Fetch-Site, Sec-Fetch-Dest`.

What this does and does not do: it keeps the data out of the address bar, links, frames and other sites' tags. It cannot hide what the page itself shows: the site's `fetch()` calls are visible in the browser's developer tools, and a command-line client can send any header it likes. Keep every API response to the fields the page really displays (as today), and never put anything in it that must stay private.

After a deploy, check it from a terminal (the first command must answer `307` with `location: /forbidden/`, the second `200` with JSON):

```bash
curl -si -H 'Sec-Fetch-Dest: document' -H 'Sec-Fetch-Mode: navigate' -H 'Sec-Fetch-Site: none' https://your-domain.tld/api/schedule/ | head -5
curl -si -H 'Sec-Fetch-Dest: empty' -H 'Sec-Fetch-Mode: cors' -H 'Sec-Fetch-Site: same-origin' https://your-domain.tld/api/schedule/ | head -5
```

The public routes accept no query string (`/api/notes/?x=1` answers `400`), because every distinct URL would miss the CDN cache and hit the database. The function has no rate limiter of its own (a counter in one serverless instance does not hold). Add one in the Vercel Firewall (Project, Firewall, New Rule): path starts with `/api/`, action Rate Limit, fixed window 60 s, about 60 requests per IP. Optionally add a second rule that denies `/api/` requests with a non-empty query string, so they never reach the function (Hobby allows one rate-limit rule per project).

1. Run this in the Supabase SQL editor (tables, view, RLS):

```sql
-- Keeps updated_at honest on every edit, whether it comes from the Table Editor, the API or another service.
-- [FIX]: Menggunakan CREATE OR REPLACE FUNCTION agar tidak error "same argument types" jika dijalankan ulang
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The "Likes" and "Not so much" lists of the Lore section. One row per item, written in all four site languages.
create table if not exists public.likes_dislikes (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('like', 'dislike')),
  label jsonb not null check (label ?& array['en', 'jp', 'id', 'kr']),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The notes pinned on the Supports page, newest first. Only rows with is_approved = true are served.
create table if not exists public.viewers_notes (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> ''),
  note text not null check (btrim(note) <> ''),
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists viewers_notes_approved_idx on public.viewers_notes (is_approved, created_at desc);

-- The fan art on the Supports page, newest post first.
create table if not exists public.fanarts (
  id bigint generated always as identity primary key,
  username text not null check (btrim(username) <> '' and username !~ '^@'),
  media_url text not null check (media_url ~ '^https://'),
  posted_at timestamptz not null
);

create index if not exists fanarts_posted_at_idx on public.fanarts (posted_at desc, id desc);

-- The Content page.
create table if not exists public.videos (
  id text primary key,
  kind text not null check (kind in ('live', 'short', 'vod')),
  label text check (label in ('original', 'cover')),
  title text not null,
  published_at timestamptz not null
);

create index if not exists videos_kind_published_at_idx on public.videos (kind, published_at desc);

-- [FIX]: Menghapus trigger lama (jika ada) sebelum membuatnya kembali agar tidak error duplicate trigger
drop trigger if exists likes_dislikes_updated_at on public.likes_dislikes;
create trigger likes_dislikes_updated_at before update on public.likes_dislikes for each row execute function public.set_updated_at();

drop trigger if exists viewers_notes_updated_at on public.viewers_notes;
create trigger viewers_notes_updated_at before update on public.viewers_notes for each row execute function public.set_updated_at();

-- RLS on with no policy: only the secret key (the API) can read or write. The browser never talks to Supabase.
alter table public.likes_dislikes enable row level security;
alter table public.viewers_notes enable row level security;
alter table public.fanarts enable row level security;
alter table public.videos enable row level security;
```

2. Load the starting data (the lists that used to live in `messages/*.ts` and `data/supports.ts`):

```sql
-- Starting data, moved over from the old static files.
insert into public.likes_dislikes (kind, label, sort_order) values
  ('like', '{"en":"Fikk","jp":"Fikk","id":"Fikk","kr":"Fikk"}', 1),
  ('like', '{"en":"Valorant","jp":"Valorant","id":"Valorant","kr":"Valorant"}', 2),
  ('like', '{"en":"Minecraft","jp":"Minecraft","id":"Minecraft","kr":"Minecraft"}', 3),
  ('like', '{"en":"Tomodachi Life","jp":"トモダチコレクション","id":"Tomodachi Life","kr":"Tomodachi Life"}', 4),
  ('like', '{"en":"Sushi","jp":"お寿司","id":"Sushi","kr":"스시"}', 5),
  ('like', '{"en":"Cimol","jp":"Cimol（揚げタピオカ団子）","id":"Cimol","kr":"Cimol(튀긴 타피오카 간식)"}', 6),
  ('like', '{"en":"Spicy food","jp":"辛いもの","id":"Makanan pedas","kr":"매운 음식"}', 7),
  ('like', '{"en":"Matcha","jp":"抹茶","id":"Matcha","kr":"말차"}', 8),
  ('like', '{"en":"Coffee","jp":"コーヒー","id":"Kopi","kr":"커피"}', 9),
  ('like', '{"en":"Teazzi","jp":"Teazzi","id":"Teazzi","kr":"Teazzi"}', 10),
  ('dislike', '{"en":"Insects","jp":"虫","id":"Serangga","kr":"벌레"}', 1),
  ('dislike', '{"en":"Horror games","jp":"ホラーゲーム","id":"Game horor","kr":"공포 게임"}', 2),
  ('dislike', '{"en":"Thunderstorms","jp":"雷","id":"Badai petir","kr":"천둥번개"}', 3),
  ('dislike', '{"en":"Mint-flavored food","jp":"ミント味の食べ物","id":"Makanan mint","kr":"민트 맛 음식"}', 4);

insert into public.viewers_notes (name, note) values
  ('Fikk', 'Semangat streaming dan bikin kontennya, btw mizu kangen.');
```

## Maintaining the data

| To | Do this in the Table Editor |
| --- | --- |
| Add or remove a like / "not so much" | Insert or delete a row of `likes_dislikes`. `kind` is `like` or `dislike`, `label` is JSON with all four languages (`{"en": "...", "jp": "...", "id": "...", "kr": "..."}`, the table refuses a row that misses one), `sort_order` sets the order |
| Pin or take down a viewer note | Insert a row of `viewers_notes`, or set its `is_approved` to `false` (or delete it) to take it down. The 60 newest approved notes are shown |
| Add or remove a fan art | Insert a row of `fanarts`: `username` (the poster's handle, no @), `media_url` (direct https link to the image, its host must be allowed in the `img-src` of `vercel.json`) and `posted_at` (when the post was made, with its offset). Delete the row to take it down. The newest 9 show first, the rest sit behind "Load more" |
| Mark a video as a song, or fix its tab | Edit the row in `videos`: set `label` to `original` or `cover` to move it to the Songs tab, or change `kind`. The sync never overwrites these edits |

- Schedule and fan art changes show on the site within about 1 to 6 minutes (the CDN keeps each answer 60 seconds and may serve a stale one for 5 more). Likes, viewer notes and the Content page are cached for 1 hour and may serve a stale answer for up to 24 more.
- **Existing database** (tables created before `is_approved` existed): run this once, and do it before deploying the API, which now filters on the column. Existing notes stay visible.

```sql
alter table public.viewers_notes add column if not exists is_approved boolean not null default true;
create index if not exists viewers_notes_approved_idx on public.viewers_notes (is_approved, created_at desc);
```

- **Existing database** (Top 10 donations removed, fan art added): run the first block before deploying the API, which now reads `fanarts`. Run the second one after the deploy, once nothing reads the donation tables any more.

```sql
create table public.fanarts (
create table if not exists public.fanarts (
  id bigint generated always as identity primary key,
  username text not null check (btrim(username) <> '' and username !~ '^@'),
  media_url text not null check (media_url ~ '^https://'),
  posted_at timestamptz not null
);

create index if not exists fanarts_posted_at_idx on public.fanarts (posted_at desc, id desc);

alter table public.fanarts enable row level security;
```

```sql
drop view if exists public.supporter_totals;
drop table if exists public.donations;
```

- **Existing database** (Content page added): run this before deploying the API, then add `YOUTUBE_API_KEY` in Vercel (Google Cloud Console, enable YouTube Data API v3, create an API key; mark it **Sensitive**). Also add `CRON_SECRET` (at least 32 random characters, mark it **Sensitive**). After deploying, run the cron job once from Vercel, Project Settings, Cron Jobs, Run, to fill the table; from then on it refreshes daily, so new uploads appear without any manual step.

```sql
create table if not exists public.videos (
  id text primary key,
  kind text not null check (kind in ('live', 'short', 'vod')),
  label text check (label in ('original', 'cover')),
  title text not null,
  published_at timestamptz not null
);

create index if not exists videos_kind_published_at_idx on public.videos (kind, published_at desc);

alter table public.videos enable row level security;
```

- **Existing database** (Songs tab added): run this once before deploying the API, which now selects `label`.

```sql
alter table public.videos add column if not exists label text check (label in ('original', 'cover'));
```

- Changing the schema: write the change as a migration (`supabase migration new <name>`), add a column before the API reads it and drop one only after the API stopped selecting it.
- Back-ups: Supabase Pro keeps daily ones. On the free plan run `supabase db dump` now and then.

## Using the data from other programs

- **Reading:** call the public routes above. They are cached at the edge, need no key and are the contract: the columns behind them may change, the JSON they return should not.
- **Writing:** only from a server, with a Supabase secret key (`sb_secret_...`) kept in that service's secret store, never in a browser, an app or a repository. Create one secret key per service in Supabase, Settings, API Keys, so a leaked one can be revoked on its own.
- **Querying Supabase directly** (another microservice, a script): select only the columns you need, filter and `limit`, and page with `range()` instead of loading a table.

```ts
const { data } = await supabase.from('fanarts').select('id,username,media_url').order('posted_at', { ascending: false }).range(0, 5);
```

```bash
curl "$SUPABASE_URL/rest/v1/fanarts?select=id,username,media_url&order=posted_at.desc&limit=6" -H "apikey: $SUPABASE_SECRET_KEY"
```

- **Make writes repeatable:** send rows in batches in one call. A service that pushes notes or fan art has no natural key, so give it one (a `source_id` column with a unique index) before it retries anything.
- **Time:** times are `timestamptz`, send them as ISO 8601 with the offset (`2026-10-12T20:15:00+07:00`).
- **Never** expose these tables to the `anon` role: RLS with no policy is what keeps them private.

## Where things live

| What | Where |
| --- | --- |
| Site name, links, handles, theme colour, share image | `src/config/site.ts` |
| Profile facts that are the same in every language (height, debut, birthday, fan name, socials, aliases). Empty values (like `illustrator` until it is known) are never published | `src/config/site.ts` (`profile`, `fanName`) |
| **All text**, in English, Japanese, Indonesian and Korean: UI labels, SEO title/description, bio, FAQ, emote names, form messages | `src/i18n/messages/{en,jp,id,kr}.ts` |
| Language list, URL codes (`/en/`, `/jp/`, `/id/`, `/kr/`), device-language detection, saved choice | `src/i18n/locales.ts`, `src/i18n/navigation.ts` |
| Routes (`/<locale>/`, `/<locale>/supports/`, `/<locale>/content/`, and the hidden `/<locale>/forbidden/`), redirect for URLs without a language | `src/App.tsx`, page slugs in `src/i18n/pages.ts`, sections in `src/pages/` |
| Per-language, per-page HTML files, meta tags, hreflang, JSON-LD, robots.txt (AI crawler rules), llms.txt (one per language too), sitemap.xml, sitemap-images.xml, no-JS fallback HTML, the `/` language redirect | `vite/seoPlugin.ts` |
| Animations (GSAP + ScrollTrigger, reduced-motion aware: with reduced motion nothing animates and CSS shows the final look) | `src/lib/motion.ts`, `src/hooks/useGsap.ts`, `Reveal.tsx` |
| Membership tier badges | `TIER_LEVELS` in `FloatingBadges.tsx`, `public/membership/tier-1.webp` to `tier-6.webp` (1:1, replace the placeholders) |
| Clover and branch decorations | `Clover` / `Branch` in `Doodles.tsx`, `Garland.tsx`, `SectionHeading.tsx` |
| Header. Desktop: a bar with About (dropdown with Lore, Schedule, Emotes, FAQ), Join, Content, Supports and the language menu. Below 1024 px the menu button opens a popup bubble with the language menu and the same links. The brand pill opens a second bubble with Home and the sound switch (`Sfx: on` / `Sfx: off`, remembered in `localStorage` as `mizu:sound`, off by default; the effects are synthesized with the Web Audio API, the site ships no audio files) | `src/components/layout/Header.tsx`, `Header.module.css`, `src/context/sound.ts` |
| Home sections, in order: Hero, Lore (`id="lore"`: the lore card, profile, likes, not so much, stream types), Schedule, Emotes, Join, FAQ. The Lore link in the About dropdown points at `#lore`; the dropdown button itself keeps the label `nav.about` | `src/pages/HomePage.tsx`, `src/components/sections/`, `navIds` in `Header.tsx` |
| Fan art decorations (stickers along both edges of the section). Fixed zigzag, the same on every visit, behind the grid. They pop in on scroll, drift at their own speed while scrolling and fly a small loop of their own when idle (three nested layers, GSAP through `useGsap`; with reduced motion they sit still) | `DECORATION_COUNT`, `SIZES`, `TILTS`, `PARALLAX` and the `useGsap` call in `Fanart.tsx` |
| Emotes: every emote sits in the same square tile and keeps its own proportions (`object-fit: contain`), so images that are not exactly 1:1 are not stretched | `.face` in `Emotes.module.css` |
| Hero watch buttons: YouTube and Twitch. While the schedule says a stream is on, the button of that stream's platform becomes the animated **Now live** button (pulsing dot, rippling ring, sheen) and opens the live page; otherwise it is the normal `Watch on ...` button | `HeroActions` in `Hero.tsx`, `LiveButton.tsx`, texts `hero.nowLive` / `hero.nowLiveOn` |
| Content page loading: skeleton cards while the list loads, and every thumbnail shows an animated placeholder (sliding stripes, hopping paw) until its image arrives, then fades in. A failed image keeps a calm placeholder. Reusable for any image: `<LoadingImage className="..." src alt />` | `LoadingImage.tsx`, `VideoSkeleton` in `ContentPage.tsx` |
| Forbidden page, shown when a browser opens an API address (see Supports, likes and notes backend) | `src/pages/ForbiddenPage.tsx`, `forbidden` in the messages, `HIDDEN_PAGES` in `src/i18n/pages.ts` |
| Emotes, hero art, first-paint images | `src/data/images.ts` |
| Stream schedule: table in Supabase, API in `api/index.ts`, client request in `src/data/schedule.ts`, date maths in `src/lib/schedule.ts`. Likes, viewer notes and fan art: tables in Supabase, same API file, shared client hook `src/data/api.ts`, support links and note type in `src/data/supports.ts`, the fan art section in `src/components/sections/Fanart.tsx`. The words are in `src/i18n/messages` | `api/index.ts`, `src/data/api.ts`, `src/data/schedule.ts`, `src/data/supports.ts` |
| Loading screen markup + styles / logic | `index.html` (inline critical CSS; keep the `<!--locale-head-->` and `<!--locale-noscript-->` markers, the build fails without them) / `src/main.tsx` |
| Images `.webp` | `public/emotes/<name>.webp`, `public/hero/<name>.webp`, `public/membership/tier-<n>.webp`, `public/og-image.webp` (1200x630), `public/favicon.ico` (must hold a 48x48 image, Google ignores favicons that are not a multiple of 48 px; the build warns), `public/favicon.svg` |

When you add an emote or hero image, add its `.webp` file to `public/` and list it in `src/data/images.ts`.
The loading screen only waits for fonts and the hero images, downloaded and decoded (`src/main.tsx`, list in `src/data/images.ts`); everything else loads lazily.

## Languages

The site lives at `/en/`, `/jp/`, `/id/` and `/kr/`. `/` redirects to the visitor's saved choice, then their device language, then English.
The header menu switches language without a reload and remembers the choice.

- `src/i18n/messages/en.ts` is the source of truth. Add a key there and `npm run typecheck` lists every language that still needs it.
- Text with a value in it is a function, for example `iAm: (name) => ...`, so each language can put the value where its grammar wants it.
- To add a language: add its code to `LOCALES` and `localeInfo` in `src/i18n/locales.ts`, a `src/i18n/messages/<code>.ts` file, register it in `messages/index.ts`, and add its language subtag to `browserLanguageMap` in `src/i18n/locales.ts`.
- `npm run build` writes one file per language and page (`dist/<code>/index.html`, `dist/<code>/supports/index.html`, `dist/<code>/content/index.html`) with its own title, meta tags and hreflang links (JSON-LD on the home page), so search engines see each language and a direct visit or refresh of any page finds a real file.
- To add a page: add it to `PAGES` and `SLUGS` in `src/i18n/pages.ts`, a `<Route>` in `src/App.tsx`, and its `seo` text in the messages. A page that must never be listed by search engines (like `forbidden`) goes in `HIDDEN_PAGES` instead: it gets a file per language with `noindex`, and no sitemap entry, canonical or hreflang.
- `npm run build` also writes `dist/forbidden/index.html`, the language-less address the API sends browsers to.
- Stream titles in the `stream_slots` table are the real YouTube titles and are not translated; their descriptions are (`description` holds `en`, `jp`, `id`, `kr`).

## Conventions

- Motion: run GSAP only through `useGsap` (or check `prefersReducedMotion()`), so reduced motion shows the final static look.
- Styling: CSS Modules per component; colours and shadows come from the variables in `src/styles/global.css`, no hard-coded hex in modules.
- Fonts: only Latin subsets are bundled on purpose; kana, kanji and Hangul use the system fonts in `--font-cjk-fallback`.
- Dropdowns: never a native `<select>`; use `src/components/ui/Dropdown.tsx`.
- Popups (the two header bubbles) close on an outside press and on Escape through `useDismiss` in `Header.tsx`.
- Sizes: write them in `rem`, not `px`. `src/styles/global.css` lowers the root size to 93.75% below 1024 px and 90% below 760 px, so type, spacing and components shrink together on tablets and phones.
- Platforms are looked up with `getPlatform()` from `src/config/site.ts`. Event handlers start with `handle`.
- Files stay together: a helper lives in the component that uses it until it is shared or the file passes ~250 lines.
