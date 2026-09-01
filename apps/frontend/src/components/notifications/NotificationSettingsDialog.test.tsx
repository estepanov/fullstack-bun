import { describe, expect, mock, test } from "bun:test";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { NotificationType } from "shared/interfaces/notification";
import { server } from "../../../test/msw";

const mockUseNotifications = () => ({
  notifications: [],
  unreadCount: 0,
  connectionStatus: "connected" as const,
  error: null,
});

mock.module("../../providers/NotificationProvider", () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useNotifications: mockUseNotifications,
}));

mock.module("@frontend/providers/NotificationProvider", () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useNotifications: mockUseNotifications,
}));

const preferencesResponse = {
  success: true,
  preferences: {
    id: "pref-1",
    userId: "user-1",
    emailEnabled: true,
    pushEnabled: false,
    emailTypes: [NotificationType.MENTION, NotificationType.ANNOUNCEMENT],
    pushTypes: [],
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2024-06-01T10:00:00.000Z",
  },
};

const renderDialog = async () => {
  const [{ RootAppProvider }, { NotificationSettingsButton }] = await Promise.all([
    import("../../providers/RootAppProvider"),
    import("./NotificationSettingsDialog"),
  ]);

  return render(
    <MemoryRouter>
      <RootAppProvider>
        <NotificationSettingsButton />
      </RootAppProvider>
    </MemoryRouter>,
  );
};

describe("NotificationSettingsDialog", () => {
  test("opens an accessible modal instead of showing settings inline", async () => {
    server.use(
      http.get(/.*\/notification\/preferences/, () => {
        return HttpResponse.json(preferencesResponse);
      }),
    );

    const user = userEvent.setup();
    await renderDialog();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByLabelText("Email Notifications")).toBeNull();

    await user.click(
      await screen.findByRole("button", { name: "Notification settings" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Notification Preferences",
    });
    expect(dialog).not.toBeNull();
    expect(
      await screen.findByText("Configure how you want to receive notifications."),
    ).not.toBeNull();
    expect(await screen.findByLabelText("Email Notifications")).not.toBeNull();
  });

  test("closes the modal from the close button and restores the trigger", async () => {
    server.use(
      http.get(/.*\/notification\/preferences/, () => {
        return HttpResponse.json(preferencesResponse);
      }),
    );

    const user = userEvent.setup();
    await renderDialog();

    const trigger = await screen.findByRole("button", {
      name: "Notification settings",
    });
    await user.click(trigger);

    await screen.findByRole("dialog", { name: "Notification Preferences" });
    await user.click(screen.getByRole("button", { name: "Close settings" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(screen.getByRole("button", { name: "Notification settings" })).not.toBeNull();
  });
});
