import { hc } from 'hono/client'
import type { AppType } from '../../../api/src/index'
import { SessionStore } from './session-utils';

export const apiClient = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
  headers() {
    return {
      'x-session-id': SessionStore.getSessionId(),
      'x-request-id': crypto.randomUUID(),
    }
  },
})
export type APIClient = typeof apiClient
