import { joinPublicUrl, resolvePublicAppConfig } from "shared/config/public-app-urls";

const buildTimeConfig = {
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
};

export const getFrontendUrl = () => resolvePublicAppConfig(buildTimeConfig).FRONTEND_URL;

export const getFrontendLoginUrl = () => joinPublicUrl(getFrontendUrl(), "/auth/login");
