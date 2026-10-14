import { createClient } from '@supabase/supabase-js';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';

/** Reads a secret from the environment (`.env.local` under `vercel dev`, Project Settings on Vercel). A missing or wrong value stops the function instead of failing later. */
function requireEnv(name: string, problemWith?: (value: string) => string | false): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set`);
  const problem = problemWith?.(value);
  if (problem) throw new Error(`${name} ${problem}`);
  return value;
}

const SUPABASE_URL = requireEnv('SUPABASE_URL', (value) => !(URL.canParse(value) && new URL(value).protocol === 'https:') && 'must be an https URL');
const SUPABASE_SECRET_KEY = requireEnv('SUPABASE_SECRET_KEY', (value) => value.startsWith('sb_publishable_') && 'is the publishable key; the server needs the secret key');

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

type Localized = Record<'en' | 'jp' | 'id' | 'kr', string>;

interface StreamSlotRow {
  id: string;
  title: string;
  description: Localized;
  datetime: string;
  durationMinutes: number;
  platform: 'youtube' | 'twitch' | 'x' | 'discord';
  membersOnly: boolean;
  thumbnailUrl: string | null;
  /** Set by the live Worker; null for rows added by hand. */
  liveStatus: 'upcoming' | 'live' | 'ended' | null;
}

interface PreferenceRow {
  id: number;
  kind: 'like' | 'dislike';
  label: Localized;
}

interface NoteRow {
  id: number;
  name: string;
  text: string;
}

interface FanartRow {
  id: number;
  username: string;
  mediaUrl: string;
  postedAt: string;
}

type SongLabel = 'original' | 'cover';

interface VideoRow {
  id: string;
  kind: VideoKind;
  label: SongLabel | null;
  title: string;
  publishedAt: string;
}

const DAY_MS = 86_400_000;
const cacheControl = (sMaxAge: number, staleWhileRevalidate: number): string => `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
const SCHEDULE_CACHE = cacheControl(60, 300);
const SLOW_CACHE = cacheControl(3_600, 86_400);

const FANART_PAGE_SIZE = 9;
const FANART_MAX_PAGE = 100;

// The kinds of upload a Content tab lists. The Worker (`worker/src/youtube.ts`) fills the `videos` table; this function only reads it.
const VIDEO_KINDS = ['live', 'short', 'vod'] as const;
type VideoKind = (typeof VIDEO_KINDS)[number];
// Videos a category shows (Streams, Shorts, Videos, Songs). A video labelled original/cover in `videos.label` is a Song, whatever its kind. The database keeps each bucket at this size.
const VIDEOS_PER_CATEGORY = 12;

const toOrigin = (value: string | undefined): string[] => {
  const host = value?.trim();
  const url = host?.includes('://') ? host : `https://${host}`;
  return host && URL.canParse(url) ? [new URL(url).origin] : [];
};

// The only pages allowed to call the API: this site, plus the preview and local addresses outside production.
const allowedOrigins = new Set([
  ...toOrigin(process.env.VITE_SITE_URL),
  ...toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []).flatMap(toOrigin),
  ...(process.env.VERCEL_ENV === 'production'
    ? []
    : [...toOrigin(process.env.VERCEL_BRANCH_URL), ...toOrigin(process.env.VERCEL_URL), 'http://localhost:3000', 'http://localhost:5173']),
]);

// Where a visitor who opens an API address in the browser ends up. A real page of the site (`src/pages/ForbiddenPage.tsx`); keep in step with FORBIDDEN_PATH in src/i18n/pages.ts.
const FORBIDDEN_PATH = '/forbidden/';
// What a browser asks for when the address is opened as a page, tab or frame. The site's own fetch() sends `Sec-Fetch-Dest: empty`.
const PAGE_DESTINATIONS = new Set(['document', 'iframe', 'frame', 'fencedframe', 'embed', 'object']);

const app = new Hono({ strict: false });

/** True when the browser is showing this address itself (address bar, a link, a frame) instead of the site's script reading it. Browsers too old to send `Sec-Fetch-*` still list `text/html` first in `Accept`. */
function opensAsPage(c: Context): boolean {
  const destination = c.req.header('sec-fetch-dest');
  if (destination) return PAGE_DESTINATIONS.has(destination);
  return !c.req.header('sec-fetch-site') && (c.req.header('accept') ?? '').includes('text/html');
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error || data === null) throw new Error(`Supabase: ${error?.message ?? 'no data'}`, { cause: error });
  return data;
}

const isContentKind = (value: string): value is VideoKind | 'song' => value === 'song' || VIDEO_KINDS.some((kind) => kind === value);

const readVideos = async (kind: VideoKind | 'song'): Promise<VideoRow[]> => {
  const videos = supabase.from('videos').select('id,kind,label,title,publishedAt:published_at');
  return unwrap(
    await (kind === 'song' ? videos.not('label', 'is', null) : videos.eq('kind', kind).is('label', null))
      .order('published_at', { ascending: false })
      .limit(VIDEOS_PER_CATEGORY)
      .overrideTypes<VideoRow[], { merge: false }>(),
  );
};

// This function is the site's Backend-for-Frontend: the browser only ever talks to it, and the Supabase and YouTube secrets never leave it.
// CORS lets only our own pages read the answers; the guard below also turns away what CORS does not stop: the address bar and frames are sent to the Forbidden page, another site's <img>/<script> tag gets a 403.
app.use('/api/*', cors({ origin: (origin) => (allowedOrigins.has(origin) ? origin : null), allowMethods: ['GET'], maxAge: 86_400 }));
app.use('/api/*', async (c, next) => {
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  // The answer depends on who asks, so a cache must not hand a script's answer to a page that opens the same address.
  c.header('Vary', 'Origin, Accept, Sec-Fetch-Site, Sec-Fetch-Dest', { append: true });

  // Nothing is read for a visitor who opens an API address: they are sent to the Forbidden page, never shown data.
  if (opensAsPage(c)) {
    c.header('Cache-Control', 'no-store');
    return c.redirect(FORBIDDEN_PATH, 307);
  }

  const origin = c.req.header('origin');
  const fetchSite = c.req.header('sec-fetch-site');
  // Browsers always send `Sec-Fetch-Site` (`none` for a typed address). Callers that are not browsers send neither header and are let through: everything under /api here is public data.
  const fromOurPages = origin ? allowedOrigins.has(origin) : !fetchSite || fetchSite === 'same-origin';
  if (fromOurPages) return next();

  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Forbidden' }, 403);
});

// Every distinct URL is its own CDN cache key, so a query string would bypass the cache and reach the database.
app.use('/api/*', async (c, next) => {
  if (!c.req.url.includes('?')) return next();
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Query parameters are not accepted' }, 400);
});

app.get('/api/schedule', async (c) => {
  const now = Date.now();
  const slots = unwrap(
    await supabase
      .from('stream_slots')
      .select('id,title,description,datetime,durationMinutes:duration_minutes,platform,membersOnly:members_only,thumbnailUrl:thumbnail_url,liveStatus:live_status')
      .gte('datetime', new Date(now - DAY_MS).toISOString())
      .lt('datetime', new Date(now + 8 * DAY_MS).toISOString())
      .order('datetime')
      .limit(100)
      .overrideTypes<StreamSlotRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SCHEDULE_CACHE);
  return c.json(slots);
});

app.get('/api/preferences', async (c) => {
  const preferences = unwrap(
    await supabase.from('likes_dislikes').select('id,kind,label').order('sort_order').order('id').overrideTypes<PreferenceRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(preferences);
});

app.get('/api/notes', async (c) => {
  const notes = unwrap(
    await supabase
      .from('viewers_notes')
      .select('id,name,text:note')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(60)
      .overrideTypes<NoteRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(notes);
});

app.get('/api/fanart/:page', async (c) => {
  // Digits only: `Number()` would also accept `0x10`, `1e1` or `+5`, each a separate cache key for the same page.
  const raw = c.req.param('page');
  const page = Number(raw);
  if (!/^[1-9]\d{0,2}$/.test(raw) || page > FANART_MAX_PAGE) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Not Found' }, 404);
  }

  // One row more than the page, only to know whether a next page exists.
  const from = (page - 1) * FANART_PAGE_SIZE;
  const rows = unwrap(
    await supabase
      .from('fanarts')
      .select('id,username,mediaUrl:media_url,postedAt:posted_at')
      .order('posted_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + FANART_PAGE_SIZE)
      .overrideTypes<FanartRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SCHEDULE_CACHE);
  return c.json({ posts: rows.slice(0, FANART_PAGE_SIZE), hasMore: rows.length > FANART_PAGE_SIZE && page < FANART_MAX_PAGE });
});

app.get('/api/content/:kind', async (c) => {
  const kind = c.req.param('kind');
  if (!isContentKind(kind)) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Not Found' }, 404);
  }

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(await readVideos(kind));
});

app.onError((error, c) => {
  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
