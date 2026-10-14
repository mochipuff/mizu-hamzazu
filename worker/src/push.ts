import type { Env, Locale, Subscription } from './types.ts';

const encoder = new TextEncoder();

/** The only hosts a browser's push service uses. A subscription anywhere else is refused: the Worker would otherwise POST to any address a visitor names. */
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];

export function isPushEndpoint(value: string): boolean {
  if (value.length > 2_048 || /["\\\s]/.test(value) || !URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === 'https:' && url.port === '' && !url.username && !url.password && PUSH_HOSTS.some((host) => host.test(url.hostname));
}

const copy: Record<Locale, { title: string; body: (stream: string) => string }> = {
  en: { title: 'Mizu is live now!', body: (stream) => stream },
  jp: { title: 'Mizuがライブ配信中！', body: (stream) => stream },
  id: { title: 'Mizu lagi live sekarang!', body: (stream) => stream },
  kr: { title: 'Mizu가 지금 라이브 중!', body: (stream) => stream },
};

export interface LivePush {
  locale: Locale;
  title: string;
  url: string;
}

export const livePayload = ({ locale, title, url }: LivePush): string =>
  JSON.stringify({ title: copy[locale].title, body: copy[locale].body(title).slice(0, 140), url, tag: 'mizu-live' });

export const toBase64Url = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...view)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

export const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

async function hkdf(salt: Uint8Array, ikm: ArrayBuffer | Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/** RFC 8291 (aes128gcm): encrypts `payload` so only the browser that owns `p256dh` / `auth` can read it. One record, no padding. */
export async function encryptPayload(subscription: Pick<Subscription, 'p256dh' | 'auth'>, payload: string): Promise<Uint8Array> {
  const uaPublic = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error('Malformed push subscription keys');

  const ephemeral = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
  const asPublic = new Uint8Array((await crypto.subtle.exportKey('raw', ephemeral.publicKey)) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  // The runtime reads the standard `public` member; the Workers typings spell it `$public`.
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey } as unknown as SubtleCryptoDeriveKeyAlgorithm, ephemeral.privateKey, 256);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(authSecret, shared, concat(encoder.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  // 0x02 marks the last (here: only) record.
  const plain = concat(encoder.encode(payload), new Uint8Array([2]));
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain));

  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, cipher);
}

let signingKey: { source: string; key: CryptoKey } | undefined;

async function getSigningKey(env: Env): Promise<CryptoKey> {
  const source = `${env.VAPID_PUBLIC_KEY}.${env.VAPID_PRIVATE_KEY}`;
  if (signingKey?.source === source) return signingKey.key;

  const point = fromBase64Url(env.VAPID_PUBLIC_KEY);
  if (point.length !== 65) throw new Error('VAPID_PUBLIC_KEY must be an uncompressed P-256 point');
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x: toBase64Url(point.slice(1, 33)), y: toBase64Url(point.slice(33)), d: env.VAPID_PRIVATE_KEY },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  signingKey = { source, key };
  return key;
}

/** RFC 8292: a signed token that tells the push service who is sending and where to reach them. */
export async function vapidAuthorization(env: Env, endpoint: string, now: number): Promise<string> {
  const part = (value: object): string => toBase64Url(encoder.encode(JSON.stringify(value)));
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })}`;
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await getSigningKey(env), encoder.encode(unsigned));
  return `vapid t=${unsigned}.${toBase64Url(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}

/** Sends one message. Returns the push service's status; 404 and 410 mean the browser unsubscribed and the row should go. */
export async function sendPush(env: Env, subscription: Subscription, payload: string, now = Date.now()): Promise<number> {
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuthorization(env, subscription.endpoint, now),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      // Half an hour: a live alert that arrives after that is only noise. The topic replaces a message that is still waiting.
      TTL: '1800',
      Urgency: 'high',
      Topic: 'mizu-live',
    },
    body: await encryptPayload(subscription, payload),
    signal: AbortSignal.timeout(8_000),
  });
  return response.status;
}
