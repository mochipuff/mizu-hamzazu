import { createClient } from '@supabase/supabase-js';
import { Hono, type MiddlewareHandler } from 'hono';

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set');

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

const DAY_MS = 86_400_000;
const cacheControl = (sMaxAge: number, staleWhileRevalidate: number): string => `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
const SCHEDULE_CACHE = cacheControl(60, 300);
const SLOW_CACHE = cacheControl(3_600, 86_400);

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_TRACKED = 10_000;
const PUBLIC_FEEDS = ['/api/schedule', '/api/preferences', '/api/notes', '/api/fanart/*'];
const hits = new Map<string, { count: number; resetAt: number }>();

const FANART_PAGE_SIZE = 6;
const FANART_MAX_PAGE = 100;

const app = new Hono({ strict: false });

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error || data === null) throw new Error(`Supabase: ${error?.message ?? 'no data'}`, { cause: error });
  return data;
}

const guardPublicFeed: MiddlewareHandler = async (c, next) => {
  const now = Date.now();
  
  const ip = c.req.header('x-real-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (hits.size >= RATE_MAX_TRACKED) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    if (hits.size >= RATE_MAX_TRACKED) hits.clear();
  }
  let entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    hits.set(ip, entry);
  }
  if (++entry.count > RATE_LIMIT) {
    c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Too Many Requests' }, 429);
  }

  if (c.req.url.includes('?')) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Query parameters are not accepted' }, 400);
  }
  await next();
};

for (const path of PUBLIC_FEEDS) app.use(path, guardPublicFeed);

app.get('/api/schedule', async (c) => {
  const now = Date.now();
  const slots = unwrap(
    await supabase
      .from('stream_slots')
      .select('id,title,description,datetime,durationMinutes:duration_minutes,platform,membersOnly:members_only,thumbnailUrl:thumbnail_url')
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
  const page = Number(c.req.param('page'));
  if (!Number.isInteger(page) || page < 1 || page > FANART_MAX_PAGE) {
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

app.onError((error, c) => {
  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
