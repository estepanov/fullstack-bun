import type { AppType } from "api/src";
import { createApiClient } from "frontend-common/api";

export const apiClient = createApiClient<AppType>(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
);

export type APIClient = typeof apiClient;
