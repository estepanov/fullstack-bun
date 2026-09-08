import { afterEach, describe, expect, test } from "bun:test";
import { getFrontendLoginUrl, getFrontendUrl } from "./public-urls";

const originalFrontendUrl = process.env.VITE_FRONTEND_URL;
const originalRuntimeConfig = window.__APP_CONFIG__;

afterEach(() => {
  if (originalFrontendUrl === undefined) {
    delete process.env.VITE_FRONTEND_URL;
  } else {
    process.env.VITE_FRONTEND_URL = originalFrontendUrl;
  }
  window.__APP_CONFIG__ = originalRuntimeConfig;
});

describe("admin public URLs", () => {
  test("uses the deployed frontend origin instead of a relative path", () => {
    process.env.VITE_FRONTEND_URL = "https://demo-fullstackbun.estepanov.com/";
    window.__APP_CONFIG__ = undefined;

    expect(getFrontendUrl()).toBe("https://demo-fullstackbun.estepanov.com");
    expect(getFrontendLoginUrl()).toBe(
      "https://demo-fullstackbun.estepanov.com/auth/login",
    );
  });

  test("does not build undefined/auth/login when the frontend origin is missing", () => {
    delete process.env.VITE_FRONTEND_URL;
    delete process.env.FRONTEND_URL;
    delete process.env.FE_BASE_URL;
    window.__APP_CONFIG__ = undefined;

    expect(getFrontendUrl()).toBe("");
    expect(getFrontendLoginUrl()).toBe("");
    expect(getFrontendLoginUrl()).not.toContain("undefined");
  });

  test("prefers runtime config injected by the production server", () => {
    process.env.VITE_FRONTEND_URL = "https://build-time.example.com";
    window.__APP_CONFIG__ = {
      FRONTEND_URL: "https://demo-fullstackbun.estepanov.com",
    };

    expect(getFrontendUrl()).toBe("https://demo-fullstackbun.estepanov.com");
  });
});
