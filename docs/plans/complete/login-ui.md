# Login UI: plan

**Status:** implemented (2026-10-02). It assumes the server returns the token in the URL fragment (`#token=...`), a change that's in progress on the server's `auth` branch.

Replace the current `ApiKeyModal` flow with a dedicated login page. It offers two ways in:

1. **Sign in through the server** (primary). This uses `AuthService.authLogin`, which runs the OAuth flow configured on the server (Google today).
2. **Enter an API key** (secondary, in a collapsed "Use an API key instead" section). This is for admins, testing and scripts.

Whichever method was used, the client reacts to auth failures from the server. A `401` or a `403` opens a warning dialog with a button that logs out and goes back to `/login`.

## Server contract

This comes from provena-server's `auth` branch: `docs/plans/auth.md`, `src/provena/api/auth/auth.py`, `src/provena/auth/roles.py`.

- **Login**: `GET {BASE}/auth/login?client_redirect_uri=<uri>&client_type=web&state=<nonce>`. This is a full browser navigation, not a `fetch`, because the server answers with a 302 to Google. Don't call the generated `AuthService.authLogin()`. Build the URL from `OpenAPI.BASE` instead.
- **Callback**: when login finishes, the server 302s to `client_redirect_uri` with these params in the URL **fragment** (`#token=...&state=...`). The server is switching from query params to the fragment so the token never reaches the static host's logs:
  - `token`: the opaque bearer token
  - `email`
  - `expires_at`: ISO 8601 UTC with a `Z` suffix. Web tokens last `web_ttl_hours`, 12 by default, and the expiry is fixed (it doesn't slide).
  - `name`: optional
  - `state`: echoed back unchanged
- **Redirect allowlist**: `client_redirect_uri` has to match the server's `redirect_allowlist`. Matching is by origin only, so the path is ignored. The defaults already allow `http://localhost:*` and `http://127.0.0.1:*`, which covers `npm run dev`. A deployed client's origin has to be added to the allowlist.
- **Sending credentials**:
  - token: `Authorization: Bearer <token>`
  - API key: `X-API-Key: <key>` (instructor `api_keys` from `auth_config.yaml`)
- **Logout**: `POST /auth/logout` with the bearer token revokes that token. API keys have no server-side logout.
- **Failure responses** (every `/read/*` endpoint uses `require_instructor_role`):
  - `401 {"detail": "reauth_required"}` when there's no valid credential: it's missing, expired, revoked, or the API key is wrong.
  - `403 {"detail": "insufficient_role"}` when the token is valid but the email isn't in the instructor role. A logged-in student gets this, for example.
- The server sends no error params to the client. If Google login fails or is cancelled, the user ends up on a server error page or on Google's own page, not back in the client. That's acceptable for now.

## Design

### Credential state: `src/lib/auth.ts` (new)

This is a small module-level store, not React context. The React Query error handler in `main.tsx` runs outside the React tree and needs to reach it.

```ts
type Credential =
  | { kind: 'apiKey'; apiKey: string }
  | { kind: 'token'; token: string; email: string; name?: string; expiresAt: string };

type AuthProblem = null | 'reauth_required' | 'insufficient_role';
```

- `getCredential()`, `setCredential(c)` and `clearCredential()` persist to localStorage under one key, `provena-auth`, stored as JSON. Ignore the old `provena-api-key` key and delete it on load.
- `applyCredential(c)` sets the OpenAPI globals:
  - token: `OpenAPI.TOKEN = token` and `OpenAPI.HEADERS = undefined`
  - API key: `OpenAPI.HEADERS = { 'X-API-Key': key }` and `OpenAPI.TOKEN = undefined`
  - none: clear both

  The generated services' per-call `authorization` param stays `undefined`. `getHeaders` in `src/api/core/request.ts` drops undefined headers and then adds `Authorization: Bearer` from `OpenAPI.TOKEN`, so the existing fetchers don't need to change.
- `reportAuthProblem(p)` and `getAuthProblem()` set the flag that opens the warning dialog.
- `subscribe(listener)` plus a `useAuth()` hook built on `useSyncExternalStore`. It returns `{ credential, problem }`.
- `logout()`:
  - If `kind === 'token'`, call `AuthService.authLogout()` without awaiting it, and ignore errors because the token may already be invalid.
  - Clear the credential and the problem.
  - Call `queryClient.clear()` so the next user can't see cached student data. Export `queryClient` from its own module so `auth.ts` can import it.
  - The caller then navigates to `/login`.
- Load and apply the saved credential when `auth.ts` is first imported, before the first render. The old `App` set the header in a `useEffect`, and child effects run before parent effects, so the first page's queries went out without it and failed with 401. `App` now only renders its children once a credential exists, and `setCredential` applies it synchronously. Together these mean no request goes out unauthenticated.
- Changing the credential (login or logout) calls `queryClient.clear()`. That silently cancels in-flight queries, so a stale request can't open the dialog. `reportAuthProblem` also ignores failures while no credential is set.
- **Expiry**: for a token credential, set a timer for `expiresAt`. When it fires, call `reportAuthProblem('reauth_required')`. If the token is already past `expiresAt` at load, set the problem right away. Don't log the user out silently. This gives the same experience as a server 401.

### Global 401/403 handling: `src/main.tsx`

Add a `QueryCache({ onError })` and a `MutationCache({ onError })` to the `QueryClient`:

- `ApiError` with status 401 → `reportAuthProblem('reauth_required')`
- `ApiError` with status 403 → `reportAuthProblem('insufficient_role')`

Key off the status code, not `body.detail`, so other 401/403 sources are still caught.

Also set `retry: (count, err) => !(err instanceof ApiError && [401, 403].includes(err.status)) && count < 3`. Without it, React Query retries 401s three times before the dialog appears.

The current fetchers rely on `isError` and don't do any auth-specific handling, so nothing else in them changes. Their existing error text may still show behind the dialog, which is fine.

Remove the stale `console.warn` about `VITE_API_KEY` in `main.tsx` while I'm there.

### Routes: `src/routes.tsx`

```
/login           → LoginPage           (public)
/auth/callback   → AuthCallbackPage    (public)
/                → App (protected layout; current children unchanged)
```

- `App` becomes the protected layout. With no credential it renders `<Navigate to="/login" state={{ from: location }} replace />`. Otherwise it renders the header, breadcrumbs, `<Outlet />` and `<AuthProblemDialog />`.
- Put `/login` and `/auth/callback` outside `App` so they don't get the breadcrumbs or the auth guard. Visiting `/login` while logged in redirects to `/`.

### Login page: `src/pages/login-page.tsx` (new)

A centered card. Write it with Tailwind directly, or add the shadcn `card` component.

- Title "Provena Instructor Dashboard" and a short description.
- **Primary "Sign in" button.** Use generic wording, not "Sign in with Google", because the server's backend is per-deployment and clients aren't supposed to know which one it is. On click:
  1. Generate `state` with `crypto.randomUUID()`.
  2. Save `{ state, returnTo }` to sessionStorage under `provena-login-pending`. A full-page navigation wipes in-memory state, so it has to live in sessionStorage. `returnTo` comes from the router `location.state.from`, defaulting to `/`.
  3. Set `window.location.href = ${OpenAPI.BASE}/auth/login?client_redirect_uri=${callbackUrl}&client_type=web&state=${state}`, with each value URL-encoded.

  Compute `callbackUrl` as `new URL(import.meta.env.BASE_URL + 'auth/callback', window.location.origin).href` so it respects `VITE_APP_BASE_PATH`.
- **API key section.** Collapsed by default under "Use an API key instead". It has an input and a "Continue" button. On submit:
  1. Apply the key temporarily.
  2. Call `DefaultService.getAssignmentIDs()` directly, not through React Query, so the global dialog doesn't fire.
  3. On success, `setCredential` and navigate to `returnTo`.
  4. On 401, show an inline "Invalid API key". On any other error, show an inline "Couldn't reach the server". Revert the temporary credential on failure.
- Show an inline error from `location.state.error` when the callback page bounces back with one, for example "Login failed: state mismatch, please try again".

### Callback page: `src/pages/auth-callback-page.tsx` (new)

On mount:

1. Read `token`, `email`, `name`, `expires_at` and `state` from `window.location.hash` (`completeServerLogin` in `auth.ts`).
2. Read and then remove `provena-login-pending` from sessionStorage.
3. If the pending entry is missing, `state` doesn't match, or `token` is absent, navigate to `/login` (with `replace`) and pass an error.
4. Otherwise `setCredential({ kind: 'token', ... })` and navigate to `returnTo` with `replace: true`. `replace` also takes the token out of the address bar and browser history.

**StrictMode gotcha**: in dev, effects run twice. The second run finds the sessionStorage entry already removed and reports a state mismatch. Guard the effect with a `useRef` "handled" flag, or do the work in a module-level once-per-URL check.

The page shows "Signing in…" while it works.

### Auth problem dialog: `src/features/auth/components/auth-problem-dialog.tsx` (new)

A non-dismissable shadcn `Dialog`, shown when `useAuth().problem` is non-null.

- `reauth_required`: title "Session expired", body "Your login is no longer valid. Log in again to continue." For an API key credential, say "Your API key was rejected" instead.
- `insufficient_role`: title "No instructor access", body "You're signed in as {email}, which doesn't have instructor access on this server." Then suggest switching accounts.
- Both show one button, "Log out and sign in again", which calls `logout()` and then `navigate('/login', { state: { from: location } })`. Return the user to the page they were on after they log back in.

### Header: `src/App.tsx`

- Show who is logged in next to the logout button: the token's `name ?? email`, or "API key" for a key credential.
- The logout button calls `logout()` and then navigates to `/login`.

### Cleanup

- Delete `src/components/api-key-modal.tsx`, and in `App.tsx` remove `handleApiKeySubmit` along with the `apiKey`, `loading` and `error` state.
- **README** (Configure section): explain that the deployed client's origin has to be in the server's `redirect_allowlist`. Note that API keys come from `roles.instructor.api_keys` in `auth_config.yaml`.
- **CLAUDE.md**: rewrite the Auth bullet and add `/login` and `/auth/callback` to the routes list.

## Gotchas

- **Use the same API host the server's Google `redirect_uri` uses** (they already match locally, on `127.0.0.1`). The server keeps `client_redirect_uri` and `state` in a session cookie set on the API host during `/auth/login`. If `VITE_API_URL` is `http://127.0.0.1:8001` but the server's Google `redirect_uri` is `http://localhost:8001/...`, the callback runs on a different host and has no cookie. The server then fails with "Login session expired or was not started via /auth/login." The repo's `.env` currently uses `127.0.0.1` and the server's example config uses `localhost`, so they need to be made consistent. Note this in the README too.
- **The token arrives in the URL fragment.** Browsers don't send fragments to servers, so it stays out of the static host's logs. The callback still navigates with `replace` so the token doesn't stay in history.
- **Generated code**: every `DefaultService` method now takes an optional `authorization` param. Don't pass it anywhere, because `OpenAPI.TOKEN` handles it globally. `src/api/` stays untouched.

## Out of scope

- An "open" instructor role, where the server needs no credential. The client still requires a login. Any string works as an API key in that mode.
- A `/auth/me` endpoint. The server doesn't have one, so the displayed email and name are the login-time snapshot from the callback params.
- Refreshing a token before it expires. Web tokens have a fixed TTL, so the user logs in again when it runs out.

## Implementation order

1. `src/lib/auth.ts`, a `src/lib/query-client.ts` extraction, and the `main.tsx` changes (startup apply, global error handler, retry).
2. Routes, the protected `App` layout and `LoginPage` (API key path first, since it can be tested without OAuth).
3. The SSO button and `AuthCallbackPage`. Test against a local server with real Google credentials.
4. `AuthProblemDialog`, the expiry timer, and the header identity display.
5. Cleanup and docs.

**Manual test checklist** (there's no test suite):
- valid and invalid API key
- SSO login as an instructor
- SSO login as a non-instructor, which should show the 403 dialog
- revoke the token server-side or wait for it to expire, which should show the 401 dialog
- tampered `state` on the callback
- logout clears cached data
- deep link while logged out returns to that link after login
- works under a non-root `VITE_APP_BASE_PATH`

## Also changed

- `src/index.css` defines the shadcn color tokens (`--color-primary`, `--color-background`, ...) in a Tailwind `@theme` block. Without them `Button`, `Dialog` and `Input` were transparent, which was part of why the old API key modal looked broken. Existing `outline` and `ghost` buttons now get hover colors too.
- The login page, callback and dialog were checked in headless Edge against a local server:
  - redirect to `/login`
  - bogus key shows the inline error and no dialog
  - Sign in reaches Google with the expected params
  - tampered `state` bounces back with an error
  - a fake token shows a single 401 and the Session expired dialog, and logging out clears storage

  A real Google login and the 403 path haven't been tested.
