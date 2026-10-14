import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { authenticate, hasScope, type Principal, type Scope } from './auth.ts';
import { LiveHub } from './hub.ts';
import { publishState, readSlots, syncVideos, tick } from './poller.ts';
import { isPushEndpoint } from './push.ts';
import { params, rest } from './supabase.ts';
import { LOCALES, type ApiKeyRow, type Env } from './types.ts';

export { LiveHub };

type AppContext = Context<{ Bindings: Env; Variables: { principal: Principal } }>;

const MAX_BODY_BYTES = 16_384;
const hubOf = (env: Env) => env.LIVE_HUB.get(env.LIVE_HUB.idFromName('main'));

const origins = new Map<string, Set<string>>();
function allowedOrigins(env: Env): Set<string> {
  let set = origins.get(env.SITE_ORIGINS);
  if (!set) {
    set = new Set(env.SITE_ORIGINS.split(',').flatMap((value) => (URL.canParse(value.trim()) ? [new URL(value.trim()).origin] : [])));
    origins.set(env.SITE_ORIGINS, set);
  }
  return set;
}

const app = new Hono<{ Bindings: Env; Variables: { principal: Principal } }>({ strict: false });

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => (allowedOrigins(c.env).has(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    maxAge: 86_400,
  }),
);

// First line of defence, before any key lookup: one address cannot hammer the Worker or guess keys.
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  const { success } = await c.env.LIMITER.limit({ key: ip });
  if (!success) return c.json({ error: 'Too Many Requests' }, 429, { 'Retry-After': '60' });
  return next();
});

/** Resolves the caller's key, applies its own per-minute limit and checks the scope. Failures never say which of the three went wrong beyond the status. */
const requireScope =
  (...required: Scope[]) =>
  async (c: AppContext, next: () => Promise<void>) => {
    const principal = await authenticate(c.req.raw.headers, c.env.WORKER_BRIDGE_SECRET, async (hash) => {
      const rows = await rest<ApiKeyRow[]>(c.env, 'api_keys', { query: params({ select: 'id,name,key_hash,scopes,is_active,rate_limit_per_min', key_hash: `eq.${hash}`, limit: '1' }) });
      return rows[0] ?? null;
    });
    if (!principal) return c.json({ error: 'Unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
    if (!hasScope(principal, required)) return c.json({ error: 'Forbidden' }, 403);
    if (principal.limitPerMinute !== null && !(await hubOf(c.env).hit(`key:${principal.id}`, principal.limitPerMinute))) {
      return c.json({ error: 'Too Many Requests' }, 429, { 'Retry-After': '60' });
    }
    c.set('principal', principal);
    return next();
  };

/** A browser-only action (subscribing): the call must come from one of the site's own pages. */
async function fromSite(c: AppContext, next: () => Promise<void>) {
  const origin = c.req.header('origin');
  if (!origin || !allowedOrigins(c.env).has(origin)) return c.json({ error: 'Forbidden' }, 403);
  return next();
}

async function readJson<T>(c: AppContext, schema: z.ZodType<T>): Promise<{ data: T } | { response: Response }> {
  if (!(c.req.header('content-type') ?? '').includes('application/json')) return { response: c.json({ error: 'Content-Type must be application/json' }, 415) };
  const text = await c.req.text();
  if (text.length > MAX_BODY_BYTES) return { response: c.json({ error: 'Payload Too Large' }, 413) };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { response: c.json({ error: 'Bad Request', details: ['Body is not valid JSON'] }, 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: c.json({ error: 'Bad Request', details: parsed.error.issues.slice(0, 10).map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`) }, 400) };
  return { data: parsed.data };
}

// ---------------------------------------------------------------- real time
// Server-Sent Events: one long HTTP response, fanned out by the LiveHub Durable Object. `Connection: keep-alive` is left out on purpose, it is invalid on HTTP/2 and 3.
app.get('/api/realtime/events', async (c) => {
  const origin = c.req.header('origin');
  if (origin && !allowedOrigins(c.env).has(origin)) return c.json({ error: 'Forbidden' }, 403);

  const upstream = await hubOf(c.env).fetch(c.req.raw);
  if (!upstream.ok) return upstream;
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
      ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    },
  });
});

const subscriptionSchema = z.object({
  endpoint: z.string().refine(isPushEndpoint, 'Not a browser push endpoint'),
  keys: z.object({ p256dh: z.string().regex(/^[\w-]{86,90}$/), auth: z.string().regex(/^[\w-]{22,24}$/) }),
  locale: z.enum(LOCALES).default('en'),
});

app.post('/api/notifications/subscribe', fromSite, async (c) => {
  const body = await readJson(c, subscriptionSchema);
  if ('response' in body) return body.response;
  const { endpoint, keys, locale } = body.data;
  await rest(c.env, 'push_subscriptions', {
    method: 'POST',
    query: params({ on_conflict: 'endpoint' }),
    body: { endpoint, p256dh: keys.p256dh, auth: keys.auth, locale },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  return c.json({ ok: true }, 201);
});

app.delete('/api/notifications/subscribe', fromSite, async (c) => {
  const body = await readJson(c, z.object({ endpoint: z.string().refine(isPushEndpoint) }));
  if ('response' in body) return body.response;
  await rest(c.env, 'push_subscriptions', { method: 'DELETE', query: params({ endpoint: `eq.${body.data.endpoint}` }), prefer: 'return=minimal' });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- system
app.post('/api/system/guerilla', requireScope('system:write'), async (c) => {
  const body = await readJson(c, z.object({ active: z.boolean(), message: z.string().trim().max(280).default('') }));
  if ('response' in body) return body.response;
  const { active, message } = body.data;
  await rest(c.env, 'system_configs', { method: 'POST', query: params({ on_conflict: 'key' }), body: { key: 'guerilla_mode', value: { active, message } }, prefer: 'resolution=merge-duplicates,return=minimal' });
  await hubOf(c.env).publish('system:guerilla', { is_active: active, notice: message });
  return c.json({ active, message });
});

// ---------------------------------------------------------------- schedule
const slotSchema = z.object({
  id: z.string().regex(/^[\w-]{1,64}$/),
  title: z.string().trim().min(1).max(200),
  description: z.object({ en: z.string().max(300), jp: z.string().max(300), id: z.string().max(300), kr: z.string().max(300) }),
  datetime: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().min(1).max(1_440),
  platform: z.enum(['youtube', 'twitch', 'x', 'discord']),
  membersOnly: z.boolean().default(false),
  thumbnailUrl: z.string().startsWith('https://i.ytimg.com/').max(300).nullable().default(null),
});

app.post('/api/schedule', requireScope('schedule:write'), async (c) => {
  const body = await readJson(c, z.object({ slots: z.array(slotSchema).min(1).max(50) }));
  if ('response' in body) return body.response;
  const rows = body.data.slots.map(({ durationMinutes, membersOnly, thumbnailUrl, ...slot }) => ({ ...slot, duration_minutes: durationMinutes, members_only: membersOnly, thumbnail_url: thumbnailUrl }));
  await rest(c.env, 'stream_slots', { method: 'POST', query: params({ on_conflict: 'id' }), body: rows, prefer: 'resolution=merge-duplicates,return=minimal' });
  await publishNow(c);
  return c.json({ ok: true, upserted: rows.length }, 201);
});

app.delete('/api/schedule/:id', requireScope('schedule:write'), async (c) => {
  const id = c.req.param('id') ?? '';
  if (!/^[\w-]{1,64}$/.test(id)) return c.json({ error: 'Bad Request', details: ['id: invalid'] }, 400);
  await rest(c.env, 'stream_slots', { method: 'DELETE', query: params({ id: `eq.${id}` }), prefer: 'return=minimal' });
  await publishNow(c);
  return c.json({ ok: true });
});

async function publishNow(c: AppContext): Promise<void> {
  const [config] = await rest<{ value: { active?: unknown; message?: unknown } }[]>(c.env, 'system_configs', { query: params({ select: 'value', key: 'eq.guerilla_mode', limit: '1' }) });
  const guerilla = { is_active: config?.value.active === true, notice: typeof config?.value.message === 'string' ? config.value.message : '' };
  await publishState(hubOf(c.env), guerilla, await readSlots(c.env, Date.now()));
}

// ---------------------------------------------------------------- content
app.post('/api/videos/sync', requireScope('content:write'), async (c) => {
  const hub = hubOf(c.env);
  // A manual sync spends YouTube quota, so it cannot be repeated within a minute.
  if (!(await hub.claim('video-sync-manual', 60_000))) return c.json({ error: 'Too Many Requests' }, 429, { 'Retry-After': '60' });
  const inserted = await syncVideos(c.env, hub);
  if (inserted === null) return c.json({ error: 'YouTube quota budget for today is used up' }, 503);
  return c.json({ ok: true, inserted });
});

app.post('/api/videos/prune', requireScope('content:write'), async (c) => {
  const deleted = await rest<number>(c.env, 'rpc/prune_videos', { method: 'POST', body: {} });
  return c.json({ ok: true, deleted });
});

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default {
  fetch: app.fetch,
  scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(tick(env, hubOf(env)));
  },
} satisfies ExportedHandler<Env>;
