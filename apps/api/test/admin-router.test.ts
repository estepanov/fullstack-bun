import { describe, expect, mock, spyOn, test } from "bun:test";
import { Hono } from "hono";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { authMockState } from "./mocks/auth-state";
import { dbMockState } from "./mocks/db";
import "./mocks/redis";
import { ensureTestEnv } from "./mocks/env";
import { testLogger } from "./mocks/logger";

ensureTestEnv();

mock.module("../src/lib/auth", () => ({
  auth: {
    api: {
      getSession: () => Promise.resolve(authMockState.session),
      setPassword: async () => ({ status: authMockState.setPasswordStatus }),
    },
  },
}));

const state = {
  deletedCount: 3,
};

dbMockState.totalCount = 2;
dbMockState.bannedCount = 1;
dbMockState.users = [
    {
      id: "user-1",
      name: "Alex",
      email: "alex@example.com",
      emailVerified: true,
      image: null,
      role: "user",
      banned: false,
      banReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
dbMockState.bannedUsers = [
    {
      id: "user-2",
      name: "Taylor",
      email: "taylor@example.com",
      image: null,
      banned: true,
      banReason: "abuse",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
dbMockState.updatedUser = {
  id: "user-1",
  name: "Alex",
  email: "alex@example.com",
  role: "admin",
};

const buildApp = async () => {
  const { adminRouter } = await import("../src/routers/admin-router");
  const app = new Hono<LoggerMiddlewareEnv>();
  app.use((c, next) => {
    c.set("logger", testLogger);
    c.set("requestId", "req-1");
    c.set("sessionId", "sess-1");
    return next();
  });
  app.route("/admin", adminRouter);
  return app;
};

describe("adminRouter", () => {
  test("rejects non-admin access", async () => {
    authMockState.session = {
      user: {
        id: "user-1",
        name: "User",
        username: "user",
        email: "user@example.com",
        emailVerified: true,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };

    const app = await buildApp();
    const res = await app.request("/admin/users");
    expect(res.status).toBe(403);
  });

  test("lists users with pagination", async () => {
    authMockState.session = {
      user: {
        id: "admin-1",
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };

    const app = await buildApp();
    const res = await app.request("/admin/users?page=1&limit=10");
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.users.length).toBe(dbMockState.users.length);
    expect(data.pagination.totalCount).toBe(dbMockState.totalCount);
  });

  test("lists banned users", async () => {
    authMockState.session = {
      user: {
        id: "admin-1",
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };

    const app = await buildApp();
    const res = await app.request("/admin/users/banned?page=1&limit=10");
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.bans.length).toBe(dbMockState.bannedUsers.length);
    expect(data.pagination.totalCount).toBe(dbMockState.bannedCount);
  });

  test("updates user role", async () => {
    authMockState.session = {
      user: {
        id: "admin-1",
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };
    dbMockState.updatedUser = {
      id: "user-1",
      name: "Alex",
      email: "alex@example.com",
      role: "admin",
    };

    const app = await buildApp();
    const res = await app.request("/admin/users/user-1/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe("admin");
  });

  test("returns 404 when role update targets missing user", async () => {
    authMockState.session = {
      user: {
        id: "admin-1",
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };
    dbMockState.updatedUser = null;

    const app = await buildApp();
    const res = await app.request("/admin/users/missing/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });

    expect(res.status).toBe(404);
  });

  test("deletes all messages for a user", async () => {
    authMockState.session = {
      user: {
        id: "admin-1",
        name: "Admin",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: { id: "session-1" },
    };
    state.deletedCount = 3;
    const { chatManager } = await import("../src/lib/chat-manager");
    const { chatService } = await import("../src/lib/chat-service");
    const deleteSpy = spyOn(chatService, "deleteMessagesByUserId").mockResolvedValue(
      state.deletedCount,
    );
    const broadcastSpy = spyOn(chatManager, "broadcast");

    const app = await buildApp();
    const res = await app.request("/admin/users/user-1/messages", {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deletedCount).toBe(3);
    expect(broadcastSpy).toHaveBeenCalledTimes(1);
    deleteSpy.mockRestore();
    broadcastSpy.mockRestore();
  });
});
