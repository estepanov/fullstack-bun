import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { ensureTestEnv } from "./mocks/env";
import { testLogger } from "./mocks/logger";

ensureTestEnv();

describe("exampleRouter", () => {
  test("lists examples", async () => {
    const { exampleRouter } = await import("../src/routers/example-router");
    const app = new Hono<LoggerMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.route("/example", exampleRouter);

    const res = await app.request("/example");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.list)).toBe(true);
    expect(data.list.length).toBeGreaterThan(0);
  });

  test("returns env values", async () => {
    const { exampleRouter } = await import("../src/routers/example-router");
    const app = new Hono<LoggerMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.route("/example", exampleRouter);

    const res = await app.request("/example/env");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.corsAllowlistedOrigins)).toBe(true);
    expect(data.corsAllowlistedOrigins).toContain("http://localhost:5173");
  });

  test("creates a new example", async () => {
    const { exampleRouter } = await import("../src/routers/example-router");
    const app = new Hono<LoggerMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.route("/example", exampleRouter);

    const res = await app.request("/example", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });
});
