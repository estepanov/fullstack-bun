import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { AuthMiddlewareEnv } from "../src/middlewares/auth";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { baseSession, baseUser } from "./mocks/auth-context";
import { dbMockState } from "./mocks/db";
import { ensureTestEnv } from "./mocks/env";
import { testLogger } from "./mocks/logger";

ensureTestEnv();

describe("checkBannedMiddleware", () => {
  test("returns 401 when user missing", async () => {
    dbMockState.userRows = [];
    const { checkBannedMiddleware } = await import("../src/middlewares/check-banned");

    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", {
        ...baseUser,
        banned: false,
      });
      c.set("session", baseSession);
      return next();
    });
    app.get("/protected", checkBannedMiddleware(), (c) => c.json({ ok: true }));

    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });

  test("returns 403 when user is banned", async () => {
    dbMockState.userRows = [
      {
        id: "user-1",
        banned: true,
        banReason: "spamming",
        banExpires: null,
      },
    ];
    const { checkBannedMiddleware } = await import("../src/middlewares/check-banned");

    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", baseUser);
      c.set("session", baseSession);
      return next();
    });
    app.get("/protected", checkBannedMiddleware(), (c) => c.json({ ok: true }));

    const res = await app.request("/protected");
    expect(res.status).toBe(403);
    const data = await res.text();
    expect(data).toContain("banned");
  });

  test("passes when ban expired", async () => {
    dbMockState.userRows = [
      {
        id: "user-1",
        banned: true,
        banReason: null,
        banExpires: new Date(Date.now() - 1000),
      },
    ];
    const { checkBannedMiddleware } = await import("../src/middlewares/check-banned");

    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", baseUser);
      c.set("session", baseSession);
      return next();
    });
    app.get("/protected", checkBannedMiddleware(), (c) => c.json({ ok: true }));

    const res = await app.request("/protected");
    expect(res.status).toBe(200);
  });
});
