import { createHash, timingSafeEqual } from 'node:crypto';
import type { ApiKeyRow } from './types.ts';

export const SCOPES = ['schedule:write', 'content:write', 'system:write', 'admin'] as const;
export type Scope = (typeof SCOPES)[number];

/** `mizu_live_` plus 48 hex characters (192 bits), so a key can be hashed with plain SHA-256: there is nothing to brute-force, and the hash is the lookup key. */
const KEY_FORMAT = /^mizu_live_[0-9a-f]{48}$/;
const BEARER = /^Bearer\s+(\S+)$/i;

export interface Principal {
  id: string;
  name: string;
  scopes: ReadonlySet<string>;
  /** null for the bridge secret, which is not rate limited. */
  limitPerMinute: number | null;
}

export const hashKey = (key: string): string => createHash('sha256').update(key).digest('hex');

/** Constant time and length-blind: both sides are hashed to the same size first. */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

export function extractKey(headers: Headers): string | null {
  const bearer = BEARER.exec(headers.get('authorization') ?? '')?.[1];
  return bearer ?? headers.get('x-api-key')?.trim() ?? null;
}

export const hasScope = (principal: Principal, required: readonly Scope[]): boolean =>
  principal.scopes.has('admin') || required.some((scope) => principal.scopes.has(scope));

/** Resolves who is calling, or null. `lookup` finds a key row by its hash (injected so the logic runs without a database). */
export async function authenticate(
  headers: Headers,
  bridgeSecret: string | undefined,
  lookup: (hash: string) => Promise<ApiKeyRow | null>,
): Promise<Principal | null> {
  const key = extractKey(headers);
  if (!key || key.length > 128) return null;

  if (bridgeSecret && bridgeSecret.length >= 32 && safeEqual(key, bridgeSecret)) {
    return { id: 'bridge', name: 'worker-bridge', scopes: new Set(['admin']), limitPerMinute: null };
  }

  // A malformed key is turned away before it costs a database read.
  if (!KEY_FORMAT.test(key)) return null;

  const hash = hashKey(key);
  const row = await lookup(hash);
  if (!row?.is_active || !safeEqual(row.key_hash, hash)) return null;
  return { id: row.id, name: row.name, scopes: new Set(row.scopes), limitPerMinute: row.rate_limit_per_min };
}
