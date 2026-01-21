import { mock } from "bun:test";

type Column = {
  table: string;
  name: string;
};

type FilterClause =
  | { type: "eq"; column: Column; value: unknown }
  | { type: "inArray"; column: Column; values: unknown[] }
  | { type: "ilike"; column: Column; pattern: string }
  | { type: "and"; conditions: FilterClause[] }
  | { type: "or"; conditions: FilterClause[] };

type OrderClause = { type: "desc"; column: Column } | Column;

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  metadata: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type NotificationPreferencesRow = {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailTypes: string;
  pushTypes: string;
  createdAt: Date;
  updatedAt: Date;
};

const column = (table: string, name: string): Column => ({ table, name });

const schemaTables = {
  user: {
    id: column("user", "id"),
    name: column("user", "name"),
    email: column("user", "email"),
    emailVerified: column("user", "emailVerified"),
    image: column("user", "image"),
    role: column("user", "role"),
    banned: column("user", "banned"),
    banReason: column("user", "banReason"),
    banExpires: column("user", "banExpires"),
    createdAt: column("user", "createdAt"),
    updatedAt: column("user", "updatedAt"),
  },
  account: {},
  passkey: {},
  session: {},
  verification: {},
  notification: {
    id: column("notification", "id"),
    userId: column("notification", "userId"),
    type: column("notification", "type"),
    title: column("notification", "title"),
    content: column("notification", "content"),
    metadata: column("notification", "metadata"),
    read: column("notification", "read"),
    createdAt: column("notification", "createdAt"),
    updatedAt: column("notification", "updatedAt"),
  },
  notificationPreferences: {
    id: column("notificationPreferences", "id"),
    userId: column("notificationPreferences", "userId"),
    emailEnabled: column("notificationPreferences", "emailEnabled"),
    pushEnabled: column("notificationPreferences", "pushEnabled"),
    emailTypes: column("notificationPreferences", "emailTypes"),
    pushTypes: column("notificationPreferences", "pushTypes"),
    createdAt: column("notificationPreferences", "createdAt"),
    updatedAt: column("notificationPreferences", "updatedAt"),
  },
};

const tableNameMap = new Map<unknown, string>([
  [schemaTables.user, "user"],
  [schemaTables.account, "account"],
  [schemaTables.passkey, "passkey"],
  [schemaTables.session, "session"],
  [schemaTables.verification, "verification"],
  [schemaTables.notification, "notification"],
  [schemaTables.notificationPreferences, "notificationPreferences"],
]);

export const dbMockState: {
  totalCount: number;
  bannedCount: number;
  users: Array<Record<string, unknown>>;
  bannedUsers: Array<Record<string, unknown>>;
  userRows: Array<{
    id?: string;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
  }>;
  updatedUser: { id: string; name: string; email: string; role: string } | null;
  hasCredentialAccount: boolean;
} = {
  totalCount: 0,
  bannedCount: 0,
  users: [],
  bannedUsers: [],
  userRows: [],
  updatedUser: null,
  hasCredentialAccount: false,
};

const notificationStore: NotificationRow[] = [];
const notificationPreferencesStore: NotificationPreferencesRow[] = [];
const userStore: Array<Record<string, unknown>> = [];

// Helper to clear all DB stores
export const clearDbStores = () => {
  notificationStore.length = 0;
  notificationPreferencesStore.length = 0;
  userStore.length = 0;
};

const getTableName = (table: unknown) => tableNameMap.get(table);

const matchesClause = (row: Record<string, unknown>, clause?: FilterClause): boolean => {
  if (!clause) {
    return true;
  }

  if (clause.type === "eq") {
    return row[clause.column.name] === clause.value;
  }

  if (clause.type === "inArray") {
    return clause.values.includes(row[clause.column.name]);
  }

  if (clause.type === "ilike") {
    const haystack = String(row[clause.column.name] ?? "").toLowerCase();
    const needle = clause.pattern.toLowerCase().replaceAll("%", "");
    return haystack.includes(needle);
  }

  if (clause.type === "and") {
    return clause.conditions.every((condition) => matchesClause(row, condition));
  }

  if (clause.type === "or") {
    return clause.conditions.some((condition) => matchesClause(row, condition));
  }

  return true;
};

const hasEqFilter = (
  clause: FilterClause | null | undefined,
  columnName: string,
  value: unknown,
): boolean => {
  if (!clause) return false;
  if (clause.type === "eq") {
    return clause.column.name === columnName && clause.value === value;
  }
  if (clause.type === "and" || clause.type === "or") {
    return clause.conditions.some((condition) =>
      hasEqFilter(condition, columnName, value),
    );
  }
  return false;
};

const applyOrder = (rows: Record<string, unknown>[], order?: OrderClause) => {
  if (!order) {
    return [...rows];
  }

  const columnRef = "type" in order ? order.column : order;
  const name = columnRef?.name;
  if (!name) {
    return [...rows];
  }

  const sorted = [...rows].sort((a, b) => {
    const aValue = a[name];
    const bValue = b[name];
    if (aValue instanceof Date && bValue instanceof Date) {
      return aValue.getTime() - bValue.getTime();
    }
    if (aValue === bValue) {
      return 0;
    }
    return aValue > bValue ? 1 : -1;
  });

  if ("type" in order && order.type === "desc") {
    sorted.reverse();
  }

  return sorted;
};

const pickFields = (row: Record<string, unknown>, fields?: Record<string, unknown>) => {
  if (!fields) {
    return row;
  }

  if ("value" in fields) {
    return row;
  }

  const selected: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === "object" && "name" in value) {
      selected[key] = row[(value as Column).name];
      continue;
    }
    selected[key] = row[key];
  }
  return selected;
};

const hasField = (fields: Record<string, unknown> | undefined, name: string) => {
  if (!fields) return false;
  return Object.values(fields).some(
    (value) =>
      value && typeof value === "object" && "name" in value && value.name === name,
  );
};

const createQuery = (
  rows: Record<string, unknown>[],
  fields?: Record<string, unknown>,
  limitValue?: number,
  offsetValue?: number,
) => {
  const isCount = Boolean(fields && "value" in fields);

  const applyPagination = (inputRows: Record<string, unknown>[]) => {
    if (isCount) {
      return [{ value: inputRows.length }];
    }

    const start = offsetValue ?? 0;
    const end = limitValue !== undefined ? start + limitValue : undefined;
    const sliced = inputRows.slice(start, end);
    return sliced.map((row) => pickFields(row, fields));
  };

  return {
    where: (clause?: FilterClause) =>
      createQuery(
        rows.filter((row) => matchesClause(row, clause)),
        fields,
        limitValue,
        offsetValue,
      ),
    orderBy: (order?: OrderClause) =>
      createQuery(applyOrder(rows, order), fields, limitValue, offsetValue),
    limit: (limit: number) => createQuery(rows, fields, limit, offsetValue),
    offset: (offset: number) => createQuery(rows, fields, limitValue, offset),
    then: (resolve: (value: unknown) => void, reject?: (reason?: unknown) => void) =>
      Promise.resolve(applyPagination(rows)).then(resolve, reject),
  };
};

const getStoreForTable = (tableName?: string) => {
  if (tableName === "notification") {
    return notificationStore;
  }
  if (tableName === "notificationPreferences") {
    return notificationPreferencesStore;
  }
  if (tableName === "user") {
    return userStore;
  }
  return null;
};

mock.module("drizzle-orm", () => ({
  eq: (columnRef: Column, value: unknown) =>
    ({ type: "eq", column: columnRef, value }) satisfies FilterClause,
  inArray: (columnRef: Column, values: unknown[]) =>
    ({ type: "inArray", column: columnRef, values }) satisfies FilterClause,
  and: (...conditions: Array<FilterClause | undefined | null>) => {
    const valid = conditions.filter(Boolean) as FilterClause[];
    if (valid.length === 0) {
      return null;
    }
    return { type: "and", conditions: valid } satisfies FilterClause;
  },
  or: (...conditions: Array<FilterClause | undefined | null>) => {
    const valid = conditions.filter(Boolean) as FilterClause[];
    if (valid.length === 0) {
      return null;
    }
    return { type: "or", conditions: valid } satisfies FilterClause;
  },
  desc: (columnRef: Column) =>
    ({ type: "desc", column: columnRef }) satisfies OrderClause,
  count: () => ({ type: "count" }),
  ilike: (columnRef: Column, pattern: string) =>
    ({ type: "ilike", column: columnRef, pattern }) satisfies FilterClause,
  sql: () => ({}),
}));

const db = {
  query: {
    account: {
      findFirst: async () =>
        dbMockState.hasCredentialAccount ? { providerId: "credential" } : null,
    },
  },
  select: (fields?: Record<string, unknown>) => {
    return {
      from: (table: unknown) => {
        const tableName = getTableName(table);
        if (tableName === "notification" || tableName === "notificationPreferences") {
          const store = getStoreForTable(tableName) ?? [];
          return createQuery(store, fields);
        }

        if (tableName === "user") {
          if (fields && "value" in fields) {
            return {
              where: (clause?: FilterClause) => {
                const bannedTrue = hasEqFilter(clause, "banned", true);
                const bannedFalse = hasEqFilter(clause, "banned", false);
                const value = bannedTrue
                  ? dbMockState.bannedUsers.length
                  : bannedFalse
                    ? dbMockState.users.length
                    : dbMockState.users.length;
                return Promise.resolve([{ value }]);
              },
              then: (resolve: (value: unknown) => void) =>
                Promise.resolve([{ value: dbMockState.users.length }]).then(resolve),
            };
          }

          return {
            where: (clause?: FilterClause) => {
              const bannedTrue = hasEqFilter(clause, "banned", true);
              const bannedFalse = hasEqFilter(clause, "banned", false);
              const rows = hasField(fields, "banExpires")
                ? dbMockState.userRows
                : bannedTrue
                  ? dbMockState.bannedUsers
                  : bannedFalse
                    ? dbMockState.users
                    : dbMockState.users;
              return createQuery(rows, fields).where(clause);
            },
            orderBy: (order?: OrderClause) =>
              createQuery(dbMockState.users, fields).orderBy(order),
            limit: (limit: number) => createQuery(dbMockState.users, fields).limit(limit),
            offset: (offset: number) =>
              createQuery(dbMockState.users, fields).offset(offset),
          };
        }

        return createQuery([], fields);
      },
    };
  },
  insert: (table: unknown) => {
    const tableName = getTableName(table);
    const store = getStoreForTable(tableName) ?? [];

    return {
      values: (values: Record<string, unknown>) => {
        const row = { ...values };
        const insertRow = () => {
          store.push(row);
          return row;
        };

        return {
          returning: (returningFields?: Record<string, unknown>) => {
            const created = insertRow();
            return Promise.resolve([pickFields(created, returningFields)]);
          },
          onConflictDoNothing: () => {
            if ("id" in row && !store.some((existing) => existing.id === row.id)) {
              store.push(row);
            }
            return Promise.resolve();
          },
        };
      },
    };
  },
  update: (table: unknown) => {
    const tableName = getTableName(table);

    if (tableName === "user") {
      return {
        set: () => ({
          where: () => ({
            returning: () =>
              Promise.resolve(dbMockState.updatedUser ? [dbMockState.updatedUser] : []),
          }),
        }),
      };
    }

    const store = getStoreForTable(tableName) ?? [];

    return {
      set: (updates: Record<string, unknown>) => ({
        where: (clause?: FilterClause) => ({
          returning: (returningFields?: Record<string, unknown>) => {
            const updatedRows = store
              .filter((row) => matchesClause(row, clause))
              .map((row) => Object.assign(row, updates));
            return Promise.resolve(
              updatedRows.map((row) => pickFields(row, returningFields)),
            );
          },
        }),
      }),
    };
  },
  delete: (table: unknown) => {
    const tableName = getTableName(table);
    const store = getStoreForTable(tableName) ?? [];

    return {
      where: (clause?: FilterClause) => {
        const performDelete = (returningFields?: Record<string, unknown>) => {
          const toDelete = store.filter((row) => matchesClause(row, clause));
          const remaining = store.filter((row) => !matchesClause(row, clause));
          store.length = 0;
          store.push(...remaining);
          return toDelete.map((row) => pickFields(row, returningFields));
        };

        return {
          returning: (returningFields?: Record<string, unknown>) =>
            Promise.resolve(performDelete(returningFields)),
          then: (
            resolve: (value: unknown) => void,
            reject?: (reason?: unknown) => void,
          ) => Promise.resolve(performDelete()).then(resolve, reject),
        };
      },
    };
  },
};

const dbClientPath = import.meta.resolve("../../src/db/client.ts");
const dbSchemaPath = import.meta.resolve("../../src/db/schema.ts");

mock.module(dbClientPath, () => ({
  db,
}));

mock.module(dbSchemaPath, () => ({
  user: schemaTables.user,
  account: schemaTables.account,
  passkey: schemaTables.passkey,
  session: schemaTables.session,
  verification: schemaTables.verification,
  notification: schemaTables.notification,
  notificationPreferences: schemaTables.notificationPreferences,
}));
