import { expect, mock, test } from "bun:test";
import "./mocks/redis";
import "./mocks/db";
import { authMockState } from "./mocks/auth-state";
import { ensureTestEnv } from "./mocks/env";

ensureTestEnv();

mock.module("../src/lib/auth", () => ({
  auth: {
    api: {
      getSession: () => Promise.resolve(authMockState.session),
      setPassword: async () => ({ status: authMockState.setPasswordStatus }),
    },
  },
}));

// Mock external auth dependencies to keep websocket tests isolated and avoid optional plugin resolutions
mock.module("better-auth", () => ({
  betterAuth: () => ({
    auth: {},
    handlers: {},
  }),
}));

mock.module("better-auth/plugins", () => ({
  admin: () => ({}),
  emailOTP: () => ({}),
  lastLoginMethod: () => ({}),
  magicLink: () => ({}),
  username: () => ({}),
}));

mock.module("better-auth/plugins/access", () => ({
  createAccessControl: () => ({
    newRole: () => ({}),
  }),
}));

mock.module("@better-auth/passkey", () => ({
  passkey: () => ({}),
}));

mock.module("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: () => ({}),
}));

mock.module("better-auth/db", () => ({
  createFieldAttribute: () => ({}),
}));

mock.module("better-auth-harmony", () => ({
  emailHarmony: () => ({}),
}));

mock.module("jose", () => ({}));

test("chat websocket upgrades successfully", async () => {
  const { default: app } = await import("../src/index");
  let server: ReturnType<typeof Bun.serve> | null = null;

  try {
    server = Bun.serve({
      fetch: app.fetch,
      websocket: app.websocket,
      port: 0,
    });
  } catch (error) {
    const code =
      error && typeof error === "object" ? (error as { code?: string }).code : undefined;
    if (code === "EPERM" || code === "EADDRINUSE") {
      return;
    }
    throw error;
  }

  const wsUrl = `ws://localhost:${server.port}/chat/ws`;

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(wsUrl, {
      headers: {
        Origin: "http://localhost:5173",
      },
    });
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket upgrade timed out"));
    }, 3000);

    ws.addEventListener("open", () => {
      ws.close();
    });

    ws.addEventListener("close", () => {
      clearTimeout(timeout);
      resolve();
    });

    ws.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket upgrade failed"));
    });
  });

  server.stop(true);
  expect(true).toBe(true);
});
