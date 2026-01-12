import { describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import type { AuthMiddlewareEnv } from "../src/middlewares/auth";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { authMockState } from "./mocks/auth-state";
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

describe("authMiddleware", () => {
  test("returns 401 when session missing", async () => {
    authMockState.session = null;
    const { authMiddleware } = await import("../src/middlewares/auth");

    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.get("/protected", authMiddleware(), (c) => c.json({ ok: true }));

    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });

  test("sets user and session when available", async () => {
    authMockState.session = {
      user: { id: "user-1" },
      session: { id: "session-1" },
    };
    const { authMiddleware } = await import("../src/middlewares/auth");

    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.get("/protected", authMiddleware(), (c) => {
      return c.json({ userId: c.var.user.id, sessionId: c.var.session.id });
    });

    const res = await app.request("/protected");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ userId: "user-1", sessionId: "session-1" });
  });
});
