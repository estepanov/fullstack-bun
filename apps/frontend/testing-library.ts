import "./happydom";
import { afterAll, afterEach, beforeAll, expect, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { server } from "./test/msw";

// Provide stubs for optional auth passkey modules during tests to avoid runtime resolution errors
mock.module("@better-auth/passkey", () => ({
  passkey: () => ({}),
}));

mock.module("@better-auth/passkey/client", () => ({
  passkeyClient: () => ({}),
}));

// Broad stubs for better-auth server/client modules to avoid pulling optional plugin bundles in tests
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

mock.module("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: () => ({}),
}));

mock.module("better-auth/db", () => ({
  createFieldAttribute: () => ({}),
}));

mock.module("better-auth/react", () => ({
  createAuthClient: () => ({
    useSession: () => ({ data: null, isLoading: false }),
    signIn: {
      email: async () => ({}),
    },
    signUp: async () => ({}),
    signOut: async () => ({}),
    resetPassword: async () => ({}),
    verifyEmail: async () => ({}),
    sendVerificationEmail: async () => ({}),
  }),
}));

mock.module("better-auth/client/plugins", () => ({
  adminClient: () => ({}),
  magicLinkClient: () => ({}),
  usernameClient: () => ({}),
  lastLoginMethodClient: () => ({}),
}));

const loadEnvFromFile = () => {
  const envPath = fileURLToPath(new URL("./.env", import.meta.url));
  let contents = "";
  try {
    contents = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key]) continue;
    value = value.replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
};

if (!process.env.VITE_API_BASE_URL) {
  loadEnvFromFile();
}

expect.extend(matchers);

beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  cleanup();
});
