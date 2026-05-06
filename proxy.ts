import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API = new Set<string>([
  "/api/health",
  "/api/login",
  "/api/setup",
  "/api/forgot-password",
  "/api/reset-password",
]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_COOKIE_NAME = "csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (PUBLIC_API.has(pathname)) return NextResponse.next();

  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 },
    );
  }

  // CSRF: double-submit cookie. The session cookie is SameSite=Strict so
  // cross-origin requests already can't carry it, but we layer the
  // CSRF token check on top to defend against same-site sub-domain takeover
  // and reflected XSS sourcing the session cookie.
  if (!SAFE_METHODS.has(request.method)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json(
        { error: "Invalid CSRF token." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
