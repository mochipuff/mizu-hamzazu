import { createHash, timingSafeEqual } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { createClient } from '@supabase/supabase-js';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

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

// A call that hangs would otherwise hold the function until Vercel's `maxDuration` (30 s) kills it.
const UPSTREAM_TIMEOUT_MS = 8_000;
const withTimeout = (init?: RequestInit): AbortSignal => AbortSignal.any([AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), ...(init?.signal ? [init.signal] : [])]);

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: withTimeout(init) }) },
});

// The languages of the site (`LOCALES` in src/i18n/locales.ts). Text stored as JSON carries one value per language.
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
// A channel id `UCxxx` has one auto-made playlist per kind of upload: `UULVxxx` live streams, `UUSHxxx` Shorts, `UULFxxx` regular videos.
const VIDEO_PLAYLIST_PREFIX = { live: 'UULV', short: 'UUSH', vod: 'UULF' } as const;
type VideoKind = keyof typeof VIDEO_PLAYLIST_PREFIX;
// Videos the sync tries to keep per category (Streams, Shorts, Videos, Songs). A video labelled original/cover in `videos.label` is a Song, whatever its kind.
const VIDEOS_PER_CATEGORY = 12;
// A playlist page holds more than a category keeps, so the window stays full after videos are labelled as songs.
const VIDEO_SYNC_PAGE_SIZE = 50;
// A video that sits in two playlists keeps the kind of the later one: what is in the /videos tab is a Video, and a Short is a Short.
const SYNC_KINDS = ['live', 'vod', 'short'] as const satisfies readonly VideoKind[];

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

interface Env {
  Variables: { permissions: ReadonlySet<string> };
}

const app = new Hono<Env>({ strict: false });

type ErrorStatus = 400 | 403 | 404 | 409 | 413;

/** An error answer is never cached. */
function fail(c: Context, status: ErrorStatus, error: string) {
  c.header('Cache-Control', 'no-store');
  return c.json({ error }, status);
}

function respond(c: Context, cache: string, body: unknown) {
  c.header('Cache-Control', cache);
  return c.json(body);
}

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

async function youtube<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const response = await fetch(`${YOUTUBE_API}/${path}?${new URLSearchParams(params)}`, { headers: { 'x-goog-api-key': requireEnv('YOUTUBE_API_KEY') }, signal: withTimeout() });
  // A channel with no Shorts (or no streams) has no such playlist.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`YouTube ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

async function fetchChannelVideos(channelId: string, kind: VideoKind) {
  const playlistId = VIDEO_PLAYLIST_PREFIX[kind] + channelId.slice(2);
  const result = await youtube<YouTubePlaylistPage>('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: String(VIDEO_SYNC_PAGE_SIZE) });
  // Private and deleted videos stay in a playlist but have no publish date.
  return (result?.items ?? []).flatMap(({ snippet, contentDetails }) =>
    contentDetails.videoPublishedAt ? [{ id: contentDetails.videoId, kind, title: snippet.title, published_at: contentDetails.videoPublishedAt }] : [],
  );
}

/** Rolling window: once a category holds more than VIDEOS_PER_CATEGORY, the oldest videos go. Songs are a category of their own. */
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

/** Called by the daily cron: adds the newest videos of the channel from YouTube to Supabase, then drops the ones that fell out of the window. Existing rows are never changed here, so `kind` and `label` can be edited by hand. */
async function syncVideos(): Promise<void> {
  const channel = await youtube<{ items?: { id: string }[] }>('channels', { part: 'id', forHandle: YOUTUBE_HANDLE });
  const channelId = channel?.items?.[0]?.id;
  if (!channelId) throw new Error(`YouTube channel ${YOUTUBE_HANDLE} not found`);

  const lists = await Promise.all(SYNC_KINDS.map((kind) => fetchChannelVideos(channelId, kind)));
  // Keyed by id, so a video found in two playlists is saved once, with the kind of the later list.
  const byId = new Map(lists.flat().map((row) => [row.id, row]));
  // Only new videos are inserted: a row already in the table keeps its `kind` and `label`, so what is corrected by hand stays corrected.
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
  // Browsers always send `Sec-Fetch-Site` (`none` for a typed address). Callers that are not browsers send neither header: the cron and the services with an API key prove themselves with a secret.
  const fromOurPages = origin ? allowedOrigins.has(origin) : !fetchSite || fetchSite === 'same-origin';
  if (fromOurPages) return next();

  return fail(c, 403, 'Forbidden');
});

// Every distinct URL is its own CDN cache key, so a query string would bypass the cache and reach the database. The admin routes are never cached and page their lists with `limit` and `offset`.
app.use('/api/*', async (c, next) => (c.req.url.includes('?') && !c.req.path.startsWith('/api/admin') ? fail(c, 400, 'Query parameters are not accepted') : next()));

// A route id that is not a valid value is a plain 404, like any unknown address: it never reaches the database and never becomes its own cache key.
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

// Guerilla mode: the creator streams whenever she can, so the page treats the schedule as decoration.
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

// Digits only (checked by the schema): `Number()` alone would also accept `0x10`, `1e1` or `+5`, each a separate cache key for the same page.
app.get('/api/fanart/:page', zValidator('param', fanartPageParam, notFoundHook), async (c) => {
  const { page } = c.req.valid('param');

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

  return respond(c, SCHEDULE_CACHE, { posts: rows.slice(0, FANART_PAGE_SIZE), hasMore: rows.length > FANART_PAGE_SIZE && page < FANART_MAX_PAGE });
});

app.get('/api/content/:kind', zValidator('param', contentKindParam, notFoundHook), async (c) => respond(c, SLOW_CACHE, await readVideos(c.req.valid('param').kind)));

// What a caller of a protected route sees when its token is missing, malformed or wrong. `bearerAuth` compares tokens in constant time and sets `WWW-Authenticate`.
const unauthorized = {
  noAuthenticationHeader: { message: { error: 'Unauthorized' } },
  invalidAuthenticationHeader: { message: { error: 'Bad Request' } },
  invalidToken: { message: { error: 'Unauthorized' } },
};

// Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`.
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

// ---- Backend access: the same data, writable, for services that hold an API key -----------------------------------------------------------------
// A key looks like `mzk_<12 hex>.<64 hex>`. Only its id, a random salt and sha256(salt + secret) are stored (see database/02_api_keys.sql), so a leaked table gives nobody a working key.
// Every key carries a list of `<resource>:<action>` permissions, for example `fanarts:create` or `settings:update`.
type Action = 'create' | 'read' | 'update' | 'delete';

interface Resource {
  table: string;
  pk: string;
  /** What a valid id looks like in the URL (and in the body of a create when `clientId` is set). */
  id: RegExp;
  /** The id is chosen by the caller (a YouTube id, a slug) instead of the database. */
  clientId?: true;
  /** The columns a caller may write. A column missing from a create must be listed in `optional`. */
  fields: Record<string, z.ZodType>;
  optional?: readonly string[];
  order: string;
  ascending?: true;
  actions: readonly Action[];
}

const ALL_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
const KEY_PATTERN = /^mzk_([0-9a-f]{12})\.([0-9a-f]{64})$/;
const NO_HASH = '0'.repeat(64);

// Images may only come from the hosts the site's Content-Security-Policy lets load (`img-src` in vercel.json; keep the two in step), so a stored link can never point a visitor somewhere else.
const IMAGE_HOST = /^(i\.ytimg\.com|pbs\.twimg\.com|[a-z0-9-]+\.supabase\.co)$/;

const text = (max: number) => z.string().trim().min(1).max(max);
const imageUrl = z.url({ protocol: /^https$/, hostname: IMAGE_HOST }).max(2048);
const isoDate = z.iso.datetime({ offset: true });
const handle = text(100).refine((value) => !value.startsWith('@'), 'must not start with @');
const localized = z.strictObject(Object.fromEntries(LANGUAGES.map((language) => [language, text(500)])) as Record<(typeof LANGUAGES)[number], ReturnType<typeof text>>);

const resources: Record<string, Resource> = {
  // Supports page: the fan art wall.
  fanarts: { table: 'fanarts', pk: 'id', id: /^[1-9]\d{0,15}$/, fields: { username: handle, media_url: imageUrl, posted_at: isoDate }, order: 'posted_at', actions: ALL_ACTIONS },
  // Content page: the videos behind the Streams, Shorts, Videos and Songs tabs.
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
  // Home page: the stream schedule.
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
  // Home page: the Likes and Not so much lists.
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
  // Switches of the site. `PATCH /api/admin/settings/guerilla_mode` with `{ "enabled": true }` turns guerilla mode on.
  settings: { table: 'site_settings', pk: 'key', id: /^[a-z_]{1,40}$/, fields: { enabled: z.boolean() }, order: 'key', ascending: true, actions: ['read', 'update'] },
};

/** The body of a create: every column that is not optional, plus the id when the caller chooses it. Unknown columns are refused. */
const createSchema = ({ pk, id, clientId, fields, optional = [] }: Resource) =>
  z.strictObject({
    ...(clientId ? { [pk]: z.string().regex(id) } : {}),
    ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, optional.includes(key) ? schema.optional() : schema])),
  });

/** The body of an update: any of the columns, at least one. */
const updateSchema = ({ fields }: Resource) => z.strictObject(fields).partial().refine((body) => Object.keys(body).length > 0, 'Nothing to update');

/** One line for the caller that names the column and nothing else about how the schema is built. */
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

/** The permissions of an API key, or null when the key is unknown, wrong, revoked or expired. */
async function authenticate(token: string): Promise<ReadonlySet<string> | null> {
  const match = KEY_PATTERN.exec(token);
  if (!match) return null;

  const [, keyId = '', secret = ''] = match;
  const [row] = unwrap(
    await supabase.from('api_keys').select('salt,key_hash,permissions,expires_at,revoked_at').eq('key_id', keyId).limit(1).overrideTypes<ApiKeyRow[], { merge: false }>(),
  );

  // Hashed even for an unknown key id, so a miss takes as long as a wrong secret.
  const matches = timingSafeEqual(Buffer.from(sha256Hex((row?.salt ?? '') + secret)), Buffer.from(row?.key_hash ?? NO_HASH));
  if (!row || !matches || row.revoked_at || (row.expires_at && Date.parse(row.expires_at) <= Date.now())) return null;
  return new Set(row.permissions);
}

/** A database refusal the caller caused (duplicate, value out of range) is a 4xx; anything else is ours and goes to the error handler. */
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

// One set of routes per resource, so an unknown resource is a 404 from the router itself. Order of checks: key, permission, id, body.
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
  // Thrown by the middleware above (a missing or wrong token): its answer is already complete, it only needs to stay out of every cache.
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
