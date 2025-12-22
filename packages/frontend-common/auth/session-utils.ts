export class SessionStore {
  private static SESSION_KEY = "app_session_id";
  private storage: Storage;

  constructor(storage?: Storage) {
    this.storage = storage ?? getDefaultStorage();
  }

  getSessionId(): string {
    let sessionId = this.storage.getItem(SessionStore.SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      this.storage.setItem(SessionStore.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  clearSession() {
    this.storage.removeItem(SessionStore.SESSION_KEY);
  }
}

const getDefaultStorage = (): Storage => {
  if (typeof window === "undefined") {
    return createMemoryStorage();
  }

  try {
    if (window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access issues and fall back to memory storage.
  }

  return createMemoryStorage();
};

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
};
