import { hc } from 'hono/client'
import type { AppType } from '../../../api/src/index'
import { v4 as uuidv4 } from 'uuid';

export const apiClient = hc<AppType>(import.meta.env.VITE_API_BASE_URL, {
  headers() {
    return {
      'x-request-id': uuidv4(),
    }
  },
})
export type APIClient = typeof apiClient
