import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublicMerchantRoute =
    pathname === "/merchant/login" || pathname.startsWith("/merchant/login/");

  // Logged-in merchants skip the marketing page immediately (crawlers have no cookie).
  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/merchant", request.url));
  }

  if (isPublicMerchantRoute && hasSession) {
    return NextResponse.redirect(new URL("/merchant", request.url));
  }

  if (pathname.startsWith("/merchant") && !isPublicMerchantRoute && !hasSession) {
    const loginUrl = new URL("/merchant/login", request.url);
    if (pathname !== "/merchant") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/merchant", "/merchant/:path*"],
};
