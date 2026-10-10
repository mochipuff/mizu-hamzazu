import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set');

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

interface StreamSlotRow {
  id: string;
  title: string;
  description: Record<'en' | 'jp' | 'id' | 'kr', string>;
  datetime: string;
  durationMinutes: number;
  platform: 'youtube' | 'twitch' | 'x' | 'discord';
  membersOnly: boolean;
  thumbnailUrl: string | null;
}

const DAY_MS = 86_400_000;

const app = new Hono({ strict: false });

app.get('/api/schedule', async (c) => {
  const now = Date.now();
  const { data, error } = await supabase
    .from('stream_slots')
    .select('id,title,description,datetime,durationMinutes:duration_minutes,platform,membersOnly:members_only,thumbnailUrl:thumbnail_url')
    .gte('datetime', new Date(now - DAY_MS).toISOString())
    .lt('datetime', new Date(now + 8 * DAY_MS).toISOString())
    .order('datetime')
    .limit(100)
    .overrideTypes<StreamSlotRow[], { merge: false }>();

  if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });

  c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return c.json(data);
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
