import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authenticate, extractKey, hasScope, hashKey, safeEqual, type Principal } from '../src/auth.ts';
import type { ApiKeyRow } from '../src/types.ts';

const KEY = `mizu_live_${'ab12'.repeat(12)}`;
const BRIDGE = 'b'.repeat(40);
const row = (overrides: Partial<ApiKeyRow> = {}): ApiKeyRow => ({ id: 'k1', name: 'bot', key_hash: hashKey(KEY), scopes: ['schedule:write'], is_active: true, rate_limit_per_min: 60, ...overrides });
const headers = (init: Record<string, string>) => new Headers(init);

test('hashKey is SHA-256 hex, the same as the SQL helper stores', () => {
  assert.equal(hashKey('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('extractKey reads Bearer and X-API-Key', () => {
  assert.equal(extractKey(headers({ authorization: 'Bearer abc' })), 'abc');
  assert.equal(extractKey(headers({ 'x-api-key': ' abc ' })), 'abc');
  assert.equal(extractKey(headers({ authorization: 'Basic abc' })), null);
  assert.equal(extractKey(headers({})), null);
});

test('safeEqual compares without caring about length', () => {
  assert.equal(safeEqual('a', 'a'), true);
  assert.equal(safeEqual('a', 'ab'), false);
});

test('a valid key resolves to its scopes', async () => {
  const principal = await authenticate(headers({ authorization: `Bearer ${KEY}` }), BRIDGE, async (hash) => (hash === hashKey(KEY) ? row() : null));
  assert.ok(principal);
  assert.equal(principal.limitPerMinute, 60);
  assert.equal(hasScope(principal, ['schedule:write']), true);
  assert.equal(hasScope(principal, ['content:write']), false);
});

test('inactive, unknown and malformed keys are refused; a malformed key never reaches the database', async () => {
  let lookups = 0;
  const lookup = async (): Promise<ApiKeyRow | null> => {
    lookups += 1;
    return null;
  };
  assert.equal(await authenticate(headers({ 'x-api-key': KEY }), BRIDGE, async () => row({ is_active: false })), null);
  assert.equal(await authenticate(headers({ 'x-api-key': KEY }), BRIDGE, lookup), null);
  assert.equal(await authenticate(headers({ 'x-api-key': 'mizu_live_short' }), BRIDGE, lookup), null);
  assert.equal(lookups, 1);
});

test('the bridge secret skips the lookup and the limit; a short secret is never accepted', async () => {
  const lookup = async (): Promise<ApiKeyRow | null> => assert.fail('no lookup expected');
  const principal = await authenticate(headers({ authorization: `Bearer ${BRIDGE}` }), BRIDGE, lookup);
  assert.equal(principal?.limitPerMinute, null);
  assert.equal(hasScope(principal as Principal, ['system:write']), true);
  assert.equal(await authenticate(headers({ authorization: 'Bearer short' }), 'short', async () => null), null);
});

test('admin passes every scope check', () => {
  const admin: Principal = { id: 'a', name: 'a', scopes: new Set(['admin']), limitPerMinute: 60 };
  assert.equal(hasScope(admin, ['content:write']), true);
});
