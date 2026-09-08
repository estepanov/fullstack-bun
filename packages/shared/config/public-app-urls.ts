/**
 * Public origin URLs for the customer app, admin app, and API.
 *
 * Vite `VITE_*` values are compiled into the client bundle at build time.
 * Hostinger, Docker, and similar platforms often set the same keys only at
 * runtime. The Node servers inject `window.__APP_CONFIG__` from `process.env`
 * so cross-app links (e.g. admin "Back to App") follow the deployed origins.
 * Empty injected values fall through to env and then to the Vite build-time
 * origins, so Fly `[build.args]` still apply when `[env]` omits the URLs.
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
  const runtime = readRuntimePublicAppConfig();
  const fromEnv = publicAppConfigFromEnv(env);
  return {
    FRONTEND_URL: firstPublicUrl(
      runtime.FRONTEND_URL,
      fromEnv.FRONTEND_URL,
      buildTime.FRONTEND_URL,
    ),
    ADMIN_URL: firstPublicUrl(runtime.ADMIN_URL, fromEnv.ADMIN_URL, buildTime.ADMIN_URL),
    API_BASE_URL: firstPublicUrl(
      runtime.API_BASE_URL,
      fromEnv.API_BASE_URL,
      buildTime.API_BASE_URL,
    ),
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

const HEAD_SEARCH_LIMIT = 32_768;

const injectPublicAppConfigIntoStream = (
  body: ReadableStream<Uint8Array>,
  config: PublicAppConfig,
): ReadableStream<Uint8Array> => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const marker = `window.${PUBLIC_APP_CONFIG_GLOBAL}=`;
  const reader = body.getReader();
  let buffer = "";
  let injected = false;

  const enqueueText = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    value: string,
  ) => {
    if (value.length === 0) {
      return;
    }
    controller.enqueue(encoder.encode(value));
  };

  const flushBufferedHtml = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (injected) {
      enqueueText(controller, buffer);
      buffer = "";
      return;
    }
    injected = true;
    enqueueText(controller, injectPublicAppConfig(buffer, config));
    buffer = "";
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          flushBufferedHtml(controller);
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        if (injected) {
          enqueueText(controller, buffer);
          buffer = "";
          return;
        }
        if (
          buffer.includes(marker) ||
          /<head[^>]*>/i.test(buffer) ||
          buffer.length >= HEAD_SEARCH_LIMIT
        ) {
          flushBufferedHtml(controller);
          return;
        }
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
};

export const injectPublicAppConfigIntoResponse = (
  response: Response,
  config: PublicAppConfig = publicAppConfigFromEnv(),
): Response => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") || !response.body) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(injectPublicAppConfigIntoStream(response.body, config), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
