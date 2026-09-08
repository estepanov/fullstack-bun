import { afterEach, describe, expect, test } from "bun:test";
import { getAdminUrl } from "./public-urls";

const originalAdminUrl = process.env.VITE_ADMIN_URL;
const originalRuntimeConfig = window.__APP_CONFIG__;

afterEach(() => {
  if (originalAdminUrl === undefined) {
    delete process.env.VITE_ADMIN_URL;
  } else {
    process.env.VITE_ADMIN_URL = originalAdminUrl;
  }
  window.__APP_CONFIG__ = originalRuntimeConfig;
});

describe("frontend public URLs", () => {
  test("uses the deployed admin origin instead of localhost", () => {
    process.env.VITE_ADMIN_URL = "https://demo-admin-fullstackbun.estepanov.com/";
    window.__APP_CONFIG__ = undefined;

    expect(getAdminUrl()).toBe("https://demo-admin-fullstackbun.estepanov.com");
    expect(getAdminUrl()).not.toContain("localhost");
  });

  test("prefers runtime config injected by the production server", () => {
    process.env.VITE_ADMIN_URL = "https://build-time-admin.example.com";
    window.__APP_CONFIG__ = {
      ADMIN_URL: "https://demo-admin-fullstackbun.estepanov.com",
    };

    expect(getAdminUrl()).toBe("https://demo-admin-fullstackbun.estepanov.com");
  });
});
