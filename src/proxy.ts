import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { LOCALE_COOKIE, isLocale, getBestLocale } from "@/lib/i18n/config";

const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/health",
  "/api/billing/webhook",
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isLocalePath(pathname: string): boolean {
  const first = pathname.split("/")[1];
  return isLocale(first);
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public marketing site under a locale prefix (/fr…, /en…) ──
  if (isLocalePath(pathname)) {
    const locale = pathname.split("/")[1]!;
    const response = addSecurityHeaders(NextResponse.next());
    if (!request.cookies.get(LOCALE_COOKIE)?.value) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  // ── Root: redirect to the best-matching locale home ──
  if (pathname === "/") {
    const locale = getBestLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language") ?? undefined
    );
    const home = new URL(`/${locale}`, request.url);
    const response = NextResponse.redirect(home);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return addSecurityHeaders(response);
  }

  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};