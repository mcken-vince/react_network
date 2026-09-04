const STORAGE_KEY = "auth-token";

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
  listeners.forEach((listener) => listener(token));
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener(null));
}

/** Notifies on login/logout within this tab. Returns an unsubscribe fn. */
export function onAuthTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
