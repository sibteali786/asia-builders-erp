import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require a token
const PUBLIC_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the "auth" cookie — same name used in auth.store.ts
  const authCookie = request.cookies.get("auth")?.value;

  // The cookie value is a JSON string like: {"state":{"user":{...},"token":"..."}}
  // We just need to know if a token exists — no need to verify it here.
  // Full JWT verification happens on the API for every request.
  let hasToken = false;
  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie));
      hasToken = !!parsed?.state?.token;
    } catch {
      hasToken = false;
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Not logged in + trying to access a protected route → send to login
  if (!hasToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in + trying to visit login/register → send to home
  if (hasToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// `matcher` controls which routes the middleware runs on.
// Excludes Next.js internals and static files — we only want to
// check auth for actual page navigations.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.jpg|.*\\.png).*)",
  ],
};
