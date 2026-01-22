import { describe, expect, test } from "bun:test";
import { UserRole } from "shared/auth/user-role";
import { createUseIsAdmin } from "./useIsAdmin";

describe("createUseIsAdmin", () => {
  test("derives admin status from session role", () => {
    const session = { user: { role: UserRole.ADMIN } };
    const useSession = () => ({ data: session, isPending: false });
    const useIsAdmin = createUseIsAdmin(useSession);

    const result = useIsAdmin();

    expect(result.isAdmin).toBe(true);
    expect(result.session).toBe(session);
    expect(result.isPending).toBe(false);
  });

  test("returns false for non-admin sessions while preserving state", () => {
    const session = { user: { role: UserRole.USER } };
    const useSession = () => ({ data: session, isPending: true });
    const useIsAdmin = createUseIsAdmin(useSession);

    const result = useIsAdmin();

    expect(result.isAdmin).toBe(false);
    expect(result.session).toBe(session);
    expect(result.isPending).toBe(true);
  });
});
