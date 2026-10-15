import { createHash, timingSafeEqual } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { createClient } from '@supabase/supabase-js';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

function requireEnv(name: string, problemWith?: (value: string) => string | false): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set`);
  const problem = problemWith?.(value);
  if (problem) throw new Error(`${name} ${problem}`);
  return value;
}

const SUPABASE_URL = requireEnv('SUPABASE_URL', (value) => !(URL.canParse(value) && new URL(value).protocol === 'https:') && 'must be an https URL');
const SUPABASE_SECRET_KEY = requireEnv('SUPABASE_SECRET_KEY', (value) => value.startsWith('sb_publishable_') && 'is the publishable key; the server needs the secret key');

const UPSTREAM_TIMEOUT_MS = 8_000;
const withTimeout = (init?: RequestInit): AbortSignal => AbortSignal.any([AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), ...(init?.signal ? [init.signal] : [])]);

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: withTimeout(init) }) },
});

const LANGUAGES = ['en', 'jp', 'id'] as const;
type Localized = Record<(typeof LANGUAGES)[number], string>;

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

interface YouTubePlaylistPage {
  items: { snippet: { title: string }; contentDetails: { videoId: string; videoPublishedAt?: string } }[];
}

const DAY_MS = 86_400_000;
const cacheControl = (sMaxAge: number, staleWhileRevalidate: number): string => `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
const SCHEDULE_CACHE = cacheControl(60, 300);
const SLOW_CACHE = cacheControl(3_600, 86_400);

const FANART_PAGE_SIZE = 9;
const FANART_MAX_PAGE = 100;

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_HANDLE = '@MizuHamzazu';
const VIDEO_PLAYLIST_PREFIX = { live: 'UULV', short: 'UUSH', vod: 'UULF' } as const;
type VideoKind = keyof typeof VIDEO_PLAYLIST_PREFIX;
const VIDEOS_PER_CATEGORY = 12;
const VIDEO_SYNC_PAGE_SIZE = 50;
const SYNC_KINDS = ['live', 'vod', 'short'] as const satisfies readonly VideoKind[];

const toOrigin = (value: string | undefined): string[] => {
  const host = value?.trim();
  const url = host?.includes('://') ? host : `https://${host}`;
  return host && URL.canParse(url) ? [new URL(url).origin] : [];
};

const allowedOrigins = new Set([
  ...toOrigin(process.env.VITE_SITE_URL),
  ...toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  ...(process.env.ALLOWED_ORIGINS?.split(',') ?? []).flatMap(toOrigin),
  ...(process.env.VERCEL_ENV === 'production'
    ? []
    : [...toOrigin(process.env.VERCEL_BRANCH_URL), ...toOrigin(process.env.VERCEL_URL), 'http://localhost:3000', 'http://localhost:5173']),
]);

const FORBIDDEN_PATH = '/forbidden/';
const PAGE_DESTINATIONS = new Set(['document', 'iframe', 'frame', 'fencedframe', 'embed', 'object']);

interface Env {
  Variables: { permissions: ReadonlySet<string> };
}

const app = new Hono<Env>({ strict: false });

type ErrorStatus = 400 | 403 | 404 | 409 | 413;

function fail(c: Context, status: ErrorStatus, error: string) {
  c.header('Cache-Control', 'no-store');
  return c.json({ error }, status);
}

function respond(c: Context, cache: string, body: unknown) {
  c.header('Cache-Control', cache);
  return c.json(body);
}

function opensAsPage(c: Context): boolean {
  const destination = c.req.header('sec-fetch-dest');
  if (destination) return PAGE_DESTINATIONS.has(destination);
  return !c.req.header('sec-fetch-site') && (c.req.header('accept') ?? '').includes('text/html');
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error || data === null) throw new Error(`Supabase: ${error?.message ?? 'no data'}`, { cause: error });
  return data;
}

async function youtube<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const response = await fetch(`${YOUTUBE_API}/${path}?${new URLSearchParams(params)}`, { headers: { 'x-goog-api-key': requireEnv('YOUTUBE_API_KEY') }, signal: withTimeout() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`YouTube ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

async function fetchChannelVideos(channelId: string, kind: VideoKind) {
  const playlistId = VIDEO_PLAYLIST_PREFIX[kind] + channelId.slice(2);
  const result = await youtube<YouTubePlaylistPage>('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: String(VIDEO_SYNC_PAGE_SIZE) });
  return (result?.items ?? []).flatMap(({ snippet, contentDetails }) =>
    contentDetails.videoPublishedAt ? [{ id: contentDetails.videoId, kind, title: snippet.title, published_at: contentDetails.videoPublishedAt }] : [],
  );
}

async function pruneVideos(): Promise<void> {
  const rows = unwrap(
    await supabase
      .from('videos')
      .select('id,kind,label')
      .order('published_at', { ascending: false })
      .overrideTypes<Pick<VideoRow, 'id' | 'kind' | 'label'>[], { merge: false }>(),
  );

  const kept = new Map<string, number>();
  const stale = rows
    .filter(({ kind, label }) => {
      const category = label ? 'song' : kind;
      const count = (kept.get(category) ?? 0) + 1;
      kept.set(category, count);
      return count > VIDEOS_PER_CATEGORY;
    })
    .map(({ id }) => id);

  if (stale.length === 0) return;
  const { error } = await supabase.from('videos').delete().in('id', stale);
  if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });
}

async function syncVideos(): Promise<void> {
  const channel = await youtube<{ items?: { id: string }[] }>('channels', { part: 'id', forHandle: YOUTUBE_HANDLE });
  const channelId = channel?.items?.[0]?.id;
  if (!channelId) throw new Error(`YouTube channel ${YOUTUBE_HANDLE} not found`);

  const lists = await Promise.all(SYNC_KINDS.map((kind) => fetchChannelVideos(channelId, kind)));
  const byId = new Map(lists.flat().map((row) => [row.id, row]));
  const { error } = await supabase.from('videos').upsert([...byId.values()], { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });

  await pruneVideos();
}

const readVideos = async (kind: VideoKind | 'song'): Promise<VideoRow[]> => {
  const videos = supabase.from('videos').select('id,kind,label,title,publishedAt:published_at');
  return unwrap(
    await (kind === 'song' ? videos.not('label', 'is', null) : videos.eq('kind', kind).is('label', null))
      .order('published_at', { ascending: false })
      .limit(VIDEOS_PER_CATEGORY)
      .overrideTypes<VideoRow[], { merge: false }>(),
  );
};

app.use('/api/*', cors({ origin: (origin) => (allowedOrigins.has(origin) ? origin : null), allowMethods: ['GET'], maxAge: 86_400 }));
app.use('/api/*', async (c, next) => {
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  c.header('Vary', 'Origin, Accept, Sec-Fetch-Site, Sec-Fetch-Dest', { append: true });

  if (opensAsPage(c)) {
    c.header('Cache-Control', 'no-store');
    return c.redirect(FORBIDDEN_PATH, 307);
  }

  const origin = c.req.header('origin');
  const fetchSite = c.req.header('sec-fetch-site');
  const fromOurPages = origin ? allowedOrigins.has(origin) : !fetchSite || fetchSite === 'same-origin';
  if (fromOurPages) return next();

  return fail(c, 403, 'Forbidden');
});

app.use('/api/*', async (c, next) => (c.req.url.includes('?') && !c.req.path.startsWith('/api/admin') ? fail(c, 400, 'Query parameters are not accepted') : next()));

const notFoundHook = (result: { success: boolean }, c: Context) => (result.success ? undefined : fail(c, 404, 'Not Found'));

const fanartPageParam = z.object({ page: z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(FANART_MAX_PAGE)) });
const contentKindParam = z.object({ kind: z.enum(['live', 'short', 'vod', 'song']) });

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

  return respond(c, SCHEDULE_CACHE, slots);
});

app.get('/api/settings', async (c) => {
  const [setting] = unwrap(await supabase.from('site_settings').select('enabled').eq('key', 'guerilla_mode').limit(1).overrideTypes<{ enabled: boolean }[], { merge: false }>());
  return respond(c, SCHEDULE_CACHE, { guerillaMode: setting?.enabled ?? false });
});

app.get('/api/preferences', async (c) => {
  const preferences = unwrap(
    await supabase.from('likes_dislikes').select('id,kind,label').order('sort_order').order('id').overrideTypes<PreferenceRow[], { merge: false }>(),
  );

  return respond(c, SLOW_CACHE, preferences);
});

app.get('/api/fanart/:page', zValidator('param', fanartPageParam, notFoundHook), async (c) => {
  const { page } = c.req.valid('param');

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

  return respond(c, SCHEDULE_CACHE, { posts: rows.slice(0, FANART_PAGE_SIZE), hasMore: rows.length > FANART_PAGE_SIZE && page < FANART_MAX_PAGE });
});

app.get('/api/content/:kind', zValidator('param', contentKindParam, notFoundHook), async (c) => respond(c, SLOW_CACHE, await readVideos(c.req.valid('param').kind)));

const unauthorized = {
  noAuthenticationHeader: { message: { error: 'Unauthorized' } },
  invalidAuthenticationHeader: { message: { error: 'Bad Request' } },
  invalidToken: { message: { error: 'Unauthorized' } },
};

app.get(
  '/api/videos/sync',
  async (c, next) => {
    const cronSecret = requireEnv('CRON_SECRET', (value) => value.length < 32 && 'must be at least 32 characters (openssl rand -hex 32)');
    return bearerAuth<Env>({ token: cronSecret, ...unauthorized })(c, next);
  },
  async (c) => {
    await syncVideos();
    return c.json({ ok: true });
  },
);

type Action = 'create' | 'read' | 'update' | 'delete';

interface Resource {
  table: string;
  pk: string;
  id: RegExp;
  clientId?: true;
  fields: Record<string, z.ZodType>;
  optional?: readonly string[];
  order: string;
  ascending?: true;
  actions: readonly Action[];
}

const ALL_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
const KEY_PATTERN = /^mzk_([0-9a-f]{12})\.([0-9a-f]{64})$/;
const NO_HASH = '0'.repeat(64);

const IMAGE_HOST = /^(i\.ytimg\.com|pbs\.twimg\.com|[a-z0-9-]+\.supabase\.co)$/;

const text = (max: number) => z.string().trim().min(1).max(max);
const imageUrl = z.url({ protocol: /^https$/, hostname: IMAGE_HOST }).max(2048);
const isoDate = z.iso.datetime({ offset: true });
const handle = text(100).refine((value) => !value.startsWith('@'), 'must not start with @');
const localized = z.strictObject(Object.fromEntries(LANGUAGES.map((language) => [language, text(500)])) as Record<(typeof LANGUAGES)[number], ReturnType<typeof text>>);

const resources: Record<string, Resource> = {
  fanarts: { table: 'fanarts', pk: 'id', id: /^[1-9]\d{0,15}$/, fields: { username: handle, media_url: imageUrl, posted_at: isoDate }, order: 'posted_at', actions: ALL_ACTIONS },
  videos: {
    table: 'videos',
    pk: 'id',
    id: /^[\w-]{11}$/,
    clientId: true,
    fields: { kind: z.enum(['live', 'short', 'vod']), label: z.enum(['original', 'cover']).nullable(), title: text(300), published_at: isoDate },
    optional: ['label'],
    order: 'published_at',
    actions: ALL_ACTIONS,
  },
  schedule: {
    table: 'stream_slots',
    pk: 'id',
    id: /^[\w-]{1,64}$/,
    clientId: true,
    fields: {
      title: text(300),
      description: localized,
      datetime: isoDate,
      duration_minutes: z.number().int().min(1).max(1440),
      platform: z.enum(['youtube', 'twitch', 'x', 'discord']),
      members_only: z.boolean(),
      thumbnail_url: imageUrl.nullable(),
    },
    optional: ['members_only', 'thumbnail_url'],
    order: 'datetime',
    actions: ALL_ACTIONS,
  },
  preferences: {
    table: 'likes_dislikes',
    pk: 'id',
    id: /^[1-9]\d{0,15}$/,
    fields: { kind: z.enum(['like', 'dislike']), label: localized, sort_order: z.number().int().min(0).max(10_000) },
    optional: ['sort_order'],
    order: 'sort_order',
    ascending: true,
    actions: ALL_ACTIONS,
  },
  settings: { table: 'site_settings', pk: 'key', id: /^[a-z_]{1,40}$/, fields: { enabled: z.boolean() }, order: 'key', ascending: true, actions: ['read', 'update'] },
};

const createSchema = ({ pk, id, clientId, fields, optional = [] }: Resource) =>
  z.strictObject({
    ...(clientId ? { [pk]: z.string().regex(id) } : {}),
    ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, optional.includes(key) ? schema.optional() : schema])),
  });

const updateSchema = ({ fields }: Resource) => z.strictObject(fields).partial().refine((body) => Object.keys(body).length > 0, 'Nothing to update');

function describeIssue(result: { error: z.core.$ZodError }): string {
  const [issue] = result.error.issues;
  if (issue?.code === 'unrecognized_keys') return `Unknown field: ${issue.keys.join(', ')}`;
  const column = issue?.path.join('.');
  return column ? `Invalid field: ${column}` : (issue?.message ?? 'Invalid body');
}

interface ApiKeyRow {
  salt: string;
  key_hash: string;
  permissions: string[];
  expires_at: string | null;
  revoked_at: string | null;
}

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

async function authenticate(token: string): Promise<ReadonlySet<string> | null> {
  const match = KEY_PATTERN.exec(token);
  if (!match) return null;

  const [, keyId = '', secret = ''] = match;
  const [row] = unwrap(
    await supabase.from('api_keys').select('salt,key_hash,permissions,expires_at,revoked_at').eq('key_id', keyId).limit(1).overrideTypes<ApiKeyRow[], { merge: false }>(),
  );

  const matches = timingSafeEqual(Buffer.from(sha256Hex((row?.salt ?? '') + secret)), Buffer.from(row?.key_hash ?? NO_HASH));
  if (!row || !matches || row.revoked_at || (row.expires_at && Date.parse(row.expires_at) <= Date.now())) return null;
  return new Set(row.permissions);
}

function databaseFailure(c: Context, error: { code: string; message: string }) {
  if (error.code === '23505') return fail(c, 409, 'Already exists');
  if (/^2[23]/.test(error.code)) return fail(c, 400, 'Rejected by the database');
  throw new Error(`Supabase: ${error.message}`, { cause: error });
}

const admin = new Hono<Env>({ strict: false });

admin.use('*', bodyLimit({ maxSize: 16 * 1024, onError: (c) => fail(c, 413, 'Payload Too Large') }));
admin.use(
  '*',
  bearerAuth<Env>({
    ...unauthorized,
    verifyToken: async (token, c) => {
      const permissions = await authenticate(token);
      if (permissions) c.set('permissions', permissions);
      return permissions !== null;
    },
  }),
);

const requires =
  (permission: string): MiddlewareHandler<Env> =>
  async (c, next) =>
    c.get('permissions').has(permission) ? next() : fail(c, 403, 'Forbidden');

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(50),
  offset: z.coerce.number().int().min(0).max(100_000).catch(0),
});

for (const [name, spec] of Object.entries(resources)) {
  const idParam = zValidator('param', z.object({ id: z.string().regex(spec.id) }), notFoundHook);
  const body = (schema: z.ZodType<Record<string, unknown>>) => zValidator('json', schema, (result, c) => (result.success ? undefined : fail(c, 400, describeIssue(result))));

  admin.get(`/${name}`, requires(`${name}:read`), zValidator('query', listQuery), async (c) => {
    const { limit, offset } = c.req.valid('query');
    const rows = unwrap(
      await supabase
        .from(spec.table)
        .select('*')
        .order(spec.order, { ascending: !!spec.ascending })
        .order(spec.pk, { ascending: !!spec.ascending })
        .range(offset, offset + limit - 1),
    );
    return c.json(rows);
  });

  admin.get(`/${name}/:id`, requires(`${name}:read`), idParam, async (c) => {
    const { data, error } = await supabase.from(spec.table).select('*').eq(spec.pk, c.req.valid('param').id).maybeSingle();
    if (error) return databaseFailure(c, error);
    return data ? c.json(data) : fail(c, 404, 'Not Found');
  });

  if (spec.actions.includes('create')) {
    admin.post(`/${name}`, requires(`${name}:create`), body(createSchema(spec)), async (c) => {
      const { data, error } = await supabase.from(spec.table).insert(c.req.valid('json')).select().single();
      return error ? databaseFailure(c, error) : c.json(data, 201);
    });
  }

  if (spec.actions.includes('update')) {
    admin.patch(`/${name}/:id`, requires(`${name}:update`), idParam, body(updateSchema(spec)), async (c) => {
      const { data, error } = await supabase.from(spec.table).update(c.req.valid('json')).eq(spec.pk, c.req.valid('param').id).select().maybeSingle();
      if (error) return databaseFailure(c, error);
      return data ? c.json(data) : fail(c, 404, 'Not Found');
    });
  }

  if (spec.actions.includes('delete')) {
    admin.delete(`/${name}/:id`, requires(`${name}:delete`), idParam, async (c) => {
      const { data, error } = await supabase.from(spec.table).delete().eq(spec.pk, c.req.valid('param').id).select(spec.pk);
      if (error) return databaseFailure(c, error);
      return data.length > 0 ? c.body(null, 204) : fail(c, 404, 'Not Found');
    });
  }
}

app.route('/api/admin', admin);

app.notFound((c) => fail(c, 404, 'Not Found'));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    const response = error.getResponse();
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
