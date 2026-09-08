import { afterEach, describe, expect, test } from "bun:test";
import {
  firstPublicUrl,
  injectPublicAppConfig,
  injectPublicAppConfigIntoResponse,
  joinPublicUrl,
  normalizePublicUrl,
  publicAppConfigFromEnv,
  resolvePublicAppConfig,
  serializePublicAppConfigScript,
} from "./public-app-urls";

const originalRuntimeConfig =
  typeof window === "undefined" ? undefined : window.__APP_CONFIG__;

afterEach(() => {
  if (typeof window !== "undefined") {
    window.__APP_CONFIG__ = originalRuntimeConfig;
  }
});

describe("normalizePublicUrl", () => {
  test("trims whitespace and trailing slashes", () => {
    expect(normalizePublicUrl(" https://app.example.com/ ")).toBe(
      "https://app.example.com",
    );
    expect(normalizePublicUrl("https://app.example.com///")).toBe(
      "https://app.example.com",
    );
  });

  test("returns empty string for missing values", () => {
    expect(normalizePublicUrl(undefined)).toBe("");
    expect(normalizePublicUrl("   ")).toBe("");
  });
});

describe("firstPublicUrl", () => {
  test("skips empty candidates", () => {
    expect(firstPublicUrl("", undefined, " https://admin.example.com/ ")).toBe(
      "https://admin.example.com",
    );
  });
});

describe("joinPublicUrl", () => {
  test("returns empty when the base origin is missing", () => {
    expect(joinPublicUrl("", "/auth/login")).toBe("");
    expect(joinPublicUrl(undefined as unknown as string, "/auth/login")).toBe("");
  });

  test("joins an origin and path without duplicating slashes", () => {
    expect(joinPublicUrl("https://app.example.com/", "/auth/login")).toBe(
      "https://app.example.com/auth/login",
    );
  });
});

describe("publicAppConfigFromEnv", () => {
  test("prefers VITE_ keys and accepts unprefixed aliases", () => {
    expect(
      publicAppConfigFromEnv({
        VITE_FRONTEND_URL: "https://app.example.com/",
        FRONTEND_URL: "https://ignored.example.com",
        ADMIN_URL: "https://admin.example.com",
        API_BASE_URL: "https://api.example.com",
      }),
    ).toEqual({
      FRONTEND_URL: "https://app.example.com",
      ADMIN_URL: "https://admin.example.com",
      API_BASE_URL: "https://api.example.com",
    });
  });
});

describe("resolvePublicAppConfig", () => {
  test("runtime window config is authoritative when injected", () => {
    window.__APP_CONFIG__ = {
      FRONTEND_URL: "https://runtime-app.example.com/",
      ADMIN_URL: "https://runtime-admin.example.com",
    };

    expect(
      resolvePublicAppConfig(
        {
          FRONTEND_URL: "https://build-app.example.com",
          ADMIN_URL: "https://build-admin.example.com",
        },
        {
          VITE_FRONTEND_URL: "https://env-app.example.com",
          VITE_ADMIN_URL: "https://env-admin.example.com",
        },
      ),
    ).toEqual({
      FRONTEND_URL: "https://runtime-app.example.com",
      ADMIN_URL: "https://runtime-admin.example.com",
      API_BASE_URL: "",
    });
  });

  test("injected empty runtime values do not fall back to env or build-time", () => {
    window.__APP_CONFIG__ = {
      FRONTEND_URL: "",
      ADMIN_URL: "",
      API_BASE_URL: "",
    };

    expect(
      resolvePublicAppConfig(
        { FRONTEND_URL: "https://build-app.example.com" },
        { VITE_FRONTEND_URL: "https://env-app.example.com" },
      ),
    ).toEqual({
      FRONTEND_URL: "",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
  });

  test("falls back to env then build-time when runtime config is absent", () => {
    window.__APP_CONFIG__ = undefined;

    expect(
      resolvePublicAppConfig(
        { FRONTEND_URL: "https://build-app.example.com" },
        { VITE_ADMIN_URL: "https://env-admin.example.com/" },
      ),
    ).toEqual({
      FRONTEND_URL: "https://build-app.example.com",
      ADMIN_URL: "https://env-admin.example.com",
      API_BASE_URL: "",
    });
  });
});

describe("injectPublicAppConfig", () => {
  test("inserts a script tag immediately after <head>", () => {
    const html = "<html><head><title>Admin</title></head><body></body></html>";
    const injected = injectPublicAppConfig(html, {
      FRONTEND_URL: "https://app.example.com",
      ADMIN_URL: "https://admin.example.com",
      API_BASE_URL: "https://api.example.com",
    });

    expect(injected.startsWith("<html><head><script>window.__APP_CONFIG__=")).toBe(true);
    expect(injected).toContain('"FRONTEND_URL":"https://app.example.com"');
    expect(injected).toContain("<title>Admin</title>");
  });

  test("does not inject twice", () => {
    const html = "<head></head>";
    const first = injectPublicAppConfig(html, {
      FRONTEND_URL: "https://app.example.com",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
    const second = injectPublicAppConfig(first, {
      FRONTEND_URL: "https://other.example.com",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
    expect(second).toBe(first);
  });

  test("escapes </script> breakout in serialized values", () => {
    const script = serializePublicAppConfigScript({
      FRONTEND_URL: "https://app.example.com/</script>",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
    expect(script).toContain("\\u003c/script>");
    expect(script.match(/<\/script>/g)?.length).toBe(1);
  });
});

describe("injectPublicAppConfigIntoResponse", () => {
  test("rewrites HTML responses and leaves other content types alone", async () => {
    const htmlResponse = new Response("<head></head>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
    const rewritten = await injectPublicAppConfigIntoResponse(htmlResponse, {
      FRONTEND_URL: "https://app.example.com",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
    expect(await rewritten.text()).toContain("window.__APP_CONFIG__=");

    const jsonResponse = new Response("{}", {
      headers: { "content-type": "application/json" },
    });
    const untouched = await injectPublicAppConfigIntoResponse(jsonResponse, {
      FRONTEND_URL: "https://app.example.com",
      ADMIN_URL: "",
      API_BASE_URL: "",
    });
    expect(await untouched.text()).toBe("{}");
  });
});
