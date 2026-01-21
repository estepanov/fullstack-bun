import { afterEach, describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import { AUTH_CONFIG } from "shared/config/auth";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { authMockState } from "./mocks/auth-state";
import { dbMockState } from "./mocks/db";
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

const user = {
  id: "user-1",
  name: "Alex",
  username: "alex",
  displayUsername: "alex",
  email: "alex@example.com",
  emailVerified: true,
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const session = { id: "session-1" };

const resetAuthConfig = () => {
  AUTH_CONFIG.emailPassword.enabled = true;
};

const resetDbState = () => {
  dbMockState.hasCredentialAccount = false;
};

describe("userRouter", () => {
  afterEach(() => {
    resetAuthConfig();
    resetDbState();
  });
  const buildApp = async () => {
    const { userRouter } = await import("../src/routers/user-router");
    const app = new Hono<LoggerMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.route("/user", userRouter);
    return app;
  };

  test("returns current user profile with password flag", async () => {
    dbMockState.hasCredentialAccount = true;
    AUTH_CONFIG.emailPassword.enabled = true;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/profile");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.hasPassword).toBe(true);
    expect(data.id).toBe(user.id);
  });

  test("returns 404 when password auth is disabled", async () => {
    dbMockState.hasCredentialAccount = false;
    AUTH_CONFIG.emailPassword.enabled = false;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/has-password");

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Password authentication is not enabled");
  });

  test("returns password status when enabled", async () => {
    dbMockState.hasCredentialAccount = false;
    AUTH_CONFIG.emailPassword.enabled = true;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/has-password");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ hasPassword: false });
  });

  test("blocks set-password when auth disabled", async () => {
    dbMockState.hasCredentialAccount = false;
    AUTH_CONFIG.emailPassword.enabled = false;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "password123" }),
    });

    expect(res.status).toBe(403);
  });

  test("returns 400 when user already has a password", async () => {
    dbMockState.hasCredentialAccount = true;
    AUTH_CONFIG.emailPassword.enabled = true;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "password123" }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("already has a password");
  });

  test("returns 400 when set password fails", async () => {
    dbMockState.hasCredentialAccount = false;
    authMockState.setPasswordStatus = false;
    AUTH_CONFIG.emailPassword.enabled = true;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "password123" }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Failed to set password");
  });

  test("sets password successfully", async () => {
    dbMockState.hasCredentialAccount = false;
    authMockState.setPasswordStatus = true;
    AUTH_CONFIG.emailPassword.enabled = true;
    authMockState.session = { user, session };

    const app = await buildApp();
    const res = await app.request("/user/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "password123" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });
});
