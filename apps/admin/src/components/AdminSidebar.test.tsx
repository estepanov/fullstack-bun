import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";
import i18next, { type i18n } from "i18next";
import type { JSX } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { MemoryRouter } from "react-router";

mock.module("@admin/lib/auth-client", () => ({
  useSession: () => ({
    data: { user: { email: "admin@example.com" } },
  }),
  signOut: () => undefined,
}));

mock.module("./LanguageSelector", () => ({
  LanguageSelector: () => null,
}));

let AdminSidebar: (props: Record<string, never>) => JSX.Element;
let i18nInstance: i18n;
const originalFrontendUrl = process.env.VITE_FRONTEND_URL;
const originalRuntimeConfig = window.__APP_CONFIG__;

beforeAll(async () => {
  i18nInstance = i18next.createInstance();
  await i18nInstance.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        admin: {
          navigation: {
            dashboard: "Dashboard",
            notifications: "Notifications",
            users: "Users",
            banned_users: "Banned Users",
            frontend_app: "Back to App",
            close_menu: "Close menu",
          },
          sign_out: "Sign Out",
        },
        color_mode_toggle: {
          label: "Color mode",
          current_mode: "Current mode",
          options: {
            light: "Light",
            dark: "Dark",
            system: "System",
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
  ({ AdminSidebar } = await import("./AdminSidebar"));
});

afterEach(() => {
  window.__APP_CONFIG__ = originalRuntimeConfig;
  if (originalFrontendUrl === undefined) {
    delete process.env.VITE_FRONTEND_URL;
  } else {
    process.env.VITE_FRONTEND_URL = originalFrontendUrl;
  }
});

describe("AdminSidebar", () => {
  test("Back to App points at the customer frontend origin", () => {
    process.env.VITE_FRONTEND_URL = "https://demo-fullstackbun.estepanov.com";
    window.__APP_CONFIG__ = {
      FRONTEND_URL: "https://demo-fullstackbun.estepanov.com",
    };

    const { getByRole } = render(
      <I18nextProvider i18n={i18nInstance}>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(getByRole("link", { name: "Back to App" })).toHaveAttribute(
      "href",
      "https://demo-fullstackbun.estepanov.com",
    );
  });
});
