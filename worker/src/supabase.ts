import type { Env } from './types.ts';

interface RestInit {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: URLSearchParams;
  body?: unknown;
  /** The `Prefer` header, for example `resolution=merge-duplicates,return=minimal`. */
  prefer?: string;
}

/** PostgREST over fetch. The secret key never leaves the Worker; errors carry the status only, never the response body. */
export async function rest<T = null>(env: Env, path: string, { method = 'GET', query, body, prefer }: RestInit = {}): Promise<T> {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Supabase ${method} ${path} failed: ${response.status}`);
  if (response.status === 204 || !(response.headers.get('content-type') ?? '').includes('json')) return null as T;
  return (await response.json()) as T;
}

export const params = (entries: Record<string, string | string[]>): URLSearchParams => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  return query;
};
