/**
 * Wrapper around fetch() that automatically attaches the CSRF token from the
 * `csrf` cookie as the `X-CSRF-Token` header. Use this for all calls to
 * `/api/...` from client components.
 *
 * The middleware enforces the double-submit token check on every non-safe
 * method, so calling raw `fetch()` for a POST/PATCH/DELETE will return 403.
 */

const CSRF_COOKIE_NAME = "csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE.has(method)) {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(input, { ...init, headers });
}
