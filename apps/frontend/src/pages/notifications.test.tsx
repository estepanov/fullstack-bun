import { describe, expect, test } from "bun:test";

import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { type Notification, NotificationType } from "shared/interfaces/notification";
import { server } from "../../test/msw";
import { RootAppProvider } from "../providers/RootAppProvider";
import { NotificationsPageContent } from "./notifications";

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "notification-1",
  userId: "user-1",
  type: NotificationType.INFO,
  title: "Security alert",
  content: "We noticed a new login to your account.",
  metadata: {},
  read: false,
  createdAt: new Date("2024-06-01T10:00:00.000Z").toISOString(),
  updatedAt: new Date("2024-06-01T10:00:00.000Z").toISOString(),
  ...overrides,
});

const renderWithProviders = (ui: ReactNode, initialEntries = ["/notifications"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <RootAppProvider>{ui}</RootAppProvider>
    </MemoryRouter>,
  );

describe("NotificationsPage", () => {
  test("renders notifications returned by the API", async () => {
    const notifications = [
      createNotification(),
      createNotification({
        id: "notification-2",
        title: "Weekly digest",
        content: "Your week in review is ready.",
        read: true,
      }),
    ];

    server.use(
      http.get(/.*\/notification\/list/, ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") ?? "";
        const filtered = search
          ? notifications.filter((notification) =>
              notification.title.toLowerCase().includes(search.toLowerCase()),
            )
          : notifications;

        return HttpResponse.json({
          success: true,
          notifications: filtered,
          pagination: {
            page: 1,
            limit: 20,
            totalCount: filtered.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }),
    );

    renderWithProviders(<NotificationsPageContent />);

    expect(await screen.findByText("Security alert")).not.toBeNull();
    expect(await screen.findByText("Weekly digest")).not.toBeNull();
  });

  test("filters results using search params", async () => {
    const notifications = [
      createNotification(),
      createNotification({
        id: "notification-2",
        title: "Weekly digest",
        content: "Your week in review is ready.",
      }),
    ];
    const requestLog: URL[] = [];

    server.use(
      http.get(/.*\/notification\/list/, ({ request }) => {
        const url = new URL(request.url);
        requestLog.push(url);
        const search = url.searchParams.get("search") ?? "";
        const filtered = search
          ? notifications.filter((notification) =>
              notification.title.toLowerCase().includes(search.toLowerCase()),
            )
          : notifications;

        return HttpResponse.json({
          success: true,
          notifications: filtered,
          pagination: {
            page: 1,
            limit: 20,
            totalCount: filtered.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }),
    );

    renderWithProviders(<NotificationsPageContent />, ["/notifications?q=alert"]);

    await waitFor(() => {
      expect(screen.getByText("Security alert")).not.toBeNull();
      expect(screen.queryByText("Weekly digest")).toBeNull();
    });

    await waitFor(() => {
      expect(requestLog.some((url) => url.searchParams.get("search") === "alert")).toBe(
        true,
      );
    });
  });
});
