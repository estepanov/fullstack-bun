import type { AppType } from "api/dist/src";
import { hc } from "hono/client";
import { SessionStore } from "./session-utils";

export const apiClient = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
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

export type APIClient = typeof apiClient;
