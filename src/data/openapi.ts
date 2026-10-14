/** OpenAPI 3.1 description of every address of the site's API, rendered at /docs/. Written in English only, like the API itself. */
type Json = Record<string, unknown>;

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });
const errorRef = (name: string): Json => ({ $ref: `#/components/responses/${name}` });
const json = (schema: Json, description: string): Json => ({ description, content: { 'application/json': { schema } } });
const ok = (schema: Json, description = 'OK'): Json => json(schema, description);

const failures = (...codes: ('400' | '401' | '403' | '404' | '429')[]): Json =>
  Object.fromEntries(codes.map((code) => [code, errorRef({ '400': 'BadRequest', '401': 'Unauthorized', '403': 'Forbidden', '404': 'NotFound', '429': 'RateLimited' }[code])]));

const secured = (...scopes: string[]): { security: Json[]; description: string } => ({
  security: [{ ApiKey: [] }, { Bearer: [] }],
  description: `Requires the \`admin\` scope or one of: ${scopes.map((scope) => `\`${scope}\``).join(', ')}.`,
});

const publicRead = (summary: string, schema: Json, tag: string, parameters: Json[] = []): Json => ({
  get: {
    tags: [tag],
    summary,
    description: 'Read-only and cached at the edge. Only this site\'s own pages may call it: another origin gets `403`, and a browser that opens the address is sent to the Forbidden page. No query string is accepted.',
    parameters,
    responses: { '200': ok(schema), ...failures('403', '404') },
  },
});

export function buildOpenApi(siteOrigin: string, liveOrigin: string): Json {
  const live = liveOrigin ? [{ url: liveOrigin }] : [{ url: siteOrigin }];
  const slotBody = { required: true, content: { 'application/json': { schema: { type: 'object', required: ['slots'], properties: { slots: { type: 'array', minItems: 1, maxItems: 50, items: ref('SlotInput') } } } } } };

  return {
    openapi: '3.1.0',
    info: {
      title: 'Mizu Hamzazu API',
      version: '1.0.0-live',
      description:
        'Public read endpoints (served by the site) and the live Worker: a Server-Sent Events stream, Web Push subscriptions and a headless machine-to-machine gateway.\n\n' +
        'Keys look like `mizu_live_<48 hex>` and are created with `npm run key:new` or the `generate_api_key` SQL function. Send them as `X-API-Key: <key>` or `Authorization: Bearer <key>`. ' +
        'Only a SHA-256 hash is stored, so a lost key cannot be recovered, only replaced. Paste a key here only on a computer you trust.',
    },
    servers: [{ url: siteOrigin, description: 'Site: cached public reads' }, ...(liveOrigin ? [{ url: liveOrigin, description: 'Live Worker: real time and M2M gateway' }] : [])],
    tags: [
      { name: 'Content', description: 'What the site shows. Public, cached.' },
      { name: 'Realtime', description: 'Server-Sent Events and Web Push.' },
      { name: 'Gateway', description: 'Authenticated write endpoints for other services.' },
    ],
    paths: {
      '/api/schedule': {
        ...publicRead('Streams from 1 day ago to 8 days ahead', { type: 'array', items: ref('StreamSlot') }, 'Content'),
        post: {
          tags: ['Gateway'],
          summary: 'Create or update streams',
          ...secured('schedule:write'),
          servers: live,
          requestBody: slotBody,
          responses: { '201': ok({ type: 'object', properties: { ok: { type: 'boolean' }, upserted: { type: 'integer' } } }, 'Saved and pushed to every open page'), ...failures('400', '401', '403', '429') },
        },
      },
      '/api/schedule/{id}': {
        delete: {
          tags: ['Gateway'],
          summary: 'Delete a stream',
          ...secured('schedule:write'),
          servers: live,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[\\w-]{1,64}$' } }],
          responses: { '200': ok({ type: 'object', properties: { ok: { type: 'boolean' } } }), ...failures('400', '401', '403', '429') },
        },
      },
      '/api/preferences': publicRead('Likes and dislikes', { type: 'array', items: ref('Preference') }, 'Content'),
      '/api/notes': publicRead('Approved viewer notes', { type: 'array', items: ref('Note') }, 'Content'),
      '/api/fanart/{page}': publicRead('Fan art, 9 per page', ref('FanartPage'), 'Content', [{ name: 'page', in: 'path', required: true, schema: { type: 'integer', minimum: 1, maximum: 100 } }]),
      '/api/content/{kind}': publicRead('The 12 newest videos of a category', { type: 'array', items: ref('Video') }, 'Content', [
        { name: 'kind', in: 'path', required: true, description: '`song` is every video labelled `original` or `cover`, whatever its kind.', schema: { type: 'string', enum: ['live', 'short', 'vod', 'song'] } },
      ]),
      '/api/realtime/events': {
        get: {
          tags: ['Realtime'],
          summary: 'Live event stream (SSE)',
          description:
            'Server-Sent Events (`text/event-stream`). On connect the server sends the latest message of each channel, then every change. Each message carries the whole state of its channel. ' +
            'A comment line (`: ping`) arrives every 20 seconds. `EventSource` reconnects by itself.\n\nChannels: `live:status`, `schedule:update`, `system:guerilla`.',
          servers: live,
          responses: {
            '200': {
              description: 'An open event stream.',
              content: { 'text/event-stream': { schema: { type: 'string' }, example: 'event: system:guerilla\ndata: {"is_active":false,"notice":""}\n\n' } },
            },
            ...failures('403', '429'),
            '503': { description: 'Too many open connections. Retry after the delay in `Retry-After`.' },
          },
        },
      },
      '/api/notifications/subscribe': {
        post: {
          tags: ['Realtime'],
          summary: 'Save a browser push subscription',
          description: 'Called by the site with the result of `PushManager.subscribe()`. Only the site\'s own pages may call it, and only endpoints of the browsers\' push services are accepted.',
          servers: live,
          requestBody: { required: true, content: { 'application/json': { schema: ref('PushSubscription') } } },
          responses: { '201': ok({ type: 'object', properties: { ok: { type: 'boolean' } } }, 'Subscribed'), ...failures('400', '403', '429') },
        },
        delete: {
          tags: ['Realtime'],
          summary: 'Remove a browser push subscription',
          servers: live,
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['endpoint'], properties: { endpoint: { type: 'string', format: 'uri' } } } } } },
          responses: { '200': ok({ type: 'object', properties: { ok: { type: 'boolean' } } }), ...failures('400', '403', '429') },
        },
      },
      '/api/system/guerilla': {
        post: {
          tags: ['Gateway'],
          summary: 'Turn guerilla mode on or off',
          ...secured('system:write'),
          servers: live,
          requestBody: { required: true, content: { 'application/json': { schema: ref('GuerillaRequest') } } },
          responses: { '200': ok(ref('GuerillaRequest'), 'Applied and broadcast on `system:guerilla`'), ...failures('400', '401', '403', '429') },
        },
      },
      '/api/videos/sync': {
        post: {
          tags: ['Gateway'],
          summary: 'Sync the newest uploads from YouTube now',
          ...secured('content:write'),
          servers: live,
          description: `${secured('content:write').description} Spends 3 YouTube quota units; at most once a minute. The database keeps each category at 12 videos.`,
          responses: { '200': ok({ type: 'object', properties: { ok: { type: 'boolean' }, inserted: { type: 'integer' } } }), ...failures('401', '403', '429'), '503': { description: 'The day\'s YouTube quota budget is used up.' } },
        },
      },
      '/api/videos/prune': {
        post: {
          tags: ['Gateway'],
          summary: 'Re-apply the 12-per-category window',
          ...secured('content:write'),
          servers: live,
          responses: { '200': ok({ type: 'object', properties: { ok: { type: 'boolean' }, deleted: { type: 'integer' } } }), ...failures('401', '403', '429') },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        Bearer: { type: 'http', scheme: 'bearer' },
      },
      responses: {
        BadRequest: json({ ...ref('Error'), examples: [{ error: 'Bad Request', details: ['slots.0.id: Invalid string'] }] }, 'The body or a parameter is invalid.'),
        Unauthorized: json(ref('Error'), 'No key, an unknown key or a revoked key.'),
        Forbidden: json(ref('Error'), 'The key lacks the required scope, or the caller is not one of the site\'s pages.'),
        NotFound: json(ref('Error'), 'No such address.'),
        RateLimited: { ...json(ref('Error'), 'Too many requests (per address, and per key: `rate_limit_per_min`).'), headers: { 'Retry-After': { schema: { type: 'integer' } } } },
      },
      schemas: {
        Error: { type: 'object', required: ['error'], properties: { error: { type: 'string' }, details: { type: 'array', items: { type: 'string' } } } },
        Localized: { type: 'object', required: ['en', 'jp', 'id', 'kr'], properties: { en: { type: 'string' }, jp: { type: 'string' }, id: { type: 'string' }, kr: { type: 'string' } } },
        StreamSlot: {
          type: 'object',
          required: ['id', 'title', 'description', 'datetime', 'durationMinutes', 'platform', 'membersOnly', 'thumbnailUrl', 'liveStatus'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: ref('Localized'),
            datetime: { type: 'string', format: 'date-time' },
            durationMinutes: { type: 'integer' },
            platform: { type: 'string', enum: ['youtube', 'twitch', 'x', 'discord'] },
            membersOnly: { type: 'boolean' },
            thumbnailUrl: { type: ['string', 'null'] },
            liveStatus: { type: ['string', 'null'], enum: ['upcoming', 'live', 'ended', null], description: 'Set by the Worker from YouTube. null for a stream added by hand.' },
          },
        },
        SlotInput: {
          type: 'object',
          required: ['id', 'title', 'description', 'datetime', 'durationMinutes', 'platform'],
          properties: {
            id: { type: 'string', pattern: '^[\\w-]{1,64}$' },
            title: { type: 'string', maxLength: 200 },
            description: ref('Localized'),
            datetime: { type: 'string', format: 'date-time', description: 'With a UTC offset, for example `2026-10-22T08:00:00+07:00`.' },
            durationMinutes: { type: 'integer', minimum: 1, maximum: 1440 },
            platform: { type: 'string', enum: ['youtube', 'twitch', 'x', 'discord'] },
            membersOnly: { type: 'boolean', default: false },
            thumbnailUrl: { type: ['string', 'null'], description: 'Only `https://i.ytimg.com/` images.' },
          },
        },
        Preference: { type: 'object', properties: { id: { type: 'integer' }, kind: { type: 'string', enum: ['like', 'dislike'] }, label: ref('Localized') } },
        Note: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, text: { type: 'string' } } },
        FanartPage: {
          type: 'object',
          properties: {
            posts: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, username: { type: 'string' }, mediaUrl: { type: 'string' }, postedAt: { type: 'string', format: 'date-time' } } } },
            hasMore: { type: 'boolean' },
          },
        },
        Video: {
          type: 'object',
          properties: { id: { type: 'string' }, kind: { type: 'string', enum: ['live', 'short', 'vod'] }, label: { type: ['string', 'null'], enum: ['original', 'cover', null] }, title: { type: 'string' }, publishedAt: { type: 'string', format: 'date-time' } },
        },
        LiveStatusEvent: {
          type: 'object',
          description: 'SSE event `live:status`.',
          properties: { is_live: { type: 'boolean' }, platform: { type: 'string', enum: ['youtube', 'twitch'] }, stream_title: { type: 'string' }, url: { type: 'string' }, started_at: { type: 'string' } },
        },
        ScheduleEvent: { type: 'object', description: 'SSE event `schedule:update`.', properties: { slots: { type: 'array', items: ref('StreamSlot') } } },
        GuerillaEvent: { type: 'object', description: 'SSE event `system:guerilla`.', properties: { is_active: { type: 'boolean' }, notice: { type: 'string' } } },
        GuerillaRequest: { type: 'object', required: ['active'], properties: { active: { type: 'boolean' }, message: { type: 'string', maxLength: 280, default: '' } } },
        PushSubscription: {
          type: 'object',
          required: ['endpoint', 'keys'],
          properties: {
            endpoint: { type: 'string', format: 'uri' },
            keys: { type: 'object', required: ['p256dh', 'auth'], properties: { p256dh: { type: 'string' }, auth: { type: 'string' } } },
            locale: { type: 'string', enum: ['en', 'jp', 'id', 'kr'], default: 'en' },
          },
        },
      },
    },
  };
}
