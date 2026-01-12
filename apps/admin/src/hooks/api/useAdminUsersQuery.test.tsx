import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

type AdminUsersGetArgs = {
  query: {
    page: string;
    limit: string;
  };
};

type MockResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const createResponse = (data: unknown, ok = true): MockResponse => ({
  ok,
  json: async () => data,
});

const mockApiClient = {
  admin: {
    users: {
      $get: async (_args: AdminUsersGetArgs) => createResponse({ users: [] }),
    },
  },
};

mock.module("@admin/lib/api-client", () => ({
  apiClient: mockApiClient,
}));

let useAdminUsersQuery: typeof import("./useAdminUsersQuery").useAdminUsersQuery;
let queryClient: QueryClient;
let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

beforeAll(async () => {
  ({ useAdminUsersQuery } = await import("./useAdminUsersQuery"));
});

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
});

afterEach(() => {
  queryClient.clear();
});

describe("useAdminUsersQuery", () => {
  test("uses default pagination values and returns data", async () => {
    let receivedArgs: AdminUsersGetArgs | null = null;
    mockApiClient.admin.users.$get = async (args: AdminUsersGetArgs) => {
      receivedArgs = args;
      return createResponse({ users: [{ id: "1" }] });
    };

    const { result } = renderHook(() => useAdminUsersQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ users: [{ id: "1" }] });
    expect(receivedArgs).toEqual({
      query: { page: "1", limit: "10" },
    });
  });

  test("surfaces an error when the api response is not ok", async () => {
    mockApiClient.admin.users.$get = async (_args: AdminUsersGetArgs) =>
      createResponse({ message: "fail" }, false);

    const { result } = renderHook(() => useAdminUsersQuery({ page: 2, limit: 5 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch users");
  });
});
