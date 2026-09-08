/**
 * Public origin URLs for the customer app, admin app, and API.
 *
 * Vite `VITE_*` values are compiled into the client bundle at build time.
 * Hostinger, Docker, and similar platforms often set the same keys only at
 * runtime. The Node servers inject `window.__APP_CONFIG__` from `process.env`
 * so cross-app links (e.g. admin "Back to App") follow the deployed origins.
 */

export const PUBLIC_APP_CONFIG_GLOBAL = "__APP_CONFIG__";

export type PublicAppConfig = {
  FRONTEND_URL: string;
  ADMIN_URL: string;
  API_BASE_URL: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<PublicAppConfig>;
  }
}

const processEnv = (): Record<string, string | undefined> => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return {};
  }
  return process.env;
};

export const normalizePublicUrl = (value: string | undefined | null): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/\/+$/, "");
};

export const firstPublicUrl = (...values: Array<string | undefined | null>): string => {
  for (const value of values) {
    const normalized = normalizePublicUrl(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
};

export const joinPublicUrl = (base: string, path: string): string => {
  const origin = normalizePublicUrl(base);
  if (!origin) {
    return "";
  }
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${suffix}`;
};

export const publicAppConfigFromEnv = (
  env: Record<string, string | undefined> = processEnv(),
): PublicAppConfig => ({
  FRONTEND_URL: firstPublicUrl(env.VITE_FRONTEND_URL, env.FRONTEND_URL, env.FE_BASE_URL),
  ADMIN_URL: firstPublicUrl(env.VITE_ADMIN_URL, env.ADMIN_URL),
  API_BASE_URL: firstPublicUrl(env.VITE_API_BASE_URL, env.API_BASE_URL),
});

export const readRuntimePublicAppConfig = (): Partial<PublicAppConfig> => {
  if (typeof window === "undefined") {
    return {};
  }
  const runtime = window[PUBLIC_APP_CONFIG_GLOBAL];
  if (!runtime || typeof runtime !== "object") {
    return {};
  }
  return runtime;
};

export const resolvePublicAppConfig = (
  buildTime: Partial<PublicAppConfig> = {},
  env: Record<string, string | undefined> = processEnv(),
): PublicAppConfig => {
  const hasRuntime =
    typeof window !== "undefined" && window[PUBLIC_APP_CONFIG_GLOBAL] !== undefined;
  if (hasRuntime) {
    const runtime = readRuntimePublicAppConfig();
    return {
      FRONTEND_URL: normalizePublicUrl(runtime.FRONTEND_URL),
      ADMIN_URL: normalizePublicUrl(runtime.ADMIN_URL),
      API_BASE_URL: normalizePublicUrl(runtime.API_BASE_URL),
    };
  }

  const fromEnv = publicAppConfigFromEnv(env);
  return {
    FRONTEND_URL: firstPublicUrl(fromEnv.FRONTEND_URL, buildTime.FRONTEND_URL),
    ADMIN_URL: firstPublicUrl(fromEnv.ADMIN_URL, buildTime.ADMIN_URL),
    API_BASE_URL: firstPublicUrl(fromEnv.API_BASE_URL, buildTime.API_BASE_URL),
  };
};

export const serializePublicAppConfigScript = (config: PublicAppConfig): string => {
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  return `<script>window.${PUBLIC_APP_CONFIG_GLOBAL}=${json};</script>`;
};

export const injectPublicAppConfig = (
  html: string,
  config: PublicAppConfig = publicAppConfigFromEnv(),
): string => {
  const marker = `window.${PUBLIC_APP_CONFIG_GLOBAL}=`;
  if (html.includes(marker)) {
    return html;
  }
  const script = serializePublicAppConfigScript(config);
  const headOpen = html.match(/<head[^>]*>/i);
  if (!headOpen || headOpen.index === undefined) {
    return `${script}${html}`;
  }
  const insertAt = headOpen.index + headOpen[0].length;
  return `${html.slice(0, insertAt)}${script}${html.slice(insertAt)}`;
};

export const injectPublicAppConfigIntoResponse = async (
  response: Response,
  config: PublicAppConfig = publicAppConfigFromEnv(),
): Promise<Response> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }
  const html = await response.text();
  const injected = injectPublicAppConfig(html, config);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
