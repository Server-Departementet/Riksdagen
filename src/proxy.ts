import { clerkMiddleware, ClerkMiddlewareAuth, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const isSpotifyRoute = createRouteMatcher(["/spotify(.*)"]);

export default clerkMiddleware(async (auth: ClerkMiddlewareAuth, req: NextRequest, _event: NextFetchEvent) => {
  const response = NextResponse.next();

  // Spotify
  if (isSpotifyRoute(req)) {
    const user = await auth();

    if ((user?.sessionClaims?.metadata as { role: string })?.role === "minister") {
      return response;
    }
    else {
      return notFound(req);
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Next.js
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',

    // Spotify route
    "/spotify",
    "/api/spotify/(.*)", // Included for clerk coverage

    // Quote Quiz attachments
    "/quote-attachments/(.*)"
  ],
};

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", req.url));
}