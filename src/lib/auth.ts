import { useSyncExternalStore } from 'react';
import { AuthService, OpenAPI } from '@/api';

// Client-side auth state. This is a module-level store rather than React
// context so that code outside the React tree (the React Query error handler
// in query-client.ts) can read and update it. See docs/plans/login-ui.md.

export type Credential =
  | { kind: 'apiKey'; apiKey: string }
  | { kind: 'token'; token: string; email: string; name?: string; expiresAt: string };

// 'reauth_required': the server returned 401 (no valid credential), or the token expired.
// 'insufficient_role': the server returned 403 (valid identity, but not an instructor).
export type AuthProblem = null | 'reauth_required' | 'insufficient_role';

interface AuthState {
  credential: Credential | null;
  problem: AuthProblem;
}

const STORAGE_KEY = 'provena-auth';
const LEGACY_STORAGE_KEY = 'provena-api-key';
const PENDING_LOGIN_KEY = 'provena-login-pending';

function loadCredential(): Credential | null {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.kind === 'apiKey' && typeof parsed.apiKey === 'string') return parsed;
    if (parsed?.kind === 'token' && typeof parsed.token === 'string') return parsed;
  } catch {
    // Fall through: treat unreadable storage as logged out.
  }
  return null;
}

function saveCredential(credential: Credential | null) {
  try {
    if (credential) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credential));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable; the credential still applies for this page load.
  }
}

/** Points the generated API client at the given credential. */
export function applyCredential(credential: Credential | null) {
  OpenAPI.TOKEN = credential?.kind === 'token' ? credential.token : undefined;
  OpenAPI.HEADERS = credential?.kind === 'apiKey' ? { 'X-API-Key': credential.apiKey } : undefined;
}

let state: AuthState = { credential: null, problem: null };
const listeners = new Set<() => void>();
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function scheduleExpiry(credential: Credential | null) {
  clearTimeout(expiryTimer);
  expiryTimer = undefined;
  if (credential?.kind !== 'token') return;

  const msLeft = Date.parse(credential.expiresAt) - Date.now();
  if (Number.isNaN(msLeft)) return;
  // An already-expired token fires right away. setTimeout overflows above
  // ~24.8 days; web tokens are far shorter, but clamp anyway.
  expiryTimer = setTimeout(
    () => reportAuthProblem('reauth_required'),
    Math.min(Math.max(msLeft, 0), 2 ** 31 - 1),
  );
}

// Load and apply any saved credential as soon as this module is imported,
// before the first render. Otherwise child components' queries can go out
// before a parent effect sets the auth header, and fail with a spurious 401.
{
  const credential = loadCredential();
  applyCredential(credential);
  state = { credential, problem: null };
  scheduleExpiry(credential);
}

/** Stores and applies a new credential (on login). Applied synchronously, before any re-render. */
export function setCredential(credential: Credential) {
  saveCredential(credential);
  applyCredential(credential);
  scheduleExpiry(credential);
  setState({ credential, problem: null });
}

/** Revokes the token on the server (best effort) and forgets the credential. */
export function logout() {
  const { credential } = state;
  if (credential?.kind === 'token') {
    // OpenAPI.TOKEN is still set here, so this request is authenticated.
    // Ignore failures: the token may already be expired or revoked.
    AuthService.authLogout().catch(() => {});
  }
  saveCredential(null);
  applyCredential(null);
  scheduleExpiry(null);
  setState({ credential: null, problem: null });
}

export function reportAuthProblem(problem: Exclude<AuthProblem, null>) {
  // Failures while logged out, such as requests still in flight from before a
  // logout, aren't something the user can fix by logging in again.
  if (!state.credential || state.problem) return;
  setState({ problem });
}

export function getAuthState(): AuthState {
  return state;
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeAuth, getAuthState);
}

// --- Server (OAuth) login ---

/** Where the server sends the browser after login. Respects VITE_APP_BASE_PATH. */
function getCallbackUrl(): string {
  return new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}auth/callback`, window.location.origin).href;
}

/** Starts a server login by navigating the whole page to /auth/login. Doesn't return. */
export function startServerLogin(returnTo: string) {
  const loginState = crypto.randomUUID();
  // In-memory state is lost when the page navigates away, so keep the CSRF
  // nonce and return path in sessionStorage until the callback page reads them.
  sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify({ state: loginState, returnTo }));

  const params = new URLSearchParams({
    client_redirect_uri: getCallbackUrl(),
    client_type: 'web',
    state: loginState,
  });
  window.location.assign(`${OpenAPI.BASE}/auth/login?${params}`);
}

export type ServerLoginResult = { ok: true; returnTo: string } | { ok: false; error: string };

/**
 * Finishes a server login from the callback URL's fragment
 * (`#token=...&email=...&expires_at=...&name=...&state=...`).
 * Consumes the pending login, so it only succeeds once per login attempt.
 */
export function completeServerLogin(hash: string): ServerLoginResult {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  let pending: { state?: string; returnTo?: string } | null = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_LOGIN_KEY) ?? 'null');
  } catch {
    pending = null;
  }
  sessionStorage.removeItem(PENDING_LOGIN_KEY);

  if (!pending?.state || params.get('state') !== pending.state) {
    return { ok: false, error: 'Login could not be verified. Please try again.' };
  }
  const token = params.get('token');
  const email = params.get('email');
  const expiresAt = params.get('expires_at');
  if (!token || !email || !expiresAt) {
    return { ok: false, error: 'The server did not return a complete login. Please try again.' };
  }

  setCredential({ kind: 'token', token, email, name: params.get('name') ?? undefined, expiresAt });
  const returnTo = pending.returnTo?.startsWith('/') ? pending.returnTo : '/';
  return { ok: true, returnTo };
}
