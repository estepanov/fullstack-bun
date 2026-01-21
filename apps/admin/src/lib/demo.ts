export const isDemoMode = import.meta.env.VITE_ADMIN_DEMO === "true";

export const demoSession = {
  user: {
    id: "demo-admin-1",
    email: "demo-admin@example.com",
    name: "Demo Admin",
    username: "demo-admin",
    displayUsername: "demo-admin",
    role: "admin",
    emailVerified: true,
    createdAt: new Date("2024-01-15T12:00:00.000Z"),
    updatedAt: new Date("2024-06-01T12:00:00.000Z"),
    lastLoginMethod: "demo",
  },
  session: {
    id: "demo-session-1",
    userId: "demo-admin-1",
    expiresAt: new Date("2099-12-31T23:59:59.000Z"),
  },
};
