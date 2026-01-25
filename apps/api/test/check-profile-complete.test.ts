import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { ProfileCompleteMiddlewareEnv } from "../src/middlewares/check-profile-complete";
import { checkProfileComplete } from "../src/middlewares/check-profile-complete";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { baseSession, baseUser } from "./mocks/auth-context";
import { testLogger } from "./mocks/logger";

describe("checkProfileComplete", () => {
  test("passes through when profile complete", async () => {
    const app = new Hono<LoggerMiddlewareEnv & ProfileCompleteMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", { ...baseUser, banned: false }); // Ensure required 'banned' property exists
      c.set("session", baseSession);
      return next();
    });
    app.get("/profile", checkProfileComplete(), (c) => {
      return c.json({ complete: c.var.hasCompleteProfile });
    });

    const res = await app.request("/profile");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ complete: true });
  });

  test("returns 403 when required fields missing", async () => {
    const app = new Hono<LoggerMiddlewareEnv & ProfileCompleteMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      c.set("user", { ...baseUser, banned: false, displayUsername: "" });
      c.set("session", baseSession);
      return next();
    });
    app.get("/profile", checkProfileComplete(), (c) => {
      return c.json({ complete: c.var.hasCompleteProfile });
    });

    const res = await app.request("/profile");
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Profile incomplete");
    expect(data.missingFields).toContain("displayUsername");
  });
});
