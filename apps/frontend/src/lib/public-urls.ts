import { resolvePublicAppConfig } from "shared/config/public-app-urls";

const isViteDev = import.meta.env.DEV === true;

export const getAdminUrl = () => {
  const configured = resolvePublicAppConfig({
    ADMIN_URL: import.meta.env.VITE_ADMIN_URL,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  }).ADMIN_URL;
  if (configured) {
    return configured;
  }
  return isViteDev ? "http://localhost:5175" : "";
};
