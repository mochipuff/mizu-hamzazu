import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';

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

/** One entry of `result.data` of GET /v1/public/supports. */
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
const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=300';

// Trakteer pages are fetched until one comes back empty, so the API's own page-size cap does not matter.
const TRAKTEER_PAGE_SIZE = 50;
const TRAKTEER_MAX_PAGES = 20;
// `updated_at` has no zone; Trakteer is an Indonesian service and its timestamps are read as Western Indonesia Time (WIB).
const TRAKTEER_UTC_OFFSET = '+07:00';

const app = new Hono({ strict: false });

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error || data === null) throw new Error(`Supabase: ${error?.message ?? 'no data'}`, { cause: error });
  return data;
}

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

  c.header('Cache-Control', PUBLIC_CACHE);
  return c.json(slots);
});

app.get('/api/preferences', async (c) => {
  const preferences = unwrap(
    await supabase.from('likes_dislikes').select('id,kind,label').order('sort_order').order('id').overrideTypes<PreferenceRow[], { merge: false }>(),
  );

  c.header('Cache-Control', PUBLIC_CACHE);
  return c.json(preferences);
});

app.get('/api/notes', async (c) => {
  const notes = unwrap(
    await supabase.from('viewers_notes').select('id,name,text:note').order('created_at', { ascending: false }).limit(60).overrideTypes<NoteRow[], { merge: false }>(),
  );

  c.header('Cache-Control', PUBLIC_CACHE);
  return c.json(notes);
});

// `supporter_totals` already sums every entry of the same supporter name; this only ranks it.
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

  c.header('Cache-Control', PUBLIC_CACHE);
  return c.json(donations);
});

const isSameSecret = (given: string | undefined, expected: string): boolean =>
  given !== undefined && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));

async function fetchTrakteerPage(page: number): Promise<TrakteerSupport[]> {
  const response = await fetch(`https://api.trakteer.id/v1/public/supports?limit=${TRAKTEER_PAGE_SIZE}&page=${page}`, {
    headers: { key: TRAKTEER_API_KEY ?? '', Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Trakteer: HTTP ${response.status}`);

  const body = (await response.json()) as { result: { data: TrakteerSupport[] } };
  return body.result.data;
}

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. Safe to run any number of times: rows are keyed by Trakteer's order_id.
app.get('/api/donations/sync', async (c) => {
  if (!CRON_SECRET || !TRAKTEER_API_KEY) throw new Error('CRON_SECRET and TRAKTEER_API_KEY must be set');
  if (!isSameSecret(c.req.header('authorization'), `Bearer ${CRON_SECRET}`)) return c.json({ error: 'Unauthorized' }, 401);

  let synced = 0;
  for (let page = 1; page <= TRAKTEER_MAX_PAGES; page++) {
    const supports = await fetchTrakteerPage(page);
    if (supports.length === 0) break;

    const rows = supports.map((support) => {
      // Fail loudly: without the donor's name every supporter would collapse into one leaderboard entry.
      if (typeof support.supporter_name !== 'string') throw new Error('Trakteer: a support entry has no supporter_name');
      return {
        order_id: support.order_id,
        supporter_name: support.supporter_name.trim(),
        amount: support.amount,
        quantity: support.quantity,
        platform: 'trakteer',
        status: support.status,
        paid_at: `${support.updated_at.replace(' ', 'T')}${TRAKTEER_UTC_OFFSET}`,
      };
    });

    const { error } = await supabase.from('donations').upsert(rows, { onConflict: 'order_id' });
    if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });
    synced += rows.length;
  }

  c.header('Cache-Control', 'no-store');
  return c.json({ synced });
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
