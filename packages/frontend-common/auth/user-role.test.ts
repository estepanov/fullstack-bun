import { describe, expect, test } from "bun:test";
import { UserRole } from "shared/auth/user-role";
import { getSessionUserRole, isAdminSession } from "./user-role";

describe("getSessionUserRole", () => {
  test("returns the role when it is valid", () => {
    const session = { user: { role: UserRole.ADMIN } };

    expect(getSessionUserRole(session)).toBe(UserRole.ADMIN);
  });

  test("returns null when the role is invalid", () => {
    const session = { user: { role: "unknown" } };

    expect(getSessionUserRole(session)).toBeNull();
  });

  test("returns null when user data is missing", () => {
    expect(getSessionUserRole({})).toBeNull();
    expect(getSessionUserRole(null)).toBeNull();
    expect(getSessionUserRole(undefined)).toBeNull();
  });
});

describe("isAdminSession", () => {
  test("returns true when the session user role is admin", () => {
    const session = { user: { role: UserRole.ADMIN } };

    expect(isAdminSession(session)).toBe(true);
  });

  test("returns false for non-admin or missing roles", () => {
    expect(isAdminSession({ user: { role: UserRole.USER } })).toBe(false);
    expect(isAdminSession({ user: { role: undefined } })).toBe(false);
    expect(isAdminSession({})).toBe(false);
  });
});
