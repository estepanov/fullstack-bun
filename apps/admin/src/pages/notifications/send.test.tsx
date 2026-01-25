import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import adminEn from "@admin-locales/en/admin.json";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18next, { type i18n } from "i18next";
import type { JSX, ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type { AdminSendNotificationRequest } from "shared/interfaces/notification";

const createResponse = (data: unknown, ok = true) => ({
  ok,
  json: async () => data,
});

const mockApiClient = {
  admin: {
    notifications: {
      send: {
        $post: mock(async () =>
          createResponse({
            success: true,
            targetCount: 1,
            createdCount: 1,
            skippedCount: 0,
            failures: [],
          }),
        ),
      },
    },
    users: {
      search: {
        $get: mock(async () =>
          createResponse({
            success: true,
            users: [
              {
                id: "user-1",
                name: "Alex",
                email: "alex@example.com",
                role: "user",
                createdAt: "2024-01-01T00:00:00.000Z",
              },
            ],
          }),
        ),
      },
    },
  },
};

mock.module("@admin/lib/api-client", () => ({
  apiClient: mockApiClient,
}));

let AdminSendNotificationsPage: () => JSX.Element;
let i18nInstance: i18n;
let queryClient: QueryClient;
let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

beforeAll(async () => {
  i18nInstance = i18next.createInstance();
  await i18nInstance.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        admin: adminEn,
      },
    },
    interpolation: { escapeValue: false },
  });
  ({ default: AdminSendNotificationsPage } = await import("./send"));
});

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  mockApiClient.admin.notifications.send.$post.mockClear();
  mockApiClient.admin.users.search.$get.mockClear();

  wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
});

describe("AdminSendNotificationsPage", () => {
  test("submits a notification for a single user", async () => {
    const user = userEvent.setup();
    const { container, getByLabelText } = render(<AdminSendNotificationsPage />, {
      wrapper,
    });

    await user.type(getByLabelText("User id or email"), "user-1");
    await user.type(getByLabelText("Title"), "Hello");
    await user.type(getByLabelText("Content"), "Welcome");

    expect(getByLabelText("User id or email")).toHaveValue("user-1");
    expect(getByLabelText("Title")).toHaveValue("Hello");
    expect(getByLabelText("Content")).toHaveValue("Welcome");

    const submitButton = container.querySelector(
      "button[type='submit']",
    ) as HTMLButtonElement | null;
    if (!submitButton) {
      throw new Error("Submit button not found");
    }

    await user.click(submitButton);

    await waitFor(() =>
      expect(mockApiClient.admin.notifications.send.$post).toHaveBeenCalled(),
    );

    // biome-ignore lint/style/noNonNullAssertion: test mock
    const payload = (
      mockApiClient.admin.notifications.send.$post.mock.calls as unknown as Array<
        [{ json: AdminSendNotificationRequest }]
      >
    )[0]![0]!;
    expect(payload.json.target).toEqual({ scope: "user", identifier: "user-1" });
    expect(payload.json.notification.title).toBe("Hello");
    expect(payload.json.notification.content).toBe("Welcome");
    expect(payload.json.notification.deliveryOptions).toEqual({ immediate: true });
  });

  test("adds a user from search results", async () => {
    const user = userEvent.setup();
    const { findByText, getByLabelText, getByPlaceholderText } = render(
      <AdminSendNotificationsPage />,
      { wrapper },
    );

    await user.type(getByPlaceholderText("Search by name or email"), "alex");

    await waitFor(() =>
      expect(mockApiClient.admin.users.search.$get).toHaveBeenCalledWith({
        query: { q: "alex", limit: "12" },
      }),
    );

    const addButton = await findByText("Add");
    await user.click(addButton);

    await waitFor(() =>
      expect(getByLabelText("User id or email")).toHaveValue("alex@example.com"),
    );
  });
});
