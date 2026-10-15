import { use, useEffect, useState } from 'react';

type ApiState<T> = { status: 'loading' | 'error'; data: undefined } | { status: 'ready'; data: T };

/** A request that remembers how it ended. `status`, `value` and `reason` are React's own convention: `use` and `peek` read them synchronously instead of waiting a tick. */
interface Tracked<T> extends Promise<T> {
  status?: 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
  settledAt?: number;
}

// A loaded answer is reused for a minute (the CDN keeps the shortest ones for the same time), so components that need the same list share one request.
const FRESH_MS = 60_000;
// A failed request is only kept long enough for an error boundary to render it; after that the next mount asks again.
const FAILURE_MS = 5_000;

const requests = new Map<string, Tracked<unknown>>();

const isExpired = ({ status, settledAt }: Tracked<unknown>): boolean => settledAt !== undefined && Date.now() - settledAt > (status === 'rejected' ? FAILURE_MS : FRESH_MS);

/** `path` ends with a slash, as the host redirects the other form. */
export function load<T>(path: string): Promise<T> {
  const cached = requests.get(path);
  if (cached && !isExpired(cached)) return cached as Tracked<T>;

  const request: Tracked<T> = fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error(`Request to ${path} failed: ${response.status}`);
      return response.json() as Promise<T>;
    })
    .then(
      (value) => {
        request.status = 'fulfilled';
        request.value = value;
        request.settledAt = Date.now();
        return value;
      },
      (error: unknown) => {
        request.status = 'rejected';
        request.reason = error;
        request.settledAt = Date.now();
        throw error;
      },
    );

  requests.set(path, request);
  return request;
}

/** Starts a request ahead of the component that will need it (a hovered tab, for example). Nobody waits for the result, so a failure is ignored here. */
export function preload(path: string): void {
  load(path).catch(() => undefined);
}

/** Lets an error boundary's "Try again" ask the server again instead of replaying the failure it just caught. */
export function forgetFailures(): void {
  requests.forEach((request, path) => request.status === 'rejected' && requests.delete(path));
}

/**
 * Reads a list and suspends until it has arrived. The nearest `<Suspense>` shows the loading state and the nearest error
 * boundary the failure: use `AsyncBoundary`. Keep `path` the same for as long as the component lives (change a `key` instead).
 */
export function useData<T>(path: string): T {
  const [request] = useState(() => load<T>(path));
  return use(request);
}

const peek = <T>(path: string): ApiState<T> => {
  const request = requests.get(path) as Tracked<T> | undefined;
  return request?.status === 'fulfilled' ? { status: 'ready', data: request.value as T } : { status: 'loading', data: undefined };
};

/**
 * For content that must stay on screen while it is fetched or refreshed (the schedule): it never suspends, so the section around it keeps its place.
 * Whatever was loaded stays visible while a newer answer is on its way, and a tab that comes back to the foreground asks again:
 * people leave this page open for hours waiting for a stream.
 */
export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>(() => peek<T>(path));

  useEffect(() => {
    let active = true;

    const refresh = () =>
      load<T>(path).then(
        (data) => active && setState((current) => (current.status === 'ready' && current.data === data ? current : { status: 'ready', data })),
        () => active && setState((current) => (current.status === 'ready' ? current : { status: 'error', data: undefined })),
      );

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    void refresh();
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [path]);

  return state;
}
