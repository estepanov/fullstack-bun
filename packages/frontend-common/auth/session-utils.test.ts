/** biome-ignore-all lint/style/noNonNullAssertion: test file */
import { describe, expect, test } from "bun:test";
import { SessionStore } from "./session-utils";

const createStubStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
};

describe("SessionStore", () => {
  test("returns existing session id without generating a new one", () => {
    const storage = createStubStorage();
    storage.setItem("app_session_id", "existing-id");
    const store = new SessionStore(storage);

    expect(store.getSessionId()).toBe("existing-id");
  });

  test("creates and reuses a session id when missing", () => {
    const storage = createStubStorage();
    const store = new SessionStore(storage);

    const generated = store.getSessionId();

    expect(typeof generated).toBe("string");
    expect(generated.length).toBeGreaterThan(0);
    expect(store.getSessionId()).toBe(generated);
    expect(storage.getItem("app_session_id")).toBe(generated);
  });

  test("clears the stored session id", () => {
    const storage = createStubStorage();
    const store = new SessionStore(storage);

    const id = store.getSessionId();
    expect(storage.getItem("app_session_id")).toBe(id);

    store.clearSession();
    expect(storage.getItem("app_session_id")).toBeNull();
  });
});
