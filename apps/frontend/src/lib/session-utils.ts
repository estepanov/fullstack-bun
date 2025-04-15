export class SessionStore {
  private static SESSION_KEY = "app_session_id";
  private storage: Storage;

  constructor(storage = localStorage) {
    this.storage = storage;
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
