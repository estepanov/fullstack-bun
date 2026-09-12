import { afterEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@frontend-test/rtl";
import { waitFor } from "@testing-library/dom";
import { fireEvent } from "@testing-library/react";
import i18n, { waitForI18n } from "../../i18n";
import type { AccountRecord } from "../../types/dashboard";

const githubAccount: AccountRecord = {
  id: "local-github-row",
  providerId: "github",
  createdAt: "2024-06-01T10:00:00.000Z",
  updatedAt: "2024-06-01T10:00:00.000Z",
  accountId: "github-user-123",
  userId: "user-1",
  scopes: ["read:user"],
};

const listAccounts = mock(async () => ({
  data: [githubAccount],
  error: null,
}));

const unlinkAccount = mock(async () => ({ error: null }));

mock.module("@frontend/lib/auth-client", () => ({
  authClient: {
    listAccounts,
    unlinkAccount,
  },
}));

const loadAccountsSection = async () => {
  await waitForI18n();
  await i18n.loadNamespaces("auth");
  const { AccountsSection } = await import("./accounts-section");
  return { AccountsSection };
};

describe("AccountsSection", () => {
  afterEach(() => {
    listAccounts.mockClear();
    unlinkAccount.mockClear();
  });

  test("unlinks by the local account row id from listAccounts", async () => {
    const { AccountsSection } = await loadAccountsSection();
    render(<AccountsSection />);

    expect(await screen.findByText("Github")).toBeInTheDocument();
    expect(screen.getByText("github-user-123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));

    await waitFor(() => {
      expect(unlinkAccount).toHaveBeenCalledTimes(1);
    });
    expect(unlinkAccount).toHaveBeenCalledWith({
      accountId: "local-github-row",
    });
    expect(unlinkAccount.mock.calls[0]?.[0]).not.toHaveProperty("providerId");
    expect(unlinkAccount.mock.calls[0]?.[0]).not.toEqual({
      accountId: "github-user-123",
    });
  });
});
