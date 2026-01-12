import { mock } from "bun:test";

export const dbMockState: {
  totalCount: number;
  bannedCount: number;
  users: Array<Record<string, unknown>>;
  bannedUsers: Array<Record<string, unknown>>;
  userRows: Array<{
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
  }>;
  updatedUser: { id: string; name: string; email: string; role: string } | null;
} = {
  totalCount: 0,
  bannedCount: 0,
  users: [],
  bannedUsers: [],
  userRows: [],
  updatedUser: null,
};

mock.module("drizzle-orm", () => ({
  eq: () => ({}),
  and: () => ({}),
  desc: () => ({}),
  count: () => ({}),
  sql: () => ({}),
}));

const db = {
  query: {
    account: {
      findFirst: async () => null,
    },
  },
  select: (fields: Record<string, unknown>) => {
    if ("value" in fields) {
      return {
        from: () => ({
          where: () => Promise.resolve([{ value: dbMockState.bannedCount }]),
          then: (resolve: (value: unknown) => void) =>
            Promise.resolve([{ value: dbMockState.totalCount }]).then(resolve),
        }),
      };
    }

    return {
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(dbMockState.userRows),
          orderBy: () => ({
            limit: () => ({
              offset: () => Promise.resolve(dbMockState.bannedUsers),
            }),
          }),
        }),
        orderBy: () => ({
          limit: () => ({
            offset: () => Promise.resolve(dbMockState.users),
          }),
        }),
      }),
    };
  },
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () =>
          Promise.resolve(dbMockState.updatedUser ? [dbMockState.updatedUser] : []),
      }),
    }),
  }),
};

const dbClientPath = import.meta.resolve("../../src/db/client.ts");
const dbSchemaPath = import.meta.resolve("../../src/db/schema.ts");

mock.module(dbClientPath, () => ({
  db,
}));

mock.module(dbSchemaPath, () => ({
  user: {},
  account: {},
  passkey: {},
  session: {},
  verification: {},
}));
