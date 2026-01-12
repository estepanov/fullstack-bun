import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { AuthMiddlewareEnv } from "../src/middlewares/auth";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { requireAdmin } from "../src/middlewares/require-admin";
import { baseSession, baseUser } from "./mocks/auth-context";
import { testLogger } from "./mocks/logger";

describe("requireAdmin", () => {
  test("rejects non-admin users", async () => {
    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", { ...baseUser, banned: false });
      c.set("session", baseSession);
      return next();
    });
    app.get("/admin", requireAdmin(), (c) => c.json({ ok: true }));

    const res = await app.request("/admin");
    expect(res.status).toBe(403);
  });

  test("allows admin users", async () => {
    const app = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", { ...baseUser, banned: false, role: "admin" });
      c.set("session", baseSession);
      return next();
    });
    app.get("/admin", requireAdmin(), (c) => c.json({ ok: true }));

    const res = await app.request("/admin");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });
});
