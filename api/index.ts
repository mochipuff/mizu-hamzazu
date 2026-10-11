import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

const { SUPABASE_URL, SUPABASE_SECRET_KEY, TRAKTEER_API_KEY, CRON_SECRET } = process.env;
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

interface DonationRow {
  name: string;
  amount: number;
  platform: 'trakteer' | 'tako' | 'membership';
}

interface TrakteerSupport {
  order_id: string;
  supporter_name: string;
  quantity: number;
  amount: number;
  status: string;
  updated_at: string;
}

const DAY_MS = 86_400_000;
const TOP_COUNT = 10;
const cacheControl = (sMaxAge: number, staleWhileRevalidate: number): string => `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
const SCHEDULE_CACHE = cacheControl(60, 300);
const SLOW_CACHE = cacheControl(3_600, 86_400);

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_TRACKED = 10_000;
const PUBLIC_FEEDS = ['/api/schedule', '/api/preferences', '/api/notes', '/api/donations'];
const hits = new Map<string, { count: number; resetAt: number }>();

const TRAKTEER_PAGE_SIZE = 50;
const TRAKTEER_MAX_PAGES = 20;

const TRAKTEER_UTC_OFFSET = '+07:00';

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

app.get('/api/donations', async (c) => {
  const donations = unwrap(
    await supabase
      .from('supporter_totals')
      .select('name,amount,platform')
      .order('amount', { ascending: false })
      .order('name')
      .limit(TOP_COUNT)
      .overrideTypes<DonationRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(donations);
});

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

const isSameSecret = (given: string | undefined, expected: string): boolean => given !== undefined && timingSafeEqual(digest(given), digest(expected));

const TRAKTEER_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d{1,6})?$/;

function toPaidAt(updatedAt: unknown): string {
  const match = typeof updatedAt === 'string' ? TRAKTEER_TIMESTAMP.exec(updatedAt.trim()) : null;
  const paidAt = match ? new Date(`${match[1]}T${match[2]}${TRAKTEER_UTC_OFFSET}`) : null;
  if (!paidAt || Number.isNaN(paidAt.getTime())) throw new Error('Trakteer: a support entry has an invalid updated_at');
  return paidAt.toISOString();
}

async function fetchTrakteerPage(page: number): Promise<TrakteerSupport[]> {
  const response = await fetch(`https://api.trakteer.id/v1/public/supports?limit=${TRAKTEER_PAGE_SIZE}&page=${page}`, {
    headers: { key: TRAKTEER_API_KEY ?? '', Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Trakteer: HTTP ${response.status}`);

  const body = (await response.json()) as { result: { data: TrakteerSupport[] } };
  return body.result.data;
}

async function handleDonationsSync(c: Context) {
  c.header('Cache-Control', 'no-store');
  if (!CRON_SECRET || !TRAKTEER_API_KEY) throw new Error('CRON_SECRET and TRAKTEER_API_KEY must be set');
  if (!isSameSecret(c.req.header('authorization'), `Bearer ${CRON_SECRET}`)) return c.json({ error: 'Unauthorized' }, 401);

  let synced = 0;
  for (let page = 1; page <= TRAKTEER_MAX_PAGES; page++) {
    const supports = await fetchTrakteerPage(page);
    if (supports.length === 0) break;

    const rows = supports.map((support) => {
      if (typeof support.supporter_name !== 'string') throw new Error('Trakteer: a support entry has no supporter_name');
      return {
        order_id: support.order_id,
        supporter_name: support.supporter_name.trim(),
        amount: support.amount,
        quantity: support.quantity,
        platform: 'trakteer',
        status: support.status,
        paid_at: toPaidAt(support.updated_at),
      };
    });

    const { error } = await supabase.from('donations').upsert(rows, { onConflict: 'order_id' });
    if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });
    synced += rows.length;
  }

  return c.json({ synced });
}

app.on(['GET', 'POST'], '/api/donations/sync', handleDonationsSync);

app.onError((error, c) => {
  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
