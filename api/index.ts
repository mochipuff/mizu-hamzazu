import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
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

type ErrorStatus = 400 | 401 | 403 | 404 | 409;

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

const isContentKind = (value: string): value is VideoKind | 'song' => value === 'song' || Object.hasOwn(VIDEO_PLAYLIST_PREFIX, value);

async function youtube<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const response = await fetch(`${YOUTUBE_API}/${path}?${new URLSearchParams(params)}`, { headers: { 'x-goog-api-key': requireEnv('YOUTUBE_API_KEY') } });
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

app.get('/api/fanart/:page', async (c) => {
  // Digits only: `Number()` would also accept `0x10`, `1e1` or `+5`, each a separate cache key for the same page.
  const raw = c.req.param('page');
  const page = Number(raw);
  if (!/^[1-9]\d{0,2}$/.test(raw) || page > FANART_MAX_PAGE) return fail(c, 404, 'Not Found');

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

app.get('/api/content/:kind', async (c) => {
  const kind = c.req.param('kind');
  return isContentKind(kind) ? respond(c, SLOW_CACHE, await readVideos(kind)) : fail(c, 404, 'Not Found');
});

// Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`.
app.get('/api/videos/sync', async (c) => {
  c.header('Cache-Control', 'no-store');
  const cronSecret = requireEnv('CRON_SECRET', (value) => value.length < 32 && 'must be at least 32 characters (openssl rand -hex 32)');
  const given = Buffer.from(c.req.header('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return fail(c, 401, 'Unauthorized');

  await syncVideos();
  return c.json({ ok: true });
});

// ---- Backend access: the same data, writable, for services that hold an API key -----------------------------------------------------------------
// A key looks like `mzk_<12 hex>.<64 hex>`. Only its id, a random salt and sha256(salt + secret) are stored (see database/02_api_keys.sql), so a leaked table gives nobody a working key.
// Every key carries a list of `<resource>:<action>` permissions, for example `fanarts:create` or `settings:update`.
type Action = 'create' | 'read' | 'update' | 'delete';
type Check = (value: unknown) => boolean;

interface Resource {
  table: string;
  pk: string;
  /** What a valid id looks like in the URL (and in the body of a create when `clientId` is set). */
  id: RegExp;
  /** The id is chosen by the caller (a YouTube id, a slug) instead of the database. */
  clientId?: true;
  /** The columns a caller may write. A missing key in a create must be listed in `optional`. */
  fields: Record<string, Check>;
  optional?: readonly string[];
  order: string;
  ascending?: true;
  actions: readonly Action[];
}

const ALL_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
const KEY_PATTERN = /^mzk_([0-9a-f]{12})\.([0-9a-f]{64})$/;
const NO_HASH = '0'.repeat(64);

const text = (max: number): Check => (value) => typeof value === 'string' && value.trim() !== '' && value.length <= max;
const oneOf = (...allowed: unknown[]): Check => (value) => allowed.includes(value);
const integer = (min: number, max: number): Check => (value) => Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isBoolean: Check = (value) => typeof value === 'boolean';
const isHttps: Check = (value) => typeof value === 'string' && value.length <= 2048 && URL.canParse(value) && new URL(value).protocol === 'https:';
const isDate: Check = (value) => typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
const isHandle: Check = (value) => text(100)(value) && !(value as string).startsWith('@');
const isLocalized: Check = (value) =>
  typeof value === 'object' && value !== null && Object.keys(value).length === LANGUAGES.length && LANGUAGES.every((language) => text(500)((value as Record<string, unknown>)[language]));

const resources: Record<string, Resource> = {
  // Supports page: the fan art wall.
  fanarts: { table: 'fanarts', pk: 'id', id: /^[1-9]\d{0,15}$/, fields: { username: isHandle, media_url: isHttps, posted_at: isDate }, order: 'posted_at', actions: ALL_ACTIONS },
  // Content page: the videos behind the Streams, Shorts, Videos and Songs tabs.
  videos: {
    table: 'videos',
    pk: 'id',
    id: /^[\w-]{11}$/,
    clientId: true,
    fields: { kind: oneOf('live', 'short', 'vod'), label: oneOf('original', 'cover', null), title: text(300), published_at: isDate },
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
      description: isLocalized,
      datetime: isDate,
      duration_minutes: integer(1, 1440),
      platform: oneOf('youtube', 'twitch', 'x', 'discord'),
      members_only: isBoolean,
      thumbnail_url: (value) => value === null || isHttps(value),
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
    fields: { kind: oneOf('like', 'dislike'), label: isLocalized, sort_order: integer(0, 10_000) },
    optional: ['sort_order'],
    order: 'sort_order',
    ascending: true,
    actions: ALL_ACTIONS,
  },
  // Switches of the site. `PATCH /api/admin/settings/guerilla_mode` with `{ "enabled": true }` turns guerilla mode on.
  settings: { table: 'site_settings', pk: 'key', id: /^[a-z_]{1,40}$/, fields: { enabled: isBoolean }, order: 'key', ascending: true, actions: ['read', 'update'] },
};

interface ApiKeyRow {
  salt: string;
  key_hash: string;
  permissions: string[];
  expires_at: string | null;
  revoked_at: string | null;
}

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

/** The permissions of the key in an `Authorization: Bearer` header, or null when the key is unknown, wrong, revoked or expired. */
async function authenticate(header: string | undefined): Promise<ReadonlySet<string> | null> {
  const match = KEY_PATTERN.exec(header?.startsWith('Bearer ') ? header.slice(7) : '');
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

/** What is wrong with a body, or null when it can be written. A create needs every field that is not optional; an update needs at least one. */
function problem(spec: Resource, input: Record<string, unknown>, creating: boolean): string | null {
  const isId: Check = (value) => typeof value === 'string' && spec.id.test(value);
  const checks: Record<string, Check> = { ...(creating && spec.clientId ? { [spec.pk]: isId } : {}), ...spec.fields };
  const unknown = Object.keys(input).find((key) => !Object.hasOwn(checks, key));
  if (unknown) return `Unknown field: ${unknown}`;
  const invalid = Object.keys(input).find((key) => !checks[key]?.(input[key]));
  if (invalid) return `Invalid field: ${invalid}`;
  const missing = creating ? Object.keys(checks).find((key) => !spec.optional?.includes(key) && !Object.hasOwn(input, key)) : undefined;
  if (missing) return `Missing field: ${missing}`;
  return !creating && Object.keys(input).length === 0 ? 'Nothing to update' : null;
}

/** A database refusal the caller caused (duplicate, value out of range) is a 4xx; anything else is ours and goes to the error handler. */
function databaseFailure(c: Context, error: { code: string; message: string }) {
  if (error.code === '23505') return fail(c, 409, 'Already exists');
  if (/^2[23]/.test(error.code)) return fail(c, 400, 'Rejected by the database');
  throw new Error(`Supabase: ${error.message}`, { cause: error });
}

const readInt = (raw: string | undefined, min: number, max: number, fallback: number): number => {
  const value = Number(raw);
  return raw !== undefined && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
};

type AdminHandler = (c: Context<Env>, spec: Resource) => Promise<Response>;

/** Finds the resource of the URL and lets the request through only when the key holds `<resource>:<action>`. */
const guarded =
  (action: Action, handler: AdminHandler) =>
  async (c: Context<Env>): Promise<Response> => {
    const name = c.req.param('resource') ?? '';
    const spec = Object.hasOwn(resources, name) ? resources[name] : undefined;
    if (!spec?.actions.includes(action)) return fail(c, 404, 'Not Found');
    if (!c.get('permissions').has(`${name}:${action}`)) return fail(c, 403, 'Forbidden');
    return handler(c, spec);
  };

/** Handlers that act on one row: the id in the URL must look like an id of that resource before the database is asked. */
const forRow =
  (handler: (c: Context<Env>, spec: Resource, id: string) => Promise<Response>): AdminHandler =>
  async (c, spec) => {
    const id = c.req.param('id') ?? '';
    return spec.id.test(id) ? handler(c, spec, id) : fail(c, 404, 'Not Found');
  };

/** The body of a create or an update when it can be written, or the 400 answer that says why not. */
async function readBody(c: Context, spec: Resource, creating: boolean): Promise<Record<string, unknown> | Response> {
  const body: unknown = await c.req.json().catch(() => null);
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return fail(c, 400, 'Body must be a JSON object');
  const wrong = problem(spec, body as Record<string, unknown>, creating);
  return wrong ? fail(c, 400, wrong) : (body as Record<string, unknown>);
}

const admin = new Hono<Env>({ strict: false });

admin.use('*', bodyLimit({ maxSize: 16 * 1024 }));
admin.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  const permissions = await authenticate(c.req.header('authorization'));
  if (!permissions) {
    c.header('WWW-Authenticate', 'Bearer');
    return fail(c, 401, 'Unauthorized');
  }
  c.set('permissions', permissions);
  return next();
});

admin.get(
  '/:resource',
  guarded('read', async (c, spec) => {
    const from = readInt(c.req.query('offset'), 0, 100_000, 0);
    const to = from + readInt(c.req.query('limit'), 1, 100, 50) - 1;
    const rows = unwrap(await supabase.from(spec.table).select('*').order(spec.order, { ascending: !!spec.ascending }).order(spec.pk, { ascending: !!spec.ascending }).range(from, to));
    return c.json(rows);
  }),
);

admin.get(
  '/:resource/:id',
  guarded(
    'read',
    forRow(async (c, spec, id) => {
      const { data, error } = await supabase.from(spec.table).select('*').eq(spec.pk, id).maybeSingle();
      if (error) return databaseFailure(c, error);
      return data ? c.json(data) : fail(c, 404, 'Not Found');
    }),
  ),
);

admin.post(
  '/:resource',
  guarded('create', async (c, spec) => {
    const input = await readBody(c, spec, true);
    if (input instanceof Response) return input;
    const { data, error } = await supabase.from(spec.table).insert(input).select().single();
    return error ? databaseFailure(c, error) : c.json(data, 201);
  }),
);

admin.patch(
  '/:resource/:id',
  guarded(
    'update',
    forRow(async (c, spec, id) => {
      const input = await readBody(c, spec, false);
      if (input instanceof Response) return input;
      const { data, error } = await supabase.from(spec.table).update(input).eq(spec.pk, id).select().maybeSingle();
      if (error) return databaseFailure(c, error);
      return data ? c.json(data) : fail(c, 404, 'Not Found');
    }),
  ),
);

admin.delete(
  '/:resource/:id',
  guarded(
    'delete',
    forRow(async (c, spec, id) => {
      const { data, error } = await supabase.from(spec.table).delete().eq(spec.pk, id).select(spec.pk);
      if (error) return databaseFailure(c, error);
      return data.length > 0 ? c.body(null, 204) : fail(c, 404, 'Not Found');
    }),
  ),
);

app.route('/api/admin', admin);

app.onError((error, c) => {
  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
