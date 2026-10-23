import { signInResponseSchema, type SignInResponse } from "../api/schemas";

/** Who is signed in. Kept in sessionStorage, so it ends with the tab. */
export type Session = SignInResponse;

const SESSION_KEY = "moya-session";

export function readSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = signInResponseSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Without storage the session lasts until the page reloads.
  }
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}
