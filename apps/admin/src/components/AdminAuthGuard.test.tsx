import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";
import i18next, { type i18n } from "i18next";
import type { JSX, ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

process.env.VITE_FRONTEND_URL ??= "http://frontend.example.com";

type SessionState =
  | { data: { user?: { role?: string } } | null; isPending: boolean }
  | { data: null; isPending: boolean };

let sessionState: SessionState = { data: null, isPending: false };
let i18nInstance: i18n;

mock.module("@admin/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

let AdminAuthGuard: (props: { children: ReactNode }) => JSX.Element;
const originalHref = window.location.href;

beforeAll(async () => {
  i18nInstance = i18next.createInstance();
  await i18nInstance.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        admin: {
          loading: "Loading...",
          redirecting: "Redirecting to login...",
          access_denied: "Access Denied",
          admin_only: "This area is restricted to administrators only.",
        },
      },
    },
    interpolation: { escapeValue: false },
  });
  ({ AdminAuthGuard } = await import("./AdminAuthGuard"));
});

beforeEach(() => {
  sessionState = { data: null, isPending: false };
  window.location.href = originalHref;
});

afterEach(() => {
  window.location.href = originalHref;
});

describe("AdminAuthGuard", () => {
  test("shows a loading state while the session is pending", () => {
    sessionState = { data: null, isPending: true };

    render(
      <I18nextProvider i18n={i18nInstance}>
        <AdminAuthGuard>Child</AdminAuthGuard>
      </I18nextProvider>,
    );

    const { getAllByText } = render(
      <I18nextProvider i18n={i18nInstance}>
        <AdminAuthGuard>Child</AdminAuthGuard>
      </I18nextProvider>,
    );

    expect(getAllByText("Loading...").length).toBeGreaterThan(0);
  });

  test("redirects to login when unauthenticated", async () => {
    sessionState = { data: null, isPending: false };

    const { getByText } = render(
      <I18nextProvider i18n={i18nInstance}>
        <AdminAuthGuard>Child</AdminAuthGuard>
      </I18nextProvider>,
    );

    expect(getByText("Redirecting to login...")).toBeInTheDocument();
    await waitFor(() => expect(window.location.href).toContain("/auth/login"));
  });

  test("renders children when the session belongs to an admin", () => {
    sessionState = { data: { user: { role: "admin" } }, isPending: false };

    const { getByText } = render(
      <I18nextProvider i18n={i18nInstance}>
        <AdminAuthGuard>
          <div>Allowed</div>
        </AdminAuthGuard>
      </I18nextProvider>,
    );

    expect(getByText("Allowed")).toBeInTheDocument();
  });
});
