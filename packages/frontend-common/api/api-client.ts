import { hc } from "hono/client";
import { SessionStore } from "../auth/session-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApiClient<TAppType = any>(baseURL: string) {
  // @ts-expect-error - hc type constraint is too strict for our generic usage
  const client = hc<TAppType>(baseURL, {
    headers() {
      const sessionStore = new SessionStore();
      return {
        "x-session-id": sessionStore.getSessionId(),
        "x-request-id": crypto.randomUUID(),
      };
    },
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: 'include',
      });
    },
  });

  return client;
}

export type APIClient<T> = ReturnType<typeof createApiClient<T>>;
