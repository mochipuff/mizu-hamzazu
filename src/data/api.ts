import { useEffect, useState } from 'react';

type ApiState<T> = { status: 'loading' | 'error'; data: undefined } | { status: 'ready'; data: T };

// Components that need the same list share one request. A failed request is forgotten so the next mount tries again.
const requests = new Map<string, Promise<unknown>>();

function load<T>(path: string): Promise<T> {
  let request = requests.get(path) as Promise<T> | undefined;
  if (!request) {
    request = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`Request to ${path} failed: ${response.status}`);
        return response.json() as Promise<T>;
      })
      .catch((error: unknown) => {
        requests.delete(path);
        throw error;
      });
    requests.set(path, request);
  }
  return request;
}

/** `path` ends with a slash, as the host redirects the other form. */
export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading', data: undefined });

  useEffect(() => {
    let active = true;
    load<T>(path).then(
      (data) => active && setState({ status: 'ready', data }),
      () => active && setState({ status: 'error', data: undefined }),
    );
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
