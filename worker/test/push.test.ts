import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encryptPayload, fromBase64Url, isPushEndpoint, toBase64Url, vapidAuthorization } from '../src/push.ts';
import type { Env } from '../src/types.ts';

const ecdh = { name: 'ECDH', namedCurve: 'P-256' } as const;
const enc = new TextEncoder();

async function hkdf(salt: Uint8Array, ikm: ArrayBuffer | Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm as BufferSource, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: salt as BufferSource, info: info as BufferSource }, key, length * 8));
}

test('encryptPayload can be read by the browser that owns the keys (RFC 8291)', async () => {
  const ua = await crypto.subtle.generateKey(ecdh, true, ['deriveBits']);
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const message = JSON.stringify({ title: 'Mizu は配信中！', body: 'テスト', url: 'https://www.youtube.com/watch?v=abcdefghijk' });

  const body = await encryptPayload({ p256dh: toBase64Url(uaPublic), auth: toBase64Url(auth) }, message);

  const salt = body.slice(0, 16);
  assert.equal(new DataView(body.buffer, body.byteOffset).getUint32(16), 4096);
  assert.equal(body[20], 65);
  const asPublic = body.slice(21, 86);
  const cipher = body.slice(86);

  const asKey = await crypto.subtle.importKey('raw', asPublic, ecdh, false, []);
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.privateKey, 256);
  const info = new Uint8Array([...enc.encode('WebPush: info\0'), ...uaPublic, ...asPublic]);
  const ikm = await hkdf(auth, shared, info, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const aes = await crypto.subtle.importKey('raw', cek as BufferSource, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aes, cipher));

  assert.equal(plain.at(-1), 2);
  assert.equal(new TextDecoder().decode(plain.slice(0, -1)), message);
});

test('encryptPayload refuses malformed subscription keys', async () => {
  await assert.rejects(encryptPayload({ p256dh: 'AAAA', auth: 'AAAA' }, 'x'));
});

test('the VAPID token is a valid ES256 JWT for the push service', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const point = new Uint8Array([4, ...fromBase64Url(jwk.x as string), ...fromBase64Url(jwk.y as string)]);
  const env = { VAPID_PUBLIC_KEY: toBase64Url(point), VAPID_PRIVATE_KEY: jwk.d as string, VAPID_SUBJECT: 'mailto:a@example.com' } as Env;

  const header = await vapidAuthorization(env, 'https://fcm.googleapis.com/fcm/send/abc', 1_000_000_000_000);
  const [, token, key] = /^vapid t=([\w.-]+), k=([\w-]+)$/.exec(header) ?? [];
  assert.equal(key, env.VAPID_PUBLIC_KEY);
  const [head, claims, signature] = (token as string).split('.') as [string, string, string];
  assert.deepEqual(JSON.parse(new TextDecoder().decode(fromBase64Url(claims))), { aud: 'https://fcm.googleapis.com', exp: 1_000_000_000 + 43_200, sub: 'mailto:a@example.com' });
  assert.equal(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, fromBase64Url(signature), enc.encode(`${head}.${claims}`)), true);
});

test('only browser push services are accepted as endpoints', () => {
  assert.equal(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true);
  assert.equal(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc'), true);
  assert.equal(isPushEndpoint('https://web.push.apple.com/abc'), true);
  assert.equal(isPushEndpoint('https://abc.notify.windows.com/w/?token=x'), true);
  assert.equal(isPushEndpoint('http://fcm.googleapis.com/x'), false);
  assert.equal(isPushEndpoint('https://evil.example/x'), false);
  assert.equal(isPushEndpoint('https://fcm.googleapis.com.evil.example/x'), false);
  assert.equal(isPushEndpoint('https://user:pw@fcm.googleapis.com/x'), false);
  assert.equal(isPushEndpoint('https://fcm.googleapis.com:8443/x'), false);
  assert.equal(isPushEndpoint('https://127.0.0.1/x'), false);
  assert.equal(isPushEndpoint('https://fcm.googleapis.com/a"b'), false);
});
