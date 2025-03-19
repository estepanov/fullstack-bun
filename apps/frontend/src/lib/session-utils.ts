export class SessionStore {
  private static SESSION_KEY = 'app_session_id';
  
  static getSessionId(): string {
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  static clearSession() {
    localStorage.removeItem(this.SESSION_KEY);
  }
} 