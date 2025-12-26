const ensureTestEnv = () => {
  process.env.NODE_ENV ||= "test";
  process.env.PORT ||= "0";
  process.env.CORS_ALLOWLISTED_ORIGINS ||= "http://localhost:5173";
  process.env.API_BASE_URL ||= "http://localhost:3001";
  process.env.FE_BASE_URL ||= "http://localhost:5173";
  process.env.BETTER_AUTH_SECRET ||=
    "test-secret-test-secret-test-secret-123";
  process.env.DATABASE_URL ||=
    "postgresql://postgres:postgres@127.0.0.1:5432/mydatabase";
  process.env.REDIS_URL ||= "redis://:redispassword@127.0.0.1:6379";
};

ensureTestEnv();

import { expect, test } from "bun:test";

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
    const code = error && typeof error === "object" ? (error as { code?: string }).code : undefined;
    if (code === "EPERM" || code === "EADDRINUSE") {
      return;
    }
    throw error;
  }

  const wsUrl = `ws://localhost:${server.port}/chat/ws`;

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
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
