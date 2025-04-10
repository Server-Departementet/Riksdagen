import { clerkMiddleware, ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

export default clerkMiddleware(async (auth: ClerkMiddlewareAuth, req: NextRequest, _event: NextFetchEvent) => {
  const response = NextResponse.next();

  // Spotify
  if (req.nextUrl.pathname.startsWith("/spotify")) {
    const user = await auth();

    if ((user?.sessionClaims?.metadata as { role: string })?.role === "minister") {
    }
    else {
      return notFound(req);
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

function notFound(req: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", req.url));
}