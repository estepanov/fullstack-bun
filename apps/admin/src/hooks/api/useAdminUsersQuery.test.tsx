import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { JSX, ReactNode } from "react";

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
      $get: async (_args: AdminUsersGetArgs) =>
        createResponse({
          success: true,
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
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
    let receivedArgs: AdminUsersGetArgs | null = null as AdminUsersGetArgs | null;
    mockApiClient.admin.users.$get = async (args: AdminUsersGetArgs) => {
      receivedArgs = args;
      return createResponse({
        success: true,
        users: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            emailVerified: true,
            image: null,
            role: "member",
            banned: false,
            banReason: null,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    };

    const { result } = renderHook(() => useAdminUsersQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.users).toHaveLength(1);
    expect(result.current.data?.users[0].id).toBe("1");
    expect(receivedArgs).not.toBeNull();
    expect(receivedArgs).toMatchObject({
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
