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
Without it the canonical URL, Open Graph image, `sitemap.xml` and JSON-LD URLs are skipped.
Also set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` there (next section), and `TRAKTEER_API_KEY` and `CRON_SECRET` for the donations sync.

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

Four more routes of `api/index.ts` read Supabase through the same secret key (RLS on, no policy, the browser never talks to Supabase):

| Route | Table / view | Feeds |
| --- | --- | --- |
| `GET /api/preferences/` | `likes_dislikes` | "Likes" and "Not so much" (About) |
| `GET /api/notes/` | `viewers_notes` | Viewer notes (Supports) |
| `GET /api/donations/` | `supporter_totals` (view over `donations`) | Top 10 donations (Supports) |
| `GET /api/donations/sync/` | writes `donations` | Pulls the Trakteer support history (needs `Authorization: Bearer $CRON_SECRET`) |

1. Run this in the Supabase SQL editor (tables, view, RLS):

```sql
-- Keeps updated_at honest on every edit, whether it comes from the Table Editor, the API or another service.
create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The "Likes" and "Not so much" lists of the About section. One row per item, written in all four site languages.
create table public.likes_dislikes (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('like', 'dislike')),
  label jsonb not null check (label ?& array['en', 'jp', 'id', 'kr']),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The notes pinned on the Supports page, newest first.
create table public.viewers_notes (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> ''),
  note text not null check (btrim(note) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per donation, never per supporter. Trakteer rows are written by GET /api/donations/sync (order_id is Trakteer's own),
-- Tako and YouTube Membership rows are added by hand because those platforms have no API here.
create table public.donations (
  order_id text primary key,
  supporter_name text not null check (btrim(supporter_name) <> ''),
  amount bigint not null check (amount >= 0),
  quantity integer not null default 1 check (quantity > 0),
  platform text not null default 'trakteer' check (platform in ('trakteer', 'tako', 'membership')),
  status text not null default 'success',
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- The leaderboard: every successful donation of the same supporter name (ignoring case and surrounding spaces) summed into one row.
-- `name` is the spelling of the latest donation, `platform` the one the supporter gave the most through.
create view public.supporter_totals with (security_invoker = true) as
select
  (array_agg(btrim(supporter_name) order by paid_at desc))[1] as name,
  sum(amount)::bigint as amount,
  sum(quantity)::integer as quantity,
  (array_agg(platform order by amount desc))[1] as platform
from public.donations
where status = 'success'
group by lower(btrim(supporter_name));

create trigger likes_dislikes_updated_at before update on public.likes_dislikes for each row execute function public.set_updated_at();
create trigger viewers_notes_updated_at before update on public.viewers_notes for each row execute function public.set_updated_at();

-- RLS on with no policy: only the secret key (the API) can read or write. The browser never talks to Supabase.
alter table public.likes_dislikes enable row level security;
alter table public.viewers_notes enable row level security;
alter table public.donations enable row level security;
revoke all on public.supporter_totals from anon, authenticated;
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

-- Only the Tako and Membership entries are seeded. The Trakteer ones come from the API (see "First sync"); seeding them too would count them twice.
insert into public.donations (order_id, supporter_name, amount, platform) values
  ('seed-cupa-tako', 'Cupa', 1000000, 'tako'),
  ('seed-avety-membership', 'Avety', 500000, 'membership'),
  ('seed-willy-tako', 'Willy', 300000, 'tako'),
  ('seed-redd-membership', 'Redd', 200000, 'membership'),
  ('seed-marc-tako', 'Marc', 150000, 'tako');
```

3. In Vercel, Project Settings, Environment Variables (Production and Preview, all **Sensitive**), add `TRAKTEER_API_KEY` (Trakteer, Manage, API) and `CRON_SECRET` (any long random string; Vercel Cron sends it as the bearer token). Locally they go in `.env.local` as well.
4. **First sync.** After the first deploy, call it once so the Trakteer supporters appear. From a terminal: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.tld/api/donations/sync/` answers `{"synced": <number>}`. After that `vercel.json` runs it once a day (Hobby plans allow one run a day; on Pro change the schedule in `crons`). The cron path ends with a slash on purpose: a cron job does not follow redirects and `trailingSlash` is on.
5. Check `select * from supporter_totals order by amount desc limit 10;` against Trakteer's own dashboard.

How the leaderboard adds up:

- Every donation is a row in `donations`. `supporter_totals` groups the rows with `status = 'success'` by supporter name (case and surrounding spaces ignored) and sums `amount` (rupiah) and `quantity`. The Top 10 page shows `amount`.
- `name` is the spelling of that supporter's latest donation. `platform` ("via ...") is the platform they gave the most through.
- Trakteer names every anonymous donor "Seseorang", so all of them add up into one entry. If that is not what you want, add `and lower(btrim(supporter_name)) <> 'seseorang'` to the view's `where`.
- Trakteer is the source of truth for Trakteer rows: the sync upserts by Trakteer's `order_id`, so running it twice changes nothing, and a hand edit of a Trakteer row is overwritten by the next run.

## Maintaining the data

| To | Do this in the Table Editor |
| --- | --- |
| Add or remove a like / "not so much" | Insert or delete a row of `likes_dislikes`. `kind` is `like` or `dislike`, `label` is JSON with all four languages (`{"en": "...", "jp": "...", "id": "...", "kr": "..."}`, the table refuses a row that misses one), `sort_order` sets the order |
| Pin or take down a viewer note | Insert or delete a row of `viewers_notes`. The 60 newest are shown |
| Record a Tako or YouTube Membership donation | Insert a row of `donations` with a unique `order_id` of your own (for example `tako-2026-10-12-cupa`), `platform` `tako` or `membership`, `amount` in rupiah |
| Correct a Trakteer amount or name | Fix it in Trakteer. A manual edit is overwritten by the next sync |
| Take a Tako or Membership donation off the board | Delete the row (or set its `status` to anything but `success`). Trakteer rows are reset by the sync |

- Changes show on the site within about 1 to 6 minutes (the CDN keeps each answer 60 seconds and may serve a stale one for 5 more).
- If the leaderboard stops moving, look at the Vercel function logs for `/api/donations/sync` (a wrong `TRAKTEER_API_KEY`, or Trakteer's Cloudflare blocking the server, show up there) and at `select max(paid_at) from donations where platform = 'trakteer'`.
- Changing the schema: write the change as a migration (`supabase migration new <name>`), add a column before the API reads it and drop one only after the API stopped selecting it.
- Back-ups: Supabase Pro keeps daily ones. On the free plan run `supabase db dump` now and then.

## Using the data from other programs

- **Reading:** call the public routes above. They are cached at the edge, need no key and are the contract: the columns behind them may change, the JSON they return should not.
- **Writing:** only from a server, with a Supabase secret key (`sb_secret_...`) kept in that service's secret store, never in a browser, an app or a repository. Create one secret key per service in Supabase, Settings, API Keys, so a leaked one can be revoked on its own.
- **Querying Supabase directly** (another microservice, a script): select only the columns you need, filter and `limit`, and page with `range()` instead of loading a table. Read the leaderboard from the view instead of summing donations yourself:

```ts
const { data } = await supabase.from('supporter_totals').select('name,amount').order('amount', { ascending: false }).limit(10);
```

```bash
curl "$SUPABASE_URL/rest/v1/supporter_totals?select=name,amount&order=amount.desc&limit=10" -H "apikey: $SUPABASE_SECRET_KEY"
```

- **Make writes repeatable:** upsert donations on `order_id` (`.upsert(rows, { onConflict: 'order_id' })`) and send rows in batches in one call. A service that pushes notes has no natural key, so give it one (a `source_id` column with a unique index) before it retries anything.
- **Money and time:** amounts are whole rupiah in `bigint`, never floats. Times are `timestamptz`, send them as ISO 8601 with the offset (`2026-10-12T20:15:00+07:00`).
- **Never** expose the `donations` table or `supporter_totals` to the `anon` role: they hold supporter names, and RLS with no policy is what keeps them private.

## Where things live

| What | Where |
| --- | --- |
| Site name, links, handles, theme colour, share image | `src/config/site.ts` |
| Profile facts that are the same in every language (height, debut, birthday, fan name, socials, aliases). Empty values (like `illustrator` until it is known) are never published | `src/config/site.ts` (`profile`, `fanName`) |
| **All text**, in English, Japanese, Indonesian and Korean: UI labels, SEO title/description, bio, FAQ, emote names, form messages | `src/i18n/messages/{en,jp,id,kr}.ts` |
| Language list, URL codes (`/en/`, `/jp/`, `/id/`, `/kr/`), device-language detection, saved choice | `src/i18n/locales.ts`, `src/i18n/navigation.ts` |
| Routes (`/<locale>/`, `/<locale>/supports/`), redirect for URLs without a language | `src/App.tsx`, page slugs in `src/i18n/pages.ts`, sections in `src/pages/` |
| Per-language, per-page HTML files, meta tags, hreflang, JSON-LD, robots.txt (AI crawler rules), llms.txt, sitemap.xml, no-JS fallback HTML, the `/` language redirect | `vite/seoPlugin.ts` |
| Animations (GSAP + ScrollTrigger, reduced-motion aware: with reduced motion nothing animates and CSS shows the final look) | `src/lib/motion.ts`, `src/hooks/useGsap.ts`, `Reveal.tsx` |
| Membership tier badges | `TIER_LEVELS` in `FloatingBadges.tsx`, `public/membership/tier-1.webp` to `tier-6.webp` (1:1, replace the placeholders) |
| Clover and branch decorations | `Clover` / `Branch` in `Doodles.tsx`, `Garland.tsx`, `SectionHeading.tsx` |
| Emotes, hero art, first-paint images | `src/data/images.ts` |
| Stream schedule: table in Supabase, API in `api/index.ts`, client request in `src/data/schedule.ts`, date maths in `src/lib/schedule.ts`. Likes, viewer notes and the donation leaderboard: tables in Supabase, same API file, shared client hook `src/data/api.ts`, types and money format in `src/data/supports.ts`. The words are in `src/i18n/messages` | `api/index.ts`, `src/data/api.ts`, `src/data/schedule.ts`, `src/data/supports.ts` |
| Loading screen markup + styles / logic | `index.html` (inline critical CSS; keep the `<!--locale-head-->` and `<!--locale-noscript-->` markers, the build fails without them) / `src/main.tsx` |
| Images `.webp` | `public/emotes/<name>.webp`, `public/hero/<name>.webp`, `public/membership/tier-<n>.webp`, `public/og-image.webp` (1200x630), `public/favicon.ico`, `public/favicon.svg` |

When you add an emote or hero image, add its `.webp` file to `public/` and list it in `src/data/images.ts`.
The loading screen only waits for fonts and the hero images, downloaded and decoded (`src/main.tsx`, list in `src/data/images.ts`); everything else loads lazily.

## Languages

The site lives at `/en/`, `/jp/`, `/id/` and `/kr/`. `/` redirects to the visitor's saved choice, then their device language, then English.
The header menu switches language without a reload and remembers the choice.

- `src/i18n/messages/en.ts` is the source of truth. Add a key there and `npm run typecheck` lists every language that still needs it.
- Text with a value in it is a function, for example `iAm: (name) => ...`, so each language can put the value where its grammar wants it.
- To add a language: add its code to `LOCALES` and `localeInfo` in `src/i18n/locales.ts`, a `src/i18n/messages/<code>.ts` file, register it in `messages/index.ts`, and add its language subtag to `browserLanguageMap` in `src/i18n/locales.ts`.
- `npm run build` writes one file per language and page (`dist/<code>/index.html`, `dist/<code>/supports/index.html`) with its own title, meta tags and hreflang links (JSON-LD on the home page), so search engines see each language and a direct visit or refresh of any page finds a real file.
- To add a page: add it to `PAGES` and `SLUGS` in `src/i18n/pages.ts`, a `<Route>` in `src/App.tsx`, and its `seo` text in the messages.
- Stream titles in the `stream_slots` table are the real YouTube titles and are not translated; their descriptions are (`description` holds `en`, `jp`, `id`, `kr`).

## Conventions

- Motion: run GSAP only through `useGsap` (or check `prefersReducedMotion()`), so reduced motion shows the final static look.
- Styling: CSS Modules per component; colours and shadows come from the variables in `src/styles/global.css`, no hard-coded hex in modules.
- Fonts: only Latin subsets are bundled on purpose; kana, kanji and Hangul use the system fonts in `--font-cjk-fallback`.
- Dropdowns: never a native `<select>`; use `src/components/ui/Dropdown.tsx`.
- Platforms are looked up with `getPlatform()` from `src/config/site.ts`. Event handlers start with `handle`.
- Files stay together: a helper lives in the component that uses it until it is shared or the file passes ~250 lines.
