import { joinPublicUrl, resolvePublicAppConfig } from "shared/config/public-app-urls";

export const getFrontendUrl = () =>
  resolvePublicAppConfig({
    FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  }).FRONTEND_URL;

export const getFrontendLoginUrl = () => joinPublicUrl(getFrontendUrl(), "/auth/login");
