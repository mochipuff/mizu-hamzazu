import { use, useEffect, useState } from 'react';

type ApiState<T> = { status: 'loading' | 'error'; data: undefined } | { status: 'ready'; data: T };

interface Tracked<T> extends Promise<T> {
  status?: 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
  settledAt?: number;
}

const FRESH_MS = 60_000;
const FAILURE_MS = 5_000;

const requests = new Map<string, Tracked<unknown>>();

const isExpired = ({ status, settledAt }: Tracked<unknown>): boolean => settledAt !== undefined && Date.now() - settledAt > (status === 'rejected' ? FAILURE_MS : FRESH_MS);

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

export function preload(path: string): void {
  load(path).catch(() => undefined);
}

export function forgetFailures(): void {
  requests.forEach((request, path) => request.status === 'rejected' && requests.delete(path));
}

export function useData<T>(path: string): T {
  const [request] = useState(() => load<T>(path));
  return use(request);
}

const peek = <T>(path: string): ApiState<T> => {
  const request = requests.get(path) as Tracked<T> | undefined;
  return request?.status === 'fulfilled' ? { status: 'ready', data: request.value as T } : { status: 'loading', data: undefined };
};

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
