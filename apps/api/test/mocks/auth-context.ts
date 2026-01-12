import type { AuthMiddlewareEnv } from "../../src/middlewares/auth";

export const baseUser = {
  id: "user-1",
  name: "Alex",
  username: "alex",
  displayUsername: "alex",
  email: "alex@example.com",
  emailVerified: true,
  image: null,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies AuthMiddlewareEnv["Variables"]["user"];

export const baseSession = {
  id: "session-1",
  userId: "user-1",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  token: "session-token",
  ipAddress: null,
  userAgent: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies AuthMiddlewareEnv["Variables"]["session"];
